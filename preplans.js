(() => {
  "use strict";
  const I=window.fireMapInternal;
  if(!I) return console.error("FireMap interne indisponible");
  const $=id=>document.getElementById(id), esc=I.esc, norm=I.norm;
  const layer=L.layerGroup().addTo(I.map);
  let buildings=[], markers=new Map(), pendingMapPoint=null;
  const categoryLabel={school:"École",care:"CHSLD / résidence",industry:"Industrie",commercial:"Commerce",gas_station:"Station-service",municipal:"Municipal",hazmat:"Matières dangereuses",other:"Autre"};
  const categoryIcon={school:"🏫",care:"🏥",industry:"🏭",commercial:"🏢",gas_station:"⛽",municipal:"🏛️",hazmat:"☣️",other:"🏢"};
  const riskLabel={low:"Faible",medium:"Moyen",high:"Élevé",very_high:"Très élevé"};
  const riskColor={low:"#39d353",medium:"#ffd400",high:"#ff9500",very_high:"#ff3b30"};
  const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2);
  function canonical(b={}){return {id:String(b.id||uid()),name:String(b.name||"Bâtiment sans nom"),address:String(b.address||""),lat:Number(b.lat),lng:Number(b.lng),category:b.category||"other",risk:b.risk||"high",floors:Number(b.floors||0),basement:b.basement||"unknown",risks:b.risks||"",fdc:b.fdc||"",electrical:b.electrical||"",gas:b.gas||"",hazmat:b.hazmat||"",access:b.access||"",assembly:b.assembly||"",attackSide:b.attackSide||"",contactName:b.contactName||"",contactPhone:b.contactPhone||"",planUrl:b.planUrl||"",photoUrls:Array.isArray(b.photoUrls)?b.photoUrls:String(b.photoUrls||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),notes:b.notes||""}}
  function icon(b){const c=riskColor[b.risk]||"#ff9500",emoji=categoryIcon[b.category]||"🏢";return L.divIcon({className:"building-div-icon",html:`<div class="building-marker" style="--risk:${c}"><span>${emoji}</span></div>`,iconSize:[32,38],iconAnchor:[16,34],popupAnchor:[0,-32]})}
  function renderMarkers(){layer.clearLayers();markers.clear();buildings.forEach(b=>{if(!isFinite(b.lat)||!isFinite(b.lng))return;const m=L.marker([b.lat,b.lng],{icon:icon(b)}).bindPopup(`<strong>${esc(b.name)}</strong><br>${esc(b.address)}<br><span class="risk-badge ${b.risk}">${riskLabel[b.risk]}</span><br><button data-open-preplan="${esc(b.id)}">Ouvrir le préplan</button>`).addTo(layer);markers.set(b.id,m)})}
  function renderList(){const q=norm($("buildingSearch").value),rf=$("riskFilter").value;const list=buildings.filter(b=>(!rf||b.risk===rf)&&(!q||norm(Object.values(b).join(" ")).includes(q))).sort((a,b)=>a.name.localeCompare(b.name,"fr"));$("buildingList").innerHTML=list.map(b=>`<article class="card-item building-card"><div class="building-list-icon" style="--risk:${riskColor[b.risk]}">${categoryIcon[b.category]}</div><div class="card-content"><h3>${esc(b.name)}</h3><span class="risk-badge ${b.risk}">${riskLabel[b.risk]}</span><p>${esc(b.address)||"Adresse non inscrite"}</p><p>${categoryLabel[b.category]} · ${b.floors||"?"} étage(s)</p><div class="card-actions"><button class="secondary" data-show-building="${esc(b.id)}">Voir</button><button class="secondary" data-edit-building="${esc(b.id)}">Modifier</button><button class="primary" data-nav-building="${esc(b.id)}">GPS</button></div></div></article>`).join("")||'<div class="card-item">Aucun bâtiment enregistré.</div>'}
  function setBuildings(items){buildings=items.map(canonical);renderMarkers();renderList()}
  function openChoice(point=null){if(point){pendingMapPoint={lat:Number(point.lat),lng:Number(point.lng)};I.state.lastMapClick={...pendingMapPoint}}else pendingMapPoint=null;$("addChoiceDialog").showModal() }
  function mapPoint(){return pendingMapPoint||I.state.lastMapClick||I.state.user||{lat:I.map.getCenter().lat,lng:I.map.getCenter().lng}}
  function openForm(b=null){const p=mapPoint();$("buildingModalTitle").textContent=b?`Modifier — ${b.name}`:"Ajouter un bâtiment à risque";$("buildingId").value=b?.id||"";$("buildingName").value=b?.name||"";$("buildingCategory").value=b?.category||"other";$("buildingAddress").value=b?.address||I.nearestAddress?.(p)||I.state.selected?.adresse||"";$("buildingLat").value=b?.lat??I.state.selected?.lat??p.lat.toFixed(7);$("buildingLng").value=b?.lng??I.state.selected?.lng??p.lng.toFixed(7);$("buildingRisk").value=b?.risk||"high";$("buildingFloors").value=b?.floors||1;$("buildingBasement").value=b?.basement||"no";$("buildingRisks").value=b?.risks||"";$("buildingFdc").value=b?.fdc||"";$("buildingElectrical").value=b?.electrical||"";$("buildingGas").value=b?.gas||"";$("buildingHazmat").value=b?.hazmat||"";$("buildingAccess").value=b?.access||"";$("buildingAssembly").value=b?.assembly||"";$("buildingAttackSide").value=b?.attackSide||"";$("buildingContactName").value=b?.contactName||"";$("buildingContactPhone").value=b?.contactPhone||"";$("buildingPlanUrl").value=b?.planUrl||"";$("buildingPhotoUrls").value=(b?.photoUrls||[]).join("\n");$("buildingNotes").value=b?.notes||"";$("deleteBuilding").classList.toggle("hidden",!b);$("buildingDialog").showModal()}
  function fromForm(){return canonical({id:$("buildingId").value||uid(),name:$("buildingName").value,address:$("buildingAddress").value,lat:$("buildingLat").value,lng:$("buildingLng").value,category:$("buildingCategory").value,risk:$("buildingRisk").value,floors:$("buildingFloors").value,basement:$("buildingBasement").value,risks:$("buildingRisks").value,fdc:$("buildingFdc").value,electrical:$("buildingElectrical").value,gas:$("buildingGas").value,hazmat:$("buildingHazmat").value,access:$("buildingAccess").value,assembly:$("buildingAssembly").value,attackSide:$("buildingAttackSide").value,contactName:$("buildingContactName").value,contactPhone:$("buildingContactPhone").value,planUrl:$("buildingPlanUrl").value,photoUrls:$("buildingPhotoUrls").value,notes:$("buildingNotes").value})}
  async function save(){const b=fromForm();if(!b.name.trim()||!b.address.trim())return I.toast("Nom et adresse requis.");if(!isFinite(b.lat)||!isFinite(b.lng))return I.toast("Coordonnées invalides.");const i=buildings.findIndex(x=>x.id===b.id);if(i>=0)buildings[i]=b;else buildings.push(b);setBuildings(buildings);$("buildingDialog").close();try{await window.fireMapCloud?.saveBuilding?.(b);I.toast("Préplan enregistré et synchronisé.")}catch(e){console.error(e);I.toast("Préplan enregistré localement seulement.")}}
  async function remove(){const id=$("buildingId").value;if(!id||!confirm("Supprimer définitivement ce bâtiment et son préplan?"))return;buildings=buildings.filter(b=>b.id!==id);setBuildings(buildings);$("buildingDialog").close();try{await window.fireMapCloud?.deleteBuilding?.(id);I.toast("Bâtiment supprimé.")}catch(e){I.toast("Suppression locale seulement.")}}
  function section(title,icon,text){if(!text)return "";return `<section class="preplan-section"><h3>${icon} ${title}</h3><p>${esc(text).replace(/\n/g,"<br>")}</p></section>`}
  function openPreplan(b){if(!b)return;const photos=(b.photoUrls||[]).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Photo du bâtiment" loading="lazy"></a>`).join("");$("preplanContent").innerHTML=`<div class="modal-head"><div><small>PRÉPLAN OPÉRATIONNEL</small><h2>${esc(b.name)}</h2></div><button type="button" data-close-preplan>×</button></div><div class="preplan-hero"><div class="building-list-icon large" style="--risk:${riskColor[b.risk]}">${categoryIcon[b.category]}</div><div><strong>${esc(b.address)}</strong><span>${categoryLabel[b.category]} · Risque ${riskLabel[b.risk]} · ${b.floors||"?"} étage(s)</span></div></div><div class="preplan-actions"><button class="primary" data-nav-building="${esc(b.id)}">➤ Naviguer</button><button class="secondary" data-map-building="${esc(b.id)}">🗺️ Voir sur la carte</button>${b.planUrl?`<a class="button-link primary" href="${esc(b.planUrl)}" target="_blank" rel="noopener">📄 Ouvrir le plan</a>`:""}</div><div class="preplan-grid">${section("Risques particuliers","⚠️",b.risks)}${section("FDC / prise pompier","💧",b.fdc)}${section("Électricité","⚡",b.electrical)}${section("Gaz / propane","🔥",b.gas)}${section("Matières dangereuses","☣️",b.hazmat)}${section("Accès pompier","🚪",b.access)}${section("Point de rassemblement","📍",b.assembly)}${section("Côté d’attaque conseillé","🚒",b.attackSide)}${section("Responsable","👤",[b.contactName,b.contactPhone].filter(Boolean).join(" — "))}${section("Notes opérationnelles","📝",b.notes)}</div>${photos?`<section class="preplan-section"><h3>📷 Photos</h3><div class="photo-grid">${photos}</div></section>`:""}<div class="modal-actions"><button class="secondary" data-edit-building="${esc(b.id)}">Modifier</button><button class="primary" data-close-preplan>Fermer</button></div>`;$("preplanDialog").showModal()}
  function showOnMap(b){$("preplanDialog").close();I.showView("map");I.map.setView([b.lat,b.lng],18);markers.get(b.id)?.openPopup()}
  document.addEventListener("click",e=>{
    const addTrigger=e.target.closest("#bottomAdd,#mapAddBtn,#drawerAdd");if(addTrigger){e.preventDefault();e.stopImmediatePropagation();openChoice();return}
    const op=e.target.closest("[data-open-preplan]");if(op)openPreplan(buildings.find(b=>b.id===op.dataset.openPreplan));
    const sh=e.target.closest("[data-show-building]");if(sh)openPreplan(buildings.find(b=>b.id===sh.dataset.showBuilding));
    const ed=e.target.closest("[data-edit-building]");if(ed){$("preplanDialog").close();openForm(buildings.find(b=>b.id===ed.dataset.editBuilding))}
    const nv=e.target.closest("[data-nav-building]");if(nv){const b=buildings.find(x=>x.id===nv.dataset.navBuilding);if(b)location.href=I.navUrl(b.lat,b.lng)}
    const mp=e.target.closest("[data-map-building]");if(mp){const b=buildings.find(x=>x.id===mp.dataset.mapBuilding);if(b)showOnMap(b)}
    if(e.target.closest("[data-close-preplan]"))$("preplanDialog").close();
  },true);
  $("closeChoice").onclick=()=>{$("addChoiceDialog").close();pendingMapPoint=null};$("chooseHydrant").onclick=()=>{$("addChoiceDialog").close();I.openHydrantForm();pendingMapPoint=null};$("chooseBuilding").onclick=()=>{$("addChoiceDialog").close();openForm();pendingMapPoint=null};$("addBuildingTop").onclick=()=>openForm();$("closeBuildingModal").onclick=$("cancelBuilding").onclick=()=>$("buildingDialog").close();$("buildingForm").onsubmit=e=>{e.preventDefault();save()};$("deleteBuilding").onclick=remove;$("buildingSearch").oninput=renderList;$("riskFilter").onchange=renderList;$("buildingToggle").onchange=e=>e.target.checked?layer.addTo(I.map):I.map.removeLayer(layer);
  // Mode édition sécuritaire : maintenir 1 seconde sur la carte pour ajouter un élément.
  const editBtn=$("editModeBtn"), mapContainer=I.map.getContainer();
  let editMode=false, holdTimer=null, holdStart=null, holdPointerId=null, holdTriggered=false;
  function setEditMode(enabled){
    editMode=Boolean(enabled);
    editBtn.setAttribute("aria-pressed",String(editMode));
    editBtn.textContent=editMode?"✏️ Édition : OUI":"✏️ Édition : NON";
    editBtn.classList.toggle("active",editMode);
    mapContainer.classList.toggle("map-edit-mode",editMode);
    cancelHold();
    I.toast(editMode?"Mode édition activé : maintenez 1 seconde sur la carte.":"Mode consultation activé.");
  }
  function cancelHold(){
    if(holdTimer){clearTimeout(holdTimer);holdTimer=null}
    holdStart=null;holdPointerId=null;holdTriggered=false;
    mapContainer.classList.remove("holding-to-add");
  }
  function ignoredTarget(target){return Boolean(target.closest(".leaflet-control,.leaflet-marker-icon,.leaflet-popup,.map-fab,button,a,input,label"))}
  function pointFromClient(x,y){const r=mapContainer.getBoundingClientRect();return I.map.containerPointToLatLng(L.point(x-r.left,y-r.top))}
  editBtn.addEventListener("click",()=>setEditMode(!editMode));
  mapContainer.addEventListener("pointerdown",e=>{
    if(!editMode||document.querySelector("dialog[open]")||ignoredTarget(e.target)||e.button>0)return;
    cancelHold();
    holdPointerId=e.pointerId;holdStart={x:e.clientX,y:e.clientY};
    mapContainer.classList.add("holding-to-add");
    holdTimer=setTimeout(()=>{
      holdTimer=null;holdTriggered=true;
      const latlng=pointFromClient(holdStart.x,holdStart.y);
      navigator.vibrate?.(35);
      openChoice({lat:latlng.lat,lng:latlng.lng});
      I.toast("Position choisie : ajoutez une borne ou un bâtiment.");
      mapContainer.classList.remove("holding-to-add");
    },1000);
  },{passive:true});
  mapContainer.addEventListener("pointermove",e=>{
    if(e.pointerId!==holdPointerId||!holdStart)return;
    if(Math.hypot(e.clientX-holdStart.x,e.clientY-holdStart.y)>12)cancelHold();
  },{passive:true});
  ["pointerup","pointercancel","pointerleave"].forEach(type=>mapContainer.addEventListener(type,e=>{
    if(e.pointerId===holdPointerId&&!holdTriggered)cancelHold();
    else if(e.pointerId===holdPointerId){holdStart=null;holdPointerId=null;holdTriggered=false}
  },{passive:true}));
  mapContainer.addEventListener("contextmenu",e=>{if(editMode){e.preventDefault();e.stopPropagation()}},{passive:false});

  window.fireMapPreplans={getBuildings:()=>buildings.slice(),openPreplanById:id=>openPreplan(buildings.find(b=>b.id===id)),showBuildingOnMap:id=>{const b=buildings.find(x=>x.id===id);if(b)showOnMap(b)}};
  window.dispatchEvent(new Event("firemap-preplans-ready"));

  const connect=()=>{const c=window.fireMapCloud;if(!c?.configured||!c.subscribeBuildings){setBuildings([]);return}c.subscribeBuildings(setBuildings,e=>{console.error(e);I.toast("Erreur de synchronisation des bâtiments.")})};if(window.fireMapCloud)connect();else window.addEventListener("firemap-cloud-ready",connect,{once:true});
})();
