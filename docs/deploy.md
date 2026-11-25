# Deploy

| Parte | Serviço | Origem |
|---|---|---|
| Backend | [Render](https://render.com) (plano gratuito) | pasta `backend/`, branch `main` |
| Frontend | [Vercel](https://vercel.com) (plano Hobby) | pasta `frontend/`, branch `main` |

A dona do repositório precisa autorizar os aplicativos da Render e da Vercel no GitHub.

> Antes de criar o projeto na Vercel, confira se o plano gratuito publica commits de quem não é dono da conta que o criou. Se não publicar, o projeto deve ser configurado de forma que as duas pessoas da equipe consigam entregar, ou o frontend pode ir para outro serviço.

## 1. Backend na Render

1. **New → Blueprint** e escolha este repositório. O [render.yaml](../render.yaml) define o serviço.
2. Informe `FRONTEND_URL`. Se o frontend ainda não existir, use um valor provisório e corrija no passo 3.
3. Aguarde o deploy e abra `https://<serviço>.onrender.com/health`. A resposta é `{"status":"ok"}`.

O deploy automático só acontece quando os checks do commit na `main` passam.

## 2. Frontend na Vercel

1. **Add New → Project** e escolha este repositório.
2. Defina **Root Directory** como `frontend`. O framework Vite é detectado automaticamente.
3. Crie as variáveis `VITE_API_URL` e `VITE_SOCKET_URL` com o endereço do backend.
4. Faça o deploy.

As variáveis `VITE_*` entram no build: ao alterá-las, publique de novo. O [vercel.json](../frontend/vercel.json) faz rotas como `/partida/K7P2QX` abrirem direto no navegador.

## 3. Ligar os dois

Na Render, ajuste `FRONTEND_URL` para o endereço de produção da Vercel, **sem barra no final**. O CORS aceita apenas essa origem, por isso os *previews* da Vercel mostram a interface, mas não conseguem falar com o backend.

## 4. Verificação automática

Em **Settings → Secrets and variables → Actions → Variables**, crie `BACKEND_URL` e `FRONTEND_URL`, sem barra no final. O workflow **Verificação de produção** roda uma vez por dia e pode ser disparado manualmente na aba Actions. Enquanto as variáveis não existirem, ele apenas registra um aviso.

Depois de publicar, anote os endereços no [README](../README.md).

## Voltar uma versão

- **Render:** em **Events**, escolha um deploy anterior e use **Rollback**.
- **Vercel:** em **Deployments**, escolha um deploy anterior e use **Promote to Production**.

Em seguida, corrija o problema com um pull request, para a `main` voltar a representar o que está publicado.

## Limitações

- A Render gratuita hiberna sem uso e leva cerca de um minuto para voltar. Abra o site antes de uma demonstração.
- Fila e partidas ficam em memória: cada deploy ou reinício encerra as partidas em andamento.
- O backend deve rodar em uma única instância.
