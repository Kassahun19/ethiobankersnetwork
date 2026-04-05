import { initializeApp } from "firebase/app";
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
  getDocFromServer,
  Firestore,
  QueryConstraint,
  Query,
  DocumentReference,
  CollectionReference
} from "firebase/firestore";
import fs from "fs";
import path from "path";
import { getAuth as getClientAuth } from "firebase/auth";

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
  const clientAuth = getClientAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: clientAuth.currentUser?.uid,
      email: clientAuth.currentUser?.email,
      emailVerified: clientAuth.currentUser?.emailVerified,
      isAnonymous: clientAuth.currentUser?.isAnonymous,
      tenantId: clientAuth.currentUser?.tenantId,
      providerInfo: clientAuth.currentUser?.providerData.map(provider => ({
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

// Load configuration from environment variables or firebase-applet-config.json
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID,
};

// If environment variables are missing, try to load from the config file
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  try {
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      firebaseConfig = { ...firebaseConfig, ...fileConfig };
    }
  } catch (error) {
    console.error("Error loading firebase-applet-config.json:", error);
  }
}

console.log(`[FIREBASE] Config keys present: ${Object.keys(firebaseConfig).filter(k => !!firebaseConfig[k]).join(", ")}`);
const app = initializeApp(firebaseConfig);
const clientDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to get a dummy doc from server to test connection
    await getDocFromServer(doc(clientDb, 'test', 'connection'));
    console.log("[FIREBASE] Connection test successful");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[FIREBASE] Connection test failed: The client is offline. Please check your Firebase configuration and network.");
    } else {
      // Other errors are expected if the doc doesn't exist or permissions are tight
      console.log("[FIREBASE] Connection test completed (may have expected permission/not-found errors)");
    }
  }
}
testConnection();

console.log(`[FIREBASE] Initialized for project: ${firebaseConfig.projectId}`);
if (firebaseConfig.firestoreDatabaseId) {
  console.log(`[FIREBASE] Using database: ${firebaseConfig.firestoreDatabaseId}`);
}

// Wrapper to mimic Admin SDK Firestore API
class CollectionWrapper {
  constructor(private db: Firestore, private path: string) {}

  doc(id?: string) {
    return new DocumentWrapper(this.db, this.path, id);
  }

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.db, this.path, [where(field, op, value)]);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.db, this.path, [orderBy(field, direction)]);
  }

  limit(count: number) {
    return new QueryWrapper(this.db, this.path, [limit(count)]);
  }

  async add(data: any) {
    try {
      const colRef = collection(this.db, this.path);
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, this.path);
      throw err; // Should not reach here as handleFirestoreError throws
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
  constructor(private db: Firestore, private colPath: string, id?: string) {
    this.id = id || doc(collection(this.db, this.colPath)).id;
  }

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
  constructor(private db: Firestore, private path: string, private constraints: QueryConstraint[]) {}

  where(field: string, op: any, value: any) {
    return new QueryWrapper(this.db, this.path, [...this.constraints, where(field, op, value)]);
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    return new QueryWrapper(this.db, this.path, [...this.constraints, orderBy(field, direction)]);
  }

  limit(count: number) {
    return new QueryWrapper(this.db, this.path, [...this.constraints, limit(count)]);
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
  collection: (path: string) => new CollectionWrapper(clientDb, path)
};

// We still need firebase-admin for some things, but for Firestore we use client SDK
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

if (getAdminApps().length === 0) {
  initializeAdminApp({
    projectId: firebaseConfig.projectId,
  });
}
export const auth = getAdminAuth();

export default { db, auth };
