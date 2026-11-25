# Backlog

75 histórias de usuário. As [issues do GitHub](https://github.com/claclarinete/Knucklebones/issues) são a fonte atual de status e discussão; este arquivo registra o planejamento inicial.

| Área | Histórias | Responsável |
|---|---|---|
| Backend | US01 a US30 (30) | Clarice |
| Frontend | US31 a US63 (33) | José |
| Infra, qualidade e deploy | US64 a US75 (12) | José |

**Marcos:** M1 Fundação · M2 Contra o bot · M3 Online · M4 Polimento

## Backend

### Regras do jogo

#### US01 — Criar o tabuleiro inicial

Prioridade Alta · M2 Contra o bot

Como jogador, quero começar a partida com tabuleiros vazios, para disputar em condições iguais.

- Cada jogador tem 3 colunas com 3 espaços vazios.
- Placar inicial é 0 nas colunas e no total.
- O código fica em src/game, sem I/O.

#### US02 — Rolar o dado

Prioridade Alta · M2 Contra o bot

Como jogador, quero receber um dado sorteado a cada turno, para que a partida dependa de sorte justa.

- O valor é um inteiro de 1 a 6.
- Com DICE_SEED em modo de teste a sequência se repete.
- DICE_SEED é ignorada em produção.

#### US03 — Colocar o dado numa coluna

Prioridade Alta · M2 Contra o bot

Como jogador, quero colocar o dado na coluna escolhida, para montar minha estratégia.

- O dado ocupa o próximo espaço livre da coluna.
- As outras colunas do meu tabuleiro não mudam.
- O estado anterior não é modificado.

#### US04 — Recusar coluna cheia ou inválida

Prioridade Alta · M2 Contra o bot

Como jogador, quero ser impedido de fazer uma jogada impossível, para a partida continuar válida.

- Coluna com 3 dados é recusada.
- Índice fora de 0 a 2 é recusado.
- Jogada recusada não altera o estado.

#### US05 — Destruir dados iguais do adversário

Prioridade Alta · M2 Contra o bot

Como jogador, quero que meu dado remova os de mesmo valor na coluna correspondente, para atrapalhar o placar do adversário.

- Remove todos os dados iguais daquela coluna.
- Colunas diferentes não são afetadas.
- Os dados restantes se reorganizam sem buracos.

#### US06 — Calcular pontuação das colunas e total

Prioridade Alta · M2 Contra o bot

Como jogador, quero ter a pontuação calculada a cada jogada, para saber quem está na frente.

- Coluna soma valor vezes quantidade ao quadrado para cada valor.
- [4,4,4] vale 36, [4,4,2] vale 18 e [1,2,3] vale 6.
- O total é a soma das 3 colunas.

#### US07 — Sortear quem começa e alternar turnos

Prioridade Alta · M2 Contra o bot

Como jogador, quero que o início seja sorteado e os turnos se alternem, para a partida ser justa.

- Quem começa é sorteado.
- Após uma jogada válida a vez passa ao adversário com um novo dado.
- Jogada recusada mantém a vez.

#### US08 — Encerrar a partida e definir o resultado

Prioridade Alta · M2 Contra o bot

Como jogador, quero que a partida termine e aponte o resultado, para saber quem venceu.

- A partida acaba quando um tabuleiro enche.
- Vence o maior total e totais iguais dão empate.
- Não há jogadas após o fim.

### Partida contra o bot

#### US09 — Criar partida contra o bot

Prioridade Alta · M2 Contra o bot

Como jogador, quero iniciar uma partida contra o computador, para jogar sem depender de outra pessoa.

- room:create com mode bot e difficulty inicia a partida.
- O bot ocupa o segundo assento.
- Dificuldade ausente ou inválida gera erro.

#### US10 — Bot fácil

Prioridade Alta · M2 Contra o bot

Como jogador, quero enfrentar um bot que joga ao acaso, para aprender sem pressão.

- Escolhe apenas colunas com espaço.
- A escolha usa o gerador aleatório injetável.

#### US11 — Bot médio

Prioridade Média · M2 Contra o bot

Como jogador, quero enfrentar um bot que busca pontos e destrói meus dados, para ter um desafio moderado.

- Maximiza o ganho próprio somado à perda causada.
- Nunca escolhe coluna cheia.

#### US12 — Bot difícil

Prioridade Média · M2 Contra o bot

Como jogador, quero enfrentar um bot que pensa jogadas à frente, para ter um desafio forte.

- Usa expectiminimax considerando os 6 valores do dado.
- Profundidade limitada para responder em menos de 1 segundo.
- Nunca escolhe coluna cheia.

#### US13 — Pausar antes da jogada do bot

Prioridade Média · M2 Contra o bot

Como jogador, quero ver a jogada do bot após um pequeno intervalo, para entender o que mudou.

- O estado após minha jogada é enviado antes da resposta do bot.
- O intervalo é configurável e pode ser zero nos testes.

### Salas privadas

#### US14 — Criar sala com código único

Prioridade Alta · M3 Online

Como jogador, quero criar uma sala e receber um código, para convidar alguém.

- Código de 6 caracteres sem 0, O, 1 e I.
- Não há duas salas ativas com o mesmo código.
- Responde room:created com code e playerToken.

#### US15 — Entrar em sala pelo código

Prioridade Alta · M3 Online

Como jogador, quero entrar numa sala informando o código, para jogar com quem me convidou.

- room:join ocupa o segundo assento.
- Código é aceito em maiúsculas ou minúsculas.
- Os dois recebem game:start.

#### US16 — Informar sala inexistente ou cheia

Prioridade Alta · M3 Online

Como jogador, quero saber por que não consegui entrar, para tentar de novo corretamente.

- Código desconhecido responde room:error not_found.
- Sala com dois jogadores responde room:error full.

#### US17 — Cancelar sala em espera

Prioridade Média · M3 Online

Como jogador, quero cancelar a sala que criei, para desistir do convite.

- room:cancel remove a sala em espera.
- O código deixa de ser aceito.
- Quem não criou a sala não consegue cancelá-la.

#### US18 — Expirar salas abandonadas

Prioridade Baixa · M3 Online

Como equipe de desenvolvimento, quero remover salas ociosas e encerradas, para não acumular memória no servidor.

- Sala em espera expira após 10 minutos.
- Sala encerrada é removida após 5 minutos.
- Os tempos são testados com relógio simulado.

#### US19 — Validar os dados dos eventos

Prioridade Alta · M3 Online

Como equipe de desenvolvimento, quero validar todo dado recebido do cliente, para o servidor não aceitar entradas malformadas.

- Cada evento tem um schema Zod.
- Dado inválido responde com erro invalid_payload.
- Dado inválido não derruba o servidor.

### Fila online

#### US20 — Entrar na fila

Prioridade Alta · M3 Online

Como jogador, quero entrar numa fila de partida online, para jogar contra outra pessoa.

- queue:join responde queue:waiting.
- A mesma conexão não ocupa duas posições.
- Quem está numa partida não entra na fila.

#### US21 — Parear jogadores por ordem de chegada

Prioridade Alta · M3 Online

Como jogador, quero ser pareado assim que houver adversário, para começar a jogar logo.

- Os dois primeiros da fila são pareados.
- Ambos recebem game:start com code e playerToken próprios.
- Quem começa é sorteado.

#### US22 — Sair da fila

Prioridade Média · M3 Online

Como jogador, quero cancelar a espera, para fazer outra coisa.

- queue:leave remove da fila.
- Quem saiu não é pareado depois.

#### US23 — Remover da fila quem desconectou

Prioridade Alta · M3 Online

Como jogador, quero não ser pareado com quem já saiu, para evitar partidas fantasmas.

- Desconexão remove da fila.
- O pareamento ignora conexões encerradas.

#### US24 — Validar ou gerar o apelido

Prioridade Alta · M3 Online

Como visitante, quero jogar com um apelido ou receber um automático, para ser identificado sem criar conta.

- Apelido tem 1 a 20 caracteres após remover espaços das pontas.
- Aceita letras, números, espaço, hífen e sublinhado.
- Vazio gera Visitante com 4 dígitos.

### Partida em tempo real

#### US25 — Transmitir o estado a cada jogada

Prioridade Alta · M3 Online

Como jogador, quero ver as jogadas assim que acontecem, para acompanhar a partida.

- game:move válido envia game:state aos dois.
- Ao terminar envia game:over com winner, scores e reason.
- Eventos de uma sala não chegam a outra.

#### US26 — Rejeitar jogada fora da vez

Prioridade Alta · M3 Online

Como jogador, quero que só quem está na vez possa jogar, para ninguém trapacear.

- Jogada fora da vez responde game:error not_your_turn só para quem enviou.
- Coluna cheia responde game:error column_full.
- O estado não muda.

#### US27 — Desistir da partida

Prioridade Média · M3 Online

Como jogador, quero desistir de uma partida, para encerrá-la sem esperar o fim.

- game:forfeit encerra a partida.
- O adversário vence com reason forfeit.

#### US28 — Tratar desconexão com prazo de 60 segundos

Prioridade Média · M3 Online

Como jogador, quero que a partida espere o adversário voltar, para não ficar preso nem perder o jogo à toa.

- O adversário recebe opponent:disconnected e a partida pausa.
- Após 60 segundos quem ficou vence com reason disconnect.
- Se os dois saírem a partida é descartada.

#### US29 — Retomar a partida após reconectar

Prioridade Média · M3 Online

Como jogador, quero voltar à partida depois de cair, para continuar de onde parei.

- game:rejoin com code e playerToken válidos devolve o estado atual.
- O adversário recebe opponent:reconnected.
- Token inválido responde room:error invalid_token.

#### US30 — Combinar revanche

Prioridade Baixa · M4 Polimento

Como jogador, quero jogar de novo com o mesmo adversário, para tentar a vitória outra vez.

- game:rematch avisa o adversário.
- Nova partida só começa quando os dois aceitam.
- Se alguém sair o outro recebe opponent:left.

## Frontend

### Base da interface

#### US31 — Aplicar a identidade visual

Prioridade Alta · M1 Fundação

Como visitante, quero ver o site com o visual dos protótipos, para ter uma experiência coerente.

- Cores, fontes e fundo definidos como variáveis CSS.
- Nenhuma arte de Cult of the Lamb é usada.
- Fontes com licença livre.

#### US32 — Criar a barra superior

Prioridade Alta · M1 Fundação

Como visitante, quero navegar entre Jogar e Regras, para chegar às telas rapidamente.

- Mostra os links Jogar e Regras.
- Destaca a página atual.
- Mostra o apelido quando houver.

#### US33 — Criar o componente de dado

Prioridade Alta · M1 Fundação

Como jogador, quero ver dados claros de 1 a 6, para ler o tabuleiro rapidamente.

- Desenha os pontos de cada valor.
- Tem rótulo acessível com o valor.
- Aceita variações normal, dupla, trio e ameaçado.

#### US34 — Adaptar o layout a telas pequenas

Prioridade Média · M1 Fundação

Como jogador, quero jogar no celular, para usar o jogo em qualquer aparelho.

- Telas utilizáveis a partir de 360 px de largura.
- Sem rolagem horizontal.

#### US35 — Exibir página não encontrada

Prioridade Baixa · M1 Fundação

Como visitante, quero ser avisado de um endereço inexistente, para voltar ao jogo.

- Mostra a mensagem e um link para o lobby.
- Segue a identidade visual.

#### US36 — Mostrar o estado da conexão

Prioridade Média · M3 Online

Como visitante, quero saber se o servidor está disponível, para entender a demora quando ele estiver acordando.

- Consulta /health ao abrir o site.
- Mostra aviso enquanto o servidor não responde.
- Permite tentar novamente em caso de falha.

### Lobby

#### US37 — Informar um apelido

Prioridade Alta · M3 Online

Como visitante, quero escrever um apelido opcional, para ser reconhecido pelo adversário.

- O apelido fica salvo no navegador.
- Campo limita a 20 caracteres.
- É possível jogar com o campo vazio.

#### US38 — Entrar na fila online

Prioridade Alta · M3 Online

Como jogador, quero clicar em Jogar online, para enfrentar outra pessoa.

- O botão envia queue:join com o apelido.
- Cliques repetidos não enviam novos pedidos.

#### US39 — Aguardar na fila e poder cancelar

Prioridade Alta · M3 Online

Como jogador, quero ver que estou esperando e poder desistir, para não ficar sem resposta.

- Mostra a espera e o botão Cancelar.
- Sugere jogar contra o bot.
- Ao receber game:start vai para a partida.

#### US40 — Escolher a dificuldade e jogar contra o bot

Prioridade Alta · M2 Contra o bot

Como jogador, quero escolher fácil, médio ou difícil, para ter um desafio adequado.

- As três opções têm descrição.
- Há uma opção selecionada por padrão.
- Jogar inicia a partida e abre a tela dela.

#### US41 — Criar sala privada

Prioridade Alta · M3 Online

Como jogador, quero criar uma sala pelo lobby, para convidar alguém.

- O botão envia room:create.
- Ao receber room:created mostra a sala de espera.

#### US42 — Entrar em sala pelo lobby

Prioridade Alta · M3 Online

Como jogador, quero digitar um código e entrar, para jogar com quem me convidou.

- Campo aceita 6 caracteres e converte para maiúsculas.
- Botão desabilitado com código incompleto.

### Sala de espera

#### US43 — Ver e copiar o código da sala

Prioridade Alta · M3 Online

Como jogador, quero ver o código e copiá-lo, para enviar ao convidado.

- Mostra os 6 caracteres.
- O botão copia e confirma a cópia.

#### US44 — Copiar o link de convite

Prioridade Média · M3 Online

Como jogador, quero copiar um link direto, para facilitar a entrada do convidado.

- O link tem o formato /partida/CODIGO.
- O botão confirma a cópia.

#### US45 — Entrar pelo link de convite

Prioridade Alta · M3 Online

Como jogador, quero abrir o link e entrar na partida, para não precisar digitar o código.

- Abrir /partida/CODIGO sem token envia room:join.
- Usa o apelido salvo.

#### US46 — Explicar erros ao entrar na sala

Prioridade Alta · M3 Online

Como jogador, quero ver mensagens claras quando a entrada falhar, para saber o que fazer.

- not_found mostra sala não encontrada.
- full mostra sala cheia.
- Há caminho de volta ao lobby.

#### US47 — Cancelar a sala pela interface

Prioridade Média · M3 Online

Como jogador, quero cancelar a sala de espera, para voltar ao lobby.

- O botão envia room:cancel.
- Volta ao lobby.

### Tela da partida

#### US48 — Mostrar tabuleiros e nomes

Prioridade Alta · M2 Contra o bot

Como jogador, quero ver os dois tabuleiros identificados, para entender a situação.

- Meu tabuleiro fica embaixo e o do adversário em cima.
- Mostra os apelidos ou o nível do bot.

#### US49 — Mostrar o dado da vez

Prioridade Alta · M2 Contra o bot

Como jogador, quero ver o dado sorteado, para decidir onde jogar.

- Mostra o valor recebido do servidor.
- Não sorteia valores no navegador.

#### US50 — Escolher a coluna da jogada

Prioridade Alta · M2 Contra o bot

Como jogador, quero tocar numa coluna para jogar, para colocar meu dado.

- Envia game:move com a coluna.
- Colunas cheias ficam desabilitadas.
- Nada é enviado fora da minha vez.

#### US51 — Indicar de quem é a vez

Prioridade Média · M2 Contra o bot

Como jogador, quero ver claramente de quem é a vez, para não esperar sem saber.

- Mostra Sua vez ou Vez do adversário.
- A mudança é anunciada a leitores de tela.

#### US52 — Mostrar o placar

Prioridade Alta · M2 Contra o bot

Como jogador, quero ver pontos por coluna e total, para comparar os jogadores.

- Usa os valores enviados pelo servidor.
- Atualiza a cada game:state.

#### US53 — Destacar duplas e trios

Prioridade Média · M2 Contra o bot

Como jogador, quero ver combinações destacadas e uma legenda, para entender os multiplicadores.

- Duplas e trios têm destaques distintos.
- O destaque não depende só de cor.

#### US54 — Pré-visualizar a destruição

Prioridade Baixa · M4 Polimento

Como jogador, quero ver quais dados serão destruídos antes de jogar, para escolher melhor.

- Passar o cursor ou focar a coluna destaca os dados ameaçados.
- A prévia some ao sair da coluna.

#### US55 — Animar rolagem e destruição

Prioridade Baixa · M4 Polimento

Como jogador, quero perceber o dado rolando e sendo destruído, para acompanhar o que aconteceu.

- Animações curtas na rolagem e na destruição.
- Respeita a preferência de reduzir movimento.

#### US56 — Confirmar desistência

Prioridade Média · M3 Online

Como jogador, quero confirmar antes de desistir, para não sair por engano.

- O botão Desistir pede confirmação.
- Só envia game:forfeit após confirmar.

#### US57 — Mostrar o fim da partida

Prioridade Alta · M2 Contra o bot

Como jogador, quero ver vitória, derrota ou empate com o placar, para saber o resultado.

- Mostra resultado, totais e motivo.
- Bloqueia novas jogadas.

#### US58 — Pedir e aceitar revanche

Prioridade Baixa · M4 Polimento

Como jogador, quero propor ou aceitar uma revanche, para jogar novamente.

- O botão envia game:rematch.
- Mostra o pedido do adversário.
- Avisa quando o adversário saiu.

#### US59 — Voltar ao lobby

Prioridade Média · M2 Contra o bot

Como jogador, quero sair da tela de fim de partida, para escolher outro modo.

- O botão leva ao lobby.
- O token da partida encerrada é descartado.

#### US60 — Mostrar a contagem de desconexão

Prioridade Média · M3 Online

Como jogador, quero ver quanto falta para o adversário voltar, para saber o que vai acontecer.

- Mostra aviso com contagem regressiva.
- Fecha ao receber opponent:reconnected.

#### US61 — Retomar a partida ao recarregar

Prioridade Média · M3 Online

Como jogador, quero recarregar a página sem perder a partida, para continuar jogando.

- playerToken fica no sessionStorage.
- Ao voltar envia game:rejoin.
- Token inválido leva ao lobby com aviso.

### Regras e acessibilidade

#### US62 — Criar a tela de regras

Prioridade Média · M2 Contra o bot

Como visitante, quero ler as regras com exemplos, para aprender a jogar.

- Cobre tabuleiro, turno, destruição, pontuação e fim.
- Mostra exemplos de trio, dupla e dados distintos.
- Tem botão para ir jogar.

#### US63 — Permitir uso por teclado e leitor de tela

Prioridade Média · M4 Polimento

Como jogador, quero jogar sem mouse e com leitor de tela, para ter acesso ao jogo.

- Todas as ações funcionam por teclado com foco visível.
- Colunas têm nomes acessíveis.
- Janelas de aviso controlam o foco.

## Infra, qualidade e deploy

### CI e cobertura

#### US64 — Rodar o CI em três sistemas

Prioridade Alta · M1 Fundação

Como equipe de desenvolvimento, quero executar verificações a cada commit em Linux, macOS e Windows, para detectar problemas cedo.

- GitHub Actions roda tipos, lint, testes e build.
- Há um check único que resume o resultado.

#### US65 — Exigir cobertura de pelo menos 80%

Prioridade Alta · M1 Fundação

Como equipe de desenvolvimento, quero medir a cobertura no CI, para manter a qualidade exigida.

- CI falha abaixo de 80% em linhas, funções, ramos e instruções.
- Relatório disponível como artefato.

### Testes de ponta a ponta

#### US66 — Preparar o Playwright

Prioridade Alta · M1 Fundação

Como equipe de desenvolvimento, quero ter a base dos testes E2E, para escrever cenários completos.

- A configuração sobe backend e frontend.
- Um teste de fumaça roda no CI.

#### US67 — E2E de partida contra o bot até o fim

Prioridade Alta · M2 Contra o bot

Como equipe de desenvolvimento, quero testar uma partida completa contra o bot, para garantir o fluxo principal.

- Joga até a tela de fim usando semente fixa.
- Confere resultado e destruição de dados.

#### US68 — E2E de fila online com dois navegadores

Prioridade Alta · M3 Online

Como equipe de desenvolvimento, quero testar o pareamento online, para garantir o multiplayer.

- Dois contextos entram na fila e são pareados.
- A jogada de um aparece no outro.

#### US69 — E2E de sala privada por link

Prioridade Média · M3 Online

Como equipe de desenvolvimento, quero testar o convite por link, para garantir a sala privada.

- Um contexto cria a sala e o outro abre o link.
- Os dois chegam à partida.

#### US70 — E2E de sala inexistente

Prioridade Média · M3 Online

Como equipe de desenvolvimento, quero testar o erro de código inválido, para garantir a mensagem correta.

- Código desconhecido mostra sala não encontrada.
- É possível voltar ao lobby.

#### US71 — E2E de desistência e desconexão

Prioridade Média · M3 Online

Como equipe de desenvolvimento, quero testar o encerramento antecipado, para garantir que ninguém fique preso.

- Desistir encerra para os dois.
- Fechar um navegador mostra o aviso no outro.

### Produção e entrega

#### US72 — Publicar o frontend

Prioridade Alta · M1 Fundação

Como visitante, quero acessar o jogo por um endereço público, para jogar sem instalar nada.

- Publicado na Vercel a partir da main.
- Rotas abertas direto no navegador funcionam.
- Variáveis apontam para o backend.

#### US73 — Publicar o backend

Prioridade Alta · M1 Fundação

Como jogador, quero que o servidor esteja disponível na internet, para jogar online.

- Publicado na Render a partir da main após os checks.
- /health responde 200.
- FRONTEND_URL libera o frontend no CORS.

#### US74 — Verificar a produção automaticamente

Prioridade Média · M1 Fundação

Como equipe de desenvolvimento, quero checar periodicamente os endereços publicados, para saber quando algo quebrar.

- Workflow confere /health e a página inicial.
- Falha do workflow indica o endereço com problema.

#### US75 — Finalizar README e protótipos

Prioridade Média · M4 Polimento

Como equipe de desenvolvimento, quero entregar a documentação atualizada, para atender aos requisitos da disciplina.

- README com integrantes, sistema, tecnologias, execução dos testes e endereços.
- Protótipos sem referências a conta e histórico.
- Registro de uso de IA preenchido pela equipe.
