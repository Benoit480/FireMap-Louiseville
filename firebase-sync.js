(async () => {
  const cfg = window.firebaseConfig || {};
  if (!cfg.apiKey || !cfg.projectId) {
    window.fireMapCloud = { configured: false };
    window.dispatchEvent(new Event("firemap-cloud-ready"));
    return;
  }
  try {
    const [{ initializeApp }, authMod, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
    ]);
    const app = initializeApp(cfg);
    const auth = authMod.getAuth(app);
    const db = fs.getFirestore(app);
    try { await fs.enableIndexedDbPersistence(db); } catch (_) {}
    await authMod.signInAnonymously(auth);
    const ref = fs.collection(db, "bornes");
    const clean = p => {
      const data = { ...p };
      delete data.photo;
      return { ...data, id: String(p.id), lat: Number(p.lat), lng: Number(p.lng), updatedAt: fs.serverTimestamp() };
    };
    window.fireMapCloud = {
      configured: true,
      subscribe(ok, fail) { return fs.onSnapshot(ref, s => ok(s.docs.map(d => ({ id: d.id, ...d.data() }))), fail); },
      savePoint(p) { return fs.setDoc(fs.doc(db, "bornes", String(p.id)), clean(p), { merge: true }); },
      deletePoint(id) { return fs.deleteDoc(fs.doc(db, "bornes", String(id))); },
      async saveMany(items) {
        for (let i = 0; i < items.length; i += 400) {
          const batch = fs.writeBatch(db);
          items.slice(i, i + 400).forEach(p => batch.set(fs.doc(db, "bornes", String(p.id)), clean(p), { merge: true }));
          await batch.commit();
        }
      }
    };
  } catch (error) {
    console.error(error);
    window.fireMapCloud = { configured: false, error };
  }
  window.dispatchEvent(new Event("firemap-cloud-ready"));
})();
