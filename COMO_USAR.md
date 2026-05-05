# Como configurar o site

## Passo 1 — Criar a planilha no Google Sheets

Crie uma planilha com as seguintes colunas (na primeira linha):

| Modelo | Categoria | Preco | Estoque |
|--------|-----------|-------|---------|
| iPhone 14 Pro | Apple | 4500 | 10 |
| Samsung S23 | Samsung | 3200 | 5 |
| Motorola G84 | Motorola | 1200 | 0 |

> As colunas podem estar em qualquer ordem. O site reconhece automaticamente.

---

## Passo 2 — Publicar a planilha

1. Abra a planilha no Google Sheets
2. Clique em **Arquivo** → **Compartilhar** → **Publicar na Web**
3. Selecione **Planilha 1** e formato **Valores separados por vírgula (.csv)**
4. Clique em **Publicar** e confirme
5. Copie o ID da planilha da URL (parte entre `/d/` e `/edit`)

Exemplo de URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       Este é o ID
```

---

## Passo 3 — Configurar o site

Abra o arquivo `app.js` e substitua na primeira linha:

```js
const SHEET_ID = 'SEU_ID_AQUI';
```

Pelo ID da sua planilha:

```js
const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
```

---

## Passo 4 — Publicar o site (gratuito)

### Opção A — GitHub Pages
1. Suba os arquivos para um repositório no GitHub
2. Vá em **Settings** → **Pages**
3. Selecione o branch `main` e clique em **Save**
4. O site fica disponível em `https://seu-usuario.github.io/nome-do-repo`

### Opção B — Vercel (mais fácil)
1. Acesse vercel.com e crie uma conta grátis
2. Conecte seu repositório GitHub
3. Pronto — site publicado automaticamente

---

## Como atualizar o estoque diariamente

Basta editar a planilha do Google Sheets. O site puxa os dados automaticamente sempre que o cliente abre a página.
