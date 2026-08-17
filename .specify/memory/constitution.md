<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles: none; initial project principles established
- Added sections: Segurança e Arquitetura; Fluxo de Desenvolvimento e Revisão
- Removed sections: none
- Follow-up TODOs: none
-->

# TravelPropose Constitution

## Core Principles

### I. Isolamento Multi-Tenant e Privacidade por Defeito

Todos os dados organizacionais MUST conter `tenant_id` e ser protegidos por RLS.
Nenhuma ação, consulta, log ou evento pode permitir acesso, inferência ou divulgação
entre organizações. Logs MUST excluir PII, tokens, palavras-passe e IP em bruto.

### II. Produto Autónomo e Configurável

O domínio de negócio MUST funcionar sem GDS, consolidadoras, CRM, pagamentos ou
outras integrações externas. Marcas, textos operacionais, regras por organização e
funcionalidades opcionais MUST ser configuráveis por tenant, sem valores hardcoded.

### III. Correção, Segurança e Tipagem Primeiro

Entradas MUST ser validadas no cliente e servidor com schemas explícitos. Código
MUST manter tipagem estrita, sem `any`, casts cegos, `@ts-ignore` ou erros
silenciados. Alterações de dados MUST ser autorizadas no servidor e, quando
relevante, protegidas por transações atómicas.

### IV. UX Acessível e Internacionalizável

A interface MUST usar PT-PT como idioma base, chaves de tradução para todo texto
visível, HTML semântico, navegação por teclado, foco visível e contraste WCAG AA.
Fluxos assíncronos MUST incluir estados de loading, erro recuperável, vazio e
feedback imediato quando adequado. A experiência começa em 375px e escala para
tablet e desktop.

### V. Entregas Pequenas, Testadas e Rastreáveis

Cada alteração MUST ter responsabilidade clara, evitar abstração especulativa e
permanecer preferencialmente abaixo de 250 linhas por ficheiro. Regras de domínio,
transições de estado, isolamento e fluxos críticos MUST ter testes automatizados.
Nenhuma entrega é concluída sem lint, tipagem, testes relevantes e inspeção do diff.

## Segurança e Arquitetura

O projeto usa autenticação e base de dados Supabase, com PostgreSQL e RLS como
fronteira final de isolamento. APIs públicas MUST usar versionamento por path quando
expostas a clientes, validar payloads e aplicar rate limiting nos fluxos sensíveis.
Segredos MUST ficar fora do repositório; apenas `.env.example` documentado pode ser
versionado. Alterações de schema MUST usar migrações versionadas e reversíveis.

## Fluxo de Desenvolvimento e Revisão

Especificações, planos e tarefas são produzidos com Spec-Kit antes da implementação.
Para tarefas que alterem mais de dois ficheiros, o plano técnico MUST ser aprovado
antes de editar código. Desenvolvimento segue TDD quando houver comportamento novo
ou correção. Antes de qualquer commit, MUST ser executado `git diff --staged`.
Commits usam Conventional Commits e alterações chegam a `main` apenas por PR com CI
verde. Documentação e comentários são em português; identificadores de código são
em inglês.

## Governance

Esta constituição complementa `RULES.md`, que prevalece em caso de conflito, e
`AGENTS.md`, que conserva o contexto aprovado do produto. Toda especificação, plano,
tarefa, revisão e PR MUST verificar conformidade com estes documentos. Alterações a
esta constituição exigem registo da motivação, avaliação de impacto e atualização de
documentos dependentes. A versão segue SemVer: MAJOR para redefinições incompatíveis,
MINOR para novos princípios ou obrigações materiais e PATCH para clarificações.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
