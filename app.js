
const STORAGE_KEY = "firemap_louiseville_points_v1";
const center = [46.2556, -72.9415];
const map = L.map("map").setView(center, 14);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

const icons = {
  hydrant: L.divIcon({html:"<div style='font-size:28px'>🚰</div>",className:"",iconSize:[30,30],iconAnchor:[15,25]}),
  water: L.divIcon({html:"<div style='font-size:28px'>🌊</div>",className:"",iconSize:[30,30],iconAnchor:[15,25]}),
  risk: L.divIcon({html:"<div style='font-size:28px'>🏭</div>",className:"",iconSize:[30,30],iconAnchor:[15,25]}),
  station: L.divIcon({html:"<div style='font-size:28px'>🚒</div>",className:"",iconSize:[30,30],iconAnchor:[15,25]})
};

let points = loadPoints();
let markers = new Map();
let userMarker = null;
let pendingLatLng = null;

const pointDialog = document.getElementById("pointDialog");
const listDialog = document.getElementById("listDialog");

function loadPoints(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function savePoints(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function typeLabel(t){return ({hydrant:"Borne-fontaine",water:"Point d’eau",risk:"Bâtiment à risque",station:"Caserne"})[t]||t}
function statusLabel(s){return ({active:"Active",inspection:"À inspecter",out:"Hors service"})[s]||s}
function toast(msg){
  const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
}
function popupHtml(p){
  const nav=`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  return `<h3>${esc(p.name)}</h3>
  <div><b>${typeLabel(p.type)}</b></div>
  ${p.address?`<div>${esc(p.address)}</div>`:""}
  ${p.flow?`<div>Débit : ${esc(p.flow)} L/min</div>`:""}
  ${p.pressure?`<div>Pression : ${esc(p.pressure)}</div>`:""}
  <div class="status-${p.status}">État : ${statusLabel(p.status)}</div>
  ${p.notes?`<p>${esc(p.notes)}</p>`:""}
  <p><a href="${nav}" target="_blank" rel="noopener">🧭 Naviguer</a></p>
  <button onclick="editPoint('${p.id}')">Modifier</button>`;
}
function render(){
  markers.forEach(m=>map.removeLayer(m)); markers.clear();
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  const filter=document.getElementById("filterSelect").value;
  points.filter(p=>{
    const matchesFilter=filter==="all"||p.type===filter;
    const text=`${p.name} ${p.address||""} ${p.notes||""}`.toLowerCase();
    return matchesFilter && (!q||text.includes(q));
  }).forEach(p=>{
    const m=L.marker([p.lat,p.lng],{icon:icons[p.type]||icons.hydrant}).addTo(map).bindPopup(popupHtml(p));
    markers.set(p.id,m);
  });
}
function resetForm(){
  document.getElementById("pointForm").reset();
  document.getElementById("pointId").value="";
  document.getElementById("deleteBtn").classList.add("hidden");
  document.getElementById("dialogTitle").textContent="Ajouter un point";
}
function openAdd(latlng){
  resetForm();
  document.getElementById("pointLat").value=latlng.lat.toFixed(6);
  document.getElementById("pointLng").value=latlng.lng.toFixed(6);
  pointDialog.showModal();
}
window.editPoint=function(id){
  const p=points.find(x=>x.id===id); if(!p)return;
  document.getElementById("dialogTitle").textContent="Modifier le point";
  document.getElementById("pointId").value=p.id;
  document.getElementById("pointType").value=p.type;
  document.getElementById("pointName").value=p.name;
  document.getElementById("pointAddress").value=p.address||"";
  document.getElementById("pointFlow").value=p.flow||"";
  document.getElementById("pointPressure").value=p.pressure||"";
  document.getElementById("pointStatus").value=p.status||"active";
  document.getElementById("pointLat").value=p.lat;
  document.getElementById("pointLng").value=p.lng;
  document.getElementById("pointNotes").value=p.notes||"";
  document.getElementById("deleteBtn").classList.remove("hidden");
  pointDialog.showModal();
}
map.on("contextmenu", e=>openAdd(e.latlng));
map.on("click", e=>{pendingLatLng=e.latlng});

document.getElementById("addBtn").onclick=()=>{
  if(pendingLatLng) openAdd(pendingLatLng);
  else if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>openAdd({lat:pos.coords.latitude,lng:pos.coords.longitude}),
      ()=>openAdd({lat:map.getCenter().lat,lng:map.getCenter().lng}));
  } else openAdd({lat:map.getCenter().lat,lng:map.getCenter().lng});
};
document.getElementById("cancelBtn").onclick=()=>pointDialog.close();

document.getElementById("pointForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.getElementById("pointId").value || crypto.randomUUID();
  const p={
    id,type:document.getElementById("pointType").value,
    name:document.getElementById("pointName").value.trim(),
    address:document.getElementById("pointAddress").value.trim(),
    flow:document.getElementById("pointFlow").value.trim(),
    pressure:document.getElementById("pointPressure").value.trim(),
    status:document.getElementById("pointStatus").value,
    lat:Number(document.getElementById("pointLat").value),
    lng:Number(document.getElementById("pointLng").value),
    notes:document.getElementById("pointNotes").value.trim(),
    updatedAt:new Date().toISOString()
  };
  const i=points.findIndex(x=>x.id===id);
  if(i>=0) points[i]=p; else points.push(p);
  savePoints();render();pointDialog.close();toast("Point enregistré");
});
document.getElementById("deleteBtn").onclick=()=>{
  const id=document.getElementById("pointId").value;
  if(confirm("Supprimer ce point?")){
    points=points.filter(p=>p.id!==id);savePoints();render();pointDialog.close();toast("Point supprimé");
  }
};
document.getElementById("searchInput").addEventListener("input",render);
document.getElementById("filterSelect").addEventListener("change",render);

document.getElementById("locateBtn").onclick=()=>{
  if(!navigator.geolocation)return toast("GPS non disponible");
  navigator.geolocation.getCurrentPosition(pos=>{
    const ll=[pos.coords.latitude,pos.coords.longitude];
    map.setView(ll,17);
    if(userMarker) map.removeLayer(userMarker);
    userMarker=L.circleMarker(ll,{radius:8,weight:3}).addTo(map).bindPopup("Votre position");
  },()=>toast("Position impossible à obtenir"),{enableHighAccuracy:true});
};

document.getElementById("listBtn").onclick=()=>{
  const box=document.getElementById("pointsList");
  box.innerHTML=points.length?points.map(p=>`<div class="point-row">
    <h3>${esc(p.name)}</h3><p>${typeLabel(p.type)} — ${statusLabel(p.status)}</p>
    <p>${esc(p.address||"Aucune adresse")}</p>
    <button onclick="focusPoint('${p.id}')">Voir sur la carte</button>
    <button onclick="editPoint('${p.id}')">Modifier</button>
  </div>`).join(""):"<p>Aucun point cartographié.</p>";
  listDialog.showModal();
};
window.focusPoint=function(id){
  const p=points.find(x=>x.id===id); if(!p)return;
  listDialog.close();map.setView([p.lat,p.lng],18);markers.get(id)?.openPopup();
}
document.getElementById("closeListBtn").onclick=()=>listDialog.close();

document.getElementById("exportBtn").onclick=()=>{
  const data={type:"FeatureCollection",features:points.map(p=>({
    type:"Feature",geometry:{type:"Point",coordinates:[p.lng,p.lat]},properties:{...p,lat:undefined,lng:undefined}
  }))};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/geo+json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");
  a.href=url;a.download=`firemap-louiseville-${new Date().toISOString().slice(0,10)}.geojson`;a.click();
  URL.revokeObjectURL(url);toast("Exportation créée");
};
document.getElementById("importInput").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    let imported=[];
    if(data.type==="FeatureCollection"){
      imported=data.features.filter(f=>f.geometry?.type==="Point").map(f=>{
        const pr=f.properties||{};return {...pr,id:pr.id||crypto.randomUUID(),lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]};
      });
    }else if(Array.isArray(data)) imported=data;
    if(!imported.length) throw new Error("Aucun point");
    if(confirm(`Importer ${imported.length} point(s)?`)){
      points=[...points,...imported];savePoints();render();toast("Importation terminée");
    }
  }catch{alert("Fichier invalide. Utilisez un fichier GeoJSON exporté par FireMap.");}
  e.target.value="";
});

render();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
}
