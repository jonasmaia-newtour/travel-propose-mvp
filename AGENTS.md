# TravelPropose - Contexto Operacional do Projeto

## Leitura obrigatória

Antes de qualquer alteração, ler `RULES.md` e este ficheiro. Em caso de conflito, `RULES.md` prevalece.

## Objetivo do produto

O TravelPropose é uma plataforma SaaS B2B multi-tenant para agências de viagens. Substitui propostas estáticas e conversas dispersas por propostas web interativas, com simulação de opções, pedido de ajuste e aceite auditável.

O produto deve ser autónomo no domínio de negócio: não haverá integrações com GDS, consolidadoras, CRM, pagamentos ou outras plataformas externas. O Supabase é a infraestrutura aprovada para autenticação, PostgreSQL e funcionalidades de base de dados.

## Decisões de arquitetura aprovadas

- Stack: Next.js com App Router, TypeScript estrito, Tailwind CSS e shadcn/ui.
- Infraestrutura: Supabase Auth e PostgreSQL com Row-Level Security (RLS).
- Organização inicial: `newtour-test`, criada por seed.
- Utilizadores de demonstração: Owner, Manager e Agent, todos com autenticação real por e-mail e palavra-passe.
- Mapeamento RBAC: Owner = `OWNER`; Manager = `ADMIN`; Agent = `MEMBER`. O viajante não tem papel interno: acede a uma proposta pública através de token seguro.
- Direção visual: corporativa e confiável, com azul profundo e verde-água. Usar tokens de tema; nunca cores de marca hardcoded em componentes.
- Idioma base da interface: PT-PT, preparado para i18n desde o início.

## Escopo do MVP

### Landing page

- Explica o valor do produto e o fluxo de propostas interativas.
- Tem dois CTAs: entrada na plataforma e abertura de uma proposta de exemplo.
- Apresenta como roadmap os itens explicitamente adiados.

### Área autenticada da agência

- Owner: visão global da agência, indicadores essenciais e acesso a todas as propostas.
- Manager: pipeline e consulta de todas as propostas, sem gestão de marca.
- Agent: cria, edita em rascunho, publica e acompanha as próprias propostas.
- A lista e o kanban usam os estados da proposta e apresentam estados loading, erro, vazio e atualização otimista quando aplicável.

### Propostas

- O Agent cria uma proposta com secções de escolha única ou múltipla.
- Cada secção contém itens com título, descrição, imagem opcional e variação de preço sobre um valor base.
- Ao publicar, a proposta recebe um token aleatório. Apenas o hash do token é persistido.
- A página pública é mobile-first e atualiza total e simulação de pagamento quando o viajante seleciona opções.
- O viajante pode pedir ajuste através de mensagem ou aprovar a combinação enquanto estiver válida.

### Integridade e privacidade

- O aceite é transacional: valida prazo, congela itens selecionados e valores num snapshot imutável e atualiza o estado numa única operação.
- A fonte de verdade do total é o servidor; o cliente apenas antecipa a apresentação.
- Eventos mínimos: abertura da proposta e alterações de seleção. Registar sessão anonimizada, dispositivo e país quando disponível; nunca IP em bruto, cookies de terceiros ou PII desnecessária.
- Toda a informação da organização contém `tenant_id` e é protegida por RLS.

## Modelo de dados inicial

- `organizations`: agência e identidade visual.
- `profiles`: utilizadores autenticados, organização e papel.
- `proposals`: metadados, proprietário, token hash, estado e validade.
- `proposal_sections`: blocos ordenados de escolha única ou múltipla.
- `proposal_items`: cópia independente dos itens da proposta.
- `proposal_events`: telemetria append-only.
- `proposal_approval_snapshots`: snapshot imutável do aceite.
- `proposal_adjustment_requests`: observações do viajante para revisão.

## Máquina de estados

`draft -> sent -> viewed -> revision_requested -> draft`

`sent | viewed -> approved | expired`

- `approved` e `expired` são terminais no MVP.
- Um pedido de ajuste devolve a proposta a `draft`; depois de editada, o Agent volta a publicá-la. O histórico do pedido permanece registado.
- Depois de publicada, a proposta não é alterada diretamente. Uma alteração comercial deve passar pela revisão, mantendo o histórico.

## Fora do MVP

- Convites e gestão de membros.
- Faturação e gestão de subscrições.
- Integrações com GDS, consolidadoras, pagamentos, CRM ou outros serviços de negócio.
- Relatórios avançados, rankings e métricas históricas.
- Notificações em tempo real.

## Requisitos de qualidade inegociáveis

- Zod valida formulários e ações/endpoints no servidor.
- Sem `any`, casts cegos, strings de UI hardcoded, PII em logs ou erros silenciados.
- Componentes acessíveis, semânticos e navegáveis por teclado; cumprir WCAG AA.
- Testes unitários para preços, estados, validade e snapshots; integração para RLS; E2E Playwright para login, publicação, simulação, pedido de ajuste, aprovação e expiração.
- Executar lint, verificação de tipos e testes antes de declarar uma entrega concluída.

## Protocolo operacional acordado

- Antes de cada PR, executar code review local independente e resolver achados bloqueantes ou importantes antes de abrir a PR.
- Títulos e descrições de PR são sempre escritos em PT-PT.
- Comunicar explicitamente o estado do trabalho: a executar, em validação, bloqueado à espera de decisão, ou concluído. Interromper e diagnosticar operações que excedam o tempo razoável para a tarefa.
- Registar no `tasks.md` o estado concluído de cada fase e, no fim da fase, deixar anotadas as validações realizadas, decisões relevantes e a próxima fase para permitir retoma numa sessão nova.
- Registar em `LEARNINGS.md`, assim que resolvido, cada erro reutilizável no formato curto: erro, causa e solução.
- Alterações ao Supabase exigem aprovação explícita imediatamente antes da alteração, depois de confirmar por leitura que a CLI aponta para o projeto `travel-propose-mvp`.
- O CLI da Vercel está disponível. Deploys deste projeto usam a equipa `jonasmaia-mvp` e só devem partir de `main` validada pela CI, salvo autorização explícita para um preview.

## Aprendizagens do ambiente

- Em PowerShell, usar `npm.cmd` e `npx.cmd`, porque a política de execução pode bloquear os wrappers `.ps1`.
- O repositório raiz contém documentação antes do scaffold; ferramentas que exigem diretório vazio devem gerar numa pasta temporária isolada e trazer apenas os artefactos necessários.
- O template padrão do Next.js inclui fontes Google, copy e links externos. Removê-los no bootstrap: builds não podem depender de fontes remotas e a interface não pode manter copy de template nem cores de marca fora de tokens.
- O teardown do `webServer` do Playwright usa `taskkill /T /F` no Windows. No sandbox local, executar o E2E com permissão elevada; na CI Linux o Playwright encerra o grupo com `SIGKILL`.

## Estado da implementação

- Fase 1: concluída e integrada em `main`.
- Fase 2: concluída e integrada em `main`.
- Fase 3: concluída e integrada em `main` (estrutura Supabase, `.env.example`, `lib/env.ts`).
- Fase 4: concluída (T014 a T019) — fundação multi-tenant, seed e autenticação
  (clientes Supabase, proxy, login e guardas RBAC) integrados em `main`.
  Migrações 001/002 e seed `newtour-test` aplicados no remoto (2026-08-19).
- Fase 5: concluída (T020 a T025) — domínio de propostas (preços, máquina de
  estados, schemas Zod, migração 002) integrado em `main` com 42 testes verdes.
- Fase 6: concluída (T026 a T030) — dashboard e RBAC (US4): tipos DB, layout,
  queries, kanban e E2E de permissões com login real dos três papéis, integrados
  em `main` (PRs #13, #14, #15). A CI usa os secrets `NEXT_PUBLIC_SUPABASE_URL`
  e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Fase 7: concluída (T031 a T035) — criador e publicação (US1): token hasheado,
  draft-service, ações, editor modular e E2E de criar/publicar, integrados em
  `main` (PRs #17 a #21). Nota: CI de #17/#19/#20 ficou pendurada no passo
  "Install Playwright browser" e os merges foram feitos ignorando a CI por
  decisão do utilizador — investigar e ajustar a CI antes da Fase 8 (ver tasks.md).
- Fase 8: concluída (T036 a T040) — página pública e simulação (US2):
  contrato público, leitura via token hash (003), página mobile-first,
  simulador com recálculo em tempo real e E2E Playwright desktop/mobile
  integrados em `main` (PRs #28 a #32).
- Fase 9: concluída (T041 a T047) — ajuste, expiração e aceite (US2/US3):
  migrações 004/005/006/007, endpoints `POST /adjustments` e `POST /approval`
  com recibo, `terms_version` no contrato, diálogos públicos (ajuste,
  validade/expiração e recibo) com `<dialog>` nativo e E2E completo
  (ajuste→republicação→aceite), integrados em `main` (PRs #33 a #46).
  A demo em produção expirou a 2026-08-21 17:04 UTC — o link da landing
  devolve 404; a proposta demo definitiva é a T054.
- Próxima fase: Fase 10 — Telemetria e indicadores (T048 a T051).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
