# Knucklebones Online

Sistema web do jogo de dados **Knucklebones**, inspirado no minigame de *Cult of the Lamb*. Os jogadores criam uma conta, jogam contra o computador ou contra outra pessoa online em tempo real e acompanham o histórico das suas partidas.

> **Status:** em desenvolvimento. A documentação de requisitos e arquitetura está pronta; o código do frontend e do backend ainda está sendo criado.

---

## Funcionalidades

- **Conta:** cadastro, login e logout.
- **Partida contra o bot:** três níveis de dificuldade (fácil, médio e difícil).
- **Multiplayer online:** criar uma sala, convidar um amigo por código ou link e jogar em tempo real.
- **Histórico:** partidas jogadas e estatísticas (vitórias, derrotas, empates e maior pontuação).
- **Regras:** tela explicando como jogar, com exemplos de pontuação.

## Como se joga (resumo)

Cada jogador tem um tabuleiro com 3 colunas de 3 espaços. Na sua vez, você recebe um dado e o coloca numa coluna com espaço. Todos os dados de mesmo valor na coluna correspondente do adversário são destruídos. Cada coluna vale a soma de `valor × quantidade²` para cada valor distinto. A partida acaba quando um dos tabuleiros enche, e vence quem tiver mais pontos.

As regras completas estão em [docs/README.md](docs/README.md#2-regras-do-jogo).

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [Especificação do sistema](docs/README.md) | Regras, arquitetura, stack, API REST, eventos do Socket.IO, modelo de dados, fluxos, user stories, testes e deploy |
| [Protótipos](docs/prototipos/) | Telas do sistema (veja a lista abaixo) |
| [Guia de contribuição](CONTRIBUTING.md) | Branches, commits, pull requests e definição de pronto |
| [Registro de uso de IA](docs/uso-de-ia.md) | Como as ferramentas de IA foram usadas no projeto |

### Protótipos

| Tela | Arquivo |
|---|---|
| Login | [Login.png](docs/prototipos/Login.png) |
| Cadastro | [Cadastro.png](docs/prototipos/Cadastro.png) |
| Lobby | [Lobby.png](docs/prototipos/Lobby.png) |
| Sala de espera | [Sala de espera.png](<docs/prototipos/Sala de espera.png>) |
| Partida | [Partida.png](docs/prototipos/Partida.png) |
| Adversário desconectado | [Adversário desconectado.png](<docs/prototipos/Adversário desconectado.png>) |
| Fim de partida | [Fim de partida.png](<docs/prototipos/Fim de partida.png>) |
| Histórico e estatísticas | [Histórico e estatísticas.png](<docs/prototipos/Histórico e estatísticas.png>) |
| Regras | [Regras.png](docs/prototipos/Regras.png) |
| Componentes | [Barra superior](<docs/prototipos/Barra superior.png>), [Dado](docs/prototipos/Dado.png), [Cenário de fundo](<docs/prototipos/Cenário de fundo.png>) |

---

## Arquitetura

Frontend e backend são separados, cada um com seu próprio deploy, e ficam neste mesmo repositório.

```mermaid
flowchart LR
    U[Navegador] --> F[Frontend<br/>React + Vite]
    F -- HTTP / REST --> B[Backend<br/>Node + Express]
    F <-- Socket.IO --> B
    B --> DB[(PostgreSQL)]
```

- O **backend é a autoridade da partida**: rola os dados, valida as jogadas, executa o bot e salva os resultados. O frontend só exibe o estado e envia as intenções do jogador.
- **REST** para ações pontuais (cadastro, login, histórico) e **Socket.IO** para a partida em tempo real.
- Autenticação com **JWT**, enviado no cabeçalho `Authorization` e no *handshake* do Socket.IO.

Detalhes em [docs/README.md](docs/README.md#3-arquitetura).

## Stack

| Parte | Tecnologia |
|---|---|
| Linguagem | TypeScript |
| Frontend | React, Vite, React Router, `socket.io-client` |
| Backend | Node.js, Express, Socket.IO |
| Banco de dados | PostgreSQL com Drizzle ORM (PGlite nos testes) |
| Autenticação e validação | JWT, `bcryptjs`, Zod |
| Testes | Vitest, `supertest`, Playwright, `@vitest/coverage-v8` |
| CI | GitHub Actions (Linux, macOS e Windows) |
| Deploy | Vercel ou Netlify (frontend), Render (backend), Neon (banco) |

## Estrutura do repositório

```
.
├── frontend/             # interface em React + Vite
├── backend/              # API REST, Socket.IO, regras do jogo e bot
├── e2e/                  # testes Playwright
├── docs/                 # especificação, protótipos e registro de uso de IA
└── .github/              # CI e modelo de pull request
```

A estrutura interna de cada pasta está descrita em [docs/README.md](docs/README.md#5-estrutura-do-repositório).

---

## Como executar localmente

> Os passos abaixo descrevem o fluxo planejado e serão atualizados conforme o `frontend/` e o `backend/` forem criados.

### Pré-requisitos

- Node.js 22 LTS ou superior e npm
- Um banco PostgreSQL (local ou um banco gratuito no Neon)

### Variáveis de ambiente

**backend/.env**

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL | `postgres://user:senha@localhost:5432/knucklebones` |
| `JWT_SECRET` | Segredo usado para assinar os tokens | uma string longa e aleatória |
| `FRONTEND_URL` | Endereço do frontend, liberado no CORS | `http://localhost:5173` |

**frontend/.env**

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | Endereço da API REST | `http://localhost:3000` |
| `VITE_SOCKET_URL` | Endereço do servidor Socket.IO | `http://localhost:3000` |

Nunca faça commit de arquivos `.env`. Cada pasta terá um `.env.example` para servir de modelo.

### Rodando

```bash
# backend
cd backend
npm install
npm run dev

# frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## Testes

```bash
npm test                 # testes de unidade e integração (Vitest), em frontend/ ou backend/
npm run test:coverage    # mesmo conjunto, com relatório de cobertura
npx playwright test      # testes E2E, em e2e/
```

A meta é cobertura mínima de **80%**, verificada pelo CI em Linux, macOS e Windows. Os testes usam uma semente fixa para o dado, para não dependerem de sorte. Mais detalhes em [docs/README.md](docs/README.md#11-testes).

## Deploy

| Parte | Onde |
|---|---|
| Frontend | Vercel ou Netlify |
| Backend | Render |
| Banco | Neon |

Configuração das variáveis em cada serviço: [docs/README.md](docs/README.md#12-deploy).

---

## Uso de IA

O projeto usa ferramentas de IA como apoio ao desenvolvimento. Cada uso relevante é registrado em [docs/uso-de-ia.md](docs/uso-de-ia.md), com a ferramenta, a tarefa e como o resultado foi revisado.

## Equipe

| Nome | GitHub |
|---|---|
| _a preencher_ | _a preencher_ |

## Aviso

Este é um projeto acadêmico que usa apenas a **mecânica** do Knucklebones. Nenhuma arte, ícone, som ou logo de *Cult of the Lamb* é usado. *Cult of the Lamb* é marca de seus respectivos donos.
