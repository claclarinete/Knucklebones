# Guia de contribuição

A especificação do sistema está em [docs/README.md](docs/README.md).

## Responsáveis

| Área | Responsável |
|---|---|
| Backend (`backend/`) | Clarice ([@claclarinete](https://github.com/claclarinete)) |
| Frontend (`frontend/`), CI e deploy | José ([@Josejgs1](https://github.com/Josejgs1)) |
| Contrato do Socket.IO, testes E2E e documentação | Ambos |

Todo pull request é revisado pela outra pessoa da equipe.

## Fluxo de trabalho

1. Escolha uma [issue](https://github.com/claclarinete/Knucklebones/issues) do marco atual e coloque-se como responsável.
2. Crie a branch dela a partir da `main` atualizada.
3. Faça commits pequenos e frequentes.
4. Abra um pull request para a `main` com `Closes #<número>` na descrição.
5. Faça o merge só depois da aprovação e com os testes passando.

Ninguém faz push direto na `main`.

## Branches

As branches são criadas por quem for trabalhar na issue, no momento em que começar. Não há criação automática.

```
<tipo>/us<número>-<descricao-curta>
```

Exemplos: `feat/us05-destruir-dados`, `fix/us50-coluna-cheia`, `docs/atualiza-readme`.

Para criar a branch já vinculada à issue:

```bash
gh issue develop <número-da-issue> --name feat/us05-destruir-dados --base main --checkout
```

O número da issue no GitHub pode ser diferente do número da história (US).

Depois do merge, a branch deve ser excluída. Com a opção **Automatically delete head branches** ligada, o GitHub faz isso sozinho; sem ela, use o botão **Delete branch** no pull request. Em seguida, localmente, rode `git fetch --prune` e `git branch -d <branch>`.

## Mensagens de commit

Seguimos o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em português:

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

| Tipo | Quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `test` | criação ou ajuste de testes |
| `docs` | documentação |
| `refactor` | mudança de código sem alterar comportamento |
| `style` | formatação, sem mudança de lógica |
| `chore` | configuração, dependências, scripts |
| `ci` | mudanças no GitHub Actions |

Escopos sugeridos: `frontend`, `backend`, `game`, `bot`, `rooms`, `queue`, `e2e`, `deploy`.

O projeto precisa de pelo menos **50 commits**. Por isso o merge dos pull requests é feito com **merge commit**, sem *squash*.

## Pull requests

- Título no mesmo padrão dos commits.
- Use o [modelo](.github/pull_request_template.md), carregado automaticamente.
- Um pull request por história, sempre que possível.

## Testes

- Testar pela **API pública** do módulo ou componente, não por detalhes internos.
- Testar **comportamento**: o que entra e o que se observa.
- Dar **nomes** que descrevam o comportamento esperado, em português.
- Um teste verifica **uma coisa**.
- Sem `if` ou laços com lógica dentro do teste; para vários casos, use `it.each`.
- Testes independentes entre si, sem depender de ordem, rede externa ou sorte (use semente fixa e relógio simulado).
- Nos testes E2E, localizar elementos por papel e texto acessível, sem esperas fixas.

Testes de unidade ficam ao lado do código (`arquivo.test.ts`); testes de integração do backend ficam em `backend/tests/`.

## Definição de pronto

- [ ] Critérios de aceitação da issue atendidos.
- [ ] Testes cobrindo o comportamento novo.
- [ ] Testes passando localmente, com cobertura de pelo menos 80%.
- [ ] CI passando em Linux, macOS e Windows, quando ele for configurado.
- [ ] Revisão aprovada pela outra pessoa.
- [ ] Documentação atualizada, se mudou evento, fluxo ou configuração.
- [ ] Uso de IA registrado pela equipe em [docs/uso-de-ia.md](docs/uso-de-ia.md), se houve.

## Regras do código

- As regras do jogo ficam em `backend/src/game/`, como código puro, sem rede ou socket.
- O frontend nunca decide o resultado de uma jogada: envia a coluna e exibe o estado recebido.
- Toda entrada vinda do cliente é validada com Zod.
- Arquivos `.env` nunca vão para o repositório.

## Arquivos e formatação

- O [.editorconfig](.editorconfig) define UTF-8, fim de linha LF e indentação de 2 espaços.
- O [.gitattributes](.gitattributes) normaliza o fim de linha para LF em todos os sistemas.
