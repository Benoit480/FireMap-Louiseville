import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot,
  writeBatch, serverTimestamp, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith("COLLEZ_") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith("COLLEZ_")
);

function cleanPoint(point) {
  // Les photos en base64 restent locales pour éviter la limite de 1 Mio par document Firestore.
  const { photo, ...data } = point;
  return {
    ...data,
    id: String(point.id),
    lat: Number(point.lat),
    lng: Number(point.lng),
    updatedAt: serverTimestamp()
  };
}

if (!configured) {
  window.fireMapCloud = { configured: false };
  window.dispatchEvent(new Event("firemap-cloud-ready"));
} else {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    try { await enableIndexedDbPersistence(db); } catch (_) {}
    await signInAnonymously(auth);
    const points = collection(db, "bornes");

    window.fireMapCloud = {
      configured: true,
      subscribe(onData, onError) {
        return onSnapshot(points, snap => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          onData(data);
        }, onError);
      },
      savePoint(point) {
        return setDoc(doc(db, "bornes", String(point.id)), cleanPoint(point), { merge: true });
      },
      async saveMany(items) {
        const chunks = [];
        for (let i = 0; i < items.length; i += 400) chunks.push(items.slice(i, i + 400));
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(p => batch.set(doc(db, "bornes", String(p.id)), cleanPoint(p), { merge: true }));
          await batch.commit();
        }
      },
      deletePoint(id) {
        return deleteDoc(doc(db, "bornes", String(id)));
      },
      async deleteMany(ids) {
        const chunks = [];
        for (let i = 0; i < ids.length; i += 400) chunks.push(ids.slice(i, i + 400));
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(id => batch.delete(doc(db, "bornes", String(id))));
          await batch.commit();
        }
      }
    };
  } catch (error) {
    console.error("Firebase FireMap:", error);
    window.fireMapCloud = { configured: false, error };
  }
  window.dispatchEvent(new Event("firemap-cloud-ready"));
}
