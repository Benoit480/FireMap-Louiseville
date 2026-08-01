(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const core = window.fireMapInternal;
  if (!core?.map) return;

  const DEFAULT_STATION = {
    id: "caserne",
    name: "Caserne de Louiseville",
    address: "Coordonnées à confirmer",
    phone: "",
    lat: 46.2563,
    lng: -72.9417
  };
  const DEFAULT_VEHICLES = [
    { id: "202", number: "202", name: "Autopompe 202", type: "engine", status: "station", crew: "", icon: "🚒" },
    { id: "502", number: "502", name: "Échelle 502", type: "ladder", status: "station", crew: "", icon: "🪜" },
    { id: "802", number: "802", name: "Citerne 802", type: "tanker", status: "station", crew: "", icon: "🚛" },
    { id: "602", number: "602", name: "Unité de soutien 602", type: "support", status: "station", crew: "", icon: "🧰" },
    { id: "902", number: "902", name: "Pickup 902", type: "pickup", status: "station", crew: "", icon: "🛻" },
    { id: "102", number: "102", name: "Chef 102", type: "chief", status: "station", crew: "", icon: "👨‍🚒" }
  ];
  const STATUS = {
    station: { label: "À la caserne", color: "#39d353" },
    enroute: { label: "En route", color: "#3b82f6" },
    onscene: { label: "Sur les lieux", color: "#ff9500" },
    water: { label: "Alimentation établie", color: "#a855f7" },
    returning: { label: "Retour", color: "#ef4444" },
    out: { label: "Hors service", color: "#64748b" }
  };
  const TYPE_ICON = { engine: "🚒", ladder: "🪜", tanker: "🚛", support: "🧰", pickup: "🛻", chief: "👨‍🚒" };
  const state = { station: loadLocal("firemap-station", DEFAULT_STATION), vehicles: loadLocal("firemap-vehicles", DEFAULT_VEHICLES), markers: new Map(), watchId: null, sharingId: null, cloudStarted: false };
  const layer = L.layerGroup().addTo(core.map);

  function loadLocal(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v || structuredClone(fallback); }
    catch (_) { return JSON.parse(JSON.stringify(fallback)); }
  }
  function saveLocal() {
    localStorage.setItem("firemap-station", JSON.stringify(state.station));
    localStorage.setItem("firemap-vehicles", JSON.stringify(state.vehicles));
  }
  function esc(v) { return core.esc ? core.esc(v) : String(v ?? ""); }
  function validPos(v) { return Number.isFinite(Number(v?.lat)) && Number.isFinite(Number(v?.lng)); }
  function stationPos(v) { return validPos(v) ? v : state.station; }
  function statusMeta(s) { return STATUS[s] || STATUS.station; }
  function normalizeVehicle(v) {
    const type = v.type || DEFAULT_VEHICLES.find(x => x.id === String(v.id))?.type || "engine";
    const pos = stationPos(v);
    return { ...v, id: String(v.id), number: String(v.number || v.id), name: v.name || `${type} ${v.id}`, type, icon: v.icon || TYPE_ICON[type] || "🚒", status: STATUS[v.status] ? v.status : "station", crew: v.crew || "", lat: Number(pos.lat), lng: Number(pos.lng), sharing: Boolean(v.sharing), updatedBy: v.updatedBy || "" };
  }
  function stationIcon() {
    return L.divIcon({ className: "", html: '<div class="station-marker"><div class="station-marker-body">🚒</div><div class="station-marker-label">CASERNE</div></div>', iconSize: [50, 62], iconAnchor: [25, 48], popupAnchor: [0, -46] });
  }
  function vehicleIcon(v) {
    const m = statusMeta(v.status);
    return L.divIcon({ className: "", html: `<div class="vehicle-marker ${v.sharing ? "live" : ""}" style="--status:${m.color}"><div class="vehicle-marker-body">${esc(v.icon)}</div><div class="vehicle-marker-label">${esc(v.number)}</div></div>`, iconSize: [44, 57], iconAnchor: [22, 39], popupAnchor: [0, -38] });
  }
  function renderMap() {
    layer.clearLayers(); state.markers.clear();
    const s = state.station;
    L.marker([s.lat, s.lng], { icon: stationIcon(), zIndexOffset: 700 })
      .bindPopup(`<strong>🚒 ${esc(s.name)}</strong><br>${esc(s.address || "Adresse non inscrite")}<br>${s.phone ? `<a href="tel:${esc(s.phone)}">${esc(s.phone)}</a><br>` : ""}<button type="button" data-station-nav>Navigation</button>`)
      .addTo(layer);
    state.vehicles.map(normalizeVehicle).forEach(v => {
      const m = statusMeta(v.status);
      const marker = L.marker([v.lat, v.lng], { icon: vehicleIcon(v), zIndexOffset: 600 })
        .bindPopup(`<strong>${esc(v.icon)} ${esc(v.name)}</strong><br><span style="color:${m.color};font-weight:800">${esc(m.label)}</span><br>${v.crew ? `${esc(v.crew)}<br>` : ""}${v.updatedAtText ? `Mise à jour : ${esc(v.updatedAtText)}<br>` : ""}<button type="button" data-vehicle-edit="${esc(v.id)}">Modifier</button>`)
        .addTo(layer);
      state.markers.set(v.id, marker);
    });
  }
  function renderList() {
    $("stationNameDisplay").textContent = state.station.name;
    $("stationAddressDisplay").textContent = state.station.address || "Adresse non inscrite";
    const box = $("vehicleList");
    box.innerHTML = state.vehicles.map(normalizeVehicle).map(v => {
      const m = statusMeta(v.status), sharing = state.sharingId === v.id;
      return `<article class="vehicle-card ${sharing ? "sharing" : ""}" style="--vehicle-status:${m.color}">
        <div class="vehicle-symbol">${esc(v.icon)}</div>
        <div class="vehicle-main"><h3>${esc(v.name)}</h3><span class="vehicle-status">${esc(m.label)}</span><p>${esc(v.crew || "Équipage non inscrit")}</p><p>${sharing ? "📡 Ce téléphone partage sa position" : (v.sharing ? "📍 Position GPS partagée" : "Position à la caserne ou dernière position connue")}</p></div>
        <div class="vehicle-actions"><button class="secondary small" data-vehicle-show="${esc(v.id)}">Carte</button><button class="secondary small" data-vehicle-edit="${esc(v.id)}">Modifier</button><button class="${sharing ? "danger" : "primary"} small" data-vehicle-share="${esc(v.id)}">${sharing ? "Arrêter GPS" : "Partager GPS"}</button></div>
      </article>`;
    }).join("");
    $("vehicleSyncStatus").textContent = window.fireMapCloud?.configured ? "Synchronisation Firebase active" : "Mode local";
    $("stopSharingAll").classList.toggle("hidden", !state.sharingId);
    renderMap();
  }
  function showOnMap(id) {
    core.showView("map");
    const v = state.vehicles.find(x => String(x.id) === String(id));
    if (!v) return;
    core.map.setView([Number(v.lat), Number(v.lng)], 17);
    setTimeout(() => state.markers.get(String(id))?.openPopup(), 150);
  }
  function showStation() {
    core.showView("map"); core.map.setView([state.station.lat, state.station.lng], 17);
  }
  function openVehicle(id) {
    const v = state.vehicles.find(x => String(x.id) === String(id)); if (!v) return;
    $("vehicleId").value = v.id; $("vehicleName").value = v.name; $("vehicleNumber").value = v.number; $("vehicleType").value = v.type; $("vehicleStatus").value = v.status; $("vehicleCrew").value = v.crew || "";
    $("vehicleDialogTitle").textContent = v.name; $("vehicleDialog").showModal();
  }
  async function saveVehicleForm(e) {
    e.preventDefault(); const id = $("vehicleId").value; const current = state.vehicles.find(x => String(x.id) === id); if (!current) return;
    const type = $("vehicleType").value;
    Object.assign(current, { name: $("vehicleName").value.trim(), number: $("vehicleNumber").value.trim(), type, icon: TYPE_ICON[type] || "🚒", status: $("vehicleStatus").value, crew: $("vehicleCrew").value.trim() });
    if (current.status === "station" && state.sharingId !== id) Object.assign(current, { lat: state.station.lat, lng: state.station.lng, sharing: false });
    saveLocal(); renderList(); $("vehicleDialog").close();
    try { if (window.fireMapCloud?.configured) await window.fireMapCloud.saveVehicle(current); core.toast("Véhicule enregistré et synchronisé."); } catch (err) { console.error(err); core.toast("Véhicule enregistré localement."); }
  }
  function openStation() {
    $("stationName").value = state.station.name; $("stationAddress").value = state.station.address || ""; $("stationLat").value = state.station.lat; $("stationLng").value = state.station.lng; $("stationPhone").value = state.station.phone || ""; $("stationDialog").showModal();
  }
  async function saveStationForm(e) {
    e.preventDefault(); const lat = Number($("stationLat").value), lng = Number($("stationLng").value); if (!Number.isFinite(lat) || !Number.isFinite(lng)) return core.toast("Coordonnées invalides.");
    state.station = { id: "caserne", name: $("stationName").value.trim(), address: $("stationAddress").value.trim(), phone: $("stationPhone").value.trim(), lat, lng };
    state.vehicles.forEach(v => { if (v.status === "station" && state.sharingId !== String(v.id)) Object.assign(v, { lat, lng }); });
    saveLocal(); renderList(); $("stationDialog").close();
    try { if (window.fireMapCloud?.configured) { await window.fireMapCloud.saveStation(state.station); for (const v of state.vehicles.filter(v => v.status === "station")) await window.fireMapCloud.saveVehicle(v); } core.toast("Caserne enregistrée."); } catch (err) { console.error(err); core.toast("Caserne enregistrée localement."); }
  }
  async function pushPosition(v, coords) {
    Object.assign(v, { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, speed: coords.speed || 0, heading: coords.heading, sharing: true, status: v.status === "station" ? "enroute" : v.status, updatedAtText: new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) });
    saveLocal(); renderList();
    try { if (window.fireMapCloud?.configured) await window.fireMapCloud.saveVehicle(v); } catch (err) { console.error(err); }
  }
  async function stopSharing(silent = false) {
    if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
    const id = state.sharingId, v = state.vehicles.find(x => String(x.id) === String(id)); state.watchId = null; state.sharingId = null;
    if (v) { v.sharing = false; saveLocal(); renderList(); try { if (window.fireMapCloud?.configured) await window.fireMapCloud.saveVehicle(v); } catch (_) {} }
    if (!silent) core.toast("Partage GPS arrêté.");
  }
  function toggleSharing(id) {
    if (state.sharingId === String(id)) return stopSharing();
    if (!navigator.geolocation) return core.toast("GPS non disponible sur cet appareil.");
    if (state.sharingId) stopSharing(true);
    const v = state.vehicles.find(x => String(x.id) === String(id)); if (!v) return;
    state.sharingId = String(id); renderList();
    state.watchId = navigator.geolocation.watchPosition(p => pushPosition(v, p.coords), err => { console.error(err); stopSharing(true); core.toast("Autorisez la localisation précise pour partager le véhicule."); }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 });
    core.toast(`${v.name} partage maintenant sa position.`);
  }
  async function seedCloudIfNeeded(items) {
    if (items.length) return;
    for (const v of state.vehicles) await window.fireMapCloud.saveVehicle(normalizeVehicle(v));
  }
  function connectCloud() {
    if (state.cloudStarted) return; const cloud = window.fireMapCloud; if (!cloud) return;
    state.cloudStarted = true;
    if (!cloud.configured || !cloud.subscribeVehicles) return renderList();
    cloud.subscribeVehicles(async items => {
      if (!items.length) { try { await seedCloudIfNeeded(items); } catch (e) { console.error(e); } return; }
      state.vehicles = items.map(normalizeVehicle).sort((a,b) => DEFAULT_VEHICLES.findIndex(x=>x.id===a.id)-DEFAULT_VEHICLES.findIndex(x=>x.id===b.id)); saveLocal(); renderList();
    }, console.error);
    cloud.subscribeStation(async item => {
      if (item && validPos(item)) { state.station = { ...DEFAULT_STATION, ...item, lat: Number(item.lat), lng: Number(item.lng) }; saveLocal(); renderList(); }
      else { try { await cloud.saveStation(state.station); } catch (e) { console.error(e); } }
    }, console.error);
  }

  document.addEventListener("click", e => {
    const show = e.target.closest("[data-vehicle-show]"); if (show) showOnMap(show.dataset.vehicleShow);
    const edit = e.target.closest("[data-vehicle-edit]"); if (edit) openVehicle(edit.dataset.vehicleEdit);
    const share = e.target.closest("[data-vehicle-share]"); if (share) toggleSharing(share.dataset.vehicleShare);
    if (e.target.closest("[data-station-nav]")) location.href = core.navUrl(state.station.lat, state.station.lng);
  });
  $("vehiclesBackMap").onclick = () => core.showView("map");
  $("showStationMap").onclick = showStation;
  $("navigateStation").onclick = () => location.href = core.navUrl(state.station.lat, state.station.lng);
  $("editStation").onclick = openStation;
  $("stopSharingAll").onclick = () => stopSharing();
  $("closeVehicleDialog").onclick = $("cancelVehicleDialog").onclick = () => $("vehicleDialog").close();
  $("vehicleForm").onsubmit = saveVehicleForm;
  $("closeStationDialog").onclick = $("cancelStationDialog").onclick = () => $("stationDialog").close();
  $("stationForm").onsubmit = saveStationForm;

  state.vehicles = DEFAULT_VEHICLES.map(def => normalizeVehicle({ ...def, ...(state.vehicles.find(v => String(v.id) === def.id) || {}), lat: state.vehicles.find(v => String(v.id) === def.id)?.lat ?? state.station.lat, lng: state.vehicles.find(v => String(v.id) === def.id)?.lng ?? state.station.lng }));
  saveLocal(); renderList();
  if (window.fireMapCloud) connectCloud(); else window.addEventListener("firemap-cloud-ready", connectCloud, { once: true });
  window.addEventListener("beforeunload", () => { if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId); });
  window.fireMapVehicles = { getVehicles: () => state.vehicles, getStation: () => state.station, showStation, showVehicle: showOnMap };
})();
