// Espacio aislado para ETIR – Docencia Básica II
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ETIR_DOCENCIA_BASICA_II" });

document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_DOCENCIA_BASICA_II",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});

