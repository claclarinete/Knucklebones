# Registro de uso de IA

A equipe usou ferramentas de IA como apoio para acelerar o desenvolvimento, principalmente nas partes mais mecânicas e repetitivas: configuração inicial dos projetos, código de estrutura, variações de casos de teste e primeiras versões de textos de documentação e de pull requests.

As decisões de projeto, as regras do jogo, a arquitetura e o contrato do Socket.IO seguem a [especificação](README.md) escrita pela equipe. Todo trecho sugerido pela IA foi lido, ajustado quando necessário e só entrou no repositório depois de passar pelos testes, pelo CI e pela revisão da outra pessoa no pull request.

| Data | Ferramenta | Tarefa | Como o resultado foi revisado | Responsável |
|---|---|---|---|---|
| 23/11/2026 | Claude Code | Rascunho da documentação inicial do repositório (README, guia de contribuição, modelos de issue e pull request) a partir da especificação | Texto conferido com a especificação e ajustado pela equipe antes do commit | Clarice |
| 23/11/2026 | Claude Code | Configuração inicial do backend e do frontend (TypeScript, scripts, Vitest, cobertura, variáveis de ambiente) | Projetos executados localmente; tipos, testes e build conferidos antes do commit | Clarice |
| 26/11/2026 | Claude Code | Apoio na implementação das regras do jogo (tabuleiro, pontuação, destruição de dados, turnos e vencedor) e na escrita dos casos de teste | Regras conferidas com a especificação; testes de unidade passando com cobertura acima de 80%; revisão no PR #82 | Clarice |
| 26/11/2026 | Claude Code | Apoio na implementação do bot (fácil, médio e difícil) e da validação dos eventos com Zod | Comportamento conferido em testes com semente fixa e numa partida real contra o servidor; revisão no PR #83 | Clarice |
| 26/11/2026 | Claude Code | Apoio na implementação da fila, das salas privadas, da pausa por queda, da retomada e da revanche, e nos testes de integração com clientes Socket.IO | Eventos conferidos com o contrato; testes de unidade e integração passando; teste manual com clientes conectados ao servidor; revisão no PR #89 | Clarice |
| 26/11/2026 | Claude Code | Configuração do Playwright e rascunho dos testes de ponta a ponta e do job de E2E no CI | Testes executados localmente várias vezes seguidas e no CI em Linux, macOS e Windows; revisão no PR #92 | Clarice |
| 26/11/2026 | Claude Code | Primeiras versões das mensagens de commit, descrições de pull request e trechos da documentação | Textos lidos e ajustados antes de publicar | Clarice |
| 25/11/2026 | Claude Code | Apoio na revisão da especificação, do backlog e do contrato do Socket.IO para o novo escopo, e na remoção do banco, da autenticação e do histórico | Textos e código conferidos pela equipe; revisão nos PRs #1 e #2 | José |
| 25/11/2026 | Claude Code | Apoio na base visual (variáveis de cor, barra superior, cenário animado) e nos componentes de dado e tabuleiro, com seus testes | Telas comparadas com os protótipos; testes de componentes passando; revisão no PR #81 | José |
| 26/11/2026 | Claude Code | Apoio na implementação do lobby (fila, bot e sala privada) e da tela da partida (placar, fim de jogo, desistência e desconexão), e nos testes dos hooks e componentes | Fluxos testados no navegador com o backend rodando; testes com cobertura acima de 80%; revisão nos PRs #84 e #85 | José |
| 26/11/2026 | Claude Code | Apoio na tela de regras e nos ajustes de acessibilidade, uso no celular e aviso do estado do servidor | Conferido no navegador, inclusive no tamanho de celular (360 x 640); testes passando; revisão nos PRs #86, #87, #90 e #93 | José |
| 26/11/2026 | Claude Code | Rascunho do workflow de CI com cobertura nos três sistemas e da documentação de CI/CD | Workflow executado no GitHub Actions em Linux, macOS e Windows; revisão no PR #88 | José |
| 26/11/2026 | Claude Code | Apoio na configuração do deploy na Render e no workflow diário de verificação da produção | `render.yaml` validado pelo formato da Render; comandos de build e verificação executados contra o site publicado; revisão nos PRs #91 e #94 | José |
