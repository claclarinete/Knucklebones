# Testes de ponta a ponta

Testes do [Playwright](https://playwright.dev) que abrem o Knucklebones Online no Chromium e jogam como uma pessoa jogaria.

## Como rodar

Antes, rode `npm install` em `backend/` e `frontend/`. Depois:

```bash
npm install
npx playwright install chromium   # só na primeira vez
npm test
```

| Comando | O que faz |
|---|---|
| `npm test` | roda todos os testes |
| `npm run test:ui` | abre o modo interativo do Playwright |
| `npm run report` | abre o relatório da última execução |
| `npm run typecheck` | confere os tipos |

O Playwright sobe o backend em `http://localhost:3100` e o frontend em `http://localhost:5180`, portas diferentes das do `npm run dev`. Fora do CI, se algo já estiver rodando nessas portas, ele reaproveita o que está lá.

O backend sobe com `DICE_SEED=42`, para o dado e os sorteios serem previsíveis, e com `BOT_DELAY_MS=300`. Os testes rodam um de cada vez, porque a fila e as salas ficam na memória de um único servidor.

## O que é testado

| Arquivo | Teste |
|---|---|
| `bot.spec.ts` | partida contra o bot até um dos tabuleiros encher |
| `fila.spec.ts` | dois navegadores na fila online entram na mesma partida |
| `sala.spec.ts` | entrada na sala pelo link de convite; sala inexistente |
| `saida.spec.ts` | desistência; saída do adversário pausa a partida com a contagem; volta e retomada |

Cada jogador abre um contexto próprio do navegador, como se fossem dois navegadores separados. Os elementos são localizados por papel e texto acessível, sem esperas fixas, como pede o [guia de contribuição](../CONTRIBUTING.md#testes).
