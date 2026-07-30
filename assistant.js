(()=>{
  "use strict";
  const $=id=>document.getElementById(id);
  const I=window.fireMapInternal;
  if(!I)return;
  let active=null, matchedBuilding=null, nearest=[];
  const esc=I.esc;
  const dist=(a,b)=>{const R=6371000,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))};
  const fmt=m=>m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`;
  const flow=p=>Number(p.flowGpm||p.flowRate||0);
  const flowLabel=p=>{const g=flow(p);return g>=1500?"🔵 ≥ 1 500 gal/min":g>=1000?"🟢 1 000 à 1 499 gal/min":g>=500?"🟠 500 à 999 gal/min":"🔴 < 500 gal/min"};
  function findBuilding(a){const bs=window.fireMapPreplans?.getBuildings?.()||[];const n=I.addressNorm(a.adresse||"");return bs.map(b=>({b,d:dist(a,b)})).sort((x,y)=>x.d-y.d).find(x=>x.d<=90||I.addressNorm(x.b.address||"")===n)?.b||null}
  function computeHydrants(a){return I.getHydrants().filter(p=>p.status!=="out_of_service"&&isFinite(p.lat)&&isFinite(p.lng)).map(p=>({...p,d:dist(a,p)})).sort((x,y)=>x.d-y.d).slice(0,5)}
  function criticalCard(icon,title,text,urgent=false){return `<article class="assistant-critical ${urgent?'urgent':''}"><span>${icon}</span><div><small>${title}</small><strong>${esc(text||"Non indiqué")}</strong></div></article>`}
  function render(){if(!active)return;matchedBuilding=findBuilding(active);nearest=computeHydrants(active);$("assistantEmpty").classList.add("hidden");$("assistantDashboard").classList.remove("hidden");$("assistantActiveAddress").textContent=active.adresse;$("assistantPreplanStatus").textContent=matchedBuilding?`Préplan trouvé : ${matchedBuilding.name}`:"Aucun préplan associé à cette adresse";
    const b=matchedBuilding;
    $("assistantCritical").innerHTML=b?[criticalCard("⚠️","RISQUES PARTICULIERS",b.risks,!!b.risks),criticalCard("💧","FDC / PRISE POMPIER",b.fdc),criticalCard("⚡","COUPURE ÉLECTRIQUE",b.electrical),criticalCard("🔥","GAZ / PROPANE",b.gas),criticalCard("☣️","MATIÈRES DANGEREUSES",b.hazmat,!!b.hazmat),criticalCard("🚪","ACCÈS POMPIER",b.access)].join(""):criticalCard("ℹ️","PRÉPLAN","Aucun bâtiment à risque enregistré à proximité");
    $("assistantHydrants").innerHTML=nearest.map((p,i)=>`<article class="assistant-hydrant ${i===0?'recommended':''}"><div class="assistant-rank">${i+1}</div><div><strong>${esc(p.name||"Borne")}</strong><span>${esc(p.address||"Adresse non inscrite")}</span><small>${flowLabel(p)} · ${fmt(p.d)} · ${p.status==="restricted"?"À inspecter":"Disponible"}</small></div><button data-assistant-hydrant="${esc(p.id)}" class="secondary small">Carte</button></article>`).join("")||"<p>Aucune borne disponible.</p>";
    $("assistantPreplanPanel").classList.toggle("hidden",!b);if(b)$("assistantPreplanSummary").innerHTML=`<div class="assistant-summary"><strong>${esc(b.name)}</strong><span>Risque ${esc(b.risk||"non défini")} · ${esc(String(b.floors||"?"))} étage(s)</span><p>${esc(b.attackSide||b.notes||"Consultez le préplan complet pour les détails opérationnels.")}</p></div>`;
  }
  function start(a){active=a;$("assistantAddress").value=a.adresse;I.selectAddress(a,false);I.showView("assistant");render()}
  function suggestions(){const q=$("assistantAddress").value.trim();if(q.length<2){$("assistantSuggestions").innerHTML="";return}const nq=I.addressNorm(q);const list=I.getAddresses().filter(a=>I.addressNorm(a.adresse).includes(nq)).slice(0,8);$("assistantSuggestions").innerHTML=list.map((a,i)=>`<button type="button" data-assistant-address="${i}"><strong>${esc(a.adresse)}</strong></button>`).join("");$("assistantSuggestions")._items=list}
  $("assistantAddress").addEventListener("input",suggestions);
  document.addEventListener("click",e=>{const a=e.target.closest("[data-assistant-address]");if(a){const item=$("assistantSuggestions")._items?.[Number(a.dataset.assistantAddress)];if(item)start(item)}const h=e.target.closest("[data-assistant-hydrant]");if(h){const p=I.getHydrants().find(x=>x.id===h.dataset.assistantHydrant);if(p){I.showView("map");I.map.setView([p.lat,p.lng],18);I.state.markers.get(p.id)?.openPopup()}}});
  $("assistantLaunch").onclick=()=>{const q=$("assistantAddress").value.trim();const nq=I.addressNorm(q);const a=I.getAddresses().find(x=>I.addressNorm(x.adresse)===nq)||I.getAddresses().find(x=>I.addressNorm(x.adresse).includes(nq));a?start(a):I.toast("Adresse introuvable dans la banque de Louiseville.")};
  $("assistantUseActive").onclick=()=>I.state.selected?start(I.state.selected):I.toast("Sélectionnez d’abord une adresse sur la carte.");
  $("assistantNavigate").onclick=()=>active&&(location.href=I.navUrl(active.lat,active.lng));
  $("assistantBackMap").onclick=()=>I.showView("map");
  $("assistantShowMap").onclick=()=>{if(!active)return;I.showView("map");const pts=[[active.lat,active.lng],...nearest.slice(0,3).map(p=>[p.lat,p.lng])];I.map.fitBounds(pts,{padding:[45,45]})};
  $("assistantOpenPreplan").onclick=()=>matchedBuilding&&window.fireMapPreplans?.openPreplanById(matchedBuilding.id);
  $("assistantEnd").onclick=()=>{active=null;matchedBuilding=null;nearest=[];I.clearIntervention();$("assistantDashboard").classList.add("hidden");$("assistantEmpty").classList.remove("hidden");$("assistantAddress").value="";I.showView("map")};
})();
