// Mapeia os pedidos e detalhes
let pedidoMap = new Map();

// Armazena o elemento do pedido atual para manipulação
let currentPedidoElement = null;

// Timer para controlar o delay de verificação da ficha
let timer;

// Array para armazenar os números das fichas já digitadas
let fichasDigitadas = [];

// Adiciona um listener para o input de arquivo, que chama a função handleFile quando um arquivo é carregado
document.getElementById('fileInput').addEventListener('change', handleFile);

// Adiciona um listener para o input da ficha, que chama a função verificarFicha após 2 segundos de inatividade
document.getElementById('fichaInput').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(verificarFicha, 2000);  // Aguarda 2 segundos antes de chamar verificarFicha
});

// Função para lidar com o arquivo carregado
function handleFile(event) {
    const file = event.target.files[0]; // Obtém o arquivo carregado
    const reader = new FileReader(); // Cria um novo FileReader para ler o arquivo

    // Quando o arquivo for carregado, executa a função
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result); // Lê os dados do arquivo em um array de bytes
        const workbook = XLSX.read(data, { type: 'array' }); // Lê o arquivo Excel como um workbook
        const sheet = workbook.Sheets['Dados']; // Obtém a aba chamada 'Dados'

        // Converte a aba em um array de arrays, onde cada array é uma linha
        const pedidos = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Índices das colunas específicas
        const COL_PEDIDO = 2; // Coluna C na planilha (número do pedido)
        const COL_MODELO = 27; // Coluna AB na planilha (modelo)
        const COL_COR = 28; // Coluna AC na planilha (cor)
        const COL_ANO = 36; // Coluna AK na planilha (ano)
        const COL_FICHA = 37; // Coluna AL na planilha (número da ficha)

        // Limpa o map de pedidos
        pedidoMap = new Map();

        // Itera sobre as linhas da planilha a partir da segunda linha
        for (let i = 1; i < pedidos.length; i++) {
            const pedidoNum = pedidos[i][COL_PEDIDO]; // Obtém o número do pedido
            const modelo = pedidos[i][COL_MODELO]; // Obtém o modelo
            const cor = pedidos[i][COL_COR]; // Obtém a cor
            const ano = pedidos[i][COL_ANO]; // Obtém o ano
            const ficha = pedidos[i][COL_FICHA]; // Obtém o número da ficha

            // Se o pedido já existir no Map, adiciona o novo item ao array existente
            if (pedidoMap.has(pedidoNum)) {
                pedidoMap.get(pedidoNum).push([modelo, cor, ano, ficha]);
            } else {
                // Caso contrário, cria um novo array para o pedido
                pedidoMap.set(pedidoNum, [[modelo, cor, ano, ficha]]);
            }
        }

        // Exibe os pedidos na interface
        exibirPedidos();
    };

    // Lê o arquivo como um array buffer
    reader.readAsArrayBuffer(file);
}

// Função para exibir os pedidos na página
function exibirPedidos() {
    const pedidoList = document.getElementById('pedidoList');
    pedidoList.innerHTML = ''; // Limpa a lista de pedidos

    // Itera sobre o Map de pedidos
    pedidoMap.forEach((value, key) => {
        const pedidoItem = document.createElement('div'); // Cria um novo elemento div para cada pedido
        pedidoItem.className = 'pedido-item'; // Define a classe CSS do pedido
        pedidoItem.textContent = 'Pedido ' + key; // Define o texto do pedido

        // Define o evento de clique para exibir o popup com os detalhes do pedido
        pedidoItem.onclick = () => showPopup(key, pedidoItem);
        pedidoList.appendChild(pedidoItem); // Adiciona o pedido à lista na página
    });
}

// Função para exibir o popup com os detalhes do pedido
function showPopup(pedidoNum, pedidoElement) {
    const pedidoItensDiv = document.getElementById('pedidoItens');
    pedidoItensDiv.innerHTML = ''; // Limpa os itens do pedido

    // Define o elemento atual do pedido
    currentPedidoElement = pedidoElement;
    const pedidoDetalhes = pedidoMap.get(pedidoNum); // Obtém os detalhes do pedido

    // Itera sobre os detalhes do pedido para exibi-los no popup
    pedidoDetalhes.forEach(detalhe => {
        const [modelo, cor] = detalhe;

        // Cria os elementos HTML para o modelo e a cor
        const container = document.createElement('div');
        container.className = 'container';

        const modeloDiv = document.createElement('div');
        modeloDiv.className = 'modelo';
        modeloDiv.textContent = 'Modelo: ' + modelo;

        const corDiv = document.createElement('div');
        corDiv.className = 'cor';
        corDiv.textContent = 'Cor: ' + cor;

        // Adiciona o modelo e a cor ao container e o container ao popup
        container.appendChild(modeloDiv);
        container.appendChild(corDiv);
        pedidoItensDiv.appendChild(container);
    });

    // Exibe o popup
    document.getElementById('popup').style.display = 'block';
}

// Função para fechar o popup
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

// Função para verificar a ficha digitada
function verificarFicha() {
    const fichaInput = document.getElementById('fichaInput');
    const fichaValor = fichaInput.value; // Obtém o valor digitado no input de ficha
    const [ano, numeroFicha] = fichaValor.split('-'); // Divide a ficha em ano e número

    // Verifica se a ficha já foi digitada anteriormente
    if (fichasDigitadas.includes(fichaValor)) {
        alert('Ficha já digitada!'); // Exibe um alerta se a ficha já foi digitada
        fichaInput.value = ''; // Limpa o campo de input
        return; // Sai da função sem fazer a verificação
    }

    // Adiciona a ficha à lista de fichas digitadas
    fichasDigitadas.push(fichaValor);

    const pedidoItensDiv = document.getElementById('pedidoItens');
    const pedidoDetalhes = Array.from(pedidoMap.values()).flat(); // Converte o Map em um array simples

    let encontrado = false; // Flag para verificar se a ficha foi encontrada

    // Itera sobre os detalhes do pedido para verificar a ficha
    for (let i = 0; i < pedidoDetalhes.length; i++) {
        const anoPlanilha = pedidoDetalhes[i][2];
        const fichaPlanilha = pedidoDetalhes[i][3];
        const modeloPlanilha = pedidoDetalhes[i][0];
        const corPlanilha = pedidoDetalhes[i][1];

        // Verifica se a ficha corresponde aos dados da planilha
        if (anoPlanilha == ano && fichaPlanilha == numeroFicha) {
            encontrado = true;

            const containers = pedidoItensDiv.querySelectorAll('.container');

            // Marca o modelo e a cor como riscados se forem encontrados no popup
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

            // Verifica se todos os modelos do pedido foram marcados
            verificarConclusao();
            break;
        }
    }

    // Se a ficha não foi encontrada, exibe um alerta
    if (!encontrado) {
        alert('Ficha não encontrada ou não corresponde a nenhum modelo.');
    }

    fichaInput.value = ''; // Limpa o campo de ficha após a verificação
}

// Função para verificar se todos os modelos do pedido foram riscados
function verificarConclusao() {
    const containerElements = document.querySelectorAll('#pedidoItens .container');

    let todasRiscadas = true; // Flag para verificar se todos os modelos foram riscados

    // Itera sobre os containers para verificar se todos estão riscados
    containerElements.forEach(container => {
        const modeloDiv = container.querySelector('.modelo');
        const corDiv = container.querySelector('.cor');

        // Se algum modelo ou cor não estiver riscado, define a flag como falsa
        if (!modeloDiv.classList.contains('riscado') || !corDiv.classList.contains('riscado')) {
            todasRiscadas = false;
        }
    });

    // Se todos os modelos estiverem riscados, marca o pedido como verde e fecha o popup
    if (todasRiscadas) {
        currentPedidoElement.classList.add('pedido-verde');
        currentPedidoElement.classList.remove('pedido-vermelho');
        closePopup();
    } else {
        // Caso contrário, marca o pedido como vermelho
        currentPedidoElement.classList.add('pedido-vermelho');
        currentPedidoElement.classList.remove('pedido-verde');
    }
}
