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
  Firestore,
  QueryConstraint,
  Query,
  DocumentReference,
  CollectionReference
} from "firebase/firestore";
import fs from "fs";
import path from "path";

// Load configuration from firebase-applet-config.json
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};

try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (error) {
  console.error("Error loading firebase-applet-config.json:", error);
}

const app = initializeApp(firebaseConfig);
const clientDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
    const colRef = collection(this.db, this.path);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id };
  }

  async get() {
    const colRef = collection(this.db, this.path);
    const snap = await getDocs(colRef);
    return {
      empty: snap.empty,
      docs: snap.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data()
      }))
    };
  }
}

class DocumentWrapper {
  public id: string;
  constructor(private db: Firestore, private colPath: string, id?: string) {
    this.id = id || doc(collection(this.db, this.colPath)).id;
  }

  async get() {
    const docRef = doc(this.db, this.colPath, this.id);
    const snap = await getDoc(docRef);
    return {
      exists: snap.exists(),
      id: snap.id,
      data: () => snap.data()
    };
  }

  async set(data: any, options?: any) {
    const docRef = doc(this.db, this.colPath, this.id);
    return await setDoc(docRef, data, options);
  }

  async update(data: any) {
    const docRef = doc(this.db, this.colPath, this.id);
    return await updateDoc(docRef, data);
  }

  async delete() {
    const docRef = doc(this.db, this.colPath, this.id);
    return await deleteDoc(docRef);
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
    const colRef = collection(this.db, this.path);
    const q = query(colRef, ...this.constraints);
    const snap = await getDocs(q);
    return {
      empty: snap.empty,
      docs: snap.docs.map(doc => ({
        id: doc.id,
        data: () => doc.data()
      }))
    };
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
