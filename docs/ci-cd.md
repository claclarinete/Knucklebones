# CI/CD e deploy

A integração contínua está configurada (US26 e US27). O deploy (US29) está descrito no `render.yaml`. Os testes de ponta a ponta e a verificação de produção (US28 e US30) ainda não existem; as seções sobre eles descrevem o que será feito.

## Integração contínua (GitHub Actions)

Arquivo [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), executado a cada `push` e `pull_request`.

| Job | Sistemas | Passos |
|---|---|---|
| Backend e frontend | Linux, macOS e Windows | `npm ci`, `npm run typecheck`, `npm run lint` (frontend), `npm run test:coverage`, `npm run build` |
| E2E | Linux, macOS e Windows | `npm ci` nas três pastas, `npm run typecheck` e `npm test` em `e2e/`, depois de instalar o Chromium do Playwright |
| `ci-ok` | Linux | falha se algum job anterior falhar |

- A versão do Node fica em um arquivo `.nvmrc` na raiz.
- A cobertura mínima é de 80% em linhas, funções, ramos e instruções. A configuração do Vitest já aplica esse limite.
- O resumo da cobertura aparece na página da execução, e os relatórios completos são publicados como artefatos.
- Execuções antigas da mesma branch são canceladas.
- No job de E2E, o Playwright sobe o backend e o frontend antes dos testes. O relatório de cada sistema é publicado como artefato (`playwright-<sistema>`).

## Entrega contínua

O [render.yaml](../render.yaml) descreve os dois serviços na [Render](https://render.com), publicados a partir da branch `main`.

| Serviço | Tipo | Pasta | Variáveis a informar |
|---|---|---|---|
| `knucklebones-backend` | Serviço web, plano gratuito | `backend/` | `FRONTEND_URL` |
| `knucklebones-frontend` | Site estático | `frontend/` | `VITE_API_URL` e `VITE_SOCKET_URL` |

O backend usa `/health` como verificação de saúde. O deploy automático acontece somente depois que os checks do commit na `main` passam.

### Primeira publicação

1. Criar a conta na Render entrando com o GitHub. A dona do repositório precisa autorizar o aplicativo da Render a acessá-lo.
2. Em **New**, escolher **Blueprint** e conectar este repositório.
3. Informar as variáveis, com os endereços previstos dos serviços, sem barra no final:
   - `FRONTEND_URL`: `https://knucklebones-frontend.onrender.com`
   - `VITE_API_URL` e `VITE_SOCKET_URL`: `https://knucklebones-backend.onrender.com`
4. Aplicar e aguardar os dois deploys.
5. Conferir os endereços reais no painel. Se algum nome já estiver em uso, a Render acrescenta um sufixo: nesse caso, corrigir as variáveis e publicar de novo.
6. Abrir `/health` no backend, que responde `{"status":"ok"}`, e jogar no endereço do frontend.

As variáveis `VITE_*` entram no build: ao alterá-las, publique o frontend de novo. O CORS do backend aceita apenas o endereço em `FRONTEND_URL`.

### Sem autorização no repositório

A Render também publica um repositório público informado pelo endereço, mas sem Blueprint conectado e sem deploy automático: cada serviço é criado à mão com os valores do `render.yaml` e atualizado manualmente.

## Verificação da produção

Arquivo previsto: `.github/workflows/smoke.yml`, diário e com disparo manual. Ele confere o `/health` do backend e a página inicial do frontend, usando as variáveis de repositório `BACKEND_URL` e `FRONTEND_URL`.

## Voltar uma versão

No painel da Render, abrir o serviço, escolher em **Events** um deploy anterior e usar **Rollback**.

Depois, corrigir o problema com um pull request, para a `main` voltar a representar o que está publicado.

## Configuração do repositório

Feita por quem administra o repositório, em **Settings**:

- **General:** ligar **Automatically delete head branches**, para a branch ser excluída depois do merge.
- **General:** manter **Allow merge commits** ligado.
- **Branches:** proteger a `main`, exigindo uma revisão e o check `ci-ok`.

## Limitações

- A Render gratuita hiberna sem uso e leva cerca de um minuto para voltar. Abra o site antes de uma demonstração.
- Fila e partidas ficam em memória: cada deploy ou reinício encerra as partidas em andamento.
- O backend roda em uma única instância.
