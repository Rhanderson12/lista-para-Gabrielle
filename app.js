// =============================================
// CONFIGURAÇÃO — edite aqui
// =============================================

// Cole aqui o ID da sua planilha do Google Sheets
// Exemplo: se a URL for https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
// o ID é: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
const SHEET_ID = 'SEU_ID_AQUI';

// Número de WhatsApp (somente números, com DDD e código do país)
const WHATSAPP_NUMERO = '5583986130800';

// =============================================

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

let todosProdutos = [];
let carrinho = [];

// =============================================
// INICIALIZAÇÃO
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
});

async function carregarProdutos() {
  const loading = document.getElementById('loading');
  const erroDiv = document.getElementById('erro');
  const grid = document.getElementById('produtosGrid');

  loading.style.display = 'block';
  erroDiv.style.display = 'none';
  grid.innerHTML = '';

  try {
    const resp = await fetch(SHEET_URL);
    if (!resp.ok) throw new Error('Erro ao buscar planilha');
    const csv = await resp.text();
    todosProdutos = parsearCSV(csv);
    preencherCategorias();
    renderizarProdutos(todosProdutos);
  } catch (e) {
    erroDiv.style.display = 'block';
  } finally {
    loading.style.display = 'none';
  }
}

// =============================================
// PARSER CSV
// =============================================

function parsearCSV(csv) {
  const linhas = csv.trim().split('\n');
  if (linhas.length < 2) return [];

  // Cabeçalho esperado: Modelo, Categoria, Preco, Estoque
  // (case-insensitive, aceita variações)
  const cabecalho = linhas[0].split(',').map(c => c.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, ''));

  const idx = {
    modelo:    encontrarColuna(cabecalho, ['modelo', 'nome', 'produto', 'aparelho']),
    categoria: encontrarColuna(cabecalho, ['categoria', 'marca', 'tipo']),
    preco:     encontrarColuna(cabecalho, ['preco', 'valor', 'price']),
    estoque:   encontrarColuna(cabecalho, ['estoque', 'quantidade', 'qtd', 'qty', 'stock']),
  };

  return linhas.slice(1)
    .map(linha => {
      const cols = splitCSVLinha(linha);
      const modelo = cols[idx.modelo]?.trim() || '';
      if (!modelo) return null;

      const estoqueRaw = parseInt(cols[idx.estoque]?.trim()) || 0;
      const precoRaw = parseFloat(
        (cols[idx.preco]?.trim() || '0')
          .replace('R$', '').replace(/\./g, '').replace(',', '.')
      ) || 0;

      return {
        modelo,
        categoria: cols[idx.categoria]?.trim() || 'Geral',
        preco: precoRaw,
        estoque: estoqueRaw,
      };
    })
    .filter(Boolean);
}

function encontrarColuna(cabecalho, opcoes) {
  for (const op of opcoes) {
    const i = cabecalho.findIndex(c => c.includes(op));
    if (i !== -1) return i;
  }
  return opcoes[0] === 'modelo' ? 0 : -1;
}

function splitCSVLinha(linha) {
  const resultado = [];
  let dentro = false;
  let campo = '';
  for (const ch of linha) {
    if (ch === '"') { dentro = !dentro; continue; }
    if (ch === ',' && !dentro) { resultado.push(campo); campo = ''; continue; }
    campo += ch;
  }
  resultado.push(campo);
  return resultado;
}

// =============================================
// RENDERIZAÇÃO
// =============================================

function preencherCategorias() {
  const sel = document.getElementById('categoriaSelect');
  const cats = [...new Set(todosProdutos.map(p => p.categoria))].sort();
  sel.innerHTML = '<option value="">Todas as categorias</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function filtrarProdutos() {
  const busca = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('categoriaSelect').value;

  const filtrados = todosProdutos.filter(p => {
    const matchBusca = p.modelo.toLowerCase().includes(busca);
    const matchCat = !cat || p.categoria === cat;
    return matchBusca && matchCat;
  });

  renderizarProdutos(filtrados);
}

function renderizarProdutos(produtos) {
  const grid = document.getElementById('produtosGrid');
  grid.innerHTML = '';

  if (produtos.length === 0) {
    grid.innerHTML = '<p class="sem-resultados">Nenhum produto encontrado.</p>';
    return;
  }

  produtos.forEach((p, i) => {
    const semEstoque = p.estoque === 0;
    const estoqueClass = p.estoque === 0 ? 'sem-estoque' : p.estoque <= 5 ? 'baixo' : '';
    const estoqueTexto = p.estoque === 0 ? 'Sem estoque' : p.estoque <= 5 ? `Apenas ${p.estoque} em estoque` : `${p.estoque} em estoque`;

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <span class="produto-categoria">${p.categoria}</span>
      <p class="produto-nome">${p.modelo}</p>
      ${p.preco > 0 ? `<p class="produto-preco">R$ ${p.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>` : ''}
      <p class="produto-estoque ${estoqueClass}">${estoqueTexto}</p>
      <div class="qtd-wrapper">
        <label>Qtd:</label>
        <input class="qtd-input" type="number" id="qtd_${i}" min="1" max="${p.estoque || 1}" value="1" ${semEstoque ? 'disabled' : ''} />
      </div>
      <button class="add-btn" ${semEstoque ? 'disabled' : ''} onclick="adicionarAoCarrinho(${i})">
        ${semEstoque ? 'Indisponível' : '+ Adicionar'}
      </button>
    `;
    grid.appendChild(card);
  });
}

// =============================================
// CARRINHO
// =============================================

function adicionarAoCarrinho(indexFiltrado) {
  const busca = document.getElementById('searchInput').value.toLowerCase();
  const cat = document.getElementById('categoriaSelect').value;
  const filtrados = todosProdutos.filter(p => {
    return p.modelo.toLowerCase().includes(busca) && (!cat || p.categoria === cat);
  });

  const produto = filtrados[indexFiltrado];
  const qtd = parseInt(document.getElementById(`qtd_${indexFiltrado}`).value) || 1;

  const existente = carrinho.find(i => i.modelo === produto.modelo);
  if (existente) {
    existente.qtd += qtd;
  } else {
    carrinho.push({ modelo: produto.modelo, categoria: produto.categoria, preco: produto.preco, qtd });
  }

  atualizarContadorCarrinho();
  mostrarFeedback(indexFiltrado);
}

function atualizarContadorCarrinho() {
  const total = carrinho.reduce((s, i) => s + i.qtd, 0);
  document.getElementById('cartCount').textContent = total;
}

function mostrarFeedback(idx) {
  const btn = document.querySelectorAll('.add-btn')[idx];
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = '✓ Adicionado!';
  btn.style.background = '#2e7d32';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
  }, 1200);
}

function abrirCarrinho() {
  document.getElementById('modalCarrinho').style.display = 'flex';
  renderizarCarrinho();
}

function fecharCarrinho() {
  document.getElementById('modalCarrinho').style.display = 'none';
}

function renderizarCarrinho() {
  const lista = document.getElementById('listaCarrinho');
  const totalItens = document.getElementById('totalItens');

  if (carrinho.length === 0) {
    lista.innerHTML = '<p class="carrinho-vazio">Seu carrinho está vazio.</p>';
    totalItens.textContent = '0';
    return;
  }

  const total = carrinho.reduce((s, i) => s + i.qtd, 0);
  totalItens.textContent = total;

  lista.innerHTML = carrinho.map((item, i) => `
    <div class="item-carrinho">
      <div class="item-info">
        <p class="item-nome">${item.modelo}</p>
        <p class="item-qtd">Quantidade: ${item.qtd}${item.preco > 0 ? ` · R$ ${(item.preco * item.qtd).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : ''}</p>
      </div>
      <button class="item-remover" onclick="removerItem(${i})">✕</button>
    </div>
  `).join('');
}

function removerItem(i) {
  carrinho.splice(i, 1);
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

function limparCarrinho() {
  carrinho = [];
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

// =============================================
// WHATSAPP
// =============================================

function enviarWhatsApp() {
  if (carrinho.length === 0) return;

  let mensagem = '🛒 *Olá! Gostaria de fazer um pedido:*\n\n';

  carrinho.forEach(item => {
    mensagem += `• *${item.modelo}* — Qtd: ${item.qtd}`;
    if (item.preco > 0) {
      mensagem += ` (R$ ${(item.preco * item.qtd).toLocaleString('pt-BR', {minimumFractionDigits: 2})})`;
    }
    mensagem += '\n';
  });

  const totalQtd = carrinho.reduce((s, i) => s + i.qtd, 0);
  mensagem += `\n📦 Total de itens: ${totalQtd}`;

  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// Fechar modal clicando fora
document.getElementById('modalCarrinho').addEventListener('click', function(e) {
  if (e.target === this) fecharCarrinho();
});
