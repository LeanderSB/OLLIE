// Adiciona um ouvinte de evento ao input de arquivo para manipular a seleção do arquivo
document.getElementById('upload-xlsx').addEventListener('change', handleFileSelect, false);

// Objeto para armazenar dados dos pedidos e modelos
let pedidosData = {};

// Função para lidar com a seleção do arquivo XLSX
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

        const sheetName = workbook.SheetNames.find(name => name === 'Dados'); // Encontra a aba 'Dados'
        if (sheetName) {
            const worksheet = workbook.Sheets[sheetName]; // Obtém a aba 'Dados'
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Converte a aba para JSON

            processSheetData(jsonData); // Processa os dados da planilha
        } else {
            document.getElementById('container-pedidos').innerHTML = '<p style="color: red;">A aba "Dados" não foi encontrada.</p>'; // Mensagem de erro se a aba não for encontrada
        }
    };
    reader.readAsArrayBuffer(file); // Lê o arquivo como um array buffer
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

// Função para exibir modelos do pedido em um popup
function showModelos(pedidoNumero) {
    const modelos = pedidosData[pedidoNumero]; // Obtém os modelos do pedido
    let html = `<h3>Modelos do Pedido ${pedidoNumero}</h3><form id="modelos-form">`;

    modelos.forEach(({ modelo, quantidade, cor, quantidadeVol }) => {
        html += `
            <div class="modelo-container">
                <input type="checkbox" id="${modelo}" name="${modelo}" onchange="toggleRiscado(this)">
                <label for="${modelo}">
                    ${modelo} (${quantidade} caixas) - Cor: ${cor}, Volumes: ${quantidadeVol}
                </label>
            </div>
        `;
    });

    html += '<button type="submit" onclick="salvarPedido(event, \'' + pedidoNumero + '\')">Salvar</button></form>';
    document.getElementById('popup-modelos').innerHTML = html; // Adiciona o conteúdo ao popup
    document.getElementById('popup').style.display = 'flex'; // Exibe o popup
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
    const checkboxes = document.querySelectorAll('#modelos-form input[type="checkbox"]'); // Obtém todos os checkboxes do formulário
    let todosSelecionados = true;

    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            todosSelecionados = false; // Define todosSelecionados como false se algum checkbox não estiver marcado
        }
    });

    if (todosSelecionados) {
        const pedidoBtn = document.querySelector(`.pedido-btn[onclick="showModelos('${pedidoNumero}')"]`); // Obtém o botão do pedido
        pedidoBtn.classList.add('pedido-salvo'); // Adiciona a classe 'pedido-salvo' ao botão
    }

    document.getElementById('popup').style.display = 'none'; // Oculta o popup
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
