/* ============================
   Usuarios Admin (Nombre / Usuario / Contraseña)
   - Editables (contenteditable)
   - Autosave en localStorage
   - Agregar / Eliminar fila
   - Sincroniza entre pestañas
   - MIGRACIÓN: copia datos desde la clave vieja si existen
============================ */
(function () {
  // >>> CLAVE OFICIAL QUE LEE EL LOGIN DE ADMIN <<<
  const STORAGE_KEY = "usuarios_admin_v1";

  // Clave antigua usada antes en esta página
  const LEGACY_KEY = "usuarios_simple_v1";

  const tabla = document.getElementById("tablaUsuarios");
  const tbody = tabla.querySelector("tbody");
  const btnAdd = document.getElementById("btnAdd");
  const msg = document.getElementById("msg");

  // ====== Utils ======
  const clean = (v) => (v == null ? "" : String(v).trim());
  const filaVacia = () => ({ nombre: "", usuario: "", contrasena: "" });

  function feedback(txt) {
    if (!msg) return;
    msg.textContent = txt || "";
    if (!txt) return;
    clearTimeout(feedback._t);
    feedback._t = setTimeout(() => (msg.textContent = ""), 1200);
  }

  // ====== Storage ======
  function leer(key = STORAGE_KEY) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function escribir(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      feedback("✔ Guardado.");
    } catch (e) {
      feedback("No se pudo guardar (storage lleno o bloqueado).");
      console.warn(e);
    }
  }

  // MIGRACIÓN: si no hay datos en la clave nueva pero sí en la vieja, copiar
  (function migrateIfNeeded() {
    const current = leer(STORAGE_KEY);
    if (current && current.length) return; // ya hay datos buenos

    const legacy = leer(LEGACY_KEY);
    if (legacy && legacy.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        // opcional: puedes limpiar la vieja si quieres
        // localStorage.removeItem(LEGACY_KEY);
        console.info("[usuarios_admin] Migrados", legacy.length, "registros desde", LEGACY_KEY);
      } catch (e) {
        console.warn("No se pudo migrar desde clave vieja:", e);
      }
    }
  })();

  // ====== DOM <-> Datos ======
  function dataDesdeDOM() {
    return [...tbody.rows].map((tr) => {
      const c = tr.cells;
      return {
        nombre:     clean(c[1]?.textContent),
        usuario:    clean(c[2]?.textContent),
        contrasena: clean(c[3]?.textContent)   // <- SIN tilde (login ya acepta ambas)
      };
    });
  }

  function crearFila(row, i) {
    const tr = document.createElement("tr");

    // N°
    const tdNum = document.createElement("td");
    tdNum.textContent = String(i + 1);
    tr.appendChild(tdNum);

    // Nombre, Usuario, Contraseña (editables)
    [row.nombre, row.usuario, row.contrasena].forEach((valor) => {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = valor || "";
      tr.appendChild(td);
    });

    // Acciones
    const tdAcc = document.createElement("td");
    tdAcc.style.textAlign = "center";
    const btn = document.createElement("button");
    btn.className = "btn-trash";
    btn.title = "Eliminar fila";
    btn.textContent = "🗑️";
    btn.addEventListener("click", () => eliminarFila(i));
    tdAcc.appendChild(btn);
    tr.appendChild(tdAcc);

    return tr;
  }

  function render(datos) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const rows = (Array.isArray(datos) && datos.length) ? datos : [filaVacia()];
    rows.forEach((row, i) => tbody.appendChild(crearFila(row, i)));

    renumerar();
  }

  function renumerar() {
    [...tbody.rows].forEach((tr, i) => {
      if (tr.cells[0]) tr.cells[0].textContent = String(i + 1);
    });
  }

  // ====== Operaciones ======
  let tSave;
  function guardarDebounced() {
    clearTimeout(tSave);
    tSave = setTimeout(() => {
      const datos = dataDesdeDOM();
      escribir(datos);
    }, 120);
  }

  function agregarFila() {
    const datos = leer(STORAGE_KEY);
    datos.push(filaVacia());
    escribir(datos);
    render(datos);
  }

  function eliminarFila(idx) {
    const datos = leer(STORAGE_KEY);
    if (!datos[idx]) return;
    if (!confirm("¿Eliminar esta fila?")) return;
    datos.splice(idx, 1);
    escribir(datos);
    render(datos.length ? datos : [filaVacia()]);
  }

  // ====== Eventos ======
  btnAdd.addEventListener("click", agregarFila);

  // Guardado automático con debounce al escribir
  tbody.addEventListener("input", (e) => {
    const td = e.target.closest('td[contenteditable="true"]');
    if (!td) return;
    guardarDebounced();
  });

  // Evita saltos de línea con Enter
  tbody.addEventListener("keydown", (e) => {
    const td = e.target.closest('td[contenteditable="true"]');
    if (!td) return;
    if (e.key === "Enter") {
      e.preventDefault();
      td.blur();
    }
  });

  // Sincroniza ediciones entre pestañas
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) render(leer(STORAGE_KEY));
  });

  // ====== Init ======
  const data = leer(STORAGE_KEY);
  render(data.length ? data : [filaVacia()]);
})();
