import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, getCountFromServer, Timestamp, orderBy, limit, deleteDoc, doc, writeBatch, setDoc, getDoc } from 'firebase/firestore';
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

    // 3. Duplicate WhatsApp check removed to allow multiple children per parent

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

export const deleteRegistration = async (id: string): Promise<StorageResult> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting registration", error);
    return { success: false, message: "Error al eliminar el registro." };
  }
};

export const clearAllRegistrations = async (): Promise<StorageResult> => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);

    // Firestore allows batches of up to 500 operations
    const batchSize = 500;
    const chunks = [];

    for (let i = 0; i < querySnapshot.docs.length; i += batchSize) {
      chunks.push(querySnapshot.docs.slice(i, i + batchSize));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    console.error("Error clearing database", error);
    return { success: false, message: "Error al reiniciar la base de datos." };
  }
};

// --- Global Configuration (Settings) ---

export const getAppConfig = async (): Promise<any | null> => {
  try {
    const docRef = doc(db, 'settings', 'app_config');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching config", error);
    return null;
  }
};

export const saveAppConfig = async (config: any): Promise<StorageResult> => {
  try {
    const docRef = doc(db, 'settings', 'app_config');
    // merge: true allows us to update only fields that changed if we wanted, 
    // but here we likely want to overwrite or merge the whole config object.
    await setDoc(docRef, config, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving config", error);
    return { success: false, message: "Error al guardar la configuración." };
  }
};