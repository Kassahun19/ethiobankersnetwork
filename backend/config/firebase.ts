import { getAdminDb } from "./firebaseAdmin";

// Operation types for error handling
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  };
  console.error('[FIREBASE] Firestore Admin Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Wrapper to mimic the modular SDK API but using Admin SDK under the hood
// This allows us to keep the existing controller code mostly unchanged
export const db = {
  collection: (path: string) => {
    const adminDb = getAdminDb();
    const col = adminDb.collection(path);
    
    return {
      doc: (id?: string) => {
        const doc = id ? col.doc(id) : col.doc();
        return {
          id: doc.id,
          get: async () => {
            try {
              const snap = await doc.get();
              return {
                exists: snap.exists,
                id: snap.id,
                data: () => snap.data()
              };
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `${path}/${doc.id}`);
              throw err;
            }
          },
          set: async (data: any, options?: any) => {
            try {
              return await doc.set(data, options);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `${path}/${doc.id}`);
              throw err;
            }
          },
          update: async (data: any) => {
            try {
              return await doc.update(data);
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `${path}/${doc.id}`);
              throw err;
            }
          },
          delete: async () => {
            try {
              return await doc.delete();
            } catch (err) {
              handleFirestoreError(err, OperationType.DELETE, `${path}/${doc.id}`);
              throw err;
            }
          }
        };
      },
      where: (field: string, op: any, value: any) => {
        // Map modular operators to Admin SDK operators if needed
        let adminOp = op;
        if (op === "==") adminOp = "==";
        
        const query = col.where(field, adminOp, value);
        
        const wrapQuery = (q: any) => ({
          get: async () => {
            try {
              const snap = await q.get();
              return {
                empty: snap.empty,
                size: snap.size,
                docs: snap.docs.map((d: any) => ({
                  id: d.id,
                  data: () => d.data()
                }))
              };
            } catch (err) {
              handleFirestoreError(err, OperationType.LIST, path);
              throw err;
            }
          },
          where: (f: string, o: any, v: any) => wrapQuery(q.where(f, o, v)),
          orderBy: (f: string, d: "asc" | "desc" = "asc") => wrapQuery(q.orderBy(f, d)),
          limit: (n: number) => wrapQuery(q.limit(n))
        });
        
        return wrapQuery(query);
      },
      orderBy: (field: string, direction: "asc" | "desc" = "asc") => {
        const query = col.orderBy(field, direction);
        const wrapQuery = (q: any) => ({
          get: async () => {
            try {
              const snap = await q.get();
              return {
                empty: snap.empty,
                size: snap.size,
                docs: snap.docs.map((d: any) => ({
                  id: d.id,
                  data: () => d.data()
                }))
              };
            } catch (err) {
              handleFirestoreError(err, OperationType.LIST, path);
              throw err;
            }
          },
          where: (f: string, o: any, v: any) => wrapQuery(q.where(f, o, v)),
          orderBy: (f: string, d: "asc" | "desc" = "asc") => wrapQuery(q.orderBy(f, d)),
          limit: (n: number) => wrapQuery(q.limit(n))
        });
        return wrapQuery(query);
      },
      limit: (count: number) => {
        const query = col.limit(count);
        const wrapQuery = (q: any) => ({
          get: async () => {
            try {
              const snap = await q.get();
              return {
                empty: snap.empty,
                size: snap.size,
                docs: snap.docs.map((d: any) => ({
                  id: d.id,
                  data: () => d.data()
                }))
              };
            } catch (err) {
              handleFirestoreError(err, OperationType.LIST, path);
              throw err;
            }
          },
          where: (f: string, o: any, v: any) => wrapQuery(q.where(f, o, v)),
          orderBy: (f: string, d: "asc" | "desc" = "asc") => wrapQuery(q.orderBy(f, d)),
          limit: (n: number) => wrapQuery(q.limit(n))
        });
        return wrapQuery(query);
      },
      add: async (data: any) => {
        try {
          const docRef = await col.add(data);
          return { id: docRef.id };
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
          throw err;
        }
      },
      get: async () => {
        try {
          const snap = await col.get();
          return {
            empty: snap.empty,
            size: snap.size,
            docs: snap.docs.map((d: any) => ({
              id: d.id,
              data: () => d.data()
            }))
          };
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, path);
          throw err;
        }
      }
    };
  }
};

export default { db };
