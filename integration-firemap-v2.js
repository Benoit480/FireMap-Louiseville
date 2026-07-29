
// À ajouter dans app.js de FireMap V2 APRÈS la création de la carte.
//
// Rend la carte accessible à l'extension.
window.map = map;

// Quand une adresse est choisie, prépare l'ajout d'une borne à cet endroit.
window.addEventListener("firemap:address-selected", event => {
  const address = event.detail;

  pendingLatLng = {
    lat: address.latitude,
    lng: address.longitude
  };

  // Remplit automatiquement les champs si la fenêtre d'ajout est ouverte.
  const addressField = document.getElementById("pointAddress");
  const latField = document.getElementById("pointLat");
  const lngField = document.getElementById("pointLng");

  if (addressField) {
    addressField.value = [
      address.numero,
      address.rue,
      address.ville,
      address.codePostal
    ].filter(Boolean).join(", ");
  }

  if (latField) latField.value = address.latitude;
  if (lngField) lngField.value = address.longitude;

  // Ouvre automatiquement l'ajout d'une borne.
  if (typeof openAdd === "function") {
    openAdd({
      lat: address.latitude,
      lng: address.longitude
    });

    setTimeout(() => {
      const field = document.getElementById("pointAddress");
      if (field) {
        field.value = [
          address.numero,
          address.rue,
          address.ville,
          address.codePostal
        ].filter(Boolean).join(", ");
      }
    }, 50);
  }
});
