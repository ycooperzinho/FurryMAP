function popupHtml(marker) {
  const u = marker.user || {};
  return `
    <div class="popup">
      ${photoImg(u, "popup-avatar")}
      <b>${escapeHtml(u.displayName || u.username || "Usuário")}</b><br>
      <small>@${escapeHtml(u.username || "")}</small><br>
      <span>${escapeHtml(u.city || "Cidade não informada")}</span><br>
      <small>${escapeHtml(u.status || "")}</small>
      <br style="clear:both"><br>
      <a class="btn" style="display:block;text-align:center;color:white" href="/perfil.html?id=${u.id}">Ver perfil completo</a>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const map = L.map("map").setView([-15.77972, -47.92972], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  try {
    const data = await api("/api/markers");
    data.markers.forEach((m) => L.marker([m.lat, m.lng]).addTo(map).bindPopup(popupHtml(m)));
  } catch (e) {
    alert(e.message);
  }

  const me = await getMe();
  if (me) {
    $("loginArea").innerHTML = `<a class="btn" href="/dashboard.html">Dashboard</a>`;
    if (me.isAdmin) $("adminNav")?.classList.remove("hidden");
  }
});
