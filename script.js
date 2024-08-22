// Adiciona um listener para o evento de mudança no input de arquivo
document.getElementById('upload-xlsx').addEventListener('change', handleFileSelect, false);

let pedidosData = []; // Armazena dados dos pedidos
let detalhesData = []; // Armazena dados dos detalhes

// Função para lidar com a seleção do arquivo
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Nenhum arquivo selecionado.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Verifica se a aba "Pedidos" existe
            const pedidosSheetName = workbook.SheetNames.find(name => name === 'Pedidos');
            // Verifica se a aba "Dados" existe
            const detalhesSheetName = workbook.SheetNames.find(name => name === 'Dados');

            if (pedidosSheetName) {
                const pedidosWorksheet = workbook.Sheets[pedidosSheetName];
                pedidosData = XLSX.utils.sheet_to_json(pedidosWorksheet);
                renderPedidos(); // Renderiza a tabela de pedidos
            } else {
                document.getElementById('tabela-pedidos').innerHTML = 'A aba "Pedidos" não foi encontrada.';
            }

            if (detalhesSheetName) {
                const detalhesWorksheet = workbook.Sheets[detalhesSheetName];
                detalhesData = XLSX.utils.sheet_to_json(detalhesWorksheet);
            } else {
                console.warn('A aba "Dados" não foi encontrada.');
            }
        } catch (error) {
            console.error('Erro ao processar o arquivo:', error);
            document.getElementById('tabela-pedidos').innerHTML = 'Ocorreu um erro ao processar o arquivo.';
        }
    };
    reader.readAsArrayBuffer(file);
}

// Função para renderizar a tabela de pedidos
function renderPedidos() {
    if (pedidosData.length === 0) {
        document.getElementById('tabela-pedidos').innerHTML = 'Nenhum pedido encontrado.';
        return;
    }

    let html = '<table><tr><th>Pedido</th></tr>';
    pedidosData.forEach(pedido => {
        html += `<tr><td><a href="#" onclick="showDetalhes(${pedido['PC17Pedido']})">${pedido['PC17Pedido']}</a></td></tr>`;
    });
    html += '</table>';
    document.getElementById('tabela-pedidos').innerHTML = html;
}

// Função para exibir detalhes do pedido no popup
function showDetalhes(pedidoNumero) {
    const detalhes = detalhesData.filter(item => item['PC17Pedido'] === pedidoNumero);

    if (detalhes.length === 0) {
        document.getElementById('popup-detalhes').innerHTML = 'Nenhum detalhe encontrado para este pedido.';
    } else {
        let html = '<table><tr><th>Modelo</th><th>Quantidade</th></tr>';
        detalhes.forEach(item => {
            html += `<tr><td>${item['PC17Modelo']}</td><td>${item['Qdade vol.']}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('popup-detalhes').innerHTML = html;
    }

    document.getElementById('popup').style.display = 'flex'; // Exibe o popup
}

// Adiciona um listener para o botão de fechar do popup
document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none'; // Oculta o popup
});

// Adiciona um listener para clicar fora do popup para fechar
window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('popup')) {
        document.getElementById('popup').style.display = 'none'; // Oculta o popup
    }
});
