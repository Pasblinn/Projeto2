# Banco de Dados Local

O sistema usa um banco de dados **local apenas**, persistido via
`localStorage` do navegador (ou do Electron, quando empacotado como
desktop app). Nao ha backend remoto: todos os dados ficam na maquina
onde o app roda.

## Como funciona

Toda a persistencia passa por [src/services/db.ts](../src/services/db.ts):

- Os dados ficam em uma unica chave `rjusinagem.db.v1`, gravada de forma
  atomica a cada escrita (snapshot completo).
- Cada colecao eh um array de objetos com `id` (UUID v4 via
  `crypto.randomUUID`).
- Numeradores sequenciais (numero da OP, codigo de orcamento) ficam em
  `counters`, incrementados de forma centralizada.

## Colecoes

| Colecao | Descricao |
|---------|-----------|
| `users` | Usuarios locais (email, nome, role, hash da senha) |
| `ordens_producao` | OPs com status de producao e financeiro |
| `registros_producao` | Registros diarios de producao por turno |
| `registros_defeito` | Defeitos com causa provavel e acao corretiva |
| `orcamentos` | Orcamentos com conversao para OP |
| `movimentos_financeiros` | Ledger de pagamentos, estornos e ajustes |

## Autenticacao local

A autenticacao eh gerenciada por [src/services/auth.ts](../src/services/auth.ts):

- Senhas sao armazenadas como hash SHA-256 (protecao contra inspecao
  casual; adequado para implantacao offline em maquina unica).
- A sessao ativa eh um ponteiro para o usuario logado na chave
  `rjusinagem.session.v1`.

### Usuarios padrao (primeiro acesso)

Na primeira execucao o banco eh semeado com tres usuarios:

| E-mail | Senha | Papel |
|--------|-------|-------|
| `admin@rjusinagem.com.br` | `admin123` | Financeiro (acesso total) |
| `chefe@rjusinagem.com.br` | `chefe123` | Chefe de Producao |
| `operador@rjusinagem.com.br` | `operador123` | Operador |

> Troque as senhas padrao apos o primeiro acesso em ambiente real.

## Papeis e permissoes

| Papel | Permissoes |
|-------|-----------|
| `financeiro` | Acesso total: OPs, producao, financeiro e relatorios |
| `chefe` | OPs, aprovacao e registro de producao |
| `operador` | Visualiza OPs e atualiza status de producao |

## Backup e restauracao

Como os dados vivem no `localStorage`, o backup eh feito exportando a
chave `rjusinagem.db.v1`:

```js
// Backup (console do navegador / DevTools do Electron)
copy(localStorage.getItem('rjusinagem.db.v1'))

// Restauracao
localStorage.setItem('rjusinagem.db.v1', '<conteudo do backup>')
```

## Limpando os dados

Para resetar o sistema ao estado inicial (inclusive usuarios padrao):

```js
localStorage.removeItem('rjusinagem.db.v1')
localStorage.removeItem('rjusinagem.session.v1')
```

## Troubleshooting

**Login retorna "E-mail ou senha invalidos"** -> confira os usuarios padrao
acima; o seed so roda quando a colecao `users` esta vazia.

**Dados sumiram apos limpar dados de navegacao** -> o `localStorage` eh
apagado junto com os dados do site. Use o backup acima antes de limpar.
