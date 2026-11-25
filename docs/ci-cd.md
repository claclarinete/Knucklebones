# CI/CD e deploy

Este guia descreve o que será configurado depois da implementação (histórias US26 a US30). Os arquivos citados aqui ainda não existem no repositório.

## Integração contínua (GitHub Actions)

Arquivo previsto: `.github/workflows/ci.yml`, executado a cada `push` e `pull_request`.

| Job | Sistemas | Passos |
|---|---|---|
| Backend e frontend | Linux, macOS e Windows | `npm ci`, `npm run typecheck`, `npm run lint` (frontend), `npm run test:coverage`, `npm run build` |
| E2E | Linux, macOS e Windows | instalar os três projetos, instalar o Chromium do Playwright e rodar `npm test` em `e2e/` |
| `ci-ok` | Linux | falha se algum job anterior falhar |

- A versão do Node fica em um arquivo `.nvmrc` na raiz.
- A cobertura mínima é de 80% em linhas, funções, ramos e instruções. A configuração do Vitest já aplica esse limite.
- Os relatórios de cobertura e do Playwright são publicados como artefatos.
- Execuções antigas da mesma branch são canceladas.
- O Playwright sobe o backend e o frontend antes dos testes.

## Entrega contínua

| Parte | Serviço | Origem |
|---|---|---|
| Backend | [Render](https://render.com), plano gratuito | pasta `backend/`, branch `main` |
| Frontend | [Vercel](https://vercel.com), plano Hobby | pasta `frontend/`, branch `main` |

A dona do repositório precisa autorizar os aplicativos da Render e da Vercel no GitHub. Antes de criar o projeto na Vercel, confira se o plano gratuito publica commits de quem não é dono da conta.

### Backend na Render

Arquivo previsto: `render.yaml` na raiz.

| Campo | Valor |
|---|---|
| Diretório | `backend` |
| Build | `npm ci --include=dev && npm run build` |
| Início | `npm start` |
| Verificação de saúde | `/health` |
| Deploy automático | somente depois que os checks passarem |
| Variáveis | `NODE_VERSION`, `NODE_ENV=production`, `FRONTEND_URL` |

### Frontend na Vercel

1. Importar o repositório e definir o diretório raiz como `frontend`.
2. Criar `VITE_API_URL` e `VITE_SOCKET_URL` com o endereço do backend.
3. Publicar.

As variáveis `VITE_*` entram no build: ao alterá-las, publique de novo. O [vercel.json](../frontend/vercel.json) faz rotas como `/partida/K7P2QX` abrirem direto no navegador.

### Ligar os dois

Na Render, ajuste `FRONTEND_URL` para o endereço de produção da Vercel, sem barra no final. O CORS aceita apenas essa origem, por isso as prévias da Vercel mostram a interface, mas não falam com o backend.

## Verificação da produção

Arquivo previsto: `.github/workflows/smoke.yml`, diário e com disparo manual. Ele confere o `/health` do backend e a página inicial do frontend, usando as variáveis de repositório `BACKEND_URL` e `FRONTEND_URL`.

## Voltar uma versão

- **Render:** em **Events**, escolher um deploy anterior e usar **Rollback**.
- **Vercel:** em **Deployments**, escolher um deploy anterior e usar **Promote to Production**.

Depois, corrigir o problema com um pull request, para a `main` voltar a representar o que está publicado.

## Configuração do repositório

Feita por quem administra o repositório, em **Settings**:

- **General:** ligar **Automatically delete head branches**, para a branch ser excluída depois do merge.
- **General:** manter **Allow merge commits** ligado.
- **Branches:** proteger a `main`, exigindo uma revisão e, quando o CI existir, o check `ci-ok`.

## Limitações

- A Render gratuita hiberna sem uso e leva cerca de um minuto para voltar. Abra o site antes de uma demonstração.
- Fila e partidas ficam em memória: cada deploy ou reinício encerra as partidas em andamento.
- O backend roda em uma única instância.
