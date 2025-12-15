import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, getCountFromServer, Timestamp, orderBy, limit, deleteDoc, doc, writeBatch, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { Registration, StorageResult, SystemUser, TicketDistributor } from '../types';

const COLLECTION_NAME = 'registrations';

// Helper to convert Firestore timestamp to ISO string if needed, 
// though we store it as ISO string based on original types.
// We will stick to storing `timestamp` as string for compatibility with existing type definition.

export const getRegistrations = async (distributorFilter?: string): Promise<Registration[]> => {
  try {
    let q;
    if (distributorFilter) {
      q = query(collection(db, COLLECTION_NAME), where('ticketDistributor', '==', distributorFilter), orderBy('timestamp', 'desc'));
    } else {
      q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Registration, 'id'>;
      return { id: doc.id, ...data };
    });
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

// Helper to sync counter if missing (Self-healing)
const ensureCounterSynced = async () => {
  const counterRef = doc(db, 'counters', 'registrations');
  const snap = await getDoc(counterRef);
  if (!snap.exists()) {
    const coll = collection(db, COLLECTION_NAME);
    const snapshot = await getCountFromServer(coll);
    await setDoc(counterRef, { count: snapshot.data().count });
  }
};

export const saveRegistration = async (data: Omit<Registration, 'id' | 'timestamp'>, maxLimit: number): Promise<StorageResult> => {
  try {
    await ensureCounterSynced();

    const result = await runTransaction(db, async (transaction) => {
      // 1. Read Counter (Fail Fast)
      const counterRef = doc(db, 'counters', 'registrations');
      const counterSnap = await transaction.get(counterRef);

      if (!counterSnap.exists()) {
        throw "Counter synced but missing in transaction. Retry.";
      }

      const currentCount = counterSnap.data().count;
      if (currentCount >= maxLimit) {
        throw "Lo sentimos, se ha alcanzado el límite máximo de cupos.";
      }

      // 2. Client-side Prep
      const newInvites = data.children.map(c => c.inviteNumber);
      const uniqueNewInvites = new Set(newInvites);
      if (uniqueNewInvites.size !== newInvites.length) {
        throw 'Hay números de invitación repetidos en este registro.';
      }

      // 3. Check Duplicates (Atomic Read)
      for (const invite of newInvites) {
        const inviteRef = doc(db, 'taken_invites', invite);
        const inviteSnap = await transaction.get(inviteRef);
        if (inviteSnap.exists()) {
          throw `La invitación ${invite} ya fue utilizada por ${inviteSnap.data().usedByChild}.`;
        }
      }

      // 4. Writes
      const regRef = doc(collection(db, COLLECTION_NAME));
      const newRegistrationData = {
        ...data,
        timestamp: new Date().toISOString()
      };

      transaction.set(regRef, newRegistrationData);

      // Update Counter
      transaction.update(counterRef, { count: currentCount + 1 });

      // Mark invites
      for (const child of data.children) {
        const inviteRef = doc(db, 'taken_invites', child.inviteNumber);
        transaction.set(inviteRef, {
          usedByChild: child.fullName,
          parentRegId: regRef.id,
          timestamp: new Date().toISOString()
        });
      }

      return { id: regRef.id, ...newRegistrationData };
    });

    return { success: true, data: result as Registration };

  } catch (error: any) {
    console.error("Transaction Error", error);
    // Clean error message if it's one of ours
    const msg = typeof error === 'string' ? error : "Hubo un error al guardar tu registro. Intenta de nuevo.";
    return { success: false, message: msg };
  }
};

export const updateChildStatus = async (registrationId: string, childId: string, status: 'delivered', deliveredAt: string): Promise<StorageResult> => {
  try {
    const regRef = doc(db, COLLECTION_NAME, registrationId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) return { success: false, message: "Registro no encontrado" };

    const data = regSnap.data() as Registration;
    let updatedChildren;

    if (data.children && Array.isArray(data.children)) {
      updatedChildren = data.children.map(child => {
        if (child.id === childId) {
          return { ...child, status, deliveredAt };
        }
        return child;
      });
    } else {
      // Handle Legacy Record Migration (Create children array from root fields)
      // Check if we are targeting the legacy child (id 'legacy')
      updatedChildren = [{
        id: 'legacy',
        name: data.fullName || 'Beneficiario',
        inviteNumber: data.inviteNumber || '???',
        age: String(data.childAge || 0),
        gender: data.genderSelection || 'N/A',
        status: status,
        deliveredAt: deliveredAt
      }];
    }

    await setDoc(regRef, { children: updatedChildren }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating child status", error);
    return { success: false, message: "Error al actualizar estado." };
  }
};


export const updateRegistration = async (id: string, data: Partial<Registration>): Promise<StorageResult> => {
  try {
    const regRef = doc(db, COLLECTION_NAME, id);
    await setDoc(regRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error updating registration", error);
    return { success: false, message: "Error al actualizar el registro." };
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

export const getRegistrationById = async (id: string): Promise<Registration | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Registration;
    }
    return null;
  } catch (error) {
    console.error("Error fetching registration", error);
    return null;
  }
};

// --- User Management ---

const USERS_COLLECTION = 'system_users';

export const getSystemUsers = async (): Promise<SystemUser[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const qs = await getDocs(q);
    return qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser));
  } catch (error) {
    console.error("Error fetching users", error);
    return [];
  }
};

export const saveSystemUser = async (user: Omit<SystemUser, 'id'> & { id?: string }): Promise<StorageResult> => {
  try {
    // Check for duplicate username
    if (!user.id) { // Only on create
      const q = query(collection(db, USERS_COLLECTION), where("username", "==", user.username.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { success: false, message: "El nombre de usuario ya existe." };
      }
    }

    let userRef;
    if (user.id) {
      userRef = doc(db, USERS_COLLECTION, user.id);
    } else {
      userRef = doc(collection(db, USERS_COLLECTION));
    }

    const userData = { ...user, id: userRef.id }; // Ensure ID is part of data
    await setDoc(userRef, userData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error saving user", error);
    return { success: false, message: "Error al guardar usuario." };
  }
};

export const deleteSystemUser = async (id: string): Promise<StorageResult> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting user", error);
    return { success: false, message: "Error al eliminar usuario." };
  }
};

export const authenticateUser = async (username: string, password: string): Promise<SystemUser | null> => {
  try {
    // 2. Check Database
    const q = query(collection(db, USERS_COLLECTION), where("username", "==", username.trim()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const user = userDoc.data() as SystemUser;

      if (user.password === password) {
        return { ...user, id: userDoc.id };
      }
    }
  } catch (error) {
    console.warn("[Auth] Database check failed. Proceeding to fallback.");
  }

  // 2. FALLBACK: Hardcoded Super Admin (Emergency Access)
  try {
    const isFallbackMatch = username.trim() === 'jorge' && password.trim() === '79710214';

    if (isFallbackMatch) {
      // Trigger background sync
      initDefaultAdmin().catch(console.error);

      return {
        id: 'super-admin',
        username: 'jorge',
        password: '',
        role: 'admin',
        name: 'Super Admin'
      };
    }
  } catch (e) {
    console.error("Fallback error", e);
  }

  return null;
};



export const initDefaultAdmin = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where("username", "==", "jorge"));
    const snap = await getDocs(q);

    const adminData = {
      username: 'jorge',
      password: '79710214',
      name: 'Super Admin',
      role: 'admin' as const
    };

    if (snap.empty) {
      console.log("Creating Default Admin...");
      await saveSystemUser(adminData);
      console.log("Default Admin Created");
    } else {
      // Ensure the password is correct/synced even if user exists (Self-healing for the migration issue)
      const userDoc = snap.docs[0];
      const currentUser = userDoc.data();
      if (currentUser.password !== adminData.password) {
        console.log("Syncing Admin Password...");
        await setDoc(userDoc.ref, { password: adminData.password }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error init default admin", error);
  }
};

// --- Distributor Management ---

export const getDistributors = async (): Promise<TicketDistributor[]> => {
  try {
    const q = query(collection(db, 'distributors'), orderBy('name'));
    const qs = await getDocs(q);
    return qs.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketDistributor));
  } catch (error) {
    console.error("Error fetching distributors", error);
    return [];
  }
};

export const saveDistributor = async (distributor: TicketDistributor): Promise<StorageResult> => {
  try {
    const data = { ...distributor };
    delete data.id; // Don't save ID inside the document if it's already the doc ID, but here we can just spread. 
    // Actually standard practice is to separate doc ID from data.

    let ref;
    if (distributor.id) {
      ref = doc(db, 'distributors', distributor.id);
    } else {
      ref = doc(collection(db, 'distributors'));
    }

    await setDoc(ref, { ...data, name: data.name.trim() }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving distributor", error);
    return { success: false, message: "Error al guardar distribuidor." };
  }
};

export const deleteDistributor = async (id: string): Promise<StorageResult> => {
  try {
    await deleteDoc(doc(db, 'distributors', id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting distributor", error);
    return { success: false, message: "Error al eliminar distribuidor." };
  }
};