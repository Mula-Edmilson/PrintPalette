const fs = require('fs');
const path = require('path');

// URL da sua Google Sheet no formato CSV
const URL_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR6oL6e1nGnPBuBAdKaNre8thqvrtnEp-ld37t2Xe94BQYSXuhxSARO7J-jqRcD-T3JybiFH2E2d33q/pub?output=csv";

// Template básico para a página de produto
const productPageTemplate = (product) => `
<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <title>${product.nome} | Print Palette</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="${product.nome}">
    <meta property="og:description" content="${product.descricao}">
    <meta property="og:image" content="${product.imagens[0]}">
    <meta property="og:url" content="https://mula-edmilson.github.io/PrintPalette/produtos/${product.id}.html">
    <meta property="og:type" content="product">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>body { font-family: 'Inter', sans-serif; }</style>
    <meta http-equiv="refresh" content="0; url=../index.html?produto=${product.id}">
</head>
<body class="bg-gray-100 text-gray-800 p-8">
    <p>A carregar a página do produto...</p>
</body>
</html>
`;

async function generateProductPages() {
    console.log("A carregar dados da Google Sheet e a gerar páginas...");
    try {
        const res = await fetch(URL_SHEET);
        if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.statusText}`);
        const csv = await res.text();
        const linhas = csv.split("\n").filter(l => l.trim());
        const cabecalho = linhas.shift().split(",").map(h => h.trim().toLowerCase());

        const getIndex = (name) => cabecalho.indexOf(name.toLowerCase());
        const indices = {
            id: getIndex('id') || 'index',
            nome: getIndex('nome'),
            preco_desconto: getIndex('preco_desconto'),
            preco_original: getIndex('preco_original'),
            imagens: getIndex('imagens'),
            descricao: getIndex('descricao'),
            categoria: getIndex('categoria')
        };
        
        const dir = path.join(__dirname, 'produtos');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        linhas.forEach((linha, index) => {
            const dados = linha.split(",").map(d => d.trim());
            const precoOriginal = parseFloat(dados[indices.preco_original]) || 0;
            const precoDesconto = parseFloat(dados[indices.preco_desconto]);

            const product = {
                id: index, // Usamos o índice para garantir que cada produto tem um ID
                nome: dados[indices.nome] || 'Produto sem nome',
                preco: !isNaN(precoDesconto) && precoDesconto > 0 ? precoDesconto : precoOriginal,
                imagens: (dados[indices.imagens] || 'https://placehold.co/600x600').split(';').map(url => url.trim()).filter(url => url),
                descricao: dados[indices.descricao] || 'Sem descrição disponível.',
            };

            const fileName = path.join(dir, `${product.id}.html`);
            fs.writeFileSync(fileName, productPageTemplate(product), 'utf8');
        });

        console.log(`Processo concluído! Foram geradas ${linhas.length} páginas.`);

    } catch (error) {
        console.error("Falha ao gerar páginas:", error);
    }
}

generateProductPages();