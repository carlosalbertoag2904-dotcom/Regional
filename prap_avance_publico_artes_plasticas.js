// Vista pública aislada para Artes Plásticas
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "ARTES_PLASTICAS" });

// Público: solo mostrar el texto (sin subtítulo, sin fondo)
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "ARTES_PLASTICAS",
      isAdmin: false,
      afterSelector: "main .card h2"
    });
  }
});
