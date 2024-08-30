// Função para lidar com a leitura do arquivo XLSX
document.getElementById('file-input').addEventListener('change', handleFile, false);

let pedidoDetalhes = []; // Array para armazenar os detalhes dos pedidos
let pedidoMap = new Map(); // Mapa para associar números de pedidos aos seus detalhes

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});

        const sheetName = 'Dados'; // Nome da aba que estamos trabalhando
        const sheet = workbook.Sheets[sheetName];
        const pedidos = XLSX.utils.sheet_to_json(sheet, {header: 1});

        const pedidoList = document.getElementById('pedido-list');
        pedidoList.innerHTML = ''; // Limpar a lista antes de renderizar

        pedidoMap.clear();
        pedidoDetalhes = pedidos;

        // Índices das colunas que vamos utilizar
        const COL_PEDIDO = 2;  // Coluna C - Número do Pedido
        const COL_MODELO = 27; // Coluna AB - Modelo
        const COL_COR = 28;    // Coluna AC - Cor

        // Loop para mapear os pedidos e seus detalhes
        for (let i = 1; i < pedidos.length; i++) {
            const pedidoNumero = pedidos[i][COL_PEDIDO];
            const modelo = pedidos[i][COL_MODELO];
            const cor = pedidos[i][COL_COR];

            if (pedidoNumero) {
                if (!pedidoMap.has(pedidoNumero)) {
                    pedidoMap.set(pedidoNumero, []);
                }
                pedidoMap.get(pedidoNumero).push({modelo, cor});
            }
        }

        // Exibir a lista de pedidos na interface
        pedidoMap.forEach((detalhes, pedidoNumero) => {
            const pedidoDiv = document.createElement('div');
            pedidoDiv.className = 'pedido';
            pedidoDiv.textContent = `Pedido ${pedidoNumero}`;
            pedidoDiv.addEventListener('click', () => showPopup(detalhes));
            pedidoList.appendChild(pedidoDiv);
        });
    };

    reader.readAsArrayBuffer(file); // Ler o arquivo como ArrayBuffer
}

// Função para exibir o popup com os detalhes do pedido
function showPopup(detalhes) {
    const popup = document.getElementById('popup');
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('pedido-content');
    const fichaInput = document.getElementById('ficha');

    content.innerHTML = '<h2>Detalhes do Pedido</h2>';
    content.innerHTML += `<div id="pedido-itens"></div>`;
    const pedidoItensDiv = document.getElementById('pedido-itens');

    // Exibir os detalhes dos modelos e cores no popup
    detalhes.forEach(detalhe => {
        const container = document.createElement('div');
        container.className = 'container';

        const modelo = document.createElement('h3');
        modelo.textContent = `Modelo: ${detalhe.modelo}`;
        modelo.className = 'modelo';
        container.appendChild(modelo);

        const cor = document.createElement('p');
        cor.textContent = `Cor: ${detalhe.cor}`;
        cor.className = 'cor';
        container.appendChild(cor);

        pedidoItensDiv.appendChild(container);
    });

    // Mostrar o popup e o overlay
    popup.style.display = 'block';
    overlay.style.display = 'block';

    // Fechar o popup ao clicar no "X" ou no overlay
    document.querySelector('#popup .close').addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    overlay.addEventListener('click', () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    });

    // Verificar a ficha ao clicar no botão
    document.getElementById('verificar-ficha').addEventListener('click', verificarFicha);

    // Função para verificar a ficha inserida
    function verificarFicha() {
        const ficha = fichaInput.value.trim();
        const [ano, numeroFicha] = ficha.split('-');

        if (!ano || !numeroFicha) {
            alert('Por favor, insira a ficha no formato correto: AK-AL');
            return;
        }

        // Índices das colunas relevantes
        const COL_ANO = 36;  // Coluna AK - Ano
        const COL_FICHA = 37; // Coluna AL - Ficha
        const COL_MODELO = 27; // Coluna AB - Modelo
        const COL_COR = 28;    // Coluna AC - Cor

        let encontrado = false;

        // Loop para comparar os dados da ficha com os modelos no popup
        for (let i = 1; i < pedidoDetalhes.length; i++) {
            const anoPlanilha = pedidoDetalhes[i][COL_ANO];
            const fichaPlanilha = pedidoDetalhes[i][COL_FICHA];
            const modeloPlanilha = pedidoDetalhes[i][COL_MODELO];
            const corPlanilha = pedidoDetalhes[i][COL_COR];

            if (anoPlanilha == ano && fichaPlanilha == numeroFicha) {
                encontrado = true;

                const containerElements = pedidoItensDiv.getElementsByClassName('container');

                for (let container of containerElements) {
                    const modeloElement = container.querySelector('.modelo');
                    const corElement = container.querySelector('.cor');

                    if (modeloElement.textContent.includes(modeloPlanilha) && corElement.textContent.includes(corPlanilha)) {
                        modeloElement.classList.add('riscado');
                        corElement.classList.add('riscado');

                        // Marcar o item como riscado e continuar a verificar
                        break;
                    }
                }

                // Apagar o valor da ficha e sair da função
                fichaInput.value = '';
                return;
            }
        }

        if (!encontrado) {
            alert('Ficha não encontrada. Verifique o número e tente novamente.');
        }

        // Apagar o valor da ficha para permitir uma nova verificação
        fichaInput.value = '';
    }
}
