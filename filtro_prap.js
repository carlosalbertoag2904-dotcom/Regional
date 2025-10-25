(function () {
  "use strict";

  // =========================
  // Año activo (URL > LS > actual)
  // =========================
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
  const YEAR_PREFIX = `${YEAR}_`;

  // =========================
  // Claves usadas en tu app (con prefijo de AÑO)
  // =========================
  const STORAGE_DIRECCION = "tablaPoa_direccion_v1"; // [{id, cols:[...]}]
  const KEY_DIRECCION = `${YEAR_PREFIX}${STORAGE_DIRECCION}`;
  // PRAP por dirección: `${YEAR}_prap_<dirId>` => [{obj, ind, cant, acts, periodo, resp}]

  // =========================
  // DOM
  // =========================
  const selDireccion = document.getElementById('selDireccion');
  const inpResp      = document.getElementById('inpResp');
  const btnBuscar    = document.getElementById('btnBuscar');
  const btnLimpiar   = document.getElementById('btnLimpiar');
  const tbody        = document.querySelector('#tablaFiltro tbody');
  const lblResumen   = document.getElementById('lblResumen');

  if (!selDireccion || !inpResp || !btnBuscar || !btnLimpiar || !tbody || !lblResumen) {
    console.warn('[filtro_prap] Faltan elementos esperados en el DOM.');
    return;
  }

  // =========================
  // Utilidades de lectura
  // =========================
  function leerDirecciones() {
    try {
      const raw = localStorage.getItem(KEY_DIRECCION);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function leerPRAP(dirId) {
    try {
      const raw = localStorage.getItem(`${YEAR_PREFIX}prap_${dirId}`);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  // =========================
  // Cargar opciones de dirección
  // =========================
  function poblarDirecciones() {
    const ds = leerDirecciones();
    selDireccion.innerHTML = `<option value="">— Todas —</option>`;
    ds.forEach((d, i) => {
      const area = (d.cols?.[0] ?? '').toString();
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `#${i+1} — ${area.slice(0,80)}`;
      selDireccion.appendChild(opt);
    });
    // Si existe el decorador de select, que se re-renderice (lo montamos abajo)
    selDireccion.dispatchEvent(new Event('change', { bubbles:true }));
  }

  // =========================
  // Ejecutar filtro
  // =========================
  function ejecutarFiltro() {
    const dirIdSel = selDireccion.value;     // "" => todas
    const respTxt  = inpResp.value.trim().toLowerCase();

    const dirs = leerDirecciones();
    const consider = dirIdSel ? dirs.filter(d => d.id === dirIdSel) : dirs;

    const resultados = [];
    consider.forEach(d => {
      const etiquetaDir = (d.cols?.[0] ?? '').toString();
      const prap = leerPRAP(d.id);
      prap.forEach(row => {
        const resp = (row.resp || '').toString().toLowerCase();
        const coincideResp = respTxt ? resp.includes(respTxt) : true;
        if (coincideResp) {
          resultados.push({
            dirId: d.id,
            dirNombre: etiquetaDir,
            obj: row.obj || "",
            ind: row.ind || "",
            cant: row.cant || "",
            acts: row.acts || "",
            periodo: row.periodo || "",
            resp: row.resp || "",
          });
        }
      });
    });

    renderTabla(resultados);
  }

  // =========================
  // Render de tabla
  // =========================
  function renderTabla(items) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (!items.length) {
      const tr = tbody.insertRow();
      const td = tr.insertCell(0);
      td.colSpan = 8;
      td.textContent = "No hay resultados para los filtros seleccionados.";
      td.style.textAlign = "center";
      lblResumen.textContent = "Mostrando 0 resultados";
      return;
    }

    items.forEach(it => {
      const tr = tbody.insertRow();
      tr.insertCell(0).textContent = it.dirNombre;
      tr.insertCell(1).textContent = it.obj;
      tr.insertCell(2).textContent = it.ind;
      tr.insertCell(3).textContent = it.cant;
      tr.insertCell(4).textContent = it.acts;
      tr.insertCell(5).textContent = it.periodo;
      tr.insertCell(6).textContent = it.resp;

      const tdVer = tr.insertCell(7);
      const a = document.createElement('a');
      a.href = `vista_prap.html?id=${encodeURIComponent(it.dirId)}&year=${YEAR}`;
      a.className = 'link-abrir';
      a.textContent = 'Abrir';

      // Reemplaza para evitar avanzar en historial (consistente con admin)
      a.addEventListener('click', (e) => {
        e.preventDefault();
        location.replace(a.href);
      });

      tdVer.appendChild(a);
    });

    lblResumen.textContent = `Mostrando ${items.length} resultado${items.length===1?'':'s'}`;
  }

  // =========================
  // Eventos
  // =========================
  btnBuscar.addEventListener('click', ejecutarFiltro);

  btnLimpiar.addEventListener('click', () => {
    selDireccion.value = "";
    inpResp.value = "";
    ejecutarFiltro();
  });

  // Debounce al teclear en Responsable
  let t;
  inpResp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(ejecutarFiltro, 250);
  });
  selDireccion.addEventListener('change', ejecutarFiltro);

  // >>> FIX extra: cuando el input de Responsable toma foco, cerrar selects abiertos
  function closeCustomSelects(){
    document.querySelectorAll('.custom-select[aria-expanded="true"]')
      .forEach(w => w.setAttribute('aria-expanded','false'));
  }
  inpResp.addEventListener('focus', closeCustomSelects);
  // Evita que el click dentro del input sea “capturado” por listeners globales
  inpResp.addEventListener('mousedown', (e) => e.stopPropagation());

  // Refrescar si otra pestaña cambia datos base DEL MISMO AÑO
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (!e.key.startsWith(YEAR_PREFIX)) return;

    const tail = e.key.slice(YEAR_PREFIX.length);
    if (tail === STORAGE_DIRECCION) {
      poblarDirecciones();
      ejecutarFiltro();
    } else if (tail.startsWith('prap_')) {
      ejecutarFiltro();
    }
  });

  // =========================
  // Init
  // =========================
  poblarDirecciones();
  ejecutarFiltro();
})();

/* =========================================================
   Select Dirección en gris (custom, sin azul del sistema)
   — Se monta sobre #selDireccion y preserva eventos change
========================================================= */
(function enhanceDireccionSelectPublic(){
  const sel = document.getElementById('selDireccion');
  if (!sel) return;

  // Contenedor
  const wrap = document.createElement('div');
  wrap.className = 'custom-select';
  wrap.setAttribute('role','combobox');
  wrap.setAttribute('aria-haspopup','listbox');
  wrap.setAttribute('aria-expanded','false');

  // Trigger
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cs-trigger';
  btn.setAttribute('aria-label','Dirección');
  const btnLabel = document.createElement('span');
  const caret = document.createElement('span'); caret.className = 'cs-caret';
  btn.appendChild(btnLabel); btn.appendChild(caret);

  // Popover
  const pop = document.createElement('div'); pop.className = 'cs-pop';
  const ul = document.createElement('ul'); ul.className = 'cs-list'; ul.setAttribute('role','listbox');
  pop.appendChild(ul);

  wrap.appendChild(btn); wrap.appendChild(pop);

  // Insertar y ocultar select nativo
  sel.classList.add('is-replaced');
  sel.parentNode.insertBefore(wrap, sel.nextSibling);

  function syncLabel(){
    const cur = sel.options[sel.selectedIndex];
    btnLabel.textContent = cur ? cur.textContent : '— Todas —';
    ul.querySelectorAll('.cs-item').forEach(li=>{
      li.toggleAttribute('aria-selected', li.dataset.value === sel.value);
    });
  }
  function renderOptions(){
    ul.innerHTML = '';
    [...sel.options].forEach(op=>{
      const li = document.createElement('li');
      li.className = 'cs-item'; li.setAttribute('role','option'); li.setAttribute('tabindex','-1');
      li.dataset.value = op.value; li.textContent = op.textContent;
      if (op.selected) li.setAttribute('aria-selected','true');
      ul.appendChild(li);
    });
    syncLabel();
  }

  function open(){ 
    wrap.setAttribute('aria-expanded','true'); 
    setTimeout(()=>{
      (ul.querySelector('.cs-item[aria-selected="true"]') || ul.querySelector('.cs-item'))?.focus();
    },0); 
  }
  // >>> FIX: que cerrar NO devuelva foco al botón cuando se hace click fuera
  function close(opts = {}){ 
    const { returnFocus = false } = opts;
    wrap.setAttribute('aria-expanded','false'); 
    if (returnFocus) btn.focus();
  }
  function toggle(){ 
    (wrap.getAttribute('aria-expanded')==='true') ? close({returnFocus:true}) : open(); 
  }

  btn.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });

  ul.addEventListener('click', e=>{
    const li = e.target.closest('.cs-item'); if(!li) return;
    sel.value = li.dataset.value;
    sel.dispatchEvent(new Event('change', { bubbles:true }));
    syncLabel(); 
    close({returnFocus:true}); // al elegir opción, sí devolvemos foco al botón
  });

  ul.addEventListener('keydown', e=>{
    const items = [...ul.querySelectorAll('.cs-item')];
    const i = items.indexOf(document.activeElement);
    if (e.key==='ArrowDown'){ e.preventDefault(); (items[Math.min(i+1, items.length-1)]||items[0]).focus(); }
    else if (e.key==='ArrowUp'){ e.preventDefault(); (items[Math.max(i-1,0)]||items[items.length-1]).focus(); }
    else if (e.key==='Enter'){ e.preventDefault(); document.activeElement.click(); }
    else if (e.key==='Escape'){ e.preventDefault(); close({returnFocus:true}); }
  });

  // Cierre al hacer click fuera (SIN robar el foco del input de Responsable)
  document.addEventListener('click', e=>{ 
    if(!wrap.contains(e.target)) close({returnFocus:false}); 
  });

  // Sincroniza cuando cambia el select real
  sel.addEventListener('change', syncLabel);

  // Re-render si repueblas <option> dinámicamente
  const mo = new MutationObserver(m=>{ if (m.some(x=>x.type==='childList')) renderOptions(); });
  mo.observe(sel, { childList:true });

  renderOptions();
})();
