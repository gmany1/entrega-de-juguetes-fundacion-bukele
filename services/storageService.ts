import { Registration, StorageResult } from '../types';

const STORAGE_KEY = 'juguetes_elsalvador_db';

export const getRegistrations = (): Registration[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error accessing local storage", error);
    return [];
  }
};

export const getRemainingSlots = (maxLimit: number): number => {
  const currentCount = getRegistrations().length;
  return Math.max(0, maxLimit - currentCount);
};

export const saveRegistration = (data: Omit<Registration, 'id' | 'timestamp'>, maxLimit: number): StorageResult => {
  const registrations = getRegistrations();

  // 1. Check Global Limit (Dynamic)
  if (registrations.length >= maxLimit) {
    return { success: false, message: 'Lo sentimos, se ha alcanzado el límite máximo de cupos.' };
  }

  // 2. Check Duplicate Invite Number
  const duplicateInvite = registrations.find(r => r.inviteNumber === data.inviteNumber);
  if (duplicateInvite) {
    return { success: false, message: `El número de invitación ${data.inviteNumber} ya ha sido utilizado.` };
  }

  // 3. Check Duplicate WhatsApp
  const duplicatePhone = registrations.find(r => r.whatsapp === data.whatsapp);
  if (duplicatePhone) {
    return { success: false, message: `El número de WhatsApp ${data.whatsapp} ya está registrado.` };
  }

  const newRegistration: Registration = {
    ...data,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  registrations.push(newRegistration);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));

  return { success: true, data: newRegistration };
};