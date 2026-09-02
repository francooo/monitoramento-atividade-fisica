# Dawn

Registro de treinos, implementado a partir do arquivo Figma `LKBE8Nrww0YwkAK9b1suNP`.

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Drizzle ORM · Neon Postgres.

---

## Rodando local

### 1. Criar o banco no Neon

1. Em <https://console.neon.tech>, crie um projeto. Escolha a região `aws-sa-east-1`
   (São Paulo) — é a mais perto e corta uns 150 ms de latência por query.
2. Nomeie o banco de `dawn`.
3. Em **Connection Details**, copie as duas strings:
   - **Pooled connection** (host termina em `-pooler`) → vai em `DATABASE_URL`.
     É a que a aplicação usa; o pooler aguenta o pico de conexões que funções
     serverless criam.
   - **Direct connection** (sem `-pooler`) → vai em `DATABASE_URL_UNPOOLED`.
     O `drizzle-kit` precisa dela: migrations rodam em sessão, e o pooler no
     modo transaction não suporta os comandos DDL usados.

### 2. Configurar o ambiente

```bash
cp .env.example .env
```

Preencha `.env` com as strings do Neon e gere uma chave de sessão:

```bash
openssl rand -base64 32
```

### 3. Instalar, migrar, popular

```bash
npm install
npm run db:migrate   # aplica drizzle/0000_init.sql
npm run db:seed      # dados de demonstração (opcional)
npm run dev
```

O seed cria três contas. Para entrar:

```
e-mail: andrews@dawn.app
senha:  dawn1234
```

Abra <http://localhost:3000>. O app é desenhado em 390 × 844 — no desktop ele
fica centralizado nessa largura em vez de esticar.

---

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Gera nova migration a partir do schema |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:push` | Empurra o schema direto, sem migration (só em dev) |
| `npm run db:studio` | Abre o Drizzle Studio |
| `npm run db:seed` | Popula com dados de demonstração |

---

## Estrutura

```
src/
├── app/
│   ├── (auth)/           entrar · criar-conta · recuperar-senha
│   ├── (app)/            feed · mapa · progresso · voce · nova-atividade
│   ├── globals.css       tokens do Figma via @theme
│   └── layout.tsx        fonte Manrope + shell de 390px
├── components/
│   ├── ui/               field, button, back-header
│   ├── activity-card.tsx    Figma 8:13
│   ├── week-summary-card.tsx Figma 8:57
│   ├── tab-bar.tsx          Figma 8:79
│   ├── top-bar.tsx          Figma 8:4
│   ├── kudos-button.tsx
│   └── icon.tsx          mapa dos SVGs exportados
├── db/
│   ├── schema.ts         7 tabelas
│   ├── queries.ts        feed, resumo semanal, totais, kudos
│   ├── index.ts          conexão Neon + Drizzle
│   └── seed.ts
├── lib/
│   ├── session.ts        sessão em banco + cookie httpOnly
│   ├── auth-actions.ts   entrar, cadastrar, recuperar, sair
│   ├── activity-actions.ts
│   ├── validation.ts     schemas Zod
│   └── format.ts         distância, ritmo, tempo em pt-BR
├── proxy.ts              guarda de rotas
└── public/
    ├── icons/            17 SVGs exportados do Figma
    └── img/              hero da autenticação + traçado do mapa
```

---

## Decisões que valem saber

**Distância em metros, duração em segundos, ambos inteiros.** Ritmo é derivado
na leitura (`formatPace`), nunca gravado — assim ele nunca fica fora de sincronia
com os números de que depende, e não há erro de arredondamento acumulado.

**Sessão em tabela, não JWT.** Custa uma query por request, mas permite revogar
uma sessão na hora. O `proxy.ts` só checa a presença do cookie para redirecionar
rápido; quem valida de verdade é `getCurrentUser`, no servidor.

**Driver HTTP do Neon.** `@neondatabase/serverless` sobre `fetch`, sem pool de
conexões — cada query é um round-trip. É o modo certo para funções serverless,
que não sobrevivem entre requisições. O custo é que múltiplas queries não são
agrupadas: o feed resolve contagens de kudos e comentários em subqueries
correlacionadas, numa ida só ao banco.

**Ícones da tab bar como máscara CSS.** Os SVGs exportados vêm com a cor cravada
(laranja no item ativo, cinza nos demais). Entram como `mask-image` com
`background-color: currentColor`: a geometria é exatamente a do arquivo, e o
estado ativo troca só a cor, sem exportar duas versões de cada ícone.

**Mensagens de erro que não vazam dados.** Login errado devolve sempre
"E-mail ou senha incorretos", e a recuperação de senha responde a mesma coisa
exista ou não a conta. Nos dois casos, a resposta não revela quais e-mails
estão cadastrados.

---

## O que ainda não está ligado

- **Envio de e-mail.** `requestPasswordReset` gera e guarda o token com hash,
  mas o link vai para o log do servidor em vez do inbox. Falta plugar um
  provedor (Resend, SES) e criar a tela `/nova-senha?token=`.
- **Google e Apple.** Os botões existem no design e estão implementados
  visualmente, sem OAuth por trás. A coluna `users.provider` já prevê isso.
- **Rotas de verdade no mapa.** A coluna `activities.route` aceita
  `[[lng, lat], ...]`, mas ainda não há captura de GPS nem render do traçado
  real — todo card mostra o SVG exportado do Figma.
- **Comentários.** A tabela e a contagem existem; falta a tela de leitura e
  escrita.
- **Tela `/nova-atividade`.** Não existe no Figma. Foi construída com os mesmos
  tokens porque o botão central da tab bar precisava de um destino. Se for
  desenhada depois, é só trocar o layout — as actions e validações continuam.
