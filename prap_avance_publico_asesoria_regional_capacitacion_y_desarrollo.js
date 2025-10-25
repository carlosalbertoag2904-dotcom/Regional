// Vista pública aislada: solo filas marcadas "Publicar" dentro del mismo namespace
PrapAvanceNS.initAvancesPage({ isAdmin: false, namespace: "COPIA1" });

// Público: solo mostrar el texto (sin subtítulo, sin fondo)
document.addEventListener("DOMContentLoaded", function () {
  if (window.TituloFuncionariosPlain) {
    TituloFuncionariosPlain.init({
      namespace: "CAPACITACION_DESARROLLO",
      isAdmin: false,
      afterSelector: "main .card h2"
    });
  }
});

