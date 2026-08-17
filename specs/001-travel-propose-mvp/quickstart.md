# Quickstart: Validar o TravelPropose MVP

## Pré-requisitos

- Node.js 24 ou LTS suportada pelo Next.js.
- `npm.cmd` enquanto a política PowerShell bloquear o wrapper `npm.ps1`.
- Supabase CLI autenticada e ligada ao projeto `travel-propose-mvp`.
- Variáveis locais preenchidas a partir de `.env.example`; `.env.local` nunca é versionado.

## Preparar o ambiente

1. Instalar dependências com `npm.cmd install`.
2. Aplicar migrações e seed com os comandos documentados no README após a Fase 3.
3. Iniciar com `npm.cmd run dev`.
4. Abrir a landing page e autenticar com um utilizador de demonstração.

## Cenário de validação

1. Entrar como Agent, criar proposta com secções `single` e `multiple`, e publicar.
2. Abrir o link numa sessão sem autenticação e alterar opções.
3. Enviar pedido de ajuste; rever, republicar e abrir novamente o link.
4. Aceitar termos e aprovar; confirmar recibo e bloqueio da segunda aprovação.
5. Entrar como Manager e Owner para confirmar pipeline; Agent só vê as próprias propostas.

## Verificações automáticas

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run test`
- `npm.cmd run test:integration`
- `npm.cmd run test:e2e`

Antes de um PR: executar verificações relevantes e inspecionar `git diff --staged`.
