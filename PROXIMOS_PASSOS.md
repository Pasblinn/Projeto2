# Proximos Passos - Implantacao

Checklist para colocar o sistema em uso na RJ Usinagem.

## Implantacao inicial

- [ ] Gerar o instalador Windows: `npm run electron:build`
      (ver [docs/BUILD.md](docs/BUILD.md)).
- [ ] Instalar o app na maquina da empresa.
- [ ] Fazer o primeiro login com os usuarios padrao
      (ver [MANUAL_USUARIO.md](MANUAL_USUARIO.md)).
- [ ] Trocar as senhas padrao dos tres usuarios.
- [ ] Cadastrar as primeiras OPs e orcamentos reais.

## Rotina recomendada

- [ ] Backup semanal do banco local (chave `rjusinagem.db.v1`,
      instrucoes em [docs/DATABASE.md](docs/DATABASE.md)).
- [ ] Conferencia mensal do relatorio Resumo Financeiro.
- [ ] Impressao da Ficha de OP ao finalizar cada ordem.

## Melhorias futuras (fora do escopo atual)

- Tela de administracao de usuarios (criar/editar/desativar pelo app).
- Exportacao/importacao de backup com um clique (sem DevTools).
- Graficos no dashboard financeiro (evolucao mensal).
- Numeracao de NF integrada ao emissor oficial (hoje o controle eh
  interno, apenas para organizacao).
- Multiplas maquinas com sincronizacao (exigiria voltar a um backend
  remoto; decisao atual eh banco 100% local).

## Limitacoes conhecidas

- Os dados vivem no `localStorage` da maquina: sem backup, a perda do
  perfil do usuario do sistema operacional perde os dados.
- Um unico computador por vez; nao ha acesso simultaneo em rede.
- A emissao de NF eh um registro interno, nao integra com SEFAZ.
