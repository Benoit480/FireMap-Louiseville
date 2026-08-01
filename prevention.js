(() => {
  "use strict";
  const I=window.fireMapInternal;
  if(!I) return console.error("FireMap interne indisponible");
  const $=id=>document.getElementById(id), esc=I.esc, norm=I.norm;
  const CACHE="firemap-prevention-v1", PENDING="firemap-prevention-pending-v1";
  const boolIds=["pvElectricalPanel","pvElectricalEntrance","pvGasEntrance","pvWaterValve","pvFdcAccessible","pvSprinklers","pvGenerator","pvElevator","pvDryStandpipe","prHazmat","prChemicals","prPropane","prOxygen","prLithium","prSolar","prFuel"];
  const photoCategories={
    pvElectricalPanel:{key:"electricalPanel",label:"Panneau électrique"},
    pvElectricalEntrance:{key:"electricalEntrance",label:"Entrée électrique"},
    pvGasEntrance:{key:"gasEntrance",label:"Entrée / coupure de gaz"},
    pvWaterValve:{key:"waterValve",label:"Valve d’eau"},
    pvFdcAccessible:{key:"fdcAccessible",label:"FDC"},
    pvSprinklers:{key:"sprinklers",label:"Gicleurs"},
    pvGenerator:{key:"generator",label:"Génératrice"},
    pvElevator:{key:"elevator",label:"Ascenseur"},
    pvDryStandpipe:{key:"dryStandpipe",label:"Colonne sèche / humide"},
    prHazmat:{key:"hazmat",label:"Matières dangereuses"},
    prChemicals:{key:"chemicals",label:"Produits chimiques"},
    prPropane:{key:"propane",label:"Propane"},
    prOxygen:{key:"oxygen",label:"Oxygène"},
    prLithium:{key:"lithium",label:"Batteries au lithium"},
    prSolar:{key:"solar",label:"Panneaux solaires"},
    prFuel:{key:"fuel",label:"Réservoirs de carburant"}
  };
  let records=new Map(), cloudUnsub=null, draftPhotos={};
  const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"")||f}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn(e)}};
  const today=()=>new Date().toISOString().slice(0,10);
  const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2);
  function canonical(r={}){
    return {id:String(r.id||r.buildingId||uid()),buildingId:String(r.buildingId||r.id||""),inspector:String(r.inspector||""),visitDate:String(r.visitDate||""),nextReview:String(r.nextReview||""),occupancy:Number(r.occupancy||0),accessCode:String(r.accessCode||""),checks:{...(r.checks||{})},risks:{...(r.risks||{})},electricalNotes:String(r.electricalNotes||""),gasNotes:String(r.gasNotes||""),fdcNotes:String(r.fdcNotes||""),accessNotes:String(r.accessNotes||""),hazmatNotes:String(r.hazmatNotes||""),photoUrls:Array.isArray(r.photoUrls)?r.photoUrls:String(r.photoUrls||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),photosByCategory:Object.fromEntries(Object.entries(r.photosByCategory||{}).map(([k,v])=>[k,Array.isArray(v)?v:[]])),observations:String(r.observations||""),visits:Array.isArray(r.visits)?r.visits.slice(0,20):[]};
  }
  function persist(){write(CACHE,[...records.values()])}
  function pending(){return read(PENDING,{})}
  function queue(r){const p=pending();p[r.id]=r;write(PENDING,p)}
  function clearPending(id){const p=pending();delete p[id];write(PENDING,p)}
  function buildings(){return window.fireMapPreplans?.getBuildings?.()||[]}
  function recordFor(id){return records.get(String(id))||canonical({id:String(id),buildingId:String(id)})}
  function daysSince(date){if(!date)return Infinity;return Math.floor((Date.now()-new Date(date+"T12:00:00").getTime())/86400000)}
  function overdue(r){return Boolean(r.nextReview && r.nextReview<today()) || (r.visitDate && daysSince(r.visitDate)>365)}
  function score(r,b){
    let score=0;
    if(r.visitDate)score+=12;if(r.inspector)score+=5;if(r.accessCode)score+=5;if(r.occupancy>0)score+=3;
    ["electricalPanel","electricalEntrance","gasEntrance","waterValve","fdcAccessible"].forEach(k=>{if(r.checks[k])score+=6});
    ["electricalNotes","gasNotes","fdcNotes","accessNotes","hazmatNotes"].forEach(k=>{if(r[k]?.trim())score+=4});
    const categoryPhotoCount=Object.values(r.photosByCategory||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);if(r.photoUrls.length+categoryPhotoCount>=1)score+=7;if(r.photoUrls.length+categoryPhotoCount>=4)score+=5;if(b?.planUrl)score+=8;if(b?.contactName&&b?.contactPhone)score+=5;if(r.observations)score+=3;
    if(r.visitDate && daysSince(r.visitDate)<=365)score+=7;
    return Math.min(100,score);
  }
  function scoreState(n){return n>=80?"complete":n>=50?"partial":"low"}
  function scoreLabel(n){return n>=80?"Préplan bien documenté":n>=50?"Informations à compléter":"Visite de prévention requise"}
  function riskNames(r){const map={hazmat:"Matières dangereuses",chemicals:"Produits chimiques",propane:"Propane",oxygen:"Oxygène",lithium:"Batteries lithium",solar:"Panneaux solaires",fuel:"Carburant"};return Object.entries(map).filter(([k])=>r.risks[k]).map(([,v])=>v)}
  function render(){
    const bs=buildings();const q=norm($("preventionSearch").value),filter=$("preventionFilter").value;
    const stats=bs.map(b=>({b,r:recordFor(b.id)})).map(x=>({...x,s:score(x.r,x.b)}));
    const avg=stats.length?Math.round(stats.reduce((a,x)=>a+x.s,0)/stats.length):0;
    const complete=stats.filter(x=>x.s>=80).length, needs=stats.filter(x=>x.s<80).length, due=stats.filter(x=>overdue(x.r)||!x.r.visitDate).length;
    $("preventionStats").innerHTML=`<div><strong>${bs.length}</strong><span>Bâtiments</span></div><div><strong>${complete}</strong><span>Préplans complets</span></div><div><strong>${due}</strong><span>Visites à faire</span></div><div><strong>${avg}%</strong><span>Préparation moyenne</span></div>`;
    const list=stats.filter(({b,r,s})=>{
      const text=norm([b.name,b.address,b.category,r.inspector,r.observations].join(" "));
      if(q&&!text.includes(q))return false;
      if(filter==="complete"&&s<80)return false;if(filter==="incomplete"&&s>=80)return false;if(filter==="overdue"&&!overdue(r))return false;if(filter==="never"&&r.visitDate)return false;
      return true;
    }).sort((a,b)=>(overdue(b.r)-overdue(a.r))||(a.s-b.s)||a.b.name.localeCompare(b.b.name,"fr"));
    $("preventionBuildingList").innerHTML=list.map(({b,r,s})=>`<article class="card-item prevention-building-card"><div class="prevention-building-head"><div><h3>${esc(b.name)}</h3><p>${esc(b.address)||"Adresse non inscrite"}</p></div><div class="score-badge ${scoreState(s)}">${s}%</div></div><div class="score-track"><span class="${scoreState(s)}" style="width:${s}%"></span></div><div class="prevention-meta"><span>${r.visitDate?`Dernière visite : ${esc(r.visitDate)}`:"Jamais visité"}</span><span class="${overdue(r)?"overdue":""}">${overdue(r)?"⚠️ Mise à jour requise":scoreLabel(s)}</span></div><div class="card-actions"><button class="primary" data-prevention-edit="${esc(b.id)}">🛡️ Faire la visite</button><button class="secondary" data-prevention-preplan="${esc(b.id)}">🏢 Préplan</button><button class="secondary" data-prevention-map="${esc(b.id)}">🗺️ Carte</button></div></article>`).join("")||'<div class="card-item">Aucun bâtiment correspondant.</div>';
  }
  function setCheck(id,v){$(id).checked=Boolean(v)}
  function open(id){
    const b=buildings().find(x=>String(x.id)===String(id));if(!b)return I.toast("Bâtiment introuvable.");const r=recordFor(id);
    $("preventionDialogTitle").textContent=b.name;$("preventionBuildingId").value=b.id;$("preventionInspector").value=r.inspector;$("preventionVisitDate").value=r.visitDate||today();$("preventionNextReview").value=r.nextReview;$("preventionOccupancy").value=r.occupancy||"";$("preventionAccessCode").value=r.accessCode;
    const checks={pvElectricalPanel:"electricalPanel",pvElectricalEntrance:"electricalEntrance",pvGasEntrance:"gasEntrance",pvWaterValve:"waterValve",pvFdcAccessible:"fdcAccessible",pvSprinklers:"sprinklers",pvGenerator:"generator",pvElevator:"elevator",pvDryStandpipe:"dryStandpipe"};Object.entries(checks).forEach(([id,k])=>setCheck(id,r.checks[k]));
    const risks={prHazmat:"hazmat",prChemicals:"chemicals",prPropane:"propane",prOxygen:"oxygen",prLithium:"lithium",prSolar:"solar",prFuel:"fuel"};Object.entries(risks).forEach(([id,k])=>setCheck(id,r.risks[k]));
    draftPhotos=structuredClone?r.photosByCategory?structuredClone(r.photosByCategory):{}:JSON.parse(JSON.stringify(r.photosByCategory||{}));
    $("pvElectricalNotes").value=r.electricalNotes;$("pvGasNotes").value=r.gasNotes;$("pvFdcNotes").value=r.fdcNotes;$("pvAccessNotes").value=r.accessNotes;$("pvHazmatNotes").value=r.hazmatNotes;$("pvPhotoUrls").value=r.photoUrls.join("\n");$("pvObservations").value=r.observations;
    $("preventionVisitHistory").innerHTML=r.visits.length?r.visits.map(v=>`<div class="visit-item"><strong>${esc(v.date||"")}</strong><span>${esc(v.inspector||"Inspecteur non inscrit")}</span><p>${esc(v.observations||"Aucune observation")}</p></div>`).join(""):'<p class="muted">Aucune visite enregistrée.</p>';
    renderAllPhotoGalleries();updateLiveScore();$("preventionDialog").showModal();
  }
  function formRecord(){
    const id=$("preventionBuildingId").value,old=recordFor(id),visitDate=$("preventionVisitDate").value||today();
    const checks={electricalPanel:$("pvElectricalPanel").checked,electricalEntrance:$("pvElectricalEntrance").checked,gasEntrance:$("pvGasEntrance").checked,waterValve:$("pvWaterValve").checked,fdcAccessible:$("pvFdcAccessible").checked,sprinklers:$("pvSprinklers").checked,generator:$("pvGenerator").checked,elevator:$("pvElevator").checked,dryStandpipe:$("pvDryStandpipe").checked};
    const risks={hazmat:$("prHazmat").checked,chemicals:$("prChemicals").checked,propane:$("prPropane").checked,oxygen:$("prOxygen").checked,lithium:$("prLithium").checked,solar:$("prSolar").checked,fuel:$("prFuel").checked};
    const entry={id:uid(),date:visitDate,inspector:$("preventionInspector").value.trim(),observations:$("pvObservations").value.trim(),savedAt:new Date().toISOString()};
    const same=old.visits[0]&&old.visits[0].date===entry.date&&old.visits[0].inspector===entry.inspector&&old.visits[0].observations===entry.observations;
    return canonical({...old,id,buildingId:id,inspector:entry.inspector,visitDate,nextReview:$("preventionNextReview").value,occupancy:Number($("preventionOccupancy").value||0),accessCode:$("preventionAccessCode").value.trim(),checks,risks,electricalNotes:$("pvElectricalNotes").value.trim(),gasNotes:$("pvGasNotes").value.trim(),fdcNotes:$("pvFdcNotes").value.trim(),accessNotes:$("pvAccessNotes").value.trim(),hazmatNotes:$("pvHazmatNotes").value.trim(),photoUrls:$("pvPhotoUrls").value,photosByCategory:JSON.parse(JSON.stringify(draftPhotos||{})),observations:entry.observations,visits:same?old.visits:[entry,...old.visits].slice(0,20)});
  }
  function updateLiveScore(){const id=$("preventionBuildingId").value;if(!id)return;const b=buildings().find(x=>String(x.id)===String(id));const r=formRecord();const s=score(r,b);$("preventionScoreValue").textContent=s+" %";$("preventionScoreBar").style.width=s+"%";$("preventionScoreBar").className=scoreState(s);$("preventionScoreLabel").textContent=scoreLabel(s)}
  async function save(e){e.preventDefault();const r=formRecord();records.set(r.id,r);persist();queue(r);render();$("preventionDialog").close();try{const c=window.fireMapCloud;if(!c?.configured||!c.savePrevention)throw new Error("Firebase indisponible");await c.savePrevention(r);clearPending(r.id);I.toast("Visite de prévention synchronisée.")}catch(err){console.error(err);I.toast("Visite enregistrée localement; synchronisation en attente.")}}
  async function flush(){const c=window.fireMapCloud;if(!c?.configured||!c.savePrevention)return;for(const [id,r] of Object.entries(pending()))try{await c.savePrevention(r);clearPending(id)}catch(e){console.error(e)}}
  function connect(){const c=window.fireMapCloud;if(!c?.configured||!c.subscribePrevention){render();return}if(cloudUnsub)cloudUnsub();cloudUnsub=c.subscribePrevention(items=>{const p=pending();records=new Map(items.map(x=>{const r=canonical(x);return[r.id,r]}));Object.values(p).forEach(x=>{const r=canonical(x);records.set(r.id,r)});persist();render();flush()},e=>{console.error(e);I.toast("Prévention en mode local.")});flush()}
  function preplanHtml(id){
    const b=buildings().find(x=>String(x.id)===String(id)),r=records.get(String(id));
    if(!r)return '<section class="preplan-section prevention-summary"><h3>🛡️ Préplan de prévention</h3><p>Aucune visite de prévention enregistrée.</p></section>';
    const sc=score(r,b), risks=riskNames(r);
    const checkMap=[
      ["electricalPanel","⚡","Panneau électrique localisé"],
      ["electricalEntrance","⚡","Entrée électrique identifiée"],
      ["gasEntrance","🔥","Entrée / coupure de gaz identifiée"],
      ["waterValve","💧","Valve d’eau identifiée"],
      ["fdcAccessible","🚒","FDC accessible"],
      ["sprinklers","💦","Gicleurs présents"],
      ["generator","🔋","Génératrice identifiée"],
      ["elevator","🛗","Ascenseur"],
      ["dryStandpipe","🧯","Colonne sèche / humide"]
    ];
    const checked=checkMap.filter(([k])=>r.checks[k]).map(([,i,l])=>`<li>${i} ${esc(l)}</li>`).join("");
    const unchecked=checkMap.filter(([k])=>!r.checks[k]).map(([,i,l])=>`<li class="preplan-unconfirmed">${i} ${esc(l)} — non confirmé</li>`).join("");
    const photos=Object.entries(r.photosByCategory||{}).flatMap(([category,list])=>(list||[]).map(photo=>({category,photo}))).map(({category,photo})=>{
      const label=Object.values(photoCategories).find(x=>x.key===category)?.label||category;
      return `<a class="preplan-photo-card" href="${esc(photo.url)}" target="_blank" rel="noopener"><img src="${esc(photo.url)}" alt="${esc(label)}" loading="lazy"><span>${esc(label)}</span></a>`;
    }).join("");
    const risksHtml=risks.length?`<section class="preplan-section preplan-alert"><h3>☣️ Risques particuliers</h3><p>${esc(risks.join(", "))}</p>${r.hazmatNotes?`<p>${esc(r.hazmatNotes)}</p>`:""}</section>`:"";
    return `<section class="preplan-section prevention-summary preplan-from-prevention"><div class="preplan-prevention-title"><h3>🛡️ Préplan issu de la prévention</h3><span class="score-badge ${scoreState(sc)}">${sc}%</span></div><div class="score-track"><span class="${scoreState(sc)}" style="width:${sc}%"></span></div><p><strong>Dernière visite :</strong> ${esc(r.visitDate||"Non inscrite")} ${r.inspector?`— ${esc(r.inspector)}`:""}</p>${r.nextReview?`<p><strong>Prochaine révision :</strong> ${esc(r.nextReview)}</p>`:""}${r.occupancy?`<p><strong>Occupation maximale :</strong> ${esc(String(r.occupancy))}</p>`:""}${r.accessCode?`<p><strong>Code d’accès :</strong> ${esc(r.accessCode)}</p>`:""}</section><section class="preplan-section"><h3>✅ Éléments opérationnels vérifiés</h3><ul class="preplan-check-list">${checked||"<li>Aucun élément confirmé.</li>"}</ul>${unchecked?`<details><summary>Éléments non confirmés</summary><ul class="preplan-check-list">${unchecked}</ul></details>`:""}</section>${risksHtml}${r.electricalNotes?`<section class="preplan-section"><h3>⚡ Électricité</h3><p>${esc(r.electricalNotes)}</p></section>`:""}${r.gasNotes?`<section class="preplan-section"><h3>🔥 Gaz / propane</h3><p>${esc(r.gasNotes)}</p></section>`:""}${r.fdcNotes?`<section class="preplan-section"><h3>🚒 FDC</h3><p>${esc(r.fdcNotes)}</p></section>`:""}${r.accessNotes?`<section class="preplan-section"><h3>🚪 Accès</h3><p>${esc(r.accessNotes)}</p></section>`:""}${r.observations?`<section class="preplan-section"><h3>📝 Observations de prévention</h3><p>${esc(r.observations).replace(/\n/g,"<br>")}</p></section>`:""}${photos?`<section class="preplan-section"><h3>📷 Photos opérationnelles</h3><div class="preplan-photo-grid">${photos}</div></section>`:""}`;
  }
  function renderPhotoGallery(category){
    const target=document.querySelector(`[data-photo-gallery="${category}"]`);if(!target)return;
    const photos=Array.isArray(draftPhotos[category])?draftPhotos[category]:[];
    target.innerHTML=photos.map((p,i)=>`<figure class="category-photo-thumb"><a href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(p.url)}" alt="Photo"></a><button type="button" data-photo-delete="${category}" data-photo-index="${i}" aria-label="Supprimer">×</button></figure>`).join("")+(photos.length?`<small>${photos.length} photo${photos.length>1?"s":""}</small>`:'<small>Aucune photo</small>');
  }
  function renderAllPhotoGalleries(){Object.values(photoCategories).forEach(meta=>renderPhotoGallery(meta.key))}
  async function compressImage(file){
    if(!file.type.startsWith("image/")||file.size<900000)return file;
    try{
      const bitmap=await createImageBitmap(file);const max=1600,ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
      canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.78));
      return blob?new File([blob],(file.name||"photo").replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"}):file;
    }catch(_){return file}
  }
  async function uploadCategoryPhotos(category,files){
    const buildingId=$("preventionBuildingId").value;if(!buildingId||!files.length)return;
    const cloud=window.fireMapCloud;if(!cloud?.configured||!cloud.uploadPreventionPhoto){I.toast("Activez Firebase Storage pour enregistrer les photos.");return}
    if(!draftPhotos[category])draftPhotos[category]=[];
    I.toast("Téléversement des photos…");
    for(const original of files){
      try{
        if(original.size>15*1024*1024)throw new Error("Photo trop volumineuse (maximum 15 Mo).");
        const file=await compressImage(original);const uploaded=await cloud.uploadPreventionPhoto(buildingId,category,file);draftPhotos[category].push(uploaded);renderPhotoGallery(category);updateLiveScore();
      }catch(err){console.error(err);I.toast(err.message||"Impossible d’enregistrer la photo.")}
    }
    I.toast("Photo ajoutée. Enregistrez la visite pour confirmer.");
  }
  async function deleteCategoryPhoto(category,index){
    const photos=draftPhotos[category]||[],photo=photos[index];if(!photo)return;
    if(!confirm("Supprimer cette photo?"))return;
    photos.splice(index,1);renderPhotoGallery(category);updateLiveScore();
    try{if(photo.path&&window.fireMapCloud?.deletePreventionPhoto)await window.fireMapCloud.deletePreventionPhoto(photo.path)}catch(err){console.warn(err)}
  }
  window.fireMapPrevention={getRecordForBuilding:id=>records.get(String(id))||null,getScore:id=>{const b=buildings().find(x=>String(x.id)===String(id));return score(recordFor(id),b)},open,preplanHtml};
  $("preventionBackMap").onclick=()=>I.showView("map");$("preventionSearch").oninput=render;$("preventionFilter").onchange=render;$("closePreventionDialog").onclick=$("cancelPreventionDialog").onclick=()=>$("preventionDialog").close();$("preventionForm").onsubmit=save;
  $("preventionForm").addEventListener("input",updateLiveScore);$("preventionForm").addEventListener("change",updateLiveScore);
  document.addEventListener("click",e=>{const camera=e.target.closest("[data-photo-camera]");if(camera){document.querySelector(`[data-photo-input="${camera.dataset.photoCamera}"][data-source="camera"]`)?.click();return}const imp=e.target.closest("[data-photo-import]");if(imp){document.querySelector(`[data-photo-input="${imp.dataset.photoImport}"][data-source="library"]`)?.click();return}const del=e.target.closest("[data-photo-delete]");if(del){deleteCategoryPhoto(del.dataset.photoDelete,Number(del.dataset.photoIndex));return}const ed=e.target.closest("[data-prevention-edit]");if(ed)open(ed.dataset.preventionEdit);const pp=e.target.closest("[data-prevention-preplan]");if(pp)window.fireMapPreplans?.openPreplanById?.(pp.dataset.preventionPreplan);const mp=e.target.closest("[data-prevention-map]");if(mp)window.fireMapPreplans?.showBuildingOnMap?.(mp.dataset.preventionMap)});
  document.addEventListener("change",e=>{const input=e.target.closest("[data-photo-input]");if(input&&input.files?.length){uploadCategoryPhotos(input.dataset.photoInput,[...input.files]);input.value=""}});
  window.addEventListener("firemap:buildings-updated",render);window.addEventListener("firemap-preplans-ready",render);window.addEventListener("online",flush);
  setupCategoryPhotoControls();read(CACHE,[]).map(canonical).forEach(r=>records.set(r.id,r));render();if(window.fireMapCloud)connect();else window.addEventListener("firemap-cloud-ready",connect,{once:true});
})();
