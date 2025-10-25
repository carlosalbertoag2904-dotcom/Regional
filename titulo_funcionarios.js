/* titulo_funcionarios_plain.js
   “Cuadro” de funcionarios sin fondo ni subtítulo.
   - Guarda en localStorage: tf_title_<NAMESPACE>
   - ADMIN: input editable (autosave)
   - PÚBLICO: texto solo lectura
*/
(function (global) {
  function init(opts) {
    const {
      namespace = "DEFAULT",
      isAdmin = false,
      afterSelector = "main .card h2",
      placeholder = "Escribe aquí los nombres de los funcionarios…"
    } = opts || {};

    const KEY = `tf_title_${namespace}`;
    const anchor = document.querySelector(afterSelector);
    if (!anchor) return;

    // recuperar valor
    let value = "";
    try {
      const raw = localStorage.getItem(KEY);
      value = (typeof raw === "string") ? raw : "";
    } catch { value = ""; }

    // contenedor
    const box = document.createElement("div");
    box.className = "titulo-funcionarios";

    if (isAdmin) {
      const input = document.createElement("input");
      input.className = "tf-input";
      input.type = "text";
      input.placeholder = placeholder;
      input.value = value;

      let t;
      input.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          try { localStorage.setItem(KEY, input.value.trim()); } catch {}
        }, 160);
      });

      box.appendChild(input);
    } else {
      const text = document.createElement("h3");
      text.className = "tf-text";
      text.textContent = value || "—";
      box.appendChild(text);
    }

    // insertar justo después del h2
    anchor.insertAdjacentElement("afterend", box);
  }

  global.TituloFuncionariosPlain = { init };
})(window);
