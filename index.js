let itensGlobais = [];
let usuarioLogado = JSON.parse(localStorage.getItem("cinema_sessao")) || null;
let filtroAtual = "todos";

const lista = document.getElementById("lista");
const feedbackInput = document.getElementById("feedback");
const contador = document.getElementById("contador-caracteres");

function verificarSessao() {
    const tagUsuario = document.getElementById("usuario-ativo-tag");
    if (usuarioLogado) {
        if (tagUsuario) tagUsuario.innerText = `🍿 Crítico: ${usuarioLogado.nome}`;
        puxarDadosDoPostgres();
    } else {
        window.location.href = "login.html";
    }
}

function fazerLogout() {
    localStorage.removeItem("cinema_sessao");
    usuarioLogado = null;
    window.location.href = "login.html";
}

// Puxa as críticas de qualquer utilizador direto do teu banco local
async function puxarDadosDoPostgres() {
    try {
        const resposta = await fetch('http://localhost:3000/api/criticas');
        itensGlobais = await resposta.json();
        atualizarEstatisticas();
        renderizar();
    } catch (err) {
        console.error("Erro ao ler dados do Postgres");
    }
}

function tocarSomAnalogico(tipo) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (tipo === 'claquete') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.04);
        osc.start(); osc.stop(ctx.currentTime + 0.04);
    }
}

if (feedbackInput) {
    feedbackInput.addEventListener("input", () => {
        contador.innerText = `${feedbackInput.value.length} / 300`;
    });
}

function obterClasseSeloPorTexto(texto) {
    if (!texto) return "selo-muito-bom";
    if (texto.includes("Obra-Prima")) return "selo-obra-prima";
    if (texto.includes("Muito Bom")) return "selo-muito-bom";
    if (texto.includes("Regular")) return "selo-regular";
    return "selo-ruim";
}

function atualizarEstatisticas() {
    const totalEl = document.getElementById("stat-total");
    const mediaEl = document.getElementById("stat-media");
    
    if (!totalEl || !mediaEl) return;

    totalEl.innerText = itensGlobais.length;
    if (itensGlobais.length === 0) {
        mediaEl.innerText = "0.0";
        return;
    }
    let s = itensGlobais.reduce((acc, item) => acc + parseFloat(item.nota), 0);
    mediaEl.innerText = (s / itensGlobais.length).toFixed(1);
}

function filtrarLista(tipo, botao) {
    tocarSomAnalogico('claquete');
    filtroAtual = tipo;
    document.querySelectorAll(".btn-filtro, .btn-curador").forEach(b => b.classList.remove("ativo"));
    if (botao) botao.classList.add("ativo");
    renderizar();
}

function renderizar() {
    if (!lista) return;
    lista.innerHTML = "";
    let temConteudo = false;

    itensGlobais.forEach((item) => {
        if (filtroAtual === "Filme" && item.tipo !== "Filme") return;
        if (filtroAtual === "Série" && item.tipo !== "Série") return;
        if (filtroAtual === "recomendados" && parseFloat(item.nota) < 8.5) return;
        
        temConteudo = true;
        let seloTexto = item.seloEditorial || "🎬 Muito Bom";
        let classeSelo = obterClasseSeloPorTexto(seloTexto);
        let autorTexto = item.autor ? `por ${item.autor}` : "Anônimo";

        // O botão de remover foi retirado do HTML abaixo
        lista.innerHTML += `
            <div class="card-filme">
                <div class="card-header">
                    <div>
                        <h3>${item.titulo}</h3>
                        <span class="status-critico ${classeSelo}">${seloTexto} <small style="color: #666; font-weight: normal; text-transform: none;">${autorTexto}</small></span>
                    </div>
                    <div class="card-badges">
                        <span class="badge tipo">${item.tipo}</span>
                        <span class="badge nota">${parseFloat(item.nota).toFixed(1)} / 10</span>
                    </div>
                </div>
                <p class="card-feedback">“ ${item.feedback} ”</p>
            </div>
        `;
    });

    if (!temConteudo) {
        lista.innerHTML = filtroAtual === "recomendados"
            ? `<p class="lista-vazia">Nenhuma obra alcançou o patamar de Recomendada (Nota ≥ 8.5) ainda.</p>`
            : `<p class="lista-vazia">Nenhum registro encontrado.</p>`;
    }
}

async function adicionarItem() {
    const tituloInput = document.getElementById("titulo");
    const tipoInput = document.getElementById("tipo");
    const notaInput = document.getElementById("nota");
    const seloInput = document.getElementById("selo-editorial");

    const titulo = tituloInput.value.trim();
    const tipo = tipoInput.value;
    const nota = parseFloat(notaInput.value);
    const selo_editorial = seloInput.value;
    const feedback = feedbackInput.value.trim();

    if (!titulo || isNaN(nota) || !feedback) return alert("Preencha todos os campos!");
    if (nota < 0 || nota > 10) return alert("A nota deve ser de 0 a 10.");

    const novaCritica = { 
        titulo, 
        tipo, 
        nota, 
        selo_editorial, 
        feedback,
        autor: usuarioLogado ? usuarioLogado.nome : "Anônimo"
    };

    try {
        await fetch('http://localhost:3000/api/criticas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaCritica)
        });
        
        tocarSomAnalogico('claquete');
        tituloInput.value = ""; notaInput.value = ""; feedbackInput.value = "";
        seloInput.selectedIndex = 0;
        contador.innerText = "0 / 300";
        
        puxarDadosDoPostgres();
    } catch (err) {
        alert("Erro ao gravar no banco de dados.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    verificarSessao();
});