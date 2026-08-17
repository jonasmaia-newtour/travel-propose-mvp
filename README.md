# TravelPropose

Plataforma B2B multi-tenant para agências criarem propostas de viagem interativas,
partilharem links seguros e registarem aceite auditável.

## Estado

O MVP está especificado e será entregue em 12 fases modulares. A stack aprovada é
Next.js, TypeScript, Tailwind CSS, shadcn/ui e Supabase.

## Arranque

Requisitos: Node.js 24 e npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

A aplicação fica disponível em `http://localhost:3000`. Consultar `AGENTS.md` para
contexto e `specs/001-travel-propose-mvp/` para especificação, plano e tarefas.

## Qualidade

Antes de cada PR:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test -- --run
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd audit --audit-level=high
```

No Windows sandboxed, o E2E pode precisar de permissão elevada para o Playwright
encerrar o servidor Next. Inspecionar sempre `git diff --staged` antes do commit.
