// Adiciona um ouvinte de evento ao input de arquivo para manipular a seleção do arquivo
document.getElementById('upload-xlsx').addEventListener('change', handleFileSelect, false);

// Objeto para armazenar dados dos pedidos e modelos
let pedidosData = {};
let fichaData = []; // Para armazenar os números de ficha formatados

// Função para lidar com a seleção do arquivo XLSX
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Nenhum arquivo selecionado.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames.find(name => name === 'Dados');
        if (sheetName) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            processFichaData(jsonData); // Processa a aba 'Dados'
            processSheetData(jsonData); // Processa a aba 'Pedidos'
        } else {
            document.getElementById('container-pedidos').innerHTML = '<p style="color: red;">A aba "Dados" não foi encontrada.</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

// Função para processar a aba 'Dados' e armazenar os números de ficha formatados
function processFichaData(data) {
    fichaData = [];
    data.forEach(row => {
        const anoFiP = row[36]; // Coluna AK (índice 36)
        const ficFiP = row[37]; // Coluna AL (índice 37)
        const modelo = row[27]; // Coluna AB (índice 27)
        const cor = row[28]; // Coluna AC (índice 28)
        if (anoFiP && ficFiP && modelo && cor) {
            fichaData.push({ fichaNumero: `${anoFiP}-${ficFiP}`, modelo: String(modelo).trim(), cor: String(cor).trim() });
        }
    });
}

// Função para processar os dados da planilha
function processSheetData(data) {
    pedidosData = {};
    data.forEach(row => {
        const [ , , pedido, modelo, quantidade, cor, quantidadeVol] = row;
        if (pedido && modelo && quantidade && cor && quantidadeVol) {
            if (!pedidosData[pedido]) {
                pedidosData[pedido] = [];
            }
            pedidosData[pedido].push({ modelo: String(modelo).trim(), quantidade, cor: String(cor).trim(), quantidadeVol });
        }
    });

    renderPedidos();
}

// Função para renderizar os botões dos pedidos
function renderPedidos() {
    if (Object.keys(pedidosData).length === 0) {
        document.getElementById('container-pedidos').innerHTML = '<p>Nenhum pedido encontrado.</p>';
        return;
    }

    let html = '';
    for (const pedido in pedidosData) {
        if (pedido === 'PC17Pedido') continue; // Pula o pedido 'PC17Pedido'
        html += `<button class="pedido-btn" onclick="showModelos('${pedido}')">${pedido}</button>`;
    }
    document.getElementById('container-pedidos').innerHTML = html;
}

// Função para exibir modelos do pedido em um popup com campo para número de ficha
function showModelos(pedidoNumero) {
    const modelos = pedidosData[pedidoNumero];
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
    html += `<button type="submit" onclick="salvarPedido(event, '${pedidoNumero}')">Salvar</button></form>`;

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
    const numeroFicha = document.getElementById('numero-ficha').value.trim();
    console.log('Número da Ficha inserido:', numeroFicha); // Debug: Mostra o número da ficha inserido

    // Limpa a seleção anterior
    const checkboxes = document.querySelectorAll('#modelos-form input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false; // Desmarca todos os checkboxes
        toggleRiscado(checkbox); // Remove a classe 'riscado'
    });

    // Procura a ficha digitada na aba 'Dados'
    const fichaEncontrada = fichaData.find(({ fichaNumero }) => fichaNumero === numeroFicha);
    console.log('Ficha encontrada:', fichaEncontrada); // Debug: Mostra a ficha encontrada ou undefined

    if (fichaEncontrada) {
        const { modelo, cor } = fichaEncontrada;
        console.log('Modelo e Cor da ficha encontrada:', modelo, cor); // Debug: Mostra o modelo e a cor encontrados

        // Marca os checkboxes correspondentes no popup
        let checkboxEncontrado = false;
        pedidosData[pedidoNumero].forEach(({ modelo: pedidoModelo, cor: pedidoCor }) => {
            console.log('Verificando modelo e cor no pedido:', pedidoModelo, pedidoCor); // Debug: Mostra cada modelo e cor no pedido
            if (pedidoModelo === modelo && pedidoCor === cor) {
                const checkbox = document.getElementById(pedidoModelo);
                if (checkbox) {
                    checkbox.checked = true; // Marca o checkbox correspondente
                    toggleRiscado(checkbox); // Atualiza a classe 'riscado'
                    checkboxEncontrado = true;
                    console.log('Checkbox marcado para modelo:', pedidoModelo); // Debug: Confirma que o checkbox foi marcado
                }
            }
        });

        if (!checkboxEncontrado) {
            console.warn('Nenhum checkbox correspondente foi encontrado para a ficha.'); // Debug: Se nenhum checkbox foi marcado
        }
    } else {
        alert("Ficha não encontrada.");
    }

    // Limpa o campo de entrada para o número da ficha
    document.getElementById('numero-ficha').value = '';

    // Atualiza a cor do botão de pedido
    const checkboxesAfter = document.querySelectorAll('#modelos-form input[type="checkbox"]');
    let todosSelecionados = true;

    checkboxesAfter.forEach(checkbox => {
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
        label.classList.remove('riscado'); // Remove a classe 'riscado' se o checkbox não estiver marcado
    }
}

// Função para fechar o popup
function closePopup() {
    document.getElementById('popup').style.display = 'none'; // Esconde o popup
}

// Função para salvar os dados do pedido e marcar o botão do pedido como salvo
function salvarPedido(event, pedidoNumero) {
    event.preventDefault();

    // Adiciona a classe 'pedido-salvo' ao botão do pedido correspondente
    const pedidoBtn = document.querySelector(`.pedido-btn[onclick="showModelos('${pedidoNumero}')"]`);
    pedidoBtn.classList.add('pedido-salvo');

    closePopup(); // Fecha o popup após salvar
}
