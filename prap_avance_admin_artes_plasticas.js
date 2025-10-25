// Vista admin aislada para Artes Plásticas
PrapAvanceNS.initAvancesPage({ isAdmin: true, namespace: "ARTES_PLASTICAS" });

// Admin: cuadro editable (sin subtítulo, sin fondo)
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ARTES_PLASTICAS",
      isAdmin: true,
      afterSelector: "main .card h2",
      placeholder: ""
    });
  }
});
