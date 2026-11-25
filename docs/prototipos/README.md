# Protótipos

| Tela | Arquivo |
|---|---|
| Lobby | [Lobby.png](Lobby.png) |
| Sala de espera | [Sala de espera.png](<Sala de espera.png>) |
| Partida | [Partida.png](Partida.png) |
| Adversário desconectado | [Adversário desconectado.png](<Adversário desconectado.png>) |
| Fim de partida | [Fim de partida.png](<Fim de partida.png>) |
| Regras | [Regras.png](Regras.png) |
| Componentes | [Barra superior](<Barra superior.png>), [Dado](Dado.png), [Cenário de fundo](<Cenário de fundo.png>) |

## Diferenças em relação ao escopo atual

As imagens são anteriores à retirada de contas e histórico. Onde divergirem, vale a [especificação](../README.md).

| Onde | No protótipo | O que implementar |
|---|---|---|
| Barra superior (todas as telas) | Link "Histórico" e botão "Sair" | Apenas "Jogar", "Regras" e o apelido, se houver |
| Lobby | Saudação de usuário logado | Campo de apelido opcional |
| Lobby | Cartões "Contra o bot" e "Com um amigo" | Manter os dois e adicionar "Jogar online" (fila) |
| Lobby | "O resultado vai para o histórico" e "Seu resumo" | Remover |
| Sala de espera | Link `/sala/CODIGO` | Link `/partida/CODIGO` |
| Adversário desconectado | "a partida é salva" | Remover o trecho |
| Fim de partida | "A partida foi salva no histórico" e "Ver histórico" | Remover |
| Fila de espera | Não há protótipo | Aviso de espera, botão "Cancelar" e sugestão de jogar contra o bot |
