document.addEventListener("DOMContentLoaded", () => {
  const loginBox = $("loginBox"), registerBox = $("registerBox");
  $("showLogin")?.addEventListener("click",()=>{loginBox.classList.remove("hidden");registerBox.classList.add("hidden");});
  $("showRegister")?.addEventListener("click",()=>{registerBox.classList.remove("hidden");loginBox.classList.add("hidden");});
  $("loginForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    try{
      await api("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login:val("login"),password:val("loginPassword")})});
      location.href="/dashboard.html";
    }catch(err){ msg("loginMsg",err.message); }
  });
  $("registerForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    try{
      await api("/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:val("email"),username:val("username"),password:val("password")})});
      location.href="/dashboard.html";
    }catch(err){ msg("registerMsg",err.message); }
  });
});
