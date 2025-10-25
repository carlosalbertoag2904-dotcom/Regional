
/* ============================
   Bloqueo “no-forward”
============================ */
(function () {
  try { history.replaceState({ noForward: true }, "", location.href); } catch {}
  window.addEventListener("popstate", function (e) {
    try {
      if (e.state && e.state.noForward) {
        history.pushState({ noForward: true }, "", location.href);
      }
    } catch {}
  });
})();

/* ============================
   MVV — PÚBLICO (lector robusto)
============================ */
(function (){
  const PRIMARY_KEY  = "mvv_paneles_v1"; // <- misma que usa el admin
  const FALLBACK_KEY = "mvv_v1";         // opcional por compatibilidad

  function readKey(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function leer() {
    return readKey(PRIMARY_KEY) ?? readKey(FALLBACK_KEY) ?? null;
  }

  // Normaliza a { title, cards:[{title,body} x3] }
  function normalizar(data) {
    const out = {
      title: "IDEAS RECTORAS",
      cards: [{title:"",body:""},{title:"",body:""},{title:"",body:""}]
    };

    if (!data) return out;

    // 1) Caso array puro (lo que guarda el admin): [{title,body},{...},{...}]
    if (Array.isArray(data)) {
      for (let i = 0; i < Math.min(3, data.length); i++) {
        out.cards[i].title = String(data[i]?.title || "");
        out.cards[i].body  = String(data[i]?.body  || "");
      }
      return out;
    }

    // 2) Objeto con cards
    if (Array.isArray(data.cards)) {
      out.title = String(data.title || data.titulo || data.pageTitle || out.title);
      for (let i = 0; i < Math.min(3, data.cards.length); i++) {
        out.cards[i].title = String(data.cards[i]?.title || data.cards[i]?.h || "");
        out.cards[i].body  = String(data.cards[i]?.body  || data.cards[i]?.p || "");
      }
      return out;
    }

    // 3) Objeto con sections
    if (Array.isArray(data.sections)) {
      out.title = String(data.title || data.titulo || data.pageTitle || out.title);
      for (let i = 0; i < Math.min(3, data.sections.length); i++) {
        out.cards[i].title = String(data.sections[i]?.h || "");
        out.cards[i].body  = String(data.sections[i]?.p || "");
      }
      return out;
    }

    // 4) Claves planas t0/b0…
    out.title = String(data.title || data.titulo || data.pageTitle || out.title);
    for (let i = 0; i < 3; i++) {
      out.cards[i].title = String(data["t"+i] || "");
      out.cards[i].body  = String(data["b"+i] || "");
    }
    return out;
  }

  function render(){
    const norm = normalizar(leer());

    const pageTitle = document.querySelector(".sheet-title, #pageTitle");
    if (pageTitle) pageTitle.textContent = norm.title;

    for (let i = 0; i < 3; i++) {
      const t = document.getElementById(`t${i}`);
      const b = document.getElementById(`b${i}`);
      if (t) t.textContent = norm.cards[i].title || "";
      if (b) b.textContent = norm.cards[i].body  || "";
    }
  }

  window.addEventListener("storage", (e) => {
    if (e.key === PRIMARY_KEY || e.key === FALLBACK_KEY) render();
  });

  render();
})();

