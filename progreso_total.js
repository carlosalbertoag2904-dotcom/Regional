/* Progreso total consolidado (por AÑO)
   - Lee TODOS los PRAP del año activo (todas las Direcciones)
   - Para cada fila PRAP (rid), suma los aportes guardados por TODAS las asesorías
     en localStorage con clave:  YYYY_prog_<NAMESPACE>_<rid>  => { abs1, abs2 }
   - Muestra la misma tabla que una asesoría (sin inputs).
*/
(function () {
  "use strict";

  // ===== Año activo: URL (?year) > LS (app_year_v1) > año actual
  const YEAR_STORE_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  function getActiveYear() {
    const p = new URLSearchParams(location.search);
    const fromUrl = parseInt(p.get("year") || "", 10);
    if (Number.isFinite(fromUrl)) return fromUrl;
    const fromLs = parseInt(localStorage.getItem(YEAR_STORE_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW;
  }
  const YEAR = getActiveYear();
  const YPFX = `${YEAR}_`;

  // === Claves ya existentes en tu proyecto (con prefijo de año) ===
  const STORAGE_DIRECCION = "tablaPoa_direccion_v1"; // [{id, cols[4]}]
  const KEY_PRAP = (id) => `${YPFX}prap_${id}`;      // filas PRAP por Dirección (año)
  const KEY_DIRS = `${YPFX}${STORAGE_DIRECCION}`;

  const table = document.getElementById('tablaTotal');
  const tbody = table ? table.tBodies[0] : null;
  if (!tbody) return;

  // ===== Utilidades =====
  const parseNum = (v) => {
    const n = Number(String(v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  };
  const pct = (n, d) => {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return "—";
    const x = Math.max(0, Math.min(100, (n / d) * 100));
    return x.toFixed(1) + "%";
  };

  // Genera rid si falta (para asegurar ID estable por fila)
  const ensureRidRow = (f) => ({
    rid: f.rid || (Date.now().toString(36) + Math.random().toString(36).slice(2,10)),
    obj: f.obj ?? "", ind: f.ind ?? "", cant: f.cant ?? "",
    acts: f.acts ?? "", periodo: f.periodo ?? "", resp: f.resp ?? ""
  });

  function leerDireccionesIds() {
    try {
      const raw = localStorage.getItem(KEY_DIRS);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(x => x.id).filter(Boolean) : [];
    } catch { return []; }
  }

  function leerPrap(id) {
    try {
      const raw = localStorage.getItem(KEY_PRAP(id));
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      const norm = arr.map(ensureRidRow);
      // persiste rid si faltaba (en ESTA clave del año)
      if (norm.some((f,i)=>!arr[i]?.rid)) {
        try { localStorage.setItem(KEY_PRAP(id), JSON.stringify(norm)); } catch {}
      }
      return norm;
    } catch { return []; }
  }

  // Lee un snapshot YYYY_prog_<NS>_<rid>  => { abs1, abs2 }
  function leerProgSnapshot(ns, rid) {
    try {
      const raw = localStorage.getItem(`${YPFX}prog_${ns}_${rid}`);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === "object") ? obj : {};
    } catch { return {}; }
  }

  // Carga todas las filas PRAP de todas las direcciones (del AÑO activo)
  function loadAllRows() {
    const ids = leerDireccionesIds();
    const rows = [];
    ids.forEach(id => {
      const prapRows = leerPrap(id);
      prapRows.forEach(r => {
        rows.push({
          prapId: id,
          rid: r.rid,
          obj: r.obj, ind: r.ind, cant: r.cant,
          acts: r.acts, periodo: r.periodo, resp: r.resp
        });
      });
    });
    return rows;
  }

  // Suma los snapshots de TODAS las asesorías del AÑO (solo claves que empiecen con YEAR_)
  function aggregateByRid() {
    const base = loadAllRows(); // catálogo PRAP con rid
    if (!base.length) return new Map();

    // rid -> fila base (para meta y textos)
    const catalog = new Map();
    base.forEach(r => {
      if (!catalog.has(r.rid)) catalog.set(r.rid, r);
    });

    // rid -> acumulados
    const acc = new Map();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(YPFX)) continue;

      // buscamos YYYY_prog_<NAMESPACE>_<rid>
      const tail = k.slice(YPFX.length);
      const m = /^prog_(.+)_(.+)$/.exec(tail);
      if (!m) continue;
      const rid = m[2];
      if (!catalog.has(rid)) continue;

      const snap = leerProgSnapshot(m[1], rid); // {abs1, abs2}
      const prev = acc.get(rid) || { abs1: 0, abs2: 0 };
      acc.set(rid, {
        abs1: prev.abs1 + parseNum(snap.abs1),
        abs2: prev.abs2 + parseNum(snap.abs2)
      });
    }

    // Mezclamos catálogo + acumulados a filas renderizables
    const out = new Map();
    catalog.forEach((r, rid) => {
      const sums = acc.get(rid) || { abs1: 0, abs2: 0 };
      out.set(rid, {
        obj: r.obj || "(sin objetivo)",
        ind: r.ind || "",
        cant: parseNum(r.cant),
        acts: r.acts || "",
        periodo: r.periodo || "",
        resp: r.resp || "",
        iAbs: parseNum(sums.abs1),
        iiAbs: parseNum(sums.abs2)
      });
    });

    return out;
  }

  function renderPlaceholder(msg) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const tr = tbody.insertRow();
    const td = tr.insertCell(0);
    td.colSpan = 11;
    td.className = "placeholder";
    td.textContent = msg || "Sin datos todavía.";
  }

  function render() {
    const map = aggregateByRid();
    if (map.size === 0) return renderPlaceholder("Sin datos todavía.");

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    // Orden sugerido: mayor % total primero, luego por objetivo
    const rows = [...map.values()].map(r => {
      const meta = parseNum(r.cant);
      const i = parseNum(r.iAbs), ii = parseNum(r.iiAbs);
      const total = i + ii;
      return {
        obj: r.obj, ind: r.ind, cant: meta,
        acts: r.acts, periodo: r.periodo, resp: r.resp,
        iAbs: i, iPct: pct(i, meta),
        iiAbs: ii, iiPct: pct(ii, meta),
        totPct: pct(total, meta)
      };
    }).sort((a,b) => {
      const ax = parseFloat(a.totPct) || 0;
      const bx = parseFloat(b.totPct) || 0;
      return bx - ax || a.obj.localeCompare(b.obj);
    });

    rows.forEach(r => {
      const tr = tbody.insertRow();
      const c = (val, cls) => { const td = tr.insertCell(-1); td.textContent = val; if (cls) td.className = cls; return td; };

      c(r.obj);
      c(r.ind);
      c(String(r.cant), "num");
      c(r.acts);
      c(r.periodo);
      c(r.resp);
      c(String(r.iAbs), "num");
      c(r.iPct, "num");
      c(String(r.iiAbs), "num");
      c(r.iiPct, "num");
      c(r.totPct, "num");
    });
  }

  // Arranque
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }

  // Reacciona a cambios en Direcciones, PRAP o cualquier progreso namespace (solo del AÑO actual)
  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (!e.key.startsWith(YPFX)) return;

    const tail = e.key.slice(YPFX.length);
    if (tail === STORAGE_DIRECCION || /^prap_/.test(tail) || /^prog_.+_.+$/.test(tail)) {
      render();
    }
  });
})();

// Botón PDF (único listener)
document.getElementById('btnPdf')?.addEventListener('click', () => {
  window.print();
});
