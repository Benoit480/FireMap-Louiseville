const K="firemap_v2_points";const map=L.map("map",{zoomControl:false}).setView([46.2556,-72.9415],14);L.control.zoom({position:"bottomright"}).addTo(map);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);let pts=(()=>{try{return JSON.parse(localStorage.getItem(K))||[]}catch{return[]}})(),marks=new Map(),sel=null,pending=null,user=null,filter="all",activeOnly=false;const $=x=>document.getElementById(x),save=()=>{localStorage.setItem(K,JSON.stringify(pts));stats()},uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random(),lab=t=>({hydrant:"Borne-fontaine",water:"Point d’eau",risk:"Bâtiment à risque",station:"Caserne"}[t]||t),sl=s=>({active:"Disponible",inspection:"À inspecter",out:"Hors service"}[s]||s),flowInfo=v=>({red:{label:"Rouge",gpm:"moins de 500 GPM"},orange:{label:"Orange",gpm:"500 à 999 GPM"},green:{label:"Vert",gpm:"1 000 à 1 499 GPM"},blue:{label:"Bleu",gpm:"1 500 GPM et plus"}}[v]||{label:"Non défini",gpm:"—"}),outletLabel=v=>({"1x4+2x2.5":"1 × 4 po + 2 × 2,5 po","2x2.5":"2 × 2,5 po"}[v]||v||"—"),legacyFlowBand=p=>p.flowBand||p.hydrantColor||(()=>{let n=Number(p.flow);return !n?"red":n<500?"red":n<1000?"orange":n<1500?"green":"blue"})(),esc=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));function toast(m){$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)}function stats(){$("s1").textContent=pts.filter(p=>p.type==="hydrant").length;$("s2").textContent=pts.filter(p=>p.status==="inspection").length;$("s3").textContent=pts.filter(p=>p.status==="out").length}function icon(p){let c=p.status==="active"?"activeM":p.status==="inspection"?"inspectionM":"outM";if(p.type==="hydrant"){let f=legacyFlowBand(p);return L.divIcon({className:"",html:`<div class="marker ${c} flow-${f}"><span class="hydrant-glyph"></span></div>`,iconSize:[42,42],iconAnchor:[21,21]})}let s=p.type==="water"?"🌊":p.type==="risk"?"🏭":"🚒";return L.divIcon({className:"",html:`<div class="marker ${c}"><span class="marker-symbol">${s}</span></div>`,iconSize:[42,42],iconAnchor:[21,21]})}function render(){marks.forEach(m=>map.removeLayer(m));marks.clear();let q=$("searchInput").value.toLowerCase();pts.filter(p=>(filter==="all"||p.type===filter)&&(!activeOnly||p.status==="active")&&(!q||(`${p.name} ${p.address} ${p.notes}`).toLowerCase().includes(q))).forEach(p=>{let m=L.marker([p.lat,p.lng],{icon:icon(p)}).addTo(map);m.on("click",()=>details(p.id));marks.set(p.id,m)});stats()}function details(id){let p=pts.find(x=>x.id===id);if(!p)return;sel=p;$("dname").textContent=p.name;$("daddress").textContent=p.address||`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;let fi=flowInfo(legacyFlowBand(p));$("dflow").textContent=`${fi.label} — ${fi.gpm}`;$("doutlets").textContent=outletLabel(p.outlets);$("dstatusText").textContent=sl(p.status);$("dinspection").textContent=p.inspection||"—";$("dnotes").textContent=p.notes||"Aucune note.";$("dstatus").textContent=sl(p.status);$("dstatus").style.background=p.status==="active"?"#1c6533":p.status==="inspection"?"#75500c":"#7e161b";if(p.photo){$("dphoto").src=p.photo;$("dphoto").classList.remove("hidden")}else $("dphoto").classList.add("hidden");$("details").classList.remove("hidden")}function reset(){$("pointForm").reset();$("pointId").value="";$("deleteBtn").classList.add("hidden");$("dialogTitle").textContent="Ajouter une borne"}function add(ll){reset();$("lat").value=ll.lat.toFixed(6);$("lng").value=ll.lng.toFixed(6);$("inspection").value=new Date().toISOString().slice(0,10);$("pointDialog").showModal()}function edit(id){let p=pts.find(x=>x.id===id);p.flowBand=legacyFlowBand(p);p.outlets=p.outlets||"1x4+2x2.5";$("dialogTitle").textContent="Modifier le point";for(let k of ["type","name","address","outlets","flowBand","status","inspection","notes","lat","lng"])$(k).value=p[k]||"";$("pointId").value=p.id;$("deleteBtn").classList.remove("hidden");$("pointDialog").showModal()}async function img(file){return new Promise(r=>{let fr=new FileReader();fr.onload=()=>{let im=new Image();im.onload=()=>{let q=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*q;c.height=im.height*q;c.getContext("2d").drawImage(im,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",.72))};im.src=fr.result};fr.readAsDataURL(file)})}map.on("click",e=>pending=e.latlng);map.on("contextmenu",e=>add(e.latlng));$("menuBtn").onclick=()=>$("panel").classList.add("open");$("closePanel").onclick=()=>$("panel").classList.remove("open");$("filterBtn").onclick=()=>$("filters").classList.add("open");$("closeFilters").onclick=()=>$("filters").classList.remove("open");$("closeDetails").onclick=()=>$("details").classList.add("hidden");$("addBtn").onclick=()=>add(pending||{lat:user?.[0]||map.getCenter().lat,lng:user?.[1]||map.getCenter().lng});$("cancelBtn").onclick=()=>$("pointDialog").close();$("editBtn").onclick=()=>sel&&edit(sel.id);$("navBtn").onclick=()=>sel&&open(`https://www.google.com/maps/dir/?api=1&destination=${sel.lat},${sel.lng}`,"_blank");$("locateBtn").onclick=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>{user=[p.coords.latitude,p.coords.longitude];map.setView(user,17);L.circleMarker(user,{radius:8,color:"white",fillColor:"#1689ff",fillOpacity:1,weight:3}).addTo(map)},()=>toast("Position impossible"),{enableHighAccuracy:true}):toast("GPS non disponible");$("pointForm").onsubmit=async e=>{e.preventDefault();let id=$("pointId").value||uid(),old=pts.find(p=>p.id===id),photo=old?.photo||"",f=$("photo").files[0];if(f)photo=await img(f);let p={id,type:$("type").value,name:$("name").value.trim(),address:$("address").value.trim(),outlets:$("outlets").value,flowBand:$("flowBand").value,status:$("status").value,inspection:$("inspection").value,notes:$("notes").value.trim(),lat:+$("lat").value,lng:+$("lng").value,photo};let i=pts.findIndex(x=>x.id===id);i>=0?pts[i]=p:pts.push(p);save();render();$("pointDialog").close();details(id);toast("Point enregistré")};$("deleteBtn").onclick=()=>{let id=$("pointId").value;if(confirm("Supprimer ce point?")){pts=pts.filter(p=>p.id!==id);save();render();$("pointDialog").close();$("details").classList.add("hidden")}};document.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chips button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.f;render()});$("activeOnly").onchange=e=>{activeOnly=e.target.checked;render()};$("searchInput").oninput=render;function list(mode="all"){$("listTitle").textContent=mode==="inspection"?"Inspections requises":"Points cartographiés";let a=mode==="inspection"?pts.filter(p=>p.status==="inspection"):pts;$("pointsList").innerHTML=a.length?a.map(p=>`<div class="row"><img src="${p.photo||'./icon-192.png'}"><div><h3>${esc(p.name)}</h3><p>${lab(p.type)} · ${sl(p.status)}</p><p>${esc(p.address||'Aucune adresse')}</p></div><button onclick="focus('${p.id}')">Voir</button></div>`).join(""):"<p>Aucun point.</p>";$("listDialog").showModal()}window.focus=id=>{let p=pts.find(x=>x.id===id);$("listDialog").close();map.setView([p.lat,p.lng],18);details(id)};$("listBtn").onclick=()=>list();$("navList").onclick=()=>list();$("navInspect").onclick=()=>list("inspection");$("closeList").onclick=()=>$("listDialog").close();$("moreBtn").onclick=()=>$("panel").classList.add("open");$("nearestBtn").onclick=()=>{if(!user)return toast("Activez votre position GPS");let a=pts.filter(p=>p.type==="hydrant"&&p.status!=="out");if(!a.length)return toast("Aucune borne disponible");a.sort((x,y)=>Math.hypot(x.lat-user[0],x.lng-user[1])-Math.hypot(y.lat-user[0],y.lng-user[1]));let p=a[0];$("panel").classList.remove("open");map.setView([p.lat,p.lng],18);details(p.id)};$("exportBtn").onclick=()=>{let fc={type:"FeatureCollection",features:pts.map(p=>({type:"Feature",geometry:{type:"Point",coordinates:[p.lng,p.lat]},properties:{...p,lat:undefined,lng:undefined}}))},b=new Blob([JSON.stringify(fc,null,2)],{type:"application/geo+json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`firemap-${new Date().toISOString().slice(0,10)}.geojson`;a.click()};$("importInput").onchange=async e=>{try{let d=JSON.parse(await e.target.files[0].text()),a=d.type==="FeatureCollection"?d.features.map(f=>({...f.properties,id:f.properties.id||uid(),lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0]})):d;if(confirm(`Importer ${a.length} point(s)?`)){pts=[...pts,...a];save();render()}}catch{alert("Fichier invalide")}};$("clearBtn").onclick=()=>{if(confirm("Effacer toutes les données locales?")){pts=[];save();render()}};render();if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));

/* ===== FireMap Louiseville V3 Pro ===== */
const GOV_GEOCODER = "https://servicescarto.mrnf.gouv.qc.ca/pes/rest/services/Territoire/Adresse_Geocodage/GeocodeServer/findAddressCandidates";
let addressTimer=null;
let addressMarker=null;
let coverageCircle=null;
let incidentLocation=null;
let deferredInstallPrompt=null;

function normalizeText(s=""){
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
function distanceMeters(a,b){
  const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad(b[0]-a[0]), dLon=toRad(b[1]-a[1]);
  const lat1=toRad(a[0]), lat2=toRad(b[0]);
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function localHydrantMatches(q){
  const n=normalizeText(q);
  if(!n)return [];
  return pts.filter(p=>normalizeText(`${p.name} ${p.address||""}`).includes(n)).slice(0,5);
}
async function searchGovernmentAddresses(query){
  const q=query.trim();
  if(q.length<3)return [];
  const params=new URLSearchParams({
    SingleLine:`${q}, Louiseville, Québec`,
    f:"json",
    outFields:"*",
    maxLocations:"8",
    searchExtent:"-73.08,46.17,-72.82,46.35",
    outSR:"4326"
  });
  try{
    const r=await fetch(`${GOV_GEOCODER}?${params}`);
    if(!r.ok)throw new Error();
    const data=await r.json();
    return (data.candidates||[]).filter(c=>{
      const t=normalizeText(c.address+" "+JSON.stringify(c.attributes||{}));
      return t.includes("louiseville") || (c.location.x>-73.08&&c.location.x<-72.82&&c.location.y>46.17&&c.location.y<46.35);
    }).map(c=>({
      label:c.address,
      lat:c.location.y,
      lng:c.location.x,
      score:c.score||0,
      source:"Gouvernement du Québec"
    }));
  }catch{
    return [];
  }
}
function renderUnifiedResults(container, query, addresses){
  const hydrants=localHydrantMatches(query);
  const items=[
    ...hydrants.map(p=>({kind:"point",label:p.name,sub:p.address||typeLabel(p.type),id:p.id})),
    ...addresses.map(a=>({kind:"address",label:a.label,sub:"Adresse — Gouvernement du Québec",lat:a.lat,lng:a.lng}))
  ];
  if(!items.length){container.innerHTML='<div class="address-empty">Aucun résultat trouvé.</div>';container.classList.remove("hidden");return}
  container.innerHTML=items.map((x,i)=>`<button class="address-result-v3" data-i="${i}">
    <span>${x.kind==="point"?"🚰":"📍"}</span><span><strong>${esc(x.label)}</strong><small>${esc(x.sub)}</small></span>
  </button>`).join("");
  container.classList.remove("hidden");
  container.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{
    const x=items[Number(btn.dataset.i)];
    container.classList.add("hidden");
    if(x.kind==="point"){const p=pts.find(v=>v.id===x.id);map.setView([p.lat,p.lng],18);details(p.id);return}
    pending={lat:x.lat,lng:x.lng};
    if(addressMarker)map.removeLayer(addressMarker);
    addressMarker=L.marker([x.lat,x.lng]).addTo(map).bindPopup(`<strong>${esc(x.label)}</strong><br>Maintenez la carte ou utilisez + pour ajouter une borne.`).openPopup();
    map.setView([x.lat,x.lng],18);
    $("searchInput").value=x.label;
  });
}
$("searchInput").oninput=()=>{
  clearTimeout(addressTimer);
  const q=$("searchInput").value;
  render();
  if(q.trim().length<3){$("addressResults").classList.add("hidden");return}
  addressTimer=setTimeout(async()=>{
    $("addressResults").innerHTML='<div class="address-empty">Recherche des adresses…</div>';
    $("addressResults").classList.remove("hidden");
    const addresses=await searchGovernmentAddresses(q);
    renderUnifiedResults($("addressResults"),q,addresses);
  },500);
};
document.addEventListener("click",e=>{
  if(!$("addressResults").contains(e.target) && e.target!==$("searchInput"))$("addressResults").classList.add("hidden");
});

$("coverageBtn")&&($("coverageBtn").onclick=()=>{
  $("sidePanel").classList.remove("open");
  if(coverageCircle){map.removeLayer(coverageCircle);coverageCircle=null;toast("Rayon masqué");return}
  const center=sel?[sel.lat,sel.lng]:map.getCenter();
  coverageCircle=L.circle(center,{radius:300,color:"#e21d25",fillColor:"#e21d25",fillOpacity:.08,weight:2}).addTo(map);
  map.fitBounds(coverageCircle.getBounds());toast("Rayon de 300 m affiché");
});

function nearestHydrantTo(latlng){
  return pts.filter(p=>p.type==="hydrant"&&p.status!=="out").map(p=>({...p,distance:distanceMeters(latlng,[p.lat,p.lng])})).sort((a,b)=>a.distance-b.distance)[0];
}
$("incidentBtn")&&($("incidentBtn").onclick=()=>{
  $("sidePanel").classList.remove("open");$("incidentPanel").classList.remove("hidden");$("incidentAddress").focus();
});
$("closeIncidentBtn")&&($("closeIncidentBtn").onclick=()=>$("incidentPanel").classList.add("hidden"));
$("incidentAddress")&&($("incidentAddress").oninput=()=>{
  clearTimeout(addressTimer);const q=$("incidentAddress").value;
  if(q.length<3){$("incidentAddressResults").innerHTML="";return}
  addressTimer=setTimeout(async()=>{
    const arr=await searchGovernmentAddresses(q);
    $("incidentAddressResults").innerHTML=arr.map((a,i)=>`<button data-i="${i}">📍 ${esc(a.label)}</button>`).join("");
    $("incidentAddressResults").querySelectorAll("button").forEach(b=>b.onclick=()=>{
      const a=arr[Number(b.dataset.i)];incidentLocation=[a.lat,a.lng];$("incidentAddress").value=a.label;$("incidentAddressResults").innerHTML="";
      const h=nearestHydrantTo(incidentLocation);
      if(!h){toast("Aucune borne disponible");return}
      sel=h;$("incidentHydrant").textContent=h.name;$("incidentDistance").textContent=`${Math.round(h.distance)} m`;
      let fi=flowInfo(legacyFlowBand(h));$("incidentFlow").textContent=`${fi.label} — ${fi.gpm}`;
      map.setView(incidentLocation,17);
      if(addressMarker)map.removeLayer(addressMarker);
      addressMarker=L.marker(incidentLocation).addTo(map).bindPopup("Lieu de l’intervention").openPopup();
      L.polyline([incidentLocation,[h.lat,h.lng]],{color:"#e21d25",weight:4,dashArray:"8 7"}).addTo(map);
    });
  },500);
});
$("incidentNavigateBtn")&&($("incidentNavigateBtn").onclick=()=>{
  if(!sel||!incidentLocation){toast("Choisissez d’abord une adresse");return}
  window.open(`https://www.google.com/maps/dir/?api=1&origin=${incidentLocation[0]},${incidentLocation[1]}&destination=${sel.lat},${sel.lng}`,"_blank");
});

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstallPrompt=e;$("installBanner").classList.remove("hidden");
});
$("installBtn")&&($("installBtn").onclick=async()=>{
  if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null}
  else alert("Sur iPhone : ouvrez Safari, touchez Partager, puis « Sur l’écran d’accueil ».");
  $("installBanner").classList.add("hidden");
});
$("dismissInstallBtn")&&($("dismissInstallBtn").onclick=()=>$("installBanner").classList.add("hidden"));

// Importation automatique d'une base locale facultative.
window.fireMapAddresses=[];
fetch("./adresses-louiseville.json").then(r=>r.ok?r.json():[]).then(data=>{window.fireMapAddresses=Array.isArray(data)?data:[]}).catch(()=>{});
