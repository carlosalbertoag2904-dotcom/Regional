// Vista pública del mismo espacio aislado
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_CIVICA" });
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_CIVICA",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});

