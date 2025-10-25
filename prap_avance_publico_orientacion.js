// Vista pública del mismo espacio aislado
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ORIENTACION" });

document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ORIENTACION",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});


