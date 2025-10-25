// Vista pública del mismo espacio aislado
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "EDUCACION_JOVENES_Y_ADULTOS" });

document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "EDUCACION_JOVENES_Y_ADULTOS",
      isAdmin: false,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});


