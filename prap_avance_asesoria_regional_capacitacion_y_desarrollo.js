// Esta copia usa un namespace distinto para aislar sus datos
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "COPIA1" });

// Admin: cuadro editable (sin subtítulo, sin fondo)
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CAPACITACION_DESARROLLO",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});

