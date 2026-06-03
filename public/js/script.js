const notification = document.getElementById("notification");

const loginBtn = document.getElementById("loginBtn");
const dashboardBtn = document.getElementById("dashboardBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loggedText = document.getElementById("loggedText");

const authBox = document.getElementById("authBox");
const dashboard = document.getElementById("dashboard");

const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");

const registerAction = document.getElementById("registerAction");
const loginAction = document.getElementById("loginAction");

const profileDisplayName = document.getElementById("profileDisplayName");
const profileTelegram = document.getElementById("profileTelegram");
const profileDiscord = document.getElementById("profileDiscord");
const profileCity = document.getElementById("profileCity");
const profilePhone = document.getElementById("profilePhone");
const profileStatus = document.getElementById("profileStatus");
const profileAbout = document.getElementById("profileAbout");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const saveMarkerBtn = document.getElementById("saveMarkerBtn");
const deleteMarkerBtn = document.getElementById("deleteMarkerBtn");

const expandMapBtn = document.getElementById("expandMapBtn");
const mapCard = document.querySelector(".map-card");

let currentUser = null;
let selectedLatLng = null;
let leafletMarkers = [];
let selectedPreviewMarker = null;

const map = L.map("map").setView([-14.235, -51.9253], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap"
}).addTo(map);

function showNotification(message, type = "info", showAuthButtons = false) {
  let buttons = "";

  if (showAuthButtons) {
    buttons = `
      <div class="notification-buttons">
        <button onclick="openAuthFromNotification()">Login</button>
        <button onclick="openAuthFromNotification(true)">Registrar</button>
      </div>
    `;
  }

  notification.innerHTML = `
    <div class="notification-header">
      <span>${escapeHTML(message)}</span>
      <button class="notification-close" onclick="closeNotification()">✕</button>
    </div>
    ${buttons}
  `;

  notification.className = "notification";
  notification.classList.add(type);
  notification.classList.remove("hidden");

  clearTimeout(notification.timer);

  notification.timer = setTimeout(() => {
    notification.classList.add("hidden");
  }, showAuthButtons ? 9000 : 3500);
}

function closeNotification() {
  notification.classList.add("hidden");
}

function openAuthFromNotification() {
  authBox.classList.remove("hidden");
  dashboard.classList.add("hidden");
  closeNotification();
  authUsername.focus();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Erro no servidor.");
  }

  return data;
}

function updateHeader() {
  if (currentUser) {
    loggedText.textContent = `Logado como ${currentUser.username}`;
    loginBtn.classList.add("hidden");
    dashboardBtn.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loggedText.textContent = "";
    loginBtn.classList.remove("hidden");
    dashboardBtn.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    dashboard.classList.add("hidden");
  }
}

function fillDashboard() {
  if (!currentUser) return;

  profileDisplayName.value = currentUser.displayName || "";
  profileTelegram.value = currentUser.telegram || "";
  profileDiscord.value = currentUser.discord || "";
  profileCity.value = currentUser.city || "";
  profilePhone.value = currentUser.phone || "";
  profileStatus.value = currentUser.status || "";
  profileAbout.value = currentUser.about || "";
}

function openDashboard() {
  if (!currentUser) {
    showNotification("Você precisa estar logado.", "error", true);
    return;
  }

  authBox.classList.add("hidden");
  dashboard.classList.toggle("hidden");
  fillDashboard();

  setTimeout(() => map.invalidateSize(), 300);
}

async function loadMe() {
  const data = await api("/api/me");
  currentUser = data.user || null;
  updateHeader();
}

async function register() {
  try {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: authUsername.value.trim(),
        password: authPassword.value.trim()
      })
    });

    currentUser = data.user;
    authBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    updateHeader();
    fillDashboard();
    await loadMarkers();

    showNotification("Conta criada com sucesso!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function login() {
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: authUsername.value.trim(),
        password: authPassword.value.trim()
      })
    });

    currentUser = data.user;
    authBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    updateHeader();
    fillDashboard();
    await loadMarkers();

    showNotification("Login realizado com sucesso!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function logout() {
  try {
    const data = await api("/api/logout", { method: "POST" });

    currentUser = null;
    selectedLatLng = null;

    if (selectedPreviewMarker) {
      selectedPreviewMarker.remove();
      selectedPreviewMarker = null;
    }

    authBox.classList.add("hidden");
    dashboard.classList.add("hidden");
    updateHeader();
    await loadMarkers();

    showNotification(data.message || "Você saiu da conta.", "warning");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function saveProfile() {
  if (!currentUser) {
    showNotification("Você precisa estar logado.", "error", true);
    return;
  }

  try {
    const data = await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        displayName: profileDisplayName.value.trim(),
        telegram: profileTelegram.value.trim(),
        discord: profileDiscord.value.trim(),
        city: profileCity.value.trim(),
        phone: profilePhone.value.trim(),
        status: profileStatus.value.trim(),
        about: profileAbout.value.trim()
      })
    });

    currentUser = {
      ...currentUser,
      displayName: profileDisplayName.value.trim() || currentUser.username,
      telegram: profileTelegram.value.trim(),
      discord: profileDiscord.value.trim(),
      city: profileCity.value.trim(),
      phone: profilePhone.value.trim(),
      status: profileStatus.value.trim(),
      about: profileAbout.value.trim()
    };

    await loadMarkers();
    showNotification(data.message || "Perfil salvo com sucesso!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function saveMarker() {
  if (!currentUser) {
    showNotification("Você precisa estar logado para marcar no mapa.", "error", true);
    return;
  }

  if (!selectedLatLng) {
    showNotification("Clique no mapa para escolher seu local.", "warning");
    return;
  }

  try {
    const data = await api("/api/markers", {
      method: "POST",
      body: JSON.stringify({
        lat: selectedLatLng.lat,
        lng: selectedLatLng.lng
      })
    });

    selectedLatLng = null;

    if (selectedPreviewMarker) {
      selectedPreviewMarker.remove();
      selectedPreviewMarker = null;
    }

    await loadMarkers();
    showNotification(data.message || "Marcador salvo com sucesso!", "success");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function deleteMyMarker() {
  if (!currentUser) {
    showNotification("Você precisa estar logado.", "error", true);
    return;
  }

  try {
    const data = await api("/api/markers/me", { method: "DELETE" });

    selectedLatLng = null;

    if (selectedPreviewMarker) {
      selectedPreviewMarker.remove();
      selectedPreviewMarker = null;
    }

    await loadMarkers();
    showNotification(data.message || "Seu marcador foi deletado.", "warning");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function loadMarkers() {
  try {
    const data = await api("/api/markers");
    renderMarkers(data.markers || []);
  } catch (error) {
    showNotification("Erro ao carregar marcadores.", "error");
  }
}

function renderMarkers(markers) {
  leafletMarkers.forEach(marker => marker.remove());
  leafletMarkers = [];

  markers.forEach(markerData => {
    const user = markerData.user;
    const canEdit = markerData.isMine;

    const marker = L.marker([markerData.lat, markerData.lng]).addTo(map);

    marker.bindPopup(`
      <div class="popup-card">
        <h3>${escapeHTML(user.displayName || user.username)}</h3>
        <p><b>Usuário:</b> ${escapeHTML(user.username)}</p>
        <p><b>Telegram:</b> ${escapeHTML(user.telegram || "Não informado")}</p>
        <p><b>Discord:</b> ${escapeHTML(user.discord || "Não informado")}</p>
        <p><b>Cidade:</b> ${escapeHTML(user.city || "Não informado")}</p>
        <p><b>Telefone:</b> ${escapeHTML(user.phone || "Não informado")}</p>
        <p><b>Status:</b> ${escapeHTML(user.status || "Sem status")}</p>
        <p><b>Sobre mim:</b> ${escapeHTML(user.about || "Nada escrito ainda")}</p>
        ${canEdit ? `<button onclick="deleteMyMarker()">Remover meu marcador</button>` : ``}
      </div>
    `);

    leafletMarkers.push(marker);
  });
}

function escapeHTML(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loginBtn.addEventListener("click", () => {
  authBox.classList.toggle("hidden");
  dashboard.classList.add("hidden");
});

dashboardBtn.addEventListener("click", openDashboard);
logoutBtn.addEventListener("click", logout);

registerAction.addEventListener("click", register);
loginAction.addEventListener("click", login);

saveProfileBtn.addEventListener("click", saveProfile);
saveMarkerBtn.addEventListener("click", saveMarker);
deleteMarkerBtn.addEventListener("click", deleteMyMarker);

expandMapBtn.addEventListener("click", () => {
  mapCard.classList.toggle("expanded");

  const isExpanded = mapCard.classList.contains("expanded");
  expandMapBtn.textContent = isExpanded ? "Diminuir Mapa" : "Expandir Mapa";

  setTimeout(() => map.invalidateSize(), 300);
});

map.on("click", function(e) {
  if (!currentUser) {
    showNotification("Você precisa estar logado para colocar um marcador.", "error", true);
    return;
  }

  selectedLatLng = {
    lat: e.latlng.lat,
    lng: e.latlng.lng
  };

  if (selectedPreviewMarker) {
    selectedPreviewMarker.remove();
  }

  selectedPreviewMarker = L.marker([selectedLatLng.lat, selectedLatLng.lng], {
    opacity: 0.6
  }).addTo(map);

  selectedPreviewMarker.bindPopup(`
    <div class="popup-card">
      <h3>Local escolhido</h3>
      <p>Agora clique em <b>Salvar Marcador</b> no Dashboard.</p>
    </div>
  `).openPopup();

  showNotification("Local escolhido! Agora clique em Salvar Marcador no Dashboard.", "success");
});

window.deleteMyMarker = deleteMyMarker;
window.closeNotification = closeNotification;
window.openAuthFromNotification = openAuthFromNotification;

async function start() {
  await loadMe();
  await loadMarkers();
  setTimeout(() => map.invalidateSize(), 300);
}

start();

