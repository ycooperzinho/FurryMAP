window.Fur = (() => {
  const $ = (id) => document.getElementById(id);

function showMsg(id, text, ok = false) {
  let box = document.getElementById("floatingToast");

  if (!box) {
    box = document.createElement("div");
    box.id = "floatingToast";
    box.className = "floating-toast";
    document.body.appendChild(box);
  }

  box.textContent = text;
  box.className = `floating-toast show ${ok ? "ok" : "err"}`;

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 3500);
}

  async function api(url, options = {}) {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
    });

    const text = await res.text();

    let data = null;

    try {
      data = JSON.parse(text);
    } catch {
      if (res.status === 401) {
        throw new Error("Você precisa criar uma conta ou entrar para usar esta função.");
      }

      console.warn("Resposta não JSON:", {
        url,
        status: res.status,
        response: text,
      });

      throw new Error("O servidor respondeu uma página inválida. Tente atualizar a página.");
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("Você precisa criar uma conta ou entrar para usar esta função.");
      }

      if (res.status === 413) {
        throw new Error("Essa imagem está muito grande. Envie uma foto menor.");
      }

      throw new Error(data.error || "Erro no servidor.");
    }

    return data;
  }

  function photoUrl(userOrUrl) {
    let raw = "";

    if (typeof userOrUrl === "string") {
      raw = userOrUrl;
    } else if (userOrUrl && userOrUrl.photo) {
      raw = userOrUrl.photo;
    }

    if (!raw || raw === "null" || raw === "undefined") {
      return "/img/default-avatar.svg";
    }

    return raw + (raw.includes("?") ? "&" : "?") + "v=" + Date.now();
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value || "";
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value || "";
  }

  function getValue(id) {
    const el = $(id);
    return el ? el.value.trim() : "";
  }

  async function logout() {
    await api("/api/logout", {
      method: "POST",
    });

    location.href = "/login.html";
  }

  return {
    $,
    api,
    showMsg,
    photoUrl,
    setText,
    setValue,
    getValue,
    logout,
  };
})();