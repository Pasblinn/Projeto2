# Banco de Dados Local (PostgreSQL)

O sistema usa um banco **PostgreSQL local**, embutido no proprio app via
[PGlite](https://pglite.dev) — o engine oficial do Postgres compilado
para WASM. Nao ha backend remoto nem servico para instalar: o banco
roda dentro do aplicativo e os dados ficam persistidos na maquina
(IndexedDB, chave `/pglite/rjusinagem`).

## Como funciona

Toda a persistencia passa por [src/services/db.ts](../src/services/db.ts):

- Na primeira execucao o schema SQL eh criado (`CREATE TABLE IF NOT
  EXISTS ...`), com chaves primarias, `FOREIGN KEY ... ON DELETE
  CASCADE` e valores default.
- Os services fazem consultas SQL parametrizadas (`SELECT`, `INSERT ...
  RETURNING`, `UPDATE`, `DELETE`).
- Numeradores sequenciais (codigo de orcamento, numero de NF) usam a
  tabela `counters` com `INSERT ... ON CONFLICT DO UPDATE` atomico.
- O codigo da OP (`OP-ANO-NNNN`) eh derivado de um `COUNT(*)` por ano,
  espelhando a funcao `gerar_codigo_op()` do sistema oficial.

## Tabelas

| Tabela | Descricao |
|--------|-----------|
| `users` | Usuarios locais (email, nome, role, hash da senha) |
| `ordens_producao` | OPs completas (material, cliente, peca, precos, aprovacao, setup) |
| `registros_producao` | Producao diaria por OP (turno, horario, operacao) — FK cascade |
| `registros_defeito` | Defeitos com causa provavel e acao corretiva — FK cascade |
| `orcamentos` | Orcamentos com conversao para OP |
| `movimentos_financeiros` | Ledger de pagamentos, estornos, ajustes e custos — FK cascade |
| `notas_fiscais` | Notas emitidas por OP — FK cascade |
| `counters` | Sequenciais (orcamento, NF) |

## Autenticacao local

A autenticacao eh gerenciada por [src/services/auth.ts](../src/services/auth.ts):

- Senhas armazenadas como hash SHA-256 na tabela `users`.
- A sessao ativa eh um ponteiro para o usuario logado, guardada em
  `localStorage` (`rjusinagem.session.v1`).

### Usuarios padrao (primeiro acesso)

Na primeira execucao a tabela `users` eh semeada com tres usuarios:

| E-mail | Senha | Papel |
|--------|-------|-------|
| `admin@rjusinagem.com.br` | `admin123` | Dono (acesso total) |
| `encarregado@rjusinagem.com.br` | `encarregado123` | Encarregado |
| `operador@rjusinagem.com.br` | `operador123` | Operador |

> Troque as senhas padrao apos o primeiro acesso em ambiente real.

## Onde os dados ficam

- **Navegador (dev)**: IndexedDB do site (`/pglite/rjusinagem`).
- **App desktop (Electron)**: IndexedDB do perfil do app —
  `~/.config/RJ Usinagem/` no Linux, `%APPDATA%/RJ Usinagem/` no Windows.

Desinstalar o app NAO apaga essa pasta; faca backup dela ao migrar de
maquina.

## Limpando os dados

Para resetar o sistema ao estado inicial (DevTools / console):

```js
indexedDB.deleteDatabase('/pglite/rjusinagem')
localStorage.removeItem('rjusinagem.session.v1')
location.reload()
```

## Troubleshooting

**Login retorna "E-mail ou senha invalidos"** -> confira os usuarios
padrao acima; o seed de usuarios so roda quando a tabela esta vazia.

**Dados sumiram apos limpar dados de navegacao** -> o IndexedDB eh
apagado junto com os dados do site. Faca backup da pasta do app antes.
