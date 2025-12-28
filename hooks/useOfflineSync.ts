
import { useState, useEffect } from 'react';
import { GuestGroup as Registration, Companion as Child } from '../types';
import { getGuestGroups as getRegistrations, updateCompanionStatus as updateChildStatus } from '../services/storageService';
import { openDB, DBSchema } from 'idb';

const DB_NAME = 'juguetes-offline-db';
const STORE_WHITELIST = 'whitelist';
const STORE_QUEUE = 'queue';

interface OfflineDB extends DBSchema {
    [STORE_WHITELIST]: {
        key: string;
        value: Registration;
    };
    [STORE_QUEUE]: {
        key: string;
        value: OfflineQueueItem;
        indexes: { 'timestamp': string };
    };
}

export interface OfflineQueueItem {
    parentId: string;
    childId: string;
    status: 'checked_in';
    timestamp: string;
    synced: boolean;
    id?: number; // Auto-increment ID from IDB
}

export const useOfflineSync = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [whitelist, setWhitelist] = useState<Registration[]>([]);
    const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbReady, setDbReady] = useState(false);

    // Initialize DB
    useEffect(() => {
        const initDB = async () => {
            try {
                const db = await openDB<OfflineDB>(DB_NAME, 1, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains(STORE_WHITELIST)) {
                            db.createObjectStore(STORE_WHITELIST, { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
                            const qStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
                            qStore.createIndex('timestamp', 'timestamp');
                        }
                    },
                });
                setDbReady(true);

                // Load initial data
                const storedWhitelist = await db.getAll(STORE_WHITELIST);
                setWhitelist(storedWhitelist);

                const storedQueue = await db.getAll(STORE_QUEUE);
                setQueue(storedQueue);

            } catch (e) {
                console.error("Failed to init IndexedDB", e);
            }
        };

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        initDB();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const downloadWhitelist = async () => {
        if (!dbReady) return;
        setIsSyncing(true);
        try {
            console.log("Downloading whitelist...");
            const regs = await getRegistrations();
            console.log(`Downloaded ${regs.length} records. Saving to IndexedDB...`);

            const db = await openDB<OfflineDB>(DB_NAME, 1);
            const tx = db.transaction(STORE_WHITELIST, 'readwrite');
            const store = tx.objectStore(STORE_WHITELIST);

            // Clear old data first to match server state (in case deletions happened)
            await store.clear();

            for (const reg of regs) {
                await store.put(reg);
            }

            await tx.done;

            setWhitelist(regs);
            setLastSync(new Date().toISOString());
            console.log("Whitelist saved successfully.");
        } catch (e) {
            console.error("Failed to download whitelist", e);
            alert("No se pudo descargar la lista. Revisa tu conexión. Detalle: " + e);
        } finally {
            setIsSyncing(false);
        }
    };

    const processQueue = async () => {
        if (isOffline || queue.length === 0 || !dbReady) return;

        setIsSyncing(true);
        const db = await openDB<OfflineDB>(DB_NAME, 1);
        const currentQueue = await db.getAll(STORE_QUEUE);

        let successes = 0;

        for (const item of currentQueue) {
            if (item.synced) continue;

            try {
                console.log(`Syncing item: ${item.parentId} - ${item.childId}`);
                const res = await updateChildStatus(item.parentId, item.childId, item.status, item.timestamp);
                if (res.success) {
                    // Update item in DB as synced or delete it? 
                    // Let's delete it if successful to keep queue clean, or mark synced.
                    // For now, delete to clear queue.
                    if (item.id) {
                        await db.delete(STORE_QUEUE, item.id as any); // Type cast due to idb quirks with autoIncrement keys
                        successes++;
                    }
                }
            } catch (e) {
                console.error("Sync failed for item", item, e);
            }
        }

        // Refresh Queue State
        const remaining = await db.getAll(STORE_QUEUE);
        setQueue(remaining);
        setIsSyncing(false);

        if (successes > 0) {
            // alert(`Se sincronizaron ${successes} entregas pendientes.`);
            // Refresh whitelist to keep consistent
            downloadWhitelist();
        }
    };

    const addToQueue = async (parentId: string, childId: string) => {
        if (!dbReady) return;

        const newItem: OfflineQueueItem = {
            parentId,
            childId,
            status: 'checked_in',
            timestamp: new Date().toISOString(),
            synced: false
        };

        // 1. Save to IDB Queue
        const db = await openDB<OfflineDB>(DB_NAME, 1);
        await db.add(STORE_QUEUE, newItem);

        // Update Local State for UI
        const updatedQueue = await db.getAll(STORE_QUEUE);
        setQueue(updatedQueue);

        // 2. Optimistic update of local whitelist for immediate feedback loop
        const newWhitelist = [...whitelist];
        const parentIdx = newWhitelist.findIndex(r => r.id === parentId);
        if (parentIdx !== -1) {
            const parent = { ...newWhitelist[parentIdx] };
            // Handle children array
            if (parent.children) {
                const childIdx = parent.children.findIndex(c => c.id === childId);
                if (childIdx !== -1) {
                    parent.children[childIdx] = { ...parent.children[childIdx], status: 'checked_in', checkedInAt: newItem.timestamp };
                }
            }
            newWhitelist[parentIdx] = parent;
            setWhitelist(newWhitelist);

            // Also update the whitelist in IDB so if they reload page while offline, it shows delivered
            await db.put(STORE_WHITELIST, parent);
        }
    };

    // Auto-sync process when online
    useEffect(() => {
        if (!isOffline && queue.length > 0) {
            const timer = setInterval(() => {
                processQueue();
            }, 5000); // Check every 5s
            return () => clearInterval(timer);
        }
    }, [isOffline, queue]);

    return {
        isOffline,
        whitelist,
        queue,
        downloadWhitelist,
        addToQueue,
        isSyncing,
        processQueue
    };
};
