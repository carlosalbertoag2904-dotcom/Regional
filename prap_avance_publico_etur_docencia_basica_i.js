// Vista pública del mismo espacio aislado
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ETIR_DOCENCIA_BASICA_I" });

document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ETIR_DOCENCIA_BASICA_I",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});

