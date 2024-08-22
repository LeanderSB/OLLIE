document.getElementById('upload-xlsx').addEventListener('change', handleFileSelect, false);

let pedidosData = {}; // Armazena dados dos pedidos e modelos

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

            processSheetData(jsonData);
        } else {
            document.getElementById('container-pedidos').innerHTML = '<p style="color: red;">A aba "Dados" não foi encontrada.</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

function processSheetData(data) {
    pedidosData = {};
    data.forEach(row => {
        const [ , , pedido, modelo, quantidade, cor, quantidadeVol] = row;
        if (pedido && modelo && quantidade && cor && quantidadeVol) {
            if (!pedidosData[pedido]) {
                pedidosData[pedido] = [];
            }
            pedidosData[pedido].push({ modelo, quantidade, cor, quantidadeVol });
        }
    });

    renderPedidos();
}

function renderPedidos() {
    if (Object.keys(pedidosData).length === 0) {
        document.getElementById('container-pedidos').innerHTML = '<p>Nenhum pedido encontrado.</p>';
        return;
    }

    let html = '';
    for (const pedido in pedidosData) {
        if (pedido === 'PC17Pedido') continue; // Remove o pedido 'PC17Pedido'
        html += `<button class="pedido-btn" onclick="showModelos('${pedido}')">${pedido}</button>`;
    }
    document.getElementById('container-pedidos').innerHTML = html;
}

function showModelos(pedidoNumero) {
    const modelos = pedidosData[pedidoNumero];
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
    document.getElementById('popup-modelos').innerHTML = html;
    document.getElementById('popup').style.display = 'flex';
}

function toggleRiscado(checkbox) {
    const label = checkbox.nextElementSibling;
    if (checkbox.checked) {
        label.classList.add('riscado');
    } else {
        label.classList.remove('riscado');
    }
}

function salvarPedido(event, pedidoNumero) {
    event.preventDefault();
    const checkboxes = document.querySelectorAll('#modelos-form input[type="checkbox"]');
    let todosSelecionados = true;

    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            todosSelecionados = false;
        }
    });

    if (todosSelecionados) {
        const pedidoBtn = document.querySelector(`.pedido-btn[onclick="showModelos('${pedidoNumero}')"]`);
        pedidoBtn.classList.add('pedido-salvo');
    }

    document.getElementById('popup').style.display = 'none';
}

document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('popup')) {
        document.getElementById('popup').style.display = 'none';
    }
});

