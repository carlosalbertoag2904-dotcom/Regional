// Espacio aislado para ETIR – Trabajo Social
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ETIR_TRABAJO_SOCIAL" });

document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_TRABAJO_SOCIAL",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
