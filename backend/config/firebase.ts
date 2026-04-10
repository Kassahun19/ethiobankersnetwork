import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Firestore,
  QueryConstraint,
} from "firebase/firestore";
import { getAuth as getClientAuth } from "firebase/auth";
import fs from "fs";
import path from "path";

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

// Load configuration with fallback
let firebaseConfigFromFile: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfigFromFile = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (err) {
  // Silent fail for config file
}

const firebaseConfig: any = {
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfigFromFile.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfigFromFile.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigFromFile.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfigFromFile.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfigFromFile.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || firebaseConfigFromFile.appId,
  firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigFromFile.firestoreDatabaseId,
};

// Log config status (redacted)
console.log("[FIREBASE] Config status:", {
  hasApiKey: !!firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)"
});

let _app: any;
function getFirebaseApp() {
  if (!_app) {
    try {
      if (getApps().length === 0) {
        console.log("[FIREBASE] Initializing new Firebase App...");
        _app = initializeApp(firebaseConfig);
      } else {
        _app = getApp();
      }
    } catch (err) {
      console.error("[FIREBASE] Failed to initialize Firebase App:", err);
      throw err;
    }
  }
  return _app;
}

let _clientDb: Firestore | null = null;
function getClientDb() {
  if (!_clientDb) {
    try {
      const app = getFirebaseApp();
      const dbId = firebaseConfig.firestoreDatabaseId;
      console.log(`[FIREBASE] Initializing Firestore (DB ID: ${dbId || "(default)"})...`);
      
      // If DB ID looks like a placeholder or is empty, use default
      const effectiveDbId = (dbId && dbId !== "TODO_FIRESTORE_DATABASE_ID") ? dbId : undefined;
      _clientDb = getFirestore(app, effectiveDbId);
    } catch (err) {
      console.error("[FIREBASE] Failed to initialize Firestore:", err);
      throw err;
    }
  }
  return _clientDb;
}

// Wrapper to mimic Admin SDK Firestore API
class CollectionWrapper {
  constructor(private path: string) {}

  private get db() { return getClientDb(); }

  doc(id?: string) {
    return new DocumentWrapper(this.path, id);
  }

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.path, [where(field, op, value)]);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.path, [orderBy(field, direction)]);
  }

  limit(count: number) {
    return new QueryWrapper(this.path, [limit(count)]);
  }

  async add(data: any) {
    try {
      const colRef = collection(this.db, this.path);
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.path);
      throw err;
    }
  }

  async get() {
    try {
      const colRef = collection(this.db, this.path);
      const snap = await getDocs(colRef);
      return {
        empty: snap.empty,
        size: snap.size,
        docs: snap.docs.map(doc => ({
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
  public id: string;
  constructor(private colPath: string, id?: string) {
    const db = getClientDb();
    this.id = id || doc(collection(db, this.colPath)).id;
  }

  private get db() { return getClientDb(); }

  async get() {
    try {
      const docRef = doc(this.db, this.colPath, this.id);
      const snap = await getDoc(docRef);
      return {
        exists: snap.exists(),
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
      const docRef = doc(this.db, this.colPath, this.id);
      return await setDoc(docRef, data, options);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }

  async update(data: any) {
    try {
      const docRef = doc(this.db, this.colPath, this.id);
      return await updateDoc(docRef, data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }

  async delete() {
    try {
      const docRef = doc(this.db, this.colPath, this.id);
      return await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${this.colPath}/${this.id}`);
      throw err;
    }
  }
}

class QueryWrapper {
  constructor(private path: string, private constraints: QueryConstraint[]) {}

  private get db() { return getClientDb(); }

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.path, [...this.constraints, where(field, op, value)]);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.path, [...this.constraints, orderBy(field, direction)]);
  }

  limit(count: number) {
    return new QueryWrapper(this.path, [...this.constraints, limit(count)]);
  }

  async get() {
    try {
      const colRef = collection(this.db, this.path);
      const q = query(colRef, ...this.constraints);
      const snap = await getDocs(q);
      return {
        empty: snap.empty,
        size: snap.size,
        docs: snap.docs.map(doc => ({
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
