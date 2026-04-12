import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else {
    console.warn("firebase-applet-config.json not found. Firebase Admin may not be fully functional.");
  }
} catch (err) {
  console.error("Error reading firebase-applet-config.json:", err);
}

if (firebaseConfig.projectId && !admin.apps.length) {
  try {
    console.log(`[FIREBASE-ADMIN] Initializing with Project ID: ${firebaseConfig.projectId}`);
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (err) {
    console.error("[FIREBASE-ADMIN] Failed to initialize Firebase Admin:", err);
  }
}

const databaseId = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "TODO_FIRESTORE_DATABASE_ID") 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

if (!firebaseConfig.projectId) {
  console.warn("[FIREBASE-ADMIN] No Project ID found. Using MOCK Admin DB.");
} else {
  console.log(`[FIREBASE-ADMIN] Using REAL Admin DB with Database ID: ${databaseId || "(default)"}`);
}

let _adminDb: admin.firestore.Firestore | null = null;
let _adminAuth: admin.auth.Auth | null = null;

export const getAdminDb = () => {
  if (_adminDb) return _adminDb;
  
  if (firebaseConfig.projectId) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({ projectId: firebaseConfig.projectId });
      }
      // Only pass databaseId if it's not undefined
      _adminDb = databaseId ? admin.firestore(databaseId) : admin.firestore();
    } catch (err) {
      console.error("Failed to initialize Firestore Admin:", err);
    }
  }
  if (!_adminDb) {
    _adminDb = {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve(),
        }),
        where: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] }),
          orderBy: () => ({
            limit: () => ({
              get: () => Promise.resolve({ empty: true, docs: [] }),
            }),
          }),
        }),
        add: () => Promise.resolve({ id: "mock-id" }),
        orderBy: () => ({
          limit: () => ({
            get: () => Promise.resolve({ empty: true, docs: [] }),
          }),
        }),
      })
    } as any;
  }
  return _adminDb;
};

export const getAdminAuth = () => {
  if (_adminAuth) return _adminAuth;
  
  if (firebaseConfig.projectId) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({ projectId: firebaseConfig.projectId });
      }
      _adminAuth = admin.auth();
    } catch (err) {
      console.error("Failed to initialize Auth Admin:", err);
    }
  }
  if (!_adminAuth) {
    _adminAuth = {} as any;
  }
  return _adminAuth;
};

// For backward compatibility, but recommended to use getAdminDb()
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path)
};
export const adminAuth = {
  // Add common auth methods if needed, or just let users use getAdminAuth()
};
