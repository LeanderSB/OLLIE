let pedidoMap = new Map();
let currentPedidoElement = null;
let timer;

document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('fichaInput').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(verificarFicha, 2000);  // Aguarda 2 segundos antes de chamar verificarFicha
});

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets['Dados'];

        const pedidos = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const COL_PEDIDO = 2; // Coluna C na planilha
        const COL_MODELO = 27; // Coluna AB na planilha
        const COL_COR = 28; // Coluna AC na planilha
        const COL_ANO = 36; // Coluna AK na planilha
        const COL_FICHA = 37; // Coluna AL na planilha

        pedidoMap = new Map();

        // Agrupar pedidos únicos
        for (let i = 1; i < pedidos.length; i++) {
            const pedidoNum = pedidos[i][COL_PEDIDO];
            const modelo = pedidos[i][COL_MODELO];
            const cor = pedidos[i][COL_COR];
            const ano = pedidos[i][COL_ANO];
            const ficha = pedidos[i][COL_FICHA];

            if (pedidoMap.has(pedidoNum)) {
                pedidoMap.get(pedidoNum).push([modelo, cor, ano, ficha]);
            } else {
                pedidoMap.set(pedidoNum, [[modelo, cor, ano, ficha]]);
            }
        }

        exibirPedidos();
    };
    reader.readAsArrayBuffer(file);
}

function exibirPedidos() {
    const pedidoList = document.getElementById('pedidoList');
    pedidoList.innerHTML = '';

    pedidoMap.forEach((value, key) => {
        const pedidoItem = document.createElement('div');
        pedidoItem.className = 'pedido-item';
        pedidoItem.textContent = 'Pedido ' + key;
        pedidoItem.onclick = () => showPopup(key, pedidoItem);
        pedidoList.appendChild(pedidoItem);
    });
}

function showPopup(pedidoNum, pedidoElement) {
    const pedidoItensDiv = document.getElementById('pedidoItens');
    pedidoItensDiv.innerHTML = '';

    currentPedidoElement = pedidoElement;
    const pedidoDetalhes = pedidoMap.get(pedidoNum);

    pedidoDetalhes.forEach(detalhe => {
        const [modelo, cor] = detalhe;

        const container = document.createElement('div');
        container.className = 'container';

        const modeloDiv = document.createElement('div');
        modeloDiv.className = 'modelo';
        modeloDiv.textContent = 'Modelo: ' + modelo;

        const corDiv = document.createElement('div');
        corDiv.className = 'cor';
        corDiv.textContent = 'Cor: ' + cor;

        container.appendChild(modeloDiv);
        container.appendChild(corDiv);
        pedidoItensDiv.appendChild(container);
    });

    document.getElementById('popup').style.display = 'block';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

function verificarFicha() {
    const fichaInput = document.getElementById('fichaInput');
    const fichaValor = fichaInput.value;
    const [ano, numeroFicha] = fichaValor.split('-');

    const pedidoItensDiv = document.getElementById('pedidoItens');
    const pedidoDetalhes = Array.from(pedidoMap.values()).flat();

    let encontrado = false;

    for (let i = 0; i < pedidoDetalhes.length; i++) {
        const anoPlanilha = pedidoDetalhes[i][2];
        const fichaPlanilha = pedidoDetalhes[i][3];
        const modeloPlanilha = pedidoDetalhes[i][0];
        const corPlanilha = pedidoDetalhes[i][1];

        if (anoPlanilha == ano && fichaPlanilha == numeroFicha) {
            encontrado = true;

            const containers = pedidoItensDiv.querySelectorAll('.container');

            containers.forEach(container => {
                const modeloDiv = container.querySelector('.modelo');
                const corDiv = container.querySelector('.cor');
                
                const modeloExibido = modeloDiv.textContent.replace('Modelo: ', '');
                const corExibida = corDiv.textContent.replace('Cor: ', '');

                if (modeloExibido == modeloPlanilha && corExibida == corPlanilha) {
                    modeloDiv.classList.add('riscado');
                    corDiv.classList.add('riscado');
                }
            });

            verificarConclusao();
            break;
        }
    }

    if (!encontrado) {
        alert('Ficha não encontrada ou não corresponde a nenhum modelo.');
    }

    fichaInput.value = ''; // Limpa o campo de ficha após a verificação
}

function verificarConclusao() {
    const containerElements = document.querySelectorAll('#pedidoItens .container');

    let todasRiscadas = true;

    containerElements.forEach(container => {
        const modeloDiv = container.querySelector('.modelo');
        const corDiv = container.querySelector('.cor');

        if (!modeloDiv.classList.contains('riscado') || !corDiv.classList.contains('riscado')) {
            todasRiscadas = false;
        }
    });

    if (todasRiscadas) {
        currentPedidoElement.classList.add('pedido-verde');
        currentPedidoElement.classList.remove('pedido-vermelho');
        closePopup(); // Fecha o popup se todos os modelos foram riscados
    } else {
        currentPedidoElement.classList.add('pedido-vermelho');
        currentPedidoElement.classList.remove('pedido-verde');
    }
}
