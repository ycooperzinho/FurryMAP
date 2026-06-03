const { $, api, showMsg, photoUrl, setValue, getValue, logout } = window.Fur;

let map = null;
let selectedMarker = null;
let me = null;
let markerLayer = null;

let cropImage = null;
let cropReady = false;

function updatePhoto(src) {
  const finalSrc = photoUrl(src);
  const img = $("profilePhotoPreview");
  if (img) img.src = finalSrc;
}

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
      <a class="btn small" href="/perfil.html?id=${u.id}">Ver perfil</a>
    </div>
  `;
}

function drawCrop() {
  const canvas = $("cropCanvas");
  if (!canvas || !cropImage) return;

  const ctx = canvas.getContext("2d");
  const size = 512;

  const zoom = Number($("cropZoom")?.value || 1);
  const moveX = Number($("cropX")?.value || 0);
  const moveY = Number($("cropY")?.value || 0);

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, size, size);

  const imgRatio = cropImage.width / cropImage.height;
  let drawW;
  let drawH;

  if (imgRatio > 1) {
    drawH = size * zoom;
    drawW = drawH * imgRatio;
  } else {
    drawW = size * zoom;
    drawH = drawW / imgRatio;
  }

  const x = (size - drawW) / 2 + moveX;
  const y = (size - drawH) / 2 + moveY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(cropImage, x, y, drawW, drawH);
  ctx.restore();

  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
  ctx.stroke();
}

function setupCrop(file) {
  const cropBox = $("cropBox");
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      cropImage = img;
      cropReady = true;

      if (cropBox) cropBox.classList.remove("hidden");

      if ($("cropZoom")) $("cropZoom").value = "1";
      if ($("cropX")) $("cropX").value = "0";
      if ($("cropY")) $("cropY").value = "0";

      drawCrop();
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function canvasToBlob() {
  return new Promise((resolve) => {
    const canvas = $("cropCanvas");

    if (!canvas) {
      resolve(null);
      return;
    }

    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.88
    );
  });
}

async function requireLogin() {
  const data = await api("/api/me");

  if (!data.user) {
    location.href = "/login.html";
    return null;
  }

  return data.user;
}

async function loadMarkers() {
  if (!map) return;

  if (markerLayer) markerLayer.remove();

  markerLayer = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true
});

map.addLayer(markerLayer);

  const data = await api("/api/markers");

  data.markers.forEach((m) => {
    L.marker([m.lat, m.lng])
      .addTo(markerLayer)
      .bindPopup(popupHtml(m));
  });
}

async function initMap() {
  if (!$("map")) return;

  map = L.map("map").setView([-15.78, -47.93], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  map.on("click", (e) => {
    if (selectedMarker) selectedMarker.remove();

    selectedMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    selectedMarker.bindPopup("Lugar selecionado. Agora clique em salvar.").openPopup();
  });

  await loadMarkers();

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

async function init() {
  try {
    me = await requireLogin();
    if (!me) return;

    if ($("hello")) $("hello").textContent = me.displayName || me.username;
    if ($("myProfileLink")) $("myProfileLink").href = `/perfil.html?id=${me.id}`;
    if (me.isAdmin && $("adminLink")) $("adminLink").classList.remove("hidden");

    updatePhoto(me.photo);

    ["displayName", "telegram", "discord", "city", "phone", "status", "about"].forEach((k) => {
      setValue(k, me[k]);
    });

    await initMap();
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

async function saveProfile(e) {
  e.preventDefault();

  try {
    await api("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: getValue("displayName"),
        telegram: getValue("telegram"),
        discord: getValue("discord"),
        city: getValue("city"),
        phone: getValue("phone"),
        status: getValue("status"),
        about: getValue("about"),
      }),
    });

    showMsg("dashMsg", "Perfil salvo com sucesso.", true);
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

async function changePassword(e) {
  e.preventDefault();

  try {
    await api("/api/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: getValue("currentPassword"),
        newPassword: getValue("newPassword"),
        confirmPassword: getValue("confirmPassword"),
      }),
    });

    setValue("currentPassword", "");
    setValue("newPassword", "");
    setValue("confirmPassword", "");

    showMsg("dashMsg", "Senha alterada com sucesso.", true);
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

async function uploadPhoto(e) {
  e.preventDefault();

  try {
    const input = $("photo");

    if (!input || !input.files || !input.files.length) {
      return showMsg("dashMsg", "Escolha uma foto primeiro.", false);
    }

    if (!cropReady) {
      return showMsg("dashMsg", "Espere a imagem carregar para ajustar.", false);
    }

    showMsg("dashMsg", "Preparando foto...", true);

    drawCrop();

    const blob = await canvasToBlob();

    if (!blob) {
      return showMsg("dashMsg", "Erro ao gerar foto ajustada.", false);
    }

    const formData = new FormData();
    formData.append("photo", blob, "perfil-ajustado.jpg");

    showMsg("dashMsg", "Enviando foto ajustada...", true);

    const data = await api("/api/profile/photo", {
      method: "POST",
      body: formData,
    });

    me.photo = data.photo;

    updatePhoto(data.photo);

    input.value = "";
    cropReady = false;
    cropImage = null;

    if ($("cropBox")) $("cropBox").classList.add("hidden");

    await loadMarkers();

    showMsg("dashMsg", "Foto atualizada com sucesso.", true);
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

async function saveMarker() {
  try {
    if (!selectedMarker) {
      return showMsg("dashMsg", "Clique no mapa primeiro para escolher o lugar.", false);
    }

    const pos = selectedMarker.getLatLng();

    await api("/api/markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: pos.lat,
        lng: pos.lng,
      }),
    });

    selectedMarker.remove();
    selectedMarker = null;

    await loadMarkers();

    showMsg("dashMsg", "Marcador salvo no mapa.", true);
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

async function deleteMyMarker() {
  try {
    if (!confirm("Apagar seu marcador?")) return;

    await api("/api/markers/me", { method: "DELETE" });

    await loadMarkers();

    showMsg("dashMsg", "Seu marcador foi apagado.", true);
  } catch (err) {
    showMsg("dashMsg", err.message, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();

  $("profileForm")?.addEventListener("submit", saveProfile);
  $("passwordForm")?.addEventListener("submit", changePassword);
  $("photoForm")?.addEventListener("submit", uploadPhoto);
  $("saveMarkerBtn")?.addEventListener("click", saveMarker);
  $("deleteMarkerBtn")?.addEventListener("click", deleteMyMarker);

  $("logoutBtn")?.addEventListener("click", () => {
    logout().catch((e) => showMsg("dashMsg", e.message, false));
  });

  $("photo")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMsg("dashMsg", "Escolha apenas imagem.", false);
      return;
    }

    setupCrop(file);
  });

  ["cropZoom", "cropX", "cropY"].forEach((id) => {
    $(id)?.addEventListener("input", drawCrop);
  });
});