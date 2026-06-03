const { $, api, showMsg, photoUrl, setText } = window.Fur;

let currentUser = null;
let profileUser = null;

function openPhotoViewer(src) {
  if (!src || src.includes("default-avatar")) return;

  const viewer = $("photoViewer");
  const img = $("photoViewerImg");

  if (!viewer || !img) return;

  img.src = src;
  viewer.classList.remove("hidden");
}

function closePhotoViewer() {
  $("photoViewer")?.classList.add("hidden");
}

async function loadProfile() {
  try {
    const me = await api("/api/me");
    currentUser = me.user;

    const params = new URLSearchParams(location.search);
    let id = params.get("id");

    if (!id) {
      if (!currentUser) {
        location.href = "/login.html";
        return;
      }

      id = currentUser.id;
    }

    const data = await api("/api/users/" + id);
    const u = data.user;
    profileUser = u;

    document.title = `${u.displayName || u.username} - FurMap`;

    setText("displayName", u.displayName || u.username || "Perfil");
    setText("username", "@" + (u.username || ""));

    ["city", "status", "telegram", "discord", "phone", "about"].forEach((k) => {
      setText(k, u[k] || "Não informado");
    });

    const profilePhoto = $("profilePhoto");

    if (profilePhoto) {
      profilePhoto.src = photoUrl(u);
      profilePhoto.style.cursor = u.photo && !u.photo.includes("default-avatar") ? "zoom-in" : "default";
    }

    if (currentUser && currentUser.isAdmin) {
      $("adminProfileActions")?.classList.remove("hidden");
    }
  } catch (err) {
    showMsg("profileMsg", err.message, false);
  }
}

async function removePhoto() {
  if (!profileUser) return;

  const ok = confirm(
    `Tem certeza que deseja remover a foto de ${profileUser.displayName || profileUser.username}?`
  );

  if (!ok) return;

  try {
    await api(`/api/admin/users/${profileUser.id}/photo`, {
      method: "DELETE",
    });

    profileUser.photo = "/img/default-avatar.svg";

    const img = $("profilePhoto");
    if (img) {
      img.src = "/img/default-avatar.svg";
      img.style.cursor = "default";
    }

    showMsg("profileMsg", "Foto removida com sucesso.", true);
  } catch (err) {
    showMsg("profileMsg", err.message, false);
  }
}

async function deleteAccount() {
  if (!profileUser || !currentUser) return;

  const ok = confirm(
    `Tem certeza que deseja apagar a conta de ${profileUser.displayName || profileUser.username}?\n\nEssa ação não pode ser desfeita.`
  );

  if (!ok) return;

  try {
    await api(`/api/admin/users/${profileUser.id}`, {
      method: "DELETE",
    });

    alert("Conta apagada com sucesso.");

    if (currentUser.id === profileUser.id) {
      location.href = "/login.html";
    } else {
      location.href = "/admin.html";
    }
  } catch (err) {
    showMsg("profileMsg", err.message, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  $("photoLink")?.addEventListener("click", () => {
    const img = $("profilePhoto");
    if (!img) return;
    openPhotoViewer(img.src);
  });

  $("closePhotoViewer")?.addEventListener("click", closePhotoViewer);

  $("photoViewer")?.addEventListener("click", (e) => {
    if (e.target.id === "photoViewer") {
      closePhotoViewer();
    }
  });

  $("removePhotoBtn")?.addEventListener("click", removePhoto);
  $("deleteAccountBtn")?.addEventListener("click", deleteAccount);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePhotoViewer();
  });
});