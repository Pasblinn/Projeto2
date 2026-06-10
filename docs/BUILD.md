# Build e Distribuicao

Como rodar o app em desenvolvimento e gerar o instalador Windows.

## Desenvolvimento (navegador)

```bash
npm install
npm run dev          # abre em http://localhost:5173
```

## Desenvolvimento (janela Electron)

Com o dev server rodando em outro terminal:

```bash
npm run dev          # terminal 1
npm run electron:dev # terminal 2 - abre a janela apontando para o dev server
```

## Build de producao (web)

```bash
npm run build        # type check + bundle em dist/
npm run preview      # serve o build localmente para conferencia
```

## Instalador Windows (Electron)

```bash
npm run electron:build
```

O comando roda o build web e em seguida o `electron-builder`, gerando o
instalador NSIS em `release/` (ex: `RJ Usinagem Setup 0.1.0.exe`).

> Para gerar instalador Windows a partir do Linux, o electron-builder usa
> Wine. Se o Wine nao estiver instalado, rode o comando em uma maquina
> Windows ou instale `wine` antes.

Configuracao do empacotamento: secao `build` do
[package.json](../package.json) (appId, icone, alvo NSIS, atalho na area
de trabalho e escolha de pasta de instalacao).

## Onde ficam os dados

O banco de dados eh local (ver [DATABASE.md](DATABASE.md)). No app
empacotado, o `localStorage` do Electron persiste em:

```
%APPDATA%/RJ Usinagem/   (Windows)
~/.config/RJ Usinagem/   (Linux)
```

Desinstalar o app NAO apaga essa pasta; faca backup dela ao migrar de
maquina.

## Checklist de release

1. `npm run build` sem erros de tipo.
2. Testar login e fluxo principal (`npm run preview`).
3. `npm run electron:build` e testar o instalador em `release/`.
4. Atualizar a versao em `package.json` (campo `version`).
