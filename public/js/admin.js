const { $, api, showMsg, photoUrl, logout } = window.Fur;

async function loadAdmin() {
  try {
    const me = await api("/api/me");

    if (!me.user) {
      location.href = "/login.html";
      return;
    }

    if (!me.user.isAdmin) {
      location.href = "/dashboard.html";
      return;
    }

    const data = await api("/api/admin/users");
    const box = $("users");

    box.innerHTML = "";

    data.users.forEach((u) => {
      const div = document.createElement("div");
      div.className = "admin-user";

      div.innerHTML = `
        <a href="/perfil.html?id=${u.id}">
          <img src="${photoUrl(u)}" alt="Foto">
        </a>

        <div>
          <b>${u.displayName || u.username}</b>
          <br>
          <span class="muted">@${u.username} • ${u.email}</span>
          <br>
          <span>${u.city || "Cidade não informada"}</span>
        </div>

        <div class="nav">
          <a class="btn small secondary" href="/perfil.html?id=${u.id}">
            Perfil
          </a>

          <button
            class="btn small secondary"
            data-photo="${u.id}"
            type="button">
            Remover foto
          </button>

          <button
            class="btn small secondary"
            data-marker="${u.id}"
            type="button">
            Apagar marcador
          </button>

          <button
            class="btn small danger"
            data-del="${u.id}"
            type="button">
            Deletar conta
          </button>
        </div>
      `;

      box.appendChild(div);
    });

    document.querySelectorAll("[data-photo]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const ok = confirm("Tem certeza que deseja remover a foto deste usuário?");

        if (!ok) return;

        try {
          await api("/api/admin/users/" + btn.dataset.photo + "/photo", {
            method: "DELETE",
          });

          showMsg("adminMsg", "Foto removida com sucesso.", true);
          loadAdmin();
        } catch (err) {
          showMsg("adminMsg", err.message, false);
        }
      })
    );

    document.querySelectorAll("[data-del]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const ok = confirm(
          "Tem certeza que deseja deletar essa conta?\n\nEssa ação não pode ser desfeita."
        );

        if (!ok) return;

        try {
          await api("/api/admin/users/" + btn.dataset.del, {
            method: "DELETE",
          });

          showMsg("adminMsg", "Conta deletada.", true);

          if (Number(btn.dataset.del) === me.user.id) {
            location.href = "/login.html";
          } else {
            loadAdmin();
          }
        } catch (err) {
          showMsg("adminMsg", err.message, false);
        }
      })
    );

    document.querySelectorAll("[data-marker]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const ok = confirm("Tem certeza que deseja apagar o marcador desse usuário?");

        if (!ok) return;

        try {
          await api("/api/admin/users/" + btn.dataset.marker + "/marker", {
            method: "DELETE",
          });

          showMsg("adminMsg", "Marcador apagado.", true);
          loadAdmin();
        } catch (err) {
          showMsg("adminMsg", err.message, false);
        }
      })
    );
  } catch (err) {
    showMsg("adminMsg", err.message, false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdmin();

  $("logoutBtn")?.addEventListener("click", () => {
    logout().catch((e) => showMsg("adminMsg", e.message, false));
  });
});