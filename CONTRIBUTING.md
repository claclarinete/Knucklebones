# Guia de contribuição

Este guia define como organizamos o trabalho no repositório. A especificação do sistema está em [docs/README.md](docs/README.md).

## Fluxo de trabalho

1. Escolha uma user story (US01 a US20, em [docs/README.md](docs/README.md#10-user-stories)) ou uma tarefa técnica.
2. Crie uma branch a partir da `main` atualizada.
3. Faça commits pequenos e com mensagens claras.
4. Abra um pull request para a `main` e peça revisão de pelo menos uma pessoa da equipe.
5. Faça o merge só depois da aprovação e com o CI passando.

Ninguém faz push direto na `main`.

## Nomes de branch

```
<tipo>/<us>-<descricao-curta>
```

Exemplos:

- `feat/us01-cadastro`
- `feat/us09-bot-facil`
- `fix/us05-destruicao-coluna-errada`
- `docs/atualiza-readme`
- `chore/configura-ci`

Quando a tarefa não pertence a uma user story, omita o número.

## Mensagens de commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), com a descrição em português:

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

Escopos sugeridos: `frontend`, `backend`, `game`, `auth`, `rooms`, `matches`, `db`, `e2e`.

Exemplos:

```
feat(game): calcula pontuação da coluna
test(game): cobre destruição de dados iguais
fix(rooms): impede terceiro jogador de entrar na sala
docs: adiciona protótipo da tela de histórico
```

## Pull requests

- Título no mesmo padrão dos commits.
- Na descrição, informe a user story relacionada, o que mudou e como testar. O modelo em [.github/pull_request_template.md](.github/pull_request_template.md) é carregado automaticamente.
- Mantenha os PRs pequenos: um PR por user story ou por parte dela.

## Definição de pronto

Uma tarefa está pronta quando:

- [ ] Os critérios de aceitação da user story foram atendidos.
- [ ] Há testes cobrindo o comportamento novo (unidade, integração ou E2E, conforme o caso).
- [ ] O CI passa em Linux, macOS e Windows, com cobertura de pelo menos 80%.
- [ ] O código foi revisado e aprovado por outra pessoa da equipe.
- [ ] A documentação foi atualizada, se a mudança alterou API, eventos, modelo de dados ou fluxos.
- [ ] O uso de IA na tarefa, se houve, foi registrado em [docs/uso-de-ia.md](docs/uso-de-ia.md).

## Regras do código

- As regras do jogo ficam em `backend/src/game/`, como código puro, sem acesso a banco, rede ou socket. Isso facilita os testes.
- O frontend nunca decide o resultado de uma jogada: ele só envia a coluna escolhida e exibe o estado recebido do backend.
- Toda entrada vinda do cliente (REST ou Socket.IO) é validada com Zod.
- Segredos ficam em arquivos `.env`, que nunca vão para o repositório.

## Arquivos e formatação

- O [.editorconfig](.editorconfig) define codificação UTF-8, fim de linha LF e indentação de 2 espaços. Instale a extensão EditorConfig no seu editor.
- O [.gitattributes](.gitattributes) normaliza o fim de linha para LF, evitando diferenças entre Windows, macOS e Linux.
