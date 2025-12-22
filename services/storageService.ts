import { db, waitForAuth, auth } from './firebaseConfig';
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
  console.log(`[Delete] Iniciando eliminación del registro ${id}...`);
  try {
    // Ensure we are authenticated
    await waitForAuth;
    if (!auth.currentUser) {
      console.error("[Delete] No auth user found");
      return { success: false, message: "Error de permisos: Firebase Auth no conectado." };
    }
    // console.log("[Delete] Usuario autenticado:", auth.currentUser.uid);

    // 1. Get the registration to find which invites to release
    const regRef = doc(db, COLLECTION_NAME, id);
    const regSnap = await getDoc(regRef);

    if (regSnap.exists()) {
      const data = regSnap.data();
      console.log("[Delete] Registro encontrado. Buscando invitaciones asociadas...", data);

      // Collect invites
      const invitesToDelete = [];
      if (data.children && Array.isArray(data.children)) {
        data.children.forEach((c: any) => {
          if (c.inviteNumber) invitesToDelete.push(c.inviteNumber);
        });
      }
      // Legacy check
      if (data.inviteNumber) invitesToDelete.push(data.inviteNumber);

      console.log(`[Delete] Invitaciones a liberar: ${invitesToDelete.join(', ')}`);

      // Delete from taken_invites
      for (const invite of invitesToDelete) {
        if (invite) {
          console.log(`[Delete] Eliminando invitación ocupada: ${invite}`);
          await deleteDoc(doc(db, 'taken_invites', invite));
        }
      }
    } else {
      console.warn("[Delete] El documento de registro no existe (posiblemente ya eliminado).");
    }

    // 2. Delete the registration
    console.log("[Delete] Eliminando documento principal...");
    await deleteDoc(regRef);

    // 3. VERIFICATION (Double Check)
    const checkSnap = await getDoc(regRef);
    if (checkSnap.exists()) {
      console.error("[Delete] ZOMBIE RECORD: Delete reported success but doc exists.");
      return { success: false, message: "Error CRÍTICO: El registro no se pudo eliminar (Persistencia de Base de Datos)." };
    }

    console.log("[Delete] Eliminación exitosa.");
    return { success: true };
  } catch (error: any) {
    console.error("[Delete] Error deleting registration", error);
    // Return the actual error code if possible
    const msg = error.code ? `Error Firebase: ${error.code} (${error.message})` : "Error al eliminar el registro.";
    return { success: false, message: msg };
  }
};

export const deleteChild = async (registrationId: string, childId: string, inviteNumber: string): Promise<StorageResult> => {
  try {
    const regRef = doc(db, COLLECTION_NAME, registrationId);

    await runTransaction(db, async (transaction) => {
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) throw "Registro no encontrado.";

      const data = regSnap.data();
      const currentChildren = data.children || [];
      const newChildren = currentChildren.filter((c: any) => c.id !== childId);

      // 1. Update Registration with removed child
      transaction.update(regRef, { children: newChildren });

      // 2. Delete the invite from taken_invites (if it exists)
      if (inviteNumber) {
        const inviteRef = doc(db, 'taken_invites', inviteNumber);
        transaction.delete(inviteRef);
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting child", error);
    return { success: false, message: typeof error === 'string' ? error : "Error al eliminar niño." };
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

    // Also clear taken_invites
    const qInvites = query(collection(db, 'taken_invites'));
    const invitesSnap = await getDocs(qInvites);
    const inviteChunks = [];
    for (let i = 0; i < invitesSnap.docs.length; i += batchSize) {
      inviteChunks.push(invitesSnap.docs.slice(i, i + batchSize));
    }
    for (const chunk of inviteChunks) {
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    console.error("Error clearing database", error);
    return { success: false, message: "Error al reiniciar la base de datos." };
  }
};

export const cleanupOrphanedInvites = async (): Promise<StorageResult> => {
  try {
    console.log("Starting orphan cleanup...");
    // 1. Get all valid Registration IDs
    const regQuery = query(collection(db, COLLECTION_NAME));
    const regSnap = await getDocs(regQuery);
    const validRegIds = new Set(regSnap.docs.map(d => d.id));

    // 2. Get all Taken Invites
    const invitesQuery = query(collection(db, 'taken_invites'));
    const invitesSnap = await getDocs(invitesQuery);

    let deletedCount = 0;
    const batch = writeBatch(db);
    let opCount = 0;

    for (const inviteDoc of invitesSnap.docs) {
      const data = inviteDoc.data();
      const parentId = data.parentRegId;

      // If it has a parentId but that parent doesn't exist in registrations -> Orphan
      if (parentId && !validRegIds.has(parentId)) {
        batch.delete(inviteDoc.ref);
        deletedCount++;
        opCount++;
      } else if (!parentId) {
        // Warning: Invites without parentId? 
        // We can't safely delete unless we cross-check every registration's children.
        // For now, let's only delete if we are sure (orphaned parentId).
        // Or if we want to be aggressive: check if this Invite Number exists in ANY child of ANY valid registration.
        // Let's implement the aggressive safety check for empty parentId
        let isUsed = false;
        const inviteNum = inviteDoc.id;
        for (const regDoc of regSnap.docs) {
          const regData = regDoc.data();
          if (regData.children && regData.children.some((c: any) => c.inviteNumber === inviteNum)) {
            isUsed = true;
            break;
          }
          if (regData.inviteNumber === inviteNum) {
            isUsed = true;
            break;
          }
        }

        if (!isUsed) {
          batch.delete(inviteDoc.ref);
          deletedCount++;
          opCount++;
        }
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphans.`);
    return { success: true, message: `Se limpiaron ${deletedCount} invitaciones huérfanas.` };

  } catch (error: any) {
    console.error("Error cleaning orphans", error);
    return { success: false, message: error.message || "Error al limpiar huérfanos." };
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
    // Check for duplicate username (Create OR Edit)
    const q = query(collection(db, USERS_COLLECTION), where("username", "==", user.username.trim()));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const match = snap.docs[0];
      // Conflict if:
      // 1. Creating new user (no ID provided)
      // 2. Editing user (ID provided) BUT the found match has a different ID
      if (!user.id || match.id !== user.id) {
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

export const cleanupDuplicateDistributors = async (): Promise<StorageResult> => {
  try {
    const distributors = await getDistributors();
    const groups: Record<string, TicketDistributor[]> = {};

    // Group by Name
    distributors.forEach(d => {
      if (!groups[d.name]) groups[d.name] = [];
      groups[d.name].push(d);
    });

    let deletedCount = 0;
    const batch = writeBatch(db);
    let opCount = 0;

    Object.values(groups).forEach(group => {
      if (group.length > 1) {
        // Sort to keep the best one:
        // Prioritize ones with ranges defined
        group.sort((a, b) => {
          const rangeA = (a.startRange || 0) + (a.endRange || 0);
          const rangeB = (b.startRange || 0) + (b.endRange || 0);
          return rangeB - rangeA; // Descending (Best first)
        });

        // Delete all except the first one
        for (let i = 1; i < group.length; i++) {
          const toDelete = group[i];
          if (toDelete.id) {
            const ref = doc(db, 'distributors', toDelete.id);
            batch.delete(ref);
            opCount++;
            deletedCount++;
          }
        }
      }
    });

    if (opCount > 0) {
      await batch.commit();
    }

    return { success: true, message: `Se eliminaron ${deletedCount} distribuidores duplicados.` };

  } catch (error: any) {
    console.error("Error cleaning duplicates", error);
    return { success: false, message: error.message };
  }
};

// --- BACKUP & RESTORE SYSTEM ---

export const getFullDatabaseDump = async (): Promise<any> => {
  try {
    const collections = [
      'registrations',
      'system_users',
      'distributors',
      'settings',
      'taken_invites' // Critical to restore for Invite integrity
    ];

    const output: Record<string, any[]> = {};

    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      output[colName] = snap.docs.map(d => ({ __id: d.id, ...d.data() }));
    }

    // Add counters manually
    const counterSnap = await getDoc(doc(db, 'counters', 'registrations'));
    if (counterSnap.exists()) {
      output['counters'] = [{ __id: 'registrations', ...counterSnap.data() }];
    }

    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: output
    };
  } catch (error) {
    console.error("Backup failed", error);
    throw error;
  }
};

export const restoreDatabaseDump = async (dump: any): Promise<StorageResult> => {
  try {
    if (!dump || !dump.data) {
      return { success: false, message: "El archivo de respaldo no es válido (Falta data)." };
    }

    // 1. WIPE ALL DATA (DANGER ZONE)
    const collectionsToWipe = Object.keys(dump.data);

    for (const colName of collectionsToWipe) {
      const q = query(collection(db, colName));
      const snap = await getDocs(q);
      // Batch delete (chunked)
      const batchSize = 400;
      const chunks = [];
      for (let i = 0; i < snap.docs.length; i += batchSize) {
        chunks.push(snap.docs.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    // 2. RESTORE DATA
    for (const colName of collectionsToWipe) {
      const items = dump.data[colName];
      if (!Array.isArray(items)) continue;

      const batchSize = 400; // Batch limit
      const chunks = [];
      for (let i = 0; i < items.length; i += batchSize) {
        chunks.push(items.slice(i, i + batchSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(item => {
          const { __id, ...rest } = item;
          if (__id) {
            const ref = doc(db, colName, __id);
            batch.set(ref, rest);
          }
        });
        await batch.commit();
      }
    }

    return { success: true };

  } catch (error: any) {
    console.error("Restore failed", error);
    return { success: false, message: error.message || "Error desconocido al restaurar." };
  }
};