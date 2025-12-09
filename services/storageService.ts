import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, getCountFromServer, Timestamp, orderBy, limit } from 'firebase/firestore';
import { Registration, StorageResult } from '../types';

const COLLECTION_NAME = 'registrations';

// Helper to convert Firestore timestamp to ISO string if needed, 
// though we store it as ISO string based on original types.
// We will stick to storing `timestamp` as string for compatibility with existing type definition.

export const getRegistrations = async (): Promise<Registration[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
  } catch (error) {
    console.error("Error accessing Firestore", error);
    return [];
  }
};

export const getRemainingSlots = async (maxLimit: number): Promise<number> => {
  try {
    const coll = collection(db, COLLECTION_NAME);
    const snapshot = await getCountFromServer(coll);
    const currentCount = snapshot.data().count;
    return Math.max(0, maxLimit - currentCount);
  } catch (error) {
    console.error("Error fetching count", error);
    return 0; // Fail safe
  }
};

export const saveRegistration = async (data: Omit<Registration, 'id' | 'timestamp'>, maxLimit: number): Promise<StorageResult> => {
  try {
    // 1. Check Global Limit in Real-Time
    const slots = await getRemainingSlots(maxLimit);
    if (slots <= 0) {
      return { success: false, message: 'Lo sentimos, se ha alcanzado el límite máximo de cupos.' };
    }

    // 2. Check Duplicate Invite Number
    const qInvite = query(collection(db, COLLECTION_NAME), where("inviteNumber", "==", data.inviteNumber), limit(1));
    const inviteSnap = await getDocs(qInvite);
    if (!inviteSnap.empty) {
      return { success: false, message: `El número de invitación ${data.inviteNumber} ya ha sido utilizado.` };
    }

    // 3. Check Duplicate WhatsApp
    const qPhone = query(collection(db, COLLECTION_NAME), where("whatsapp", "==", data.whatsapp), limit(1));
    const phoneSnap = await getDocs(qPhone);
    if (!phoneSnap.empty) {
      return { success: false, message: `El número de WhatsApp ${data.whatsapp} ya está registrado.` };
    }

    // 4. Save to Firestore
    const newRegistrationData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // addDoc auto-generates an ID
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newRegistrationData);

    const completeRegistration: Registration = {
      id: docRef.id,
      ...newRegistrationData
    };

    return { success: true, data: completeRegistration };

  } catch (error) {
    console.error("Error saving registration", error);
    return { success: false, message: "Hubo un error al guardar tu registro. Intenta de nuevo." };
  }
};