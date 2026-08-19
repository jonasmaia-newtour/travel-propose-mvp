# Tasks: TravelPropose MVP

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/` e
`quickstart.md` em `specs/001-travel-propose-mvp/`.

**Regra de entrega**: uma fase por PR, máximo 400 linhas alteradas; se exceder, dividir
a fase antes de implementar. Escrever os testes primeiro, confirmar falha, implementar
o mínimo e confirmar sucesso.

## Phase 1: Governança e repositório

- [x] T001 Criar repositório Git e configurar branch `main` no diretório raiz
- [x] T002 Criar `.gitignore`, `.gitattributes`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS` e `.env.example`
- [x] T003 Criar `.github/PULL_REQUEST_TEMPLATE.md` e workflow `.github/workflows/ci.yml`
- [x] T004 Criar repositório privado GitHub e associar `origin` após revisão de `git diff --staged`

## Phase 2: Scaffold e qualidade base

- [x] T005 Criar aplicação Next.js TypeScript no diretório raiz conforme `specs/001-travel-propose-mvp/plan.md`
- [x] T006 Configurar Tailwind, shadcn/ui e tokens corporativos em `app/globals.css` e `components.json`
- [x] T007 [P] Configurar Vitest em `vitest.config.ts` e `tests/setup.ts`
- [x] T008 [P] Configurar Playwright e axe em `playwright.config.ts` e `tests/e2e/accessibility.spec.ts`
- [x] T009 Configurar scripts de lint, typecheck, teste e E2E em `package.json`

## Phase 3: Supabase e ambiente

- [x] T010 Confirmar por leitura que a CLI Supabase está ligada ao projeto `travel-propose-mvp` antes de qualquer write
- [x] T011 Criar estrutura local `supabase/config.toml`, `supabase/migrations/` e `supabase/seed.sql` após aprovação explícita do utilizador
- [x] T012 Documentar variáveis em `.env.example` e validação de arranque em `lib/env.ts`
- [x] T013 Criar teste de configuração em `tests/unit/env.spec.ts`

> Nota de encerramento da Fase 3: a estrutura (`config.toml`, `supabase/migrations/.gitkeep` e `seed.sql`
> placeholder) está commitada e validada. As migrações de conteúdo criadas fora de PR durante esta fase
> pertencem à Fase 4/T015; foram preservadas como material de referência e serão reescritas com as
> correções RLS (função de trigger, cores `text`, `auth.uid()`) antes de qualquer write no Supabase.

## Phase 4: Fundação multi-tenant e autenticação

- [ ] T014 Escrever teste de isolamento em `tests/integration/tenant-isolation.spec.ts`
- [ ] T015 Criar migração de organizações, perfis, enums, índices, timestamps e RLS em `supabase/migrations/001_identity.sql`
- [ ] T016 Criar seed `newtour-test` e utilizadores de demonstração em `supabase/seed.sql` após aprovação explícita do utilizador
- [ ] T017 Configurar clientes Supabase browser/server/proxy em `lib/supabase/`
- [ ] T018 Implementar login e guardas RBAC em `app/(auth)/login/page.tsx` e `lib/auth/`
- [ ] T019 Executar testes de RLS, autenticação, lint e typecheck da fase

> A Fase 4 ultrapassa o limite de 400 linhas por PR e será entregue em dois PRs:
> PR 4a (T014 + T015 + T016) e PR 4b (T017 + T018 + T019).

## Phase 5: Domínio de propostas

- [ ] T020 [P] Escrever testes de preço em `tests/unit/proposal/pricing.spec.ts`
- [ ] T021 [P] Escrever testes de estados em `tests/unit/proposal/state-machine.spec.ts`
- [ ] T022 Implementar cálculo e seleção em `domain/proposal/pricing.ts`
- [ ] T023 Implementar transições em `domain/proposal/state-machine.ts`
- [ ] T024 Criar schemas Zod em `schemas/proposal.ts`
- [ ] T025 Criar migração de propostas, secções, itens e RLS em `supabase/migrations/002_proposals.sql` após aprovação explícita do utilizador

## Phase 6: Dashboard e RBAC (US4)

**Independent test**: cada papel só vê propostas permitidas e o pipeline da agência.

- [ ] T026 [P] [US4] Escrever E2E de permissões em `tests/e2e/dashboard-rbac.spec.ts`
- [ ] T027 [US4] Criar layout e navegação autenticados em `app/(dashboard)/layout.tsx`
- [ ] T028 [US4] Criar queries paginadas do pipeline em `lib/proposals/dashboard-queries.ts`
- [ ] T029 [US4] Implementar dashboard e kanban em `app/(dashboard)/dashboard/page.tsx` e `components/dashboard/`
- [ ] T030 [US4] Validar Owner, Manager e Agent com Playwright

## Phase 7: Criador e publicação (US1)

**Independent test**: Agent cria rascunho, adiciona opções e recebe link seguro.

- [ ] T031 [P] [US1] Escrever testes de schema e publicação em `tests/unit/proposal/publish.spec.ts`
- [ ] T032 [US1] Implementar repositório e ações de rascunho em `lib/proposals/draft-service.ts` e `app/(dashboard)/proposals/actions.ts`
- [ ] T033 [US1] Criar editor modular em `app/(dashboard)/proposals/new/page.tsx` e `components/proposal/editor/`
- [ ] T034 [US1] Implementar publicação e hash de token em `lib/proposals/publish-service.ts`
- [ ] T035 [US1] Escrever E2E criar/publicar em `tests/e2e/proposal-create-publish.spec.ts`

## Phase 8: Página pública e simulação (US2)

**Independent test**: viajante abre link válido, seleciona opções e vê total atualizado.

- [ ] T036 [P] [US2] Escrever testes de representação pública em `tests/contract/public-proposal.spec.ts`
- [ ] T037 [US2] Criar função pública de leitura e endpoint em `supabase/migrations/003_public-read.sql` e `app/api/v1/public/proposals/[token]/route.ts` após aprovação explícita do utilizador
- [ ] T038 [US2] Implementar página mobile-first em `app/p/[token]/page.tsx`
- [ ] T039 [US2] Implementar simulador acessível em `components/proposal/public-simulator.tsx`
- [ ] T040 [US2] Escrever E2E de simulação em `tests/e2e/public-proposal-simulation.spec.ts`

## Phase 9: Ajuste, expiração e aceite (US2, US3)

**Independent test**: pedido de ajuste volta a rascunho; aceite único grava snapshot.

- [ ] T041 [P] [US3] Escrever testes de pedido de ajuste em `tests/integration/proposal-adjustment.spec.ts`
- [ ] T042 [P] [US2] Escrever testes de expiração e concorrência em `tests/integration/proposal-approval.spec.ts`
- [ ] T043 [US3] Criar migração de pedidos de ajuste e função segura em `supabase/migrations/004_adjustments.sql` após aprovação explícita do utilizador
- [ ] T044 [US2] Criar migração de snapshots e função transacional de aceite em `supabase/migrations/005_approval.sql` após aprovação explícita do utilizador
- [ ] T045 [US2] Implementar endpoints de ajuste e aceite em `app/api/v1/public/proposals/[token]/`
- [ ] T046 [US2] Implementar diálogos públicos de ajuste, validade e recibo em `components/proposal/`
- [ ] T047 [US2] Executar E2E completo de ajuste e aceite em `tests/e2e/proposal-adjustment-approval.spec.ts`

## Phase 10: Telemetria e indicadores

- [ ] T048 Escrever testes de privacidade de evento em `tests/unit/telemetry/event-schema.spec.ts`
- [ ] T049 Criar migração e RLS de eventos em `supabase/migrations/006_telemetry.sql` após aprovação explícita do utilizador
- [ ] T050 Implementar ingestão com rate limit em `app/api/v1/public/proposals/[token]/events/route.ts`
- [ ] T051 Integrar eventos e indicadores essenciais em `components/proposal/` e `components/dashboard/`

## Phase 11: Landing, i18n e acessibilidade (US5)

**Independent test**: visitante alcança autenticação ou proposta exemplo pela landing.

- [ ] T052 [P] [US5] Criar catálogo PT-PT em `lib/i18n/pt-PT.ts`
- [ ] T053 [US5] Implementar landing e roadmap em `app/(marketing)/page.tsx` e `components/marketing/`
- [ ] T054 [US5] Criar proposta de exemplo através de seed em `supabase/seed.sql` após aprovação explícita do utilizador
- [ ] T055 [US5] Executar testes axe e E2E da landing em `tests/e2e/landing.spec.ts`

## Phase 12: Release e validação transversal

- [ ] T056 Rever políticas RLS e permissões de funções no Supabase após aprovação explícita do utilizador
- [ ] T057 Executar `npm.cmd run lint`, `npm.cmd run typecheck`, testes unitários, integração e E2E
- [ ] T058 Validar os cenários de `specs/001-travel-propose-mvp/quickstart.md`
- [ ] T059 Executar `git diff --staged`, atualizar documentação e abrir PR de cada fase

## Dependencies & Execution Order

`1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12`.

US4 depende da fundação multi-tenant; US1 depende do domínio e dashboard; US2 depende
de US1; US3 depende de US2; US5 pode começar após a Fase 2, mas é entregue na Fase 11.

## Parallel Opportunities

- Fase 2: T007 e T008 podem ocorrer em paralelo.
- Fase 5: T020 e T021 podem ocorrer em paralelo.
- Fase 9: T041 e T042 podem ocorrer em paralelo.
- Fase 11: T052 pode ocorrer em paralelo com trabalho visual isolado.

## Implementation Strategy

Começar pela Fase 1 e só iniciar uma fase após validação da anterior. A primeira
demonstração funcional ocorre no fim da Fase 8; a primeira demonstração de negócio
completa ocorre no fim da Fase 11; a Fase 12 é o gate de release.
