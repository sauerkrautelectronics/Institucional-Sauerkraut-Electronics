
/* ========================================
   CARROSSEL DE OFERTAS
   SAUERKRAUT ELECTRONICS
   ======================================== */

(function () {
    const paineis = document.querySelectorAll("[data-offers-carousel]");

    if (paineis.length === 0) {
        return;
    }

    const primeiroPainel = paineis[0];
    const ofertasIniciais = primeiroPainel.querySelectorAll("[data-offer-item]");
    const totalOfertas = ofertasIniciais.length;

    if (totalOfertas <= 1) {
        return;
    }

    let indiceAtual = 0;

    function atualizarCarrossel() {
        paineis.forEach(function (painel) {
            const ofertas = painel.querySelectorAll("[data-offer-item]");
            const contador = painel.querySelector("[data-offer-counter]");

            ofertas.forEach(function (oferta, indice) {
                oferta.hidden = indice !== indiceAtual;
            });

            if (contador) {
                contador.textContent =
                    (indiceAtual + 1) + " / " + totalOfertas;
            }
        });
    }

    function avancar() {
        indiceAtual = (indiceAtual + 1) % totalOfertas;
        atualizarCarrossel();
    }

    function voltar() {
        indiceAtual =
            (indiceAtual - 1 + totalOfertas) % totalOfertas;

        atualizarCarrossel();
    }

    paineis.forEach(function (painel) {
        const botaoAnterior = painel.querySelector("[data-offer-prev]");
        const botaoProximo = painel.querySelector("[data-offer-next]");

        if (botaoAnterior) {
            botaoAnterior.addEventListener("click", voltar);
        }

        if (botaoProximo) {
            botaoProximo.addEventListener("click", avancar);
        }
    });

    atualizarCarrossel();

    window.setInterval(avancar, 7000);
})();
