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
