const { $, api, showMsg, photoUrl } = window.Fur;

let map = null;
let markerLayer = null;

function popupHtml(marker) {
  const u = marker.user || {};
  const img = photoUrl(u);

  return `
    <div class="popup">
      <a href="/perfil.html?id=${u.id}">
        <img src="${img}" alt="Foto do perfil">
      </a>

      <b>${u.displayName || u.username || "Furry"}</b>
      <small>@${u.username || ""}</small>
      <p>${u.city || "Cidade não informada"}</p>

      <a class="btn small" href="/perfil.html?id=${u.id}">
        Ver perfil
      </a>
    </div>
  `;
}

async function loadMarkers() {
  try {
    if (!map) return;

    if (markerLayer) {
      markerLayer.remove();
    }

    markerLayer = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15
    });

    map.addLayer(markerLayer);

    const data = await api("/api/markers");

    data.markers.forEach((m) => {
      L.marker([m.lat, m.lng])
        .addTo(markerLayer)
        .bindPopup(popupHtml(m));
    });

    showMsg("mapMsg", "Mapa carregado com sucesso.", true);
  } catch (err) {
    showMsg("mapMsg", err.message, false);
  }
}

function initMap() {
  map = L.map("map").setView([-15.78, -47.93], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  loadMarkers();

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

document.addEventListener("DOMContentLoaded", initMap);