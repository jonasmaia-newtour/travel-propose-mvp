# Implementation Plan: TravelPropose MVP

**Branch**: `001-travel-propose-mvp` | **Date**: 2026-08-17 |
**Spec**: [spec.md](spec.md)

## Summary

Construir um SaaS B2B multi-tenant para a agência de demonstração `newtour-test`:
utilizadores internos criam propostas modulares; viajantes simulam opções por link
seguro, pedem ajustes ou aprovam uma combinação congelada. A entrega será organizada
em 12 fases pequenas, cada uma demonstrável, testada e própria para um PR de até 400
linhas. Fases que excedam este limite serão subdivididas antes da implementação.

## Technical Context

**Language/Version**: TypeScript estrito; Node.js v24.19.0 no ambiente local.

**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, shadcn/ui, Zod,
Supabase JS/SSR, Vitest, Playwright e axe para testes de acessibilidade.

**Storage**: Supabase Auth e PostgreSQL; migrações versionadas, RLS e dados de
demonstração.

**Testing**: Vitest para domínio e schemas; testes de integração contra Supabase local
ou ambiente dedicado; Playwright para fluxos críticos; axe no E2E.

**Target Platform**: web responsiva, 375px/768px/1440px; browsers modernos.

**Project Type**: aplicação web full-stack única.

**Performance Goals**: página pública utilizável em menos de três segundos em rede
móvel de teste; criação e publicação em menos de dois minutos.

**Constraints**: PT-PT e i18n; WCAG AA; sem PII em logs; sem integrações de negócio
externas; todos os dados de negócio isolados por `tenant_id`; sem `any` ou strings de
UI hardcoded.

**Scale/Scope**: uma agência e três utilizadores de demonstração; cinco jornadas de
utilizador; 12 fases de entrega; cada PR limitado a 400 linhas alteradas.

## Constitution Check

| Gate | Resultado | Evidência |
|---|---|---|
| Isolamento e privacidade | PASS | Modelo inclui `tenant_id`, RLS e token público hashed. |
| Produto autónomo | PASS | Não há GDS, CRM, pagamentos ou outra integração de negócio. |
| Correção e segurança | PASS | Zod, autorização no servidor e aceite transacional são obrigatórios. |
| UX e i18n | PASS | PT-PT, estados assíncronos e WCAG AA estão no escopo. |
| Entrega testada e rastreável | PASS | TDD, testes por fase, PRs pequenos e CI estão planeados. |

## Project Structure

```text
app/
├── (marketing)/                 # Landing page
├── (auth)/                      # Login e callback
├── (dashboard)/                 # Área autenticada e RBAC
├── p/[token]/                   # Proposta pública
├── api/v1/                      # Endpoints públicos versionados
└── layout.tsx

components/
├── ui/                          # Componentes geridos pelo shadcn/ui
├── proposal/                    # Editor, secções e visualizador
└── dashboard/                   # Pipeline e indicadores

lib/
├── supabase/                    # Clientes browser, server e proxy
├── auth/                        # Guardas de sessão e papéis
├── i18n/                        # Catálogo e formatação PT-PT
└── observability/               # Logging estruturado sem PII

domain/
├── proposal/                    # Preços, seleção, estados e snapshots puros
└── shared/                      # Tipos e resultados de domínio

schemas/                         # Schemas Zod partilhados
supabase/
├── migrations/                  # Schema, funções, RLS e seeds
└── seed.sql
tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Um único projeto Next.js reduz superfície de integração e
permite renderização pública no servidor, área autenticada e ações protegidas no mesmo
limite de deployment.

## Delivery Phases

1. **Governança e repositório** — inicializar Git/GitHub, proteção de ficheiros,
   documentação e CI mínima.
2. **Scaffold web** — criar a aplicação, lint, TypeScript, testes e base shadcn/ui.
3. **Supabase local e ambiente** — ligar CLI, definir variáveis documentadas e
   estabelecer migrações reproduzíveis.
4. **Identidade e multi-tenancy** — organizações, perfis, papéis, seed
   `newtour-test`, autenticação e RLS de fronteira.
5. **Domínio de propostas** — schema, transições, cálculo de preços e testes puros.
6. **Dashboard e RBAC** — shell autenticada, guardas de rota e pipeline por papel.
7. **Criador de propostas** — rascunho, secções e itens com validação e publicação.
8. **Página pública** — token seguro, visualização mobile-first e simulação local.
9. **Ajustes e aceite** — pedido de revisão, validade, snapshot e transação atómica.
10. **Telemetria e indicadores** — eventos anónimos, pipeline e métricas essenciais.
11. **Landing e acabamento UX** — CTAs, proposta de exemplo, roadmap, i18n e
    acessibilidade transversal.
12. **Qualidade de release** — E2E, RLS, axe, segurança, performance e CI final.

Cada fase só começa após a anterior estar verificada. A execução de uma fase gera no
máximo um PR; se o diff estimado ultrapassar 400 linhas, será dividido em tarefas e
PRs menores sem alterar a fronteira funcional da fase.

## Complexity Tracking

Nenhuma violação constitucional prevista.
