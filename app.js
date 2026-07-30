(() => {
  "use strict";

  const LOUISEVILLE_CENTER = [46.2563, -72.9417];
  const ADDRESS_FILE = "louiseville_adresses.json";
  const HYDRANT_FILES = [
    "firemap-2026-07-30 2.geojson",
    "firemap-2026-07-30.geojson",
    "bornes-fontaines.geojson"
  ];

  const state = {
    addresses: [],
    selected: null,
    userPosition: null,
    hydrants: [],
    hydrantLayer: null,
    selectedMarker: null,
    userMarker: null,
    deferredInstall: null
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    input: $("addressSearch"),
    clear: $("clearSearch"),
    results: $("results"),
    status: $("searchStatus"),
    selectedPanel: $("selectedPanel"),
    selectedAddress: $("selectedAddress"),
    selectedCoords: $("selectedCoords"),
    start: $("startBtn"),
    openSelected: $("openSelectedBtn"),
    nearestHydrant: $("nearestHydrantBtn"),
    locate: $("locateBtn"),
    hydrantCount: $("hydrantCount"),
    hydrantToggle: $("hydrantToggle"),
    toast: $("toast"),
    install: $("installBtn")
  };

  const map = L.map("map", { zoomControl: true }).setView(LOUISEVILLE_CENTER, 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  function normalize(value = "") {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.remove("hidden");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.toast.classList.add("hidden"), 2600);
  }

  async function loadAddresses() {
    try {
      const response = await fetch(ADDRESS_FILE, { cache: "no-cache" });
      if (!response.ok) throw new Error("Fichier introuvable");
      state.addresses = await response.json();
      el.status.textContent = `${state.addresses.length.toLocaleString("fr-CA")} adresses chargées`;
    } catch (error) {
      el.status.textContent = "Impossible de charger les adresses.";
      toast("Vérifie que louiseville_adresses.json est dans le dépôt.");
      console.error(error);
    }
  }

  function getCoordsFromFeature(feature) {
    if (!feature || !feature.geometry) return null;
    const g = feature.geometry;
    if (g.type === "Point" && Array.isArray(g.coordinates)) {
      return { lat: Number(g.coordinates[1]), lng: Number(g.coordinates[0]) };
    }
    return null;
  }

  async function loadHydrants() {
    let geojson = null;
    for (const filename of HYDRANT_FILES) {
      try {
        const response = await fetch(filename, { cache: "no-cache" });
        if (response.ok) {
          geojson = await response.json();
          break;
        }
      } catch (_) {}
    }

    if (!geojson) {
      el.hydrantCount.textContent = "Aucun fichier de bornes trouvé";
      return;
    }

    const features = geojson.features || [];
    state.hydrants = features
      .map((feature, index) => {
        const coords = getCoordsFromFeature(feature);
        if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) return null;
        return {
          id: feature.id || index,
          lat: coords.lat,
          lng: coords.lng,
          properties: feature.properties || {}
        };
      })
      .filter(Boolean);

    state.hydrantLayer = L.layerGroup();
    state.hydrants.forEach((hydrant) => {
      const icon = L.divIcon({
        className: "",
        html: '<div class="hydrant-marker">H</div>',
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });
      const props = hydrant.properties;
      const title = props.nom || props.name || props.numero || props.id || "Borne-fontaine";
      L.marker([hydrant.lat, hydrant.lng], { icon })
        .bindPopup(`<strong>${escapeHtml(String(title))}</strong><br>${hydrant.lat.toFixed(6)}, ${hydrant.lng.toFixed(6)}`)
        .addTo(state.hydrantLayer);
    });

    state.hydrantLayer.addTo(map);
    el.hydrantCount.textContent = `${state.hydrants.length} bornes affichées`;
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function searchAddresses(query) {
    const terms = normalize(query).split(" ").filter(Boolean);
    if (!terms.length) return [];
    return state.addresses
      .filter((a) => terms.every((term) => a.recherche.includes(term)))
      .sort((a, b) => {
        const first = terms[0];
        const ap = a.recherche.startsWith(first) ? 0 : 1;
        const bp = b.recherche.startsWith(first) ? 0 : 1;
        return ap - bp || a.adresse.localeCompare(b.adresse, "fr");
      })
      .slice(0, 30);
  }

  function renderResults(items) {
    el.results.innerHTML = "";
    if (!el.input.value.trim()) return;

    if (!items.length) {
      el.status.textContent = "Aucune adresse trouvée";
      return;
    }

    el.status.textContent = `${items.length} résultat${items.length > 1 ? "s" : ""}`;
    const fragment = document.createDocumentFragment();

    items.forEach((address) => {
      const button = document.createElement("button");
      button.className = "result-item";
      button.innerHTML = `
        <span class="pin">📍</span>
        <span>
          <strong>${escapeHtml(address.adresse)}</strong>
          <small>${address.lat.toFixed(6)}, ${address.lng.toFixed(6)}</small>
        </span>`;
      button.addEventListener("click", () => selectAddress(address));
      fragment.appendChild(button);
    });
    el.results.appendChild(fragment);
  }

  function selectAddress(address) {
    state.selected = address;
    el.input.value = address.adresse;
    el.results.innerHTML = "";
    el.status.textContent = "Adresse sélectionnée";
    el.selectedPanel.classList.remove("hidden");
    el.selectedAddress.textContent = address.adresse;
    el.selectedCoords.textContent = `${address.lat.toFixed(6)}, ${address.lng.toFixed(6)}`;
    el.openSelected.disabled = false;
    el.nearestHydrant.disabled = state.hydrants.length === 0;

    if (state.selectedMarker) map.removeLayer(state.selectedMarker);
    state.selectedMarker = L.marker([address.lat, address.lng])
      .addTo(map)
      .bindPopup(`<strong>Intervention</strong><br>${escapeHtml(address.adresse)}`)
      .openPopup();

    map.setView([address.lat, address.lng], 17);
  }

  function navigationUrl(lat, lng, label = "") {
    const destination = `${lat},${lng}`;
    const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isApple) {
      return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  }

  function startNavigation(address = state.selected) {
    if (!address) return toast("Choisis d’abord une adresse.");
    window.location.href = navigationUrl(address.lat, address.lng, address.adresse);
  }

  function locateUser() {
    if (!navigator.geolocation) return toast("Localisation non prise en charge.");
    el.locate.textContent = "Localisation…";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if (state.userMarker) map.removeLayer(state.userMarker);
        state.userMarker = L.circleMarker([state.userPosition.lat, state.userPosition.lng], {
          radius: 9, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1
        }).addTo(map).bindPopup("Votre position").openPopup();
        map.setView([state.userPosition.lat, state.userPosition.lng], 16);
        el.locate.textContent = "Ma position";
      },
      () => {
        el.locate.textContent = "Ma position";
        toast("Autorise la localisation dans Safari.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  }

  function distanceMeters(a, b) {
    const R = 6371000;
    const p1 = a.lat * Math.PI / 180;
    const p2 = b.lat * Math.PI / 180;
    const dp = (b.lat - a.lat) * Math.PI / 180;
    const dl = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dp/2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
  }

  function findNearestHydrant() {
    if (!state.selected) return toast("Choisis une adresse.");
    if (!state.hydrants.length) return toast("Aucune borne chargée.");

    let nearest = null;
    let nearestDistance = Infinity;
    state.hydrants.forEach((hydrant) => {
      const d = distanceMeters(state.selected, hydrant);
      if (d < nearestDistance) {
        nearest = hydrant;
        nearestDistance = d;
      }
    });

    if (!nearest) return;
    map.fitBounds([
      [state.selected.lat, state.selected.lng],
      [nearest.lat, nearest.lng]
    ], { padding: [40, 40] });

    L.popup()
      .setLatLng([nearest.lat, nearest.lng])
      .setContent(`<strong>Borne la plus proche</strong><br>Environ ${Math.round(nearestDistance)} m`)
      .openOn(map);
    toast(`Borne la plus proche : environ ${Math.round(nearestDistance)} m`);
  }

  el.input.addEventListener("input", () => renderResults(searchAddresses(el.input.value)));
  el.clear.addEventListener("click", () => {
    el.input.value = "";
    el.results.innerHTML = "";
    el.status.textContent = `${state.addresses.length.toLocaleString("fr-CA")} adresses chargées`;
    el.input.focus();
  });
  el.start.addEventListener("click", () => startNavigation());
  el.openSelected.addEventListener("click", () => startNavigation());
  el.nearestHydrant.addEventListener("click", findNearestHydrant);
  el.locate.addEventListener("click", locateUser);
  $("navSearch").addEventListener("click", () => {
    document.querySelector(".search-section").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => el.input.focus(), 500);
  });
  $("navRefresh").addEventListener("click", () => location.reload());
  el.hydrantToggle.addEventListener("change", () => {
    if (!state.hydrantLayer) return;
    if (el.hydrantToggle.checked) state.hydrantLayer.addTo(map);
    else map.removeLayer(state.hydrantLayer);
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstall = event;
    el.install.classList.remove("hidden");
  });
  el.install.addEventListener("click", async () => {
    if (!state.deferredInstall) return;
    state.deferredInstall.prompt();
    await state.deferredInstall.userChoice;
    state.deferredInstall = null;
    el.install.classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
  }

  Promise.all([loadAddresses(), loadHydrants()]);
})();
