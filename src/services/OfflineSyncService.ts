import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { collection, getDocs, doc, writeBatch, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { GuestGroup, Companion } from '../../types';

interface WeddingDB extends DBSchema {
    guests: {
        key: string;
        value: GuestGroup;
        indexes: { 'by-ticket': string };
    };
    pending_scans: {
        key: string;
        value: {
            ticketCode: string;
            scannedAt: string;
            synced: boolean;
        };
    };
}

const DB_NAME = 'wedding-planner-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<WeddingDB>> => {
    return openDB<WeddingDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('guests')) {
                const guestStore = db.createObjectStore('guests', { keyPath: 'id' });
                guestStore.createIndex('by-ticket', 'tickets.ticketCode', { unique: true, multiEntry: true }); // simplified logic, might need flattening
                // Actually, indexing nested arrays in IDB is tricky. 
                // Better strategy: Store flattened tickets or just iterate for search (dataset < 500 is fast enough).
            }
            if (!db.objectStoreNames.contains('pending_scans')) {
                db.createObjectStore('pending_scans', { keyPath: 'ticketCode' });
            }
        },
    });
};

export const downloadFullEventData = async () => {
    console.log("Starting full download...");
    try {
        const querySnapshot = await getDocs(collection(db, 'registrations'));
        const guests: GuestGroup[] = [];
        querySnapshot.forEach((doc) => {
            guests.push({ id: doc.id, ...doc.data() } as GuestGroup);
        });

        const dbLocal = await initDB();
        const tx = dbLocal.transaction('guests', 'readwrite');
        await Promise.all([
            ...guests.map(g => tx.store.put(g)),
            tx.done
        ]);
        console.log(`Downloaded ${guests.length} guest groups.`);
        return { success: true, count: guests.length };
    } catch (error) {
        console.error("Download failed:", error);
        return { success: false, error };
    }
};

export const searchGuestLocal = async (query: string): Promise<GuestGroup[]> => {
    const dbLocal = await initDB();
    const allGuests = await dbLocal.getAll('guests');
    const lowerQ = query.toLowerCase();

    return allGuests.filter(g =>
        g.primaryGuestName.toLowerCase().includes(lowerQ) ||
        g.companions.some(c => c.ticketCode.toLowerCase().includes(lowerQ) || c.fullName.toLowerCase().includes(lowerQ))
    );
};

export const markTicketScannedLocal = async (ticketCode: string): Promise<{ success: boolean; guest?: GuestGroup; message?: string }> => {
    const dbLocal = await initDB();
    const allGuests = await dbLocal.getAll('guests');

    // Find guest with this ticket
    const guestGroup = allGuests.find(g => g.companions.some(c => c.ticketCode === ticketCode));

    if (!guestGroup) {
        return { success: false, message: 'Ticket no encontrado localmente.' };
    }

    // Check if already scanned
    const companionIndex = guestGroup.companions.findIndex(c => c.ticketCode === ticketCode);
    const companion = guestGroup.companions[companionIndex];

    if (companion.status === 'checked_in') {
        return { success: false, message: `¡YA INGRESÓ! (${companion.checkedInAt})`, guest: guestGroup };
    }

    // Update Local State
    const updatedCompanion = { ...companion, status: 'checked_in' as const, checkedInAt: new Date().toISOString() };
    const updatedGroup = { ...guestGroup };
    updatedGroup.companions[companionIndex] = updatedCompanion;

    await dbLocal.put('guests', updatedGroup);

    // Queue for Sync
    await dbLocal.put('pending_scans', {
        ticketCode,
        scannedAt: updatedCompanion.checkedInAt,
        synced: false
    });

    // Try background sync if online
    if (navigator.onLine) {
        syncPendingScans().catch(console.error);
    }

    return { success: true, guest: updatedGroup };
};

export const syncPendingScans = async () => {
    const dbLocal = await initDB();
    const pending = await dbLocal.getAll('pending_scans');

    if (pending.length === 0) return;

    console.log(`Syncing ${pending.length} scans...`);
    const batch = writeBatch(db);
    let count = 0;

    for (const scan of pending) {
        // Find the group ID (inefficient but safe)
        const allGuests = await dbLocal.getAll('guests');
        const group = allGuests.find(g => g.companions.some(c => c.ticketCode === scan.ticketCode));

        if (group) {
            const groupRef = doc(db, 'registrations', group.id);
            // We need to update the specific array item. Firestore arrayUnion doesn't support partial object updates easily.
            // Safe approach: Read fresh from server or just overwrite entire array if we trust local state 'winner'
            // For MVP: We will assume we are adding the checkedInAt timestamp.

            // To do this atomically without overwriting other changes is hard.
            // Best bet for MVP: Read current doc, find index, update index, write back.
            // Transactional update would be better.
        }
    }

    // Simplified Sync for MVP: Just pushing a "ScanLog" ensures no overwrite conflicts
    // Then a cloud function aggregates? Or just Client-side logic updates the document.
    // Let's stick to updating the document directly for now.

    // REVISED STRATEGY: 
    // We won't batch complex array updates. We'll verify one by one.
    for (const scan of pending) {
        if (scan.synced) continue;

        try {
            // 1. Find group from local cache to get ID (fast)
            const allGuests = await dbLocal.getAll('guests');
            const group = allGuests.find(g => g.companions.some(c => c.ticketCode === scan.ticketCode));

            if (!group) continue;

            // 2. Fetch fresh from Firestore to avoid overwriting unrelated changes
            const groupRef = doc(db, 'registrations', group.id);
            const freshDoc = await getDoc(groupRef);

            if (freshDoc.exists()) {
                const data = freshDoc.data() as GuestGroup;
                const freshCompanions = data.companions.map(c => {
                    if (c.ticketCode === scan.ticketCode) {
                        return { ...c, status: 'checked_in', checkedInAt: scan.scannedAt };
                    }
                    return c;
                });

                // 3. Update
                await writeBatch(db).update(groupRef, { companions: freshCompanions }).commit(); // Actually batch is singlet here

                // 4. Mark local pending as done (or delete)
                const tx = dbLocal.transaction('pending_scans', 'readwrite');
                await tx.store.delete(scan.ticketCode);
                await tx.done;
                count++;
            }
        } catch (e) {
            console.error(`Failed to sync ticket ${scan.ticketCode}`, e);
        }
    }

    return count;
};
