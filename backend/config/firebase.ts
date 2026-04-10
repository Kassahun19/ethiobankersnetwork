import { 
  getAdminDb,
  getAdminAuth
} from "./firebaseAdmin";
import { getAuth as getClientAuth } from "firebase/auth";
import { getApps } from "firebase/app";

// Operation types for error handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let clientAuth;
  try {
    // We still try to get client auth if available for context, 
    // but we don't rely on it for initialization
    if (getApps().length > 0) {
      clientAuth = getClientAuth();
    }
  } catch (e) {
    // Auth might not be initialized
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: clientAuth?.currentUser?.uid,
      email: clientAuth?.currentUser?.email,
      emailVerified: clientAuth?.currentUser?.emailVerified,
      isAnonymous: clientAuth?.currentUser?.isAnonymous,
      tenantId: clientAuth?.currentUser?.tenantId,
      providerInfo: clientAuth?.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('[FIREBASE] Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Wrapper to mimic Admin SDK Firestore API using firebase-admin
class CollectionWrapper {
  constructor(private path: string) {}

  private get db() { return getAdminDb(); }

  doc(id?: string) {
    return new DocumentWrapper(this.path, id);
  }

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.path, this.db.collection(this.path).where(field, op, value));
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.path, this.db.collection(this.path).orderBy(field, direction));
  }

  limit(count: number) {
    return new QueryWrapper(this.path, this.db.collection(this.path).limit(count));
  }

  async add(data: any) {
    try {
      const docRef = await this.db.collection(this.path).add(data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.path);
      throw err;
    }
  }

  async get() {
    try {
      const snap = await this.db.collection(this.path).get();
      return {
        empty: snap.empty,
        size: snap.size,
        docs: snap.docs.map((doc: any) => ({
          id: doc.id,
          data: () => doc.data()
        }))
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.path);
      throw err;
    }
  }
}

class DocumentWrapper {
  constructor(private colPath: string, public id?: string) {
    if (!this.id) {
      this.id = getAdminDb().collection(this.colPath).doc().id;
    }
  }

  private get db() { return getAdminDb(); }

  async get() {
    try {
      const docRef = this.db.collection(this.colPath).doc(this.id);
      const snap = await docRef.get();
      return {
        exists: snap.exists,
        id: snap.id,
        data: () => snap.data()
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${this.colPath}/${this.id}`);
      throw err;
    }
  }

  async set(data: any, options?: any) {
    try {
      const docRef = this.db.collection(this.colPath).doc(this.id);
      return await docRef.set(data, options);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }

  async update(data: any) {
    try {
      const docRef = this.db.collection(this.colPath).doc(this.id);
      return await docRef.update(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }

  async delete() {
    try {
      const docRef = this.db.collection(this.colPath).doc(this.id);
      return await docRef.delete();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }
}

class QueryWrapper {
  constructor(private path: string, private query: any) {}

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.path, this.query.where(field, op, value));
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.path, this.query.orderBy(field, direction));
  }

  limit(count: number) {
    return new QueryWrapper(this.path, this.query.limit(count));
  }

  async get() {
    try {
      const snap = await this.query.get();
      return {
        empty: snap.empty,
        size: snap.size,
        docs: snap.docs.map((doc: any) => ({
          id: doc.id,
          data: () => doc.data()
        }))
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.path);
      throw err;
    }
  }
}

export const db = {
  collection: (path: string) => new CollectionWrapper(path)
};

export default { db };
