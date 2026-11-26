# Knucklebones Online

[![CI](https://github.com/claclarinete/Knucklebones/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/claclarinete/Knucklebones/actions/workflows/ci.yml)

Sistema web do jogo de dados **Knucklebones**, inspirado no minigame de *Cult of the Lamb*. Basta abrir o site para jogar contra outra pessoa online, contra o computador ou numa sala privada.

> **Status:** em desenvolvimento. A interface e a partida contra o bot funcionam; fila online e salas privadas estão em implementação. A publicação em produção ainda será feita.

## Integrantes

| Nome | GitHub | Responsabilidade |
|---|---|---|
| Clarice Oliveira Minobolli Teixeira | [@claclarinete](https://github.com/claclarinete) | Backend |
| José Gabriel Silva | [@Josejgs1](https://github.com/Josejgs1) | Frontend e deploy |

## Sobre o sistema

Funcionalidades planejadas:

- **Fila online:** o jogador entra na fila e é pareado com outra pessoa.
- **Contra o bot:** três níveis de dificuldade (fácil, médio e difícil).
- **Sala privada:** criar uma sala e convidar por código ou link.
- **Apelido opcional:** sem cadastro; quem não escolher um vira `Visitante-NNNN`.
- **Regras:** tela explicando como jogar, com exemplos de pontuação.

Não há contas, login, histórico de partidas nem banco de dados.

### Como se joga

Cada jogador tem um tabuleiro com 3 colunas de 3 espaços. Na sua vez, você recebe um dado e o coloca numa coluna com espaço. Todos os dados de mesmo valor na coluna correspondente do adversário são destruídos. Cada coluna vale a soma de `valor × quantidade²` para cada valor distinto. A partida acaba quando um dos tabuleiros enche, e vence quem tiver mais pontos.

## Tecnologias

| Tecnologia | Para que é usada |
|---|---|
| TypeScript | Linguagem do frontend e do backend, com checagem de tipos |
| React + Vite | Interface web e servidor de desenvolvimento/build |
| React Router | Navegação entre as telas |
| Node.js + Express | Servidor HTTP do backend |
| Socket.IO | Comunicação em tempo real durante a fila e a partida |
| Zod | Validação dos dados recebidos pelo backend |
| Vitest, Testing Library e Supertest | Testes de unidade e integração |
| Playwright | Testes de ponta a ponta no navegador |
| `@vitest/coverage-v8` | Medição de cobertura |
| GitHub Actions | CI em Linux, macOS e Windows |
| Render | Publicação do frontend e do backend |

## Como executar localmente

Pré-requisitos: Node.js 22 ou superior e npm.

```bash
# backend
cd backend
npm install
cp .env.example .env
npm run dev

# frontend (em outro terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend abre em `http://localhost:5173` e o backend em `http://localhost:3000`.

## Execução dos testes

Em `backend/` ou `frontend/`, depois de `npm install`:

```bash
npm test                 # testes de unidade e integração
npm run test:coverage    # os mesmos testes, com relatório de cobertura
```

A cobertura mínima é de **80%** em linhas, funções, ramos e instruções, e o comando falha abaixo disso. O relatório fica em `coverage/` (abra `coverage/index.html` no navegador).

### Testes de ponta a ponta

Os testes do Playwright ficam em `e2e/` e abrem o sistema num navegador de verdade. Eles sobem o backend (porta 3100) e o frontend (porta 5180) sozinhos, então basta ter rodado `npm install` em `backend/` e `frontend/`:

```bash
cd e2e
npm install
npx playwright install chromium   # só na primeira vez
npm test                          # roda os testes
npm run report                    # abre o relatório da última execução
```

Mais detalhes em [e2e/README.md](e2e/README.md).

O [CI](.github/workflows/ci.yml) executa tipos, lint, testes com cobertura, build e testes de ponta a ponta em Linux, macOS e Windows a cada commit. Em cada execução, o resumo da cobertura aparece na página do GitHub Actions e os relatórios completos ficam disponíveis como artefatos.

## Documentação

| Documento | Conteúdo |
|---|---|
| [Especificação](docs/README.md) | Regras, arquitetura, fluxos, testes e deploy |
| [Contrato do Socket.IO](docs/contrato-socket.md) | Eventos e dados trocados entre frontend e backend |
| [CI/CD e deploy](docs/ci-cd.md) | Pipeline, publicação e configuração do repositório |
| [Backlog](docs/backlog.md) | 30 histórias de usuário |
| [Protótipos](docs/prototipos/) | Telas do sistema e diferenças em relação ao escopo atual |
| [Guia de contribuição](CONTRIBUTING.md) | Issues, branches, commits, pull requests e testes |
| [Registro de uso de IA](docs/uso-de-ia.md) | Preenchido pela equipe |

## Estrutura do repositório

```
.
├── frontend/     # interface em React + Vite
├── backend/      # Socket.IO, regras do jogo, bot, salas e fila
├── e2e/          # testes Playwright
├── docs/         # especificação, contrato, backlog e protótipos
└── .github/      # CI e modelos de issue e pull request
```

## Uso de IA

Registrado pela equipe em [docs/uso-de-ia.md](docs/uso-de-ia.md).

## Aviso

Este é um projeto acadêmico que usa apenas a **mecânica** do Knucklebones. Nenhuma arte, ícone, som ou logo de *Cult of the Lamb* é usado. *Cult of the Lamb* é marca de seus respectivos donos.
