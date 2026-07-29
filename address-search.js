
/**
 * FireMap Louiseville — Extension de recherche d'adresses
 * Source: OpenStreetMap / Nominatim
 * Usage: recherches interactives seulement, avec délai et cache local.
 * Ne pas utiliser pour télécharger en masse les adresses.
 */
(() => {
  const CONFIG = {
    city: "Louiseville",
    province: "Québec",
    country: "Canada",
    countryCode: "ca",
    viewbox: "-73.05,46.34,-72.82,46.16", // ouest,nord,est,sud
    minChars: 3,
    delayMs: 850,
    maxResults: 8,
    cacheKey: "firemap_address_cache_v1"
  };

  const state = {
    timer: null,
    lastRequestAt: 0,
    cache: loadCache()
  };

  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.cacheKey)) || {};
    } catch {
      return {};
    }
  }

  function saveCache() {
    const entries = Object.entries(state.cache).slice(-100);
    localStorage.setItem(CONFIG.cacheKey, JSON.stringify(Object.fromEntries(entries)));
  }

  function normalizeQuery(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function isLouiseville(result) {
    const a = result.address || {};
    const locality = [
      a.city, a.town, a.village, a.municipality,
      a.county, a.state_district
    ].filter(Boolean).join(" ").toLowerCase();

    return locality.includes("louiseville") ||
      String(result.display_name || "").toLowerCase().includes("louiseville");
  }

  async function searchAddress(query) {
    const clean = normalizeQuery(query);
    if (clean.length < CONFIG.minChars) return [];

    const cacheId = clean.toLowerCase();
    if (state.cache[cacheId]) return state.cache[cacheId];

    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - state.lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));

    const fullQuery = `${clean}, ${CONFIG.city}, ${CONFIG.province}, ${CONFIG.country}`;
    const params = new URLSearchParams({
      q: fullQuery,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(CONFIG.maxResults),
      countrycodes: CONFIG.countryCode,
      bounded: "1",
      viewbox: CONFIG.viewbox,
      "accept-language": "fr"
    });

    state.lastRequestAt = Date.now();

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "fr-CA,fr;q=0.9"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur de recherche (${response.status})`);
    }

    const raw = await response.json();
    const results = raw
      .filter(isLouiseville)
      .map(item => ({
        id: String(item.place_id),
        label: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        numero: item.address?.house_number || "",
        rue: item.address?.road || item.address?.pedestrian || "",
        ville: item.address?.city || item.address?.town ||
          item.address?.village || "Louiseville",
        codePostal: item.address?.postcode || "",
        province: item.address?.state || "Québec",
        source: "OpenStreetMap / Nominatim"
      }));

    state.cache[cacheId] = results;
    saveCache();
    return results;
  }

  function createUI() {
    if (document.getElementById("addressSearchResults")) return;

    const input = document.getElementById("searchInput");
    if (!input) {
      console.warn("FireMap Address Extension: #searchInput introuvable.");
      return;
    }

    const wrapper = input.parentElement;
    wrapper.style.position = "relative";

    const results = document.createElement("div");
    results.id = "addressSearchResults";
    results.className = "address-results";
    results.setAttribute("role", "listbox");
    results.hidden = true;
    wrapper.appendChild(results);

    const attribution = document.createElement("div");
    attribution.className = "address-attribution";
    attribution.innerHTML =
      'Recherche d’adresses © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    results.appendChild(attribution);

    input.addEventListener("input", () => {
      clearTimeout(state.timer);
      const query = input.value;

      if (normalizeQuery(query).length < CONFIG.minChars) {
        results.hidden = true;
        return;
      }

      state.timer = setTimeout(async () => {
        renderLoading(results);
        try {
          const matches = await searchAddress(query);
          renderResults(results, matches);
        } catch (error) {
          renderError(results, error.message);
        }
      }, CONFIG.delayMs);
    });

    document.addEventListener("click", event => {
      if (!wrapper.contains(event.target)) results.hidden = true;
    });
  }

  function renderLoading(container) {
    container.hidden = false;
    container.innerHTML = '<div class="address-state">Recherche…</div>' +
      attributionHtml();
  }

  function renderError(container, message) {
    container.hidden = false;
    container.innerHTML =
      `<div class="address-state address-error">${escapeHtml(message)}</div>` +
      attributionHtml();
  }

  function renderResults(container, matches) {
    container.hidden = false;

    if (!matches.length) {
      container.innerHTML =
        '<div class="address-state">Aucune adresse trouvée à Louiseville.</div>' +
        attributionHtml();
      return;
    }

    container.innerHTML = matches.map((address, index) => `
      <button type="button"
              class="address-result"
              data-address-index="${index}"
              role="option">
        <span class="address-pin">⌖</span>
        <span>
          <strong>${escapeHtml(formatPrimary(address))}</strong>
          <small>${escapeHtml(address.label)}</small>
        </span>
      </button>
    `).join("") + attributionHtml();

    container.querySelectorAll(".address-result").forEach(button => {
      button.addEventListener("click", () => {
        const address = matches[Number(button.dataset.addressIndex)];
        selectAddress(address);
        container.hidden = true;
      });
    });
  }

  function formatPrimary(address) {
    const first = [address.numero, address.rue].filter(Boolean).join(" ");
    return first || address.label.split(",")[0];
  }

  function selectAddress(address) {
    const input = document.getElementById("searchInput");
    input.value = formatPrimary(address);

    if (window.map && typeof window.map.setView === "function") {
      window.map.setView([address.latitude, address.longitude], 18);
    }

    window.dispatchEvent(new CustomEvent("firemap:address-selected", {
      detail: address
    }));

    if (typeof window.openAddressAddDialog === "function") {
      window.openAddressAddDialog(address);
    }
  }

  function attributionHtml() {
    return '<div class="address-attribution">Recherche d’adresses © ' +
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>';
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  window.FireMapAddressSearch = {
    search: searchAddress,
    config: CONFIG
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUI);
  } else {
    createUI();
  }
})();
