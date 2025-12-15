
import { useState, useEffect } from 'react';
import { Registration, Child } from '../types';
import { getRegistrations, updateChildStatus } from '../services/storageService';

const CACHE_KEY = 'offline_whitelist';
const QUEUE_KEY = 'offline_queue';

export interface OfflineQueueItem {
    parentId: string;
    childId: string;
    status: 'delivered';
    timestamp: string;
    synced: boolean;
}

export const useOfflineSync = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [whitelist, setWhitelist] = useState<Registration[]>([]);
    const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initial Load
    useEffect(() => {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
            setWhitelist(JSON.parse(stored));
        }

        const storedQueue = localStorage.getItem(QUEUE_KEY);
        if (storedQueue) {
            setQueue(JSON.parse(storedQueue));
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const downloadWhitelist = async () => {
        setIsSyncing(true);
        try {
            const regs = await getRegistrations();
            localStorage.setItem(CACHE_KEY, JSON.stringify(regs));
            setWhitelist(regs);
            setLastSync(new Date().toISOString());
        } catch (e) {
            console.error("Failed to download whitelist", e);
            alert("No se pudo descargar la lista. Revisa tu conexión.");
        } finally {
            setIsSyncing(false);
        }
    };

    const processQueue = async () => {
        if (isOffline || queue.length === 0) return;

        setIsSyncing(true);
        const newQueue = [...queue];
        let successes = 0;

        for (let i = 0; i < newQueue.length; i++) {
            const item = newQueue[i];
            if (item.synced) continue;

            try {
                const res = await updateChildStatus(item.parentId, item.childId, item.status, item.timestamp);
                if (res.success) {
                    item.synced = true;
                    successes++;
                }
            } catch (e) {
                console.error("Sync failed for item", item, e);
            }
        }

        // Remove synced items
        const remaining = newQueue.filter(i => !i.synced);
        setQueue(remaining);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        setIsSyncing(false);

        if (successes > 0) {
            // alert(`Se sincronizaron ${successes} entregas pendientes.`);
            // Refresh whitelist to keep consistent
            downloadWhitelist();
        }
    };

    const addToQueue = (parentId: string, childId: string) => {
        const newItem: OfflineQueueItem = {
            parentId,
            childId,
            status: 'delivered',
            timestamp: new Date().toISOString(),
            synced: false
        };

        const newQueue = [...queue, newItem];
        setQueue(newQueue);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));

        // Optimistic update of local whitelist for immediate feedback loop
        const newWhitelist = [...whitelist];
        const parentIdx = newWhitelist.findIndex(r => r.id === parentId);
        if (parentIdx !== -1) {
            const parent = { ...newWhitelist[parentIdx] };
            // Handle children array
            if (parent.children) {
                const childIdx = parent.children.findIndex(c => c.id === childId);
                if (childIdx !== -1) {
                    parent.children[childIdx] = { ...parent.children[childIdx], status: 'delivered', deliveredAt: newItem.timestamp };
                }
            } else {
                // Legacy fallback logic
                // For now, whitelist assumes unified structure or we just accept the queue add
            }
            newWhitelist[parentIdx] = parent;
            setWhitelist(newWhitelist);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newWhitelist));
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
