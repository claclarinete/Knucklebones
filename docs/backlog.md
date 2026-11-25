# Backlog

30 histórias de usuário. As [issues do GitHub](https://github.com/claclarinete/Knucklebones/issues) mostram o andamento; este arquivo registra o planejamento.

| Área | Histórias | Responsável |
|---|---|---|
| Backend | US01 a US13 (13) | Clarice |
| Frontend | US14 a US25 (12) | José |
| CI, testes E2E e deploy | US26 a US30 (5) | José |

**Marcos:** M1 Fundação; M2 Contra o bot; M3 Online; M4 Polimento e entrega.

## Backend

### US01: Montar o tabuleiro e jogar um dado

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero receber um dado e colocá-lo numa coluna, para montar minha estratégia.

- Cada jogador tem 3 colunas com 3 espaços.
- O dado vai de 1 a 6 e aceita semente fixa em teste.
- Coluna cheia ou inexistente é recusada sem alterar o estado.

### US02: Destruir dados do adversário

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero que meu dado remova os de mesmo valor na coluna correspondente, para atrapalhar o placar do adversário.

- Remove todos os dados iguais daquela coluna.
- Outras colunas não são afetadas.
- Os dados restantes se reorganizam sem buracos.

### US03: Calcular a pontuação

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero ter a pontuação calculada a cada jogada, para saber quem está na frente.

- Coluna soma valor vezes quantidade ao quadrado para cada valor.
- [4,4,4] vale 36, [4,4,2] vale 18 e [1,2,3] vale 6.
- O total é a soma das 3 colunas.

### US04: Controlar turnos e fim de partida

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero que os turnos se alternem e a partida termine com um resultado, para saber quem venceu.

- Quem começa é sorteado.
- Jogada válida passa a vez.
- A partida acaba quando um tabuleiro enche.
- Vence o maior total e totais iguais dão empate.

### US05: Criar partida contra o bot

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero iniciar uma partida contra o computador, para jogar sem depender de outra pessoa.

- room:create com mode bot e difficulty inicia a partida.
- O estado da minha jogada chega antes da resposta do bot.
- O intervalo do bot é configurável.

### US06: Bot nas dificuldades fácil e médio

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero enfrentar um bot simples ou moderado, para ter um desafio adequado.

- Fácil escolhe uma coluna válida ao acaso.
- Médio maximiza o ganho próprio somado à perda causada.
- O bot nunca escolhe coluna cheia.

### US07: Bot na dificuldade difícil

Prioridade: média. Marco: M2 Contra o bot.

Como jogador, quero enfrentar um bot que pensa jogadas à frente, para ter um desafio forte.

- Usa expectiminimax considerando os 6 valores do dado.
- Responde em menos de 1 segundo.

### US08: Salas privadas

Prioridade: alta. Marco: M3 Online.

Como jogador, quero criar uma sala ou entrar por código, para jogar com quem eu convidar.

- Código único de 6 caracteres sem 0, O, 1 e I.
- Sala inexistente responde not_found e sala cheia responde full.
- Quem criou pode cancelar.
- Sala em espera expira após 10 minutos.

### US09: Fila online

Prioridade: alta. Marco: M3 Online.

Como jogador, quero entrar numa fila de partida, para jogar contra outra pessoa.

- Pareamento por ordem de chegada.
- É possível sair da fila.
- Quem desconecta é removido.
- Os dois recebem game:start.

### US10: Apelido e validação dos eventos

Prioridade: alta. Marco: M3 Online.

Como visitante, quero jogar com apelido opcional e ter meus dados validados, para participar sem criar conta.

- Apelido de 1 a 20 caracteres.
- Vazio gera Visitante com 4 dígitos.
- Cada evento é validado com Zod.
- Dado inválido responde invalid_payload sem derrubar o servidor.

### US11: Partida em tempo real

Prioridade: alta. Marco: M3 Online.

Como jogador, quero ver as jogadas assim que acontecem, para acompanhar a partida.

- Jogada válida envia game:state aos dois.
- Jogada fora da vez é recusada.
- O fim envia game:over.
- Eventos de uma sala não chegam a outra.

### US12: Desistência, desconexão e retomada

Prioridade: média. Marco: M3 Online.

Como jogador, quero desistir ou voltar após cair, para não ficar preso numa partida.

- game:forfeit dá a vitória ao adversário.
- A queda pausa a partida por 60 segundos.
- game:rejoin com token válido devolve o estado.
- Sem retorno, quem ficou vence.

### US13: Revanche

Prioridade: baixa. Marco: M4 Polimento e entrega.

Como jogador, quero jogar de novo com o mesmo adversário, para tentar outra vez.

- A nova partida só começa quando os dois pedem.
- Se alguém sair, o outro é avisado.

## Frontend

### US14: Identidade visual e navegação

Prioridade: alta. Marco: M1 Fundação.

Como visitante, quero ver o visual dos protótipos e navegar entre as telas, para ter uma experiência coerente.

- Cores, fontes livres e fundo definidos como variáveis CSS.
- Barra superior com Jogar, Regras e apelido.
- Página não encontrada leva ao lobby.

### US15: Componentes de dado e tabuleiro

Prioridade: alta. Marco: M1 Fundação.

Como jogador, quero ver os dados e as colunas com clareza, para entender a partida rapidamente.

- Dado desenha os valores de 1 a 6 com rótulo acessível.
- Tabuleiro mostra 3 colunas de 3 espaços.

### US16: Lobby com apelido e fila online

Prioridade: alta. Marco: M3 Online.

Como jogador, quero escolher um apelido e entrar na fila, para enfrentar outra pessoa.

- Apelido opcional salvo no navegador.
- Mostra a espera com botão Cancelar.
- Ao receber game:start abre a partida.

### US17: Lobby contra o bot

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero escolher a dificuldade e jogar, para treinar sozinho.

- As três opções têm descrição.
- Há uma opção selecionada por padrão.

### US18: Sala privada na interface

Prioridade: alta. Marco: M3 Online.

Como jogador, quero criar uma sala, copiar o convite ou entrar, para jogar com alguém.

- Mostra o código e copia código ou link.
- Abrir /partida/CODIGO entra na sala.
- Erros de sala aparecem com caminho de volta.
- É possível cancelar.

### US19: Jogar na tela da partida

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero ver o dado e escolher a coluna, para fazer minha jogada.

- Mostra os dois tabuleiros e de quem é a vez.
- Colunas cheias ficam desabilitadas.
- Nada é enviado fora da minha vez.

### US20: Placar e destaques

Prioridade: média. Marco: M2 Contra o bot.

Como jogador, quero ver pontos, duplas, trios e dados ameaçados, para decidir onde jogar.

- Placar por coluna e total vindo do servidor.
- Duplas e trios destacados sem depender só de cor.
- Prévia dos dados que serão destruídos.

### US21: Fim de partida e revanche

Prioridade: alta. Marco: M2 Contra o bot.

Como jogador, quero ver o resultado e escolher o próximo passo, para jogar novamente.

- Mostra vitória, derrota ou empate com o placar.
- Permite voltar ao lobby.
- Permite pedir ou aceitar revanche.

### US22: Desistência e desconexão na interface

Prioridade: média. Marco: M3 Online.

Como jogador, quero desistir com confirmação e entender quedas de conexão, para saber o que está acontecendo.

- Desistir pede confirmação.
- Mostra contagem regressiva quando o adversário cai.
- Recarregar a página retoma a partida.

### US23: Tela de regras

Prioridade: média. Marco: M2 Contra o bot.

Como visitante, quero ler as regras com exemplos, para aprender a jogar.

- Cobre tabuleiro, turno, destruição, pontuação e fim.
- Mostra exemplos de pontuação.

### US24: Responsividade e acessibilidade

Prioridade: média. Marco: M4 Polimento e entrega.

Como jogador, quero jogar no celular, por teclado e com leitor de tela, para usar o jogo sem barreiras.

- Utilizável a partir de 360 px.
- Todas as ações funcionam por teclado com foco visível.
- Mudança de turno é anunciada.

### US25: Estado da conexão com o servidor

Prioridade: média. Marco: M3 Online.

Como visitante, quero saber se o servidor está disponível, para entender a demora quando ele estiver acordando.

- Consulta /health ao abrir o site.
- Mostra aviso e permite tentar novamente.

## CI, testes E2E e deploy

### US26: CI com GitHub Actions

Prioridade: alta. Marco: M4 Polimento e entrega.

Como equipe de desenvolvimento, quero verificar cada commit em Linux, macOS e Windows, para detectar problemas cedo.

- Roda tipos, lint, testes e build.
- Um check único resume o resultado.

### US27: Metas de testes de unidade e cobertura

Prioridade: alta. Marco: M4 Polimento e entrega.

Como equipe de desenvolvimento, quero garantir a quantidade de testes e a cobertura, para atender aos requisitos da disciplina.

- Pelo menos 30 testes de unidade.
- Cobertura mínima de 80% exigida no CI.
- Relatório disponível.

### US28: Cinco testes de ponta a ponta

Prioridade: alta. Marco: M4 Polimento e entrega.

Como equipe de desenvolvimento, quero testar os fluxos principais no navegador, para garantir que o sistema funciona integrado.

- Partida contra o bot até o fim.
- Fila com dois navegadores.
- Sala por link.
- Sala inexistente.
- Desistência ou desconexão.

### US29: Publicar frontend e backend

Prioridade: alta. Marco: M4 Polimento e entrega.

Como visitante, quero acessar o jogo por um endereço público, para jogar sem instalar nada.

- Frontend na Vercel e backend na Render a partir da main.
- /health responde 200.
- CORS libera o frontend.

### US30: Verificar produção e concluir o README

Prioridade: média. Marco: M4 Polimento e entrega.

Como equipe de desenvolvimento, quero conferir o que foi publicado e documentar, para entregar o projeto completo.

- Verificação automática dos endereços.
- README com integrantes, sistema, tecnologias, execução dos testes e endereços.
