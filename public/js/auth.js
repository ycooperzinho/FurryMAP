const { $, api, showMsg } = window.Fur;
function switchTab(which){
  $('tabLogin').classList.toggle('active', which === 'login');
  $('tabRegister').classList.toggle('active', which === 'register');
  $('loginForm').classList.toggle('hidden', which !== 'login');
  $('registerForm').classList.toggle('hidden', which !== 'register');
}
document.addEventListener('DOMContentLoaded', () => {
  $('tabLogin')?.addEventListener('click', () => switchTab('login'));
  $('tabRegister')?.addEventListener('click', () => switchTab('register'));
  $('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ login: $('login').value, password: $('loginPassword').value }) });
      showMsg('msg', 'Login feito. Abrindo dashboard...', true);
      location.href = '/dashboard.html';
    } catch (err) { showMsg('msg', err.message, false); }
  });
  $('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: $('email').value, username: $('username').value, password: $('password').value }) });
      showMsg('msg', 'Conta criada. Abrindo dashboard...', true);
      location.href = '/dashboard.html';
    } catch (err) { showMsg('msg', err.message, false); }
  });
});
