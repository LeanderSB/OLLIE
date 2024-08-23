// Adiciona um ouvinte de evento ao input de arquivo para manipular a seleção do arquivo
document.getElementById('upload-xlsx').addEventListener('change', handleFileSelect, false);

// Objeto para armazenar dados dos pedidos e modelos
let pedidosData = {};
let fichaData = []; // Para armazenar os números de ficha formatados

// Função para lidar com a seleção do arquivo XLSX (Quando carrego o excel)
function handleFileSelect(event) {
    const file = event.target.files[0]; // Obtém o arquivo selecionado
    if (!file) {
        alert('Nenhum arquivo selecionado.'); // Exibe um alerta se nenhum arquivo for selecionado
        return;
    }

    const reader = new FileReader(); // Cria um novo FileReader
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result); // Lê o conteúdo do arquivo
        const workbook = XLSX.read(data, { type: 'array' }); // Lê o conteúdo como uma planilha
        //Se ele encontra a pagina dados na planilha ele processa
        const sheetName = workbook.SheetNames.find(name => name === 'Dados'); // Encontra a aba 'Dados'
        if (sheetName) {
            const worksheet = workbook.Sheets[sheetName]; // Obtém a aba 'Dados'
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Converte a aba para JSON

            processFichaData(jsonData); // Processa a aba 'Dados'
            processSheetData(jsonData); // Processa a aba 'Pedidos'
        } else {
            document.getElementById('container-pedidos').innerHTML = '<p style="color: red;">A aba "Dados" não foi encontrada.</p>'; // Mensagem de erro se a aba não for encontrada
        }
    };
    reader.readAsArrayBuffer(file); // Lê o arquivo como um array buffer
}

// Função para processar a aba 'Dados' e armazenar os números de ficha formatados
function processFichaData(data) {
    fichaData = [];
    data.forEach(row => {
        const anoFiP = row[36]; // Coluna AK (índice 36)
        const ficFiP = row[37]; // Coluna AL (índice 37)
        const modelo = row[27]; // Coluna AB (índice 27)
        if (anoFiP && ficFiP && modelo) {
            fichaData.push({ fichaNumero: `${anoFiP}-${ficFiP}`, modelo }); // Adiciona o número de ficha e modelo à lista
        }
    });
}

// Função para processar os dados da planilha
function processSheetData(data) {
    pedidosData = {}; // Inicializa o objeto de dados dos pedidos
    data.forEach(row => {
        const [ , , pedido, modelo, quantidade, cor, quantidadeVol] = row; // Desestrutura os dados da linha
        if (pedido && modelo && quantidade && cor && quantidadeVol) { // Verifica se todos os dados estão presentes
            if (!pedidosData[pedido]) {
                pedidosData[pedido] = []; // Inicializa um array para o pedido se ainda não existir
            }
            pedidosData[pedido].push({ modelo, quantidade, cor, quantidadeVol }); // Adiciona o modelo ao pedido
        }
    });

    renderPedidos(); // Renderiza os pedidos
}

// Função para renderizar os botões dos pedidos
function renderPedidos() {
    if (Object.keys(pedidosData).length === 0) {
        document.getElementById('container-pedidos').innerHTML = '<p>Nenhum pedido encontrado.</p>'; // Mensagem se não houver pedidos
        return;
    }

    let html = '';
    for (const pedido in pedidosData) {
        if (pedido === 'PC17Pedido') continue; // Pula o pedido 'PC17Pedido'
        html += `<button class="pedido-btn" onclick="showModelos('${pedido}')">${pedido}</button>`; // Cria um botão para cada pedido
    }
    document.getElementById('container-pedidos').innerHTML = html; // Adiciona os botões ao container
}

// Função para exibir modelos do pedido em um popup com campo para número de ficha
function showModelos(pedidoNumero) {
    const modelos = pedidosData[pedidoNumero]; // Obtém os modelos do pedido
    let html = `<h3>Modelos do Pedido ${pedidoNumero}</h3><form id="modelos-form">`;

    // Adiciona os modelos ao formulário
    modelos.forEach(({ modelo, quantidade, cor, quantidadeVol }) => {
        html += `
            <div class="modelo-container">
                <input type="checkbox" id="${modelo}" name="${modelo}" onchange="toggleRiscado(this)">
                <label for="${modelo}">
                    ${modelo} ${quantidade} ${cor}: (${quantidadeVol} Pares)
                </label>
            </div>
        `;
    });

    // Adiciona o campo de entrada para o número de ficha
    html += `
        <div class="ficha-container">
            <label for="numero-ficha">Número da Ficha:</label>
            <input type="text" id="numero-ficha" name="numero-ficha" placeholder="Digite o número da ficha" onkeypress="handleKeyPress(event)">
        </div>
        <button type="button" onclick="confirmarFicha('${pedidoNumero}')">Confirmar Ficha</button>
    `;

    // Adiciona o botão de salvar
    html += '<button type="submit" onclick="salvarPedido(event, \'' + pedidoNumero + '\')">Salvar</button></form>';

    // Exibe o conteúdo no popup
    document.getElementById('popup-modelos').innerHTML = html; 
    document.getElementById('popup').style.display = 'flex'; 
}

// Função para lidar com a tecla Enter no campo de número de ficha
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Previne o comportamento padrão da tecla Enter
        const pedidoNumero = document.querySelector('#modelos-form button[type="submit"]').getAttribute('onclick').match(/'(.+?)'/)[1];
        confirmarFicha(pedidoNumero);
    }
}

// Função para confirmar o número da ficha e marcar os checkboxes correspondentes
function confirmarFicha(pedidoNumero) {
    // Obtém o número da ficha digitado
    const numeroFicha = document.getElementById('numero-ficha').value;

    // Verifica se o número da ficha digitado corresponde a algum número na matriz
    fichaData.forEach(({ fichaNumero, modelo }) => {
        if (fichaNumero === numeroFicha) {
            // Marca o checkbox do modelo correspondente, se ele existir no pedido
            pedidosData[pedidoNumero].forEach(({ modelo: pedidoModelo }) => {
                if (pedidoModelo === modelo) {
                    document.getElementById(pedidoModelo).checked = true;
                    toggleRiscado(document.getElementById(pedidoModelo)); // Atualiza a classe 'riscado'
                }
            });
        }
    });

    // Atualiza a cor do botão de pedido
    const checkboxes = document.querySelectorAll('#modelos-form input[type="checkbox"]');
    let todosSelecionados = true;

    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            todosSelecionados = false; // Define todosSelecionados como false se algum checkbox não estiver marcado
        }
    });

    // Obtém o botão do pedido correspondente
    const pedidoBtn = document.querySelector(`.pedido-btn[onclick="showModelos('${pedidoNumero}')"]`);

    // Se todos os checkboxes estiverem marcados, marca o pedido como salvo
    if (todosSelecionados) {
        pedidoBtn.classList.add('pedido-salvo'); // Verde para indicar que todos os modelos foram selecionados
    } else {
        pedidoBtn.style.backgroundColor = '#ff4c4c'; // Vermelho para indicar que nem todos os modelos foram selecionados
    }
}

// Função para alternar o estilo riscado do texto
function toggleRiscado(checkbox) {
    const label = checkbox.nextElementSibling; // Obtém o label associado ao checkbox
    if (checkbox.checked) {
        label.classList.add('riscado'); // Adiciona a classe 'riscado' se o checkbox estiver marcado
    } else {
        label.classList.remove('riscado'); // Remove a classe 'riscado' se o checkbox estiver desmarcado
    }
}

// Função para salvar o pedido quando todos os modelos são selecionados
function salvarPedido(event, pedidoNumero) {
    event.preventDefault(); // Previne o comportamento padrão do formulário

    // Obtém todos os checkboxes do formulário
    const checkboxes = document.querySelectorAll('#modelos-form input[type="checkbox"]');
    let todosSelecionados = true;

    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            todosSelecionados = false; // Define todosSelecionados como false se algum checkbox não estiver marcado
        }
    });

    // Obtém o botão do pedido correspondente
    const pedidoBtn = document.querySelector(`.pedido-btn[onclick="showModelos('${pedidoNumero}')"]`);

    // Se todos os checkboxes estiverem marcados, marca o pedido como salvo
    if (todosSelecionados) {
        pedidoBtn.classList.add('pedido-salvo'); // Verde para indicar que todos os modelos foram selecionados
    } else {
        pedidoBtn.style.backgroundColor = '#ff4c4c'; // Vermelho para indicar que nem todos os modelos foram selecionados
    }

    // Fecha o popup
    document.getElementById('popup').style.display = 'none';
}

// Adiciona um ouvinte de evento para fechar o popup quando o botão de fechar é clicado
document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none'; // Oculta o popup
});

// Adiciona um ouvinte de evento para fechar o popup quando se clica fora do popup
window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('popup')) {
        document.getElementById('popup').style.display = 'none'; // Oculta o popup
    }
});
