import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { GuestGroup, SystemUser, AppConfig } from '../types';
import {
    getGuestGroups as getRegistrations,
    getSystemUsers,
    saveSystemUser as saveUserService,
    deleteSystemUser as deleteUserService,
    deleteGuestGroup as deleteRegService,
    updateGuestGroup as updateRegService, // This needs to be checked if it exists or we use saveGuestGroup
    deleteCompanion as deleteChildService
} from '../services/storageService';
import { waitForAuth, auth } from '../services/firebaseConfig';
import { useConfig } from './ConfigContext';

// Mock Data for Demo
const MOCK_REGISTRATIONS: GuestGroup[] = [
    {
        id: 'mock1',
        primaryGuestName: 'Familia Pérez-López',
        whatsapp: '+503 7777-1234',
        tableAssignment: 'Mesa 4',
        dietaryRestrictions: '1x Vegetariano',
        songRequest: 'La Bamba - Ritchie Valens',
        messageToCouple: '¡Muchas felicidades! Nos vemos en la pista.',
        companions: [
            { id: 'c1', fullName: 'Juan Pérez', ticketCode: 'PER-001', age: 35, mealPreference: 'Carne', status: 'checked_in' },
            { id: 'c2', fullName: 'Maria López', ticketCode: 'PER-002', age: 32, mealPreference: 'Vegetariano', status: 'checked_in' }
        ],
        timestamp: new Date().toISOString()
    },
    {
        id: 'mock2',
        primaryGuestName: 'Carlos Martinez (Amigo Novio)',
        whatsapp: '+503 7000-5678',
        tableAssignment: 'Mesa 8',
        songRequest: 'Vivir Mi Vida - Marc Anthony',
        companions: [
            { id: 'c3', fullName: 'Carlos Martinez', ticketCode: 'MAR-001', age: 28, mealPreference: 'Pollo', status: 'pending' }
        ],
        timestamp: new Date().toISOString()
    }
];

interface AdminContextType {
    registrations: GuestGroup[];
    users: SystemUser[];
    isLoading: boolean;
    error: string | null;

    // Actions
    refreshData: () => Promise<void>;
    refreshUsers: () => Promise<void>;

    // CRUD Wrappers that update local state
    handleDeleteRegistration: (id: string) => Promise<boolean>;
    handleUpdateRegistration: (id: string, data: Partial<GuestGroup>) => Promise<boolean>;
    handleDeleteChild: (regId: string, childId: string, inviteNumber: string) => Promise<boolean>;

    // Stats (Computed)
    stats: {
        totalRegistrations: number;
        totalTickets: number;
        deliveredCount: number;
        pendingCount: number;
        distributorData: any[]; // Recharts data
        ageData: any[]; // Recharts data
        genderData: any[]; // Recharts data
        timelineData: any[]; // Recharts data
        colonyData: any[]; // Recharts data
    };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { config } = useConfig();
    const [registrations, setRegistrations] = useState<GuestGroup[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await waitForAuth;
            if (auth.currentUser) {
                const [regs, usrs] = await Promise.all([
                    getRegistrations(),
                    getSystemUsers()
                ]);
                setRegistrations([...regs, ...MOCK_REGISTRATIONS]);
                setUsers(usrs);
            }
        } catch (err: any) {
            console.error("Error loading admin data", err);
            setError(err.message || "Error al cargar datos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Polling for "Live" updates as per Logistics Narrative
        const intervalId = setInterval(() => {
            refreshData();
        }, 15000); // Poll every 15 seconds

        return () => clearInterval(intervalId);
    }, []);

    const refreshData = async () => {
        const regs = await getRegistrations();
        setRegistrations(regs);
    };

    const refreshUsers = async () => {
        const usrs = await getSystemUsers();
        setUsers(usrs);
    };

    const handleDeleteRegistration = async (id: string) => {
        const res = await deleteRegService(id);
        if (res.success) {
            setRegistrations(prev => prev.filter(r => r.id !== id));
            return true;
        }
        return false;
    };

    const handleUpdateRegistration = async (id: string, data: Partial<GuestGroup>) => {
        // NOTE: If updateRegService (updateGuestGroup) doesn't exist, we might need saveGuestGroup
        // But for partial updates, usually we want a specific update function.
        // Assuming updateGuestGroup behaves like updateRegistration (merges data)
        const res = await updateRegService(id, data as any); // Type cast if needed until strictly typed
        if (res.success) {
            setRegistrations(prev => prev.map(r => r.id === id ? { ...r, ...data } as GuestGroup : r));
            return true;
        }
        return false;
    };

    const handleDeleteChild = async (regId: string, childId: string, inviteNumber: string) => {
        const res = await deleteChildService(regId, childId, inviteNumber);
        if (res.success) {
            setRegistrations(prev => prev.map(r => {
                if (r.id === regId) {
                    const newChildren = (r.companions || []).filter(c => c.id !== childId);
                    return { ...r, companions: newChildren, childCount: newChildren.length }; // childCount legacy
                }
                return r;
            }));
            return true;
        }
        return false;
    };

    // --- Statistics Computation ---
    const stats = useMemo(() => {
        const totalRegistrations = registrations.length;
        let totalTickets = 0;
        let deliveredCount = 0;

        // Data Structures for Charts
        const ageDist: Record<number, number> = {};
        const genderDist: Record<string, number> = { 'Niño': 0, 'Niña': 0 };
        const timeline: Record<string, number> = {};
        const colonies: Record<string, Record<string, number>> = {}; // colony -> { DistributorName: count }
        const distributorStats: Record<string, { registered: number, missing: number }> = {};

        // Initialize Distributors (Tables)
        config.tables?.forEach(d => {
            distributorStats[d.tableName] = { registered: 0, missing: d.capacity };
        });
        // Fallback for legacy 'ticketDistributors' if config.tables is empty?
        if (Object.keys(distributorStats).length === 0 && config.ticketDistributors) {
            config.ticketDistributors.forEach(d => {
                distributorStats[d.name] = { registered: 0, missing: (d.endRange || 0) - (d.startRange || 0) + 1 };
            });
        }


        registrations.forEach(reg => {
            // Determine children / companions
            const groupMembers = (reg.companions && reg.companions.length > 0)
                ? reg.companions
                // Legacy fallback for old 'children' field or if just raw
                : ((reg as any).children && (reg as any).children.length > 0)
                    ? (reg as any).children
                    : [];

            totalTickets += groupMembers.length;

            // Timeline
            const date = reg.timestamp ? reg.timestamp.split('T')[0] : 'N/A';
            timeline[date] = (timeline[date] || 0) + groupMembers.length;

            // Colony / Address
            const colony = reg.address ? reg.address.split(',')[0].trim() : (reg as any).addressDetails || 'Desconocido';

            // Determine Dist/Table
            // Use config distributor logic if available, or reg.ticketDistributor/tableAssignment
            const assignedTable = reg.tableAssignment || reg.ticketDistributor || 'Otros';

            if (!colonies[colony]) colonies[colony] = {};
            colonies[colony][assignedTable] = (colonies[colony][assignedTable] || 0) + groupMembers.length;


            groupMembers.forEach((c: any) => {
                if (c.status === 'checked_in' || c.status === 'delivered') deliveredCount++;

                // Age (if available)
                if (c.age) {
                    const age = parseInt(String(c.age)) || 0;
                    ageDist[age] = (ageDist[age] || 0) + 1;
                }

                // Gender (if available)
                if (c.gender) {
                    const g = c.gender === 'Niño' || c.gender === 'niños' || c.gender === 'Masculino' ? 'Niño' : 'Niña';
                    genderDist[g] = (genderDist[g] || 0) + 1;
                }

                // Table Stats (using tableAssignment now)
                if (distributorStats[assignedTable]) {
                    distributorStats[assignedTable].registered++;
                    distributorStats[assignedTable].missing--;
                }
            });
        });

        // Format for Recharts
        const ageData = Object.entries(ageDist).map(([age, count]) => ({ age, count })).sort((a, b) => parseInt(a.age as string) - parseInt(b.age as string));
        const genderData = Object.entries(genderDist).map(([name, value]) => ({ name, value }));
        const timelineData = Object.entries(timeline).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

        const distributorData = Object.entries(distributorStats).map(([name, val]) => ({
            name,
            registered: val.registered,
            missing: Math.max(0, val.missing)
        }));

        const colonyData = Object.entries(colonies).map(([name, dists]) => ({
            name,
            ...dists
        })).sort((a, b) => {
            // sort by total count
            const sumA = Object.values(a).reduce((sum: number, v) => typeof v === 'number' ? sum + v : sum, 0) as number;
            const sumB = Object.values(b).reduce((sum: number, v) => typeof v === 'number' ? sum + v : sum, 0) as number;
            return sumB - sumA;
        });

        return {
            totalRegistrations,
            totalTickets,
            deliveredCount,
            pendingCount: totalTickets - deliveredCount,
            distributorData,
            ageData,
            genderData,
            timelineData,
            colonyData
        };

    }, [registrations, config.tables, config.ticketDistributors]);

    return (
        <AdminContext.Provider value={{
            registrations,
            users,
            isLoading,
            error,
            refreshData,
            refreshUsers,
            handleDeleteRegistration,
            handleUpdateRegistration,
            handleDeleteChild,
            stats
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
