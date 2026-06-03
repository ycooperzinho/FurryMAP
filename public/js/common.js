async function api(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Resposta HTML/texto em vez de JSON:", text);
    throw new Error("Rota errada ou servidor respondeu HTML: " + url);
  }
  if (!res.ok) throw new Error(data.error || "Erro no servidor.");
  return data;
}

function $(id) {
  return document.getElementById(id);
}

function val(id) {
  const el = $(id);
  return el ? el.value.trim() : "";
}

function setVal(id, v) {
  const el = $(id);
  if (el) el.value = v || "";
}

function msg(id, text, ok = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
  el.classList.remove("hidden");
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function userPhoto(user, fresh = false) {
  const src = user && user.photo ? user.photo : "/img/default-avatar.svg";
  return fresh && user && user.photo ? src + "?v=" + Date.now() : src;
}

function openPhoto(src, name = "Foto de perfil") {
  if (!src) src = "/img/default-avatar.svg";

  let modal = $("photoModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "photoModal";
    modal.className = "photo-modal hidden";
    modal.innerHTML = `
      <button class="photo-modal-close" type="button" aria-label="Fechar">×</button>
      <div class="photo-modal-box">
        <img id="photoModalImg" src="" alt="Foto de perfil ampliada">
        <p id="photoModalName"></p>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.classList.contains("photo-modal-close")) {
        modal.classList.add("hidden");
      }
    });
  }

  $("photoModalImg").src = src;
  $("photoModalName").textContent = name;
  modal.classList.remove("hidden");
}

function photoImg(user, className = "avatar-click", fresh = false) {
  const name = escapeHtml((user && (user.displayName || user.username)) || "Usuário");
  const src = userPhoto(user, fresh);
  return `<img class="${className}" src="${src}" alt="Foto de ${name}" title="Clique para ver a foto" onclick="openPhoto('${src}', '${name}')">`;
}

async function getMe() {
  return (await api("/api/me")).user;
}

async function requireLogin() {
  const u = await getMe();
  if (!u) location.href = "/login.html";
  return u;
}

async function logout() {
  await api("/api/logout", { method: "POST" });
  location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const b = $("logoutBtn");
  if (b) b.addEventListener("click", logout);
});
