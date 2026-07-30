const C="firemap-v3-markers-20260729-1",A=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./hydrant-mask.png","./adresses-louiseville.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(x=>{let y=x.clone();caches.open(C).then(c=>c.put(e.request,y));return x}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))))});
