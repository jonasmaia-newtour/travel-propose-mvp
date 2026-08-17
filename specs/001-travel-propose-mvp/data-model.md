# Data Model: TravelPropose MVP

## Convenções

- Todas as tabelas de domínio incluem `id`, `created_at` e `updated_at`.
- Tabelas organizacionais incluem `tenant_id` indexado e chave estrangeira para a organização.
- Valores monetários usam precisão decimal; datas usam timestamp com fuso; estados e papéis usam enums.
- RLS é ativado em cada tabela exposta. Chaves estrangeiras e campos de procura têm índices.

## Entidades

### organizations

`id`, `name`, `slug` único, `logo_url` opcional, `primary_color`, `locale`.
Representa a agência; a seed inicial cria `newtour-test`.

### profiles

`id` referencia o utilizador autenticado, `tenant_id`, `full_name`, `role`, `is_active`.
Papéis: `OWNER`, `ADMIN`, `MEMBER`, `GUEST`. Um perfil pertence a uma organização.

### proposals

`id`, `tenant_id`, `owner_id`, `title`, `client_name`, `base_amount`, `currency`,
`payment_terms`, `status`, `token_hash` opcional, `expires_at`, `published_at` e
`approved_at` opcionais. Estados: `draft`, `sent`, `viewed`, `revision_requested`,
`approved`, `expired`. Índices: `(tenant_id, status)`, `(owner_id, status)`, validade.

### proposal_sections e proposal_items

Uma secção tem `proposal_id`, título, modo `single` ou `multiple` e ordem. Um item
tem proposta, secção, título, descrição/imagem opcionais, `price_delta`, valor
predefinido e ordem. Itens pertencem à proposta e são a cópia congelável do MVP.

### proposal_adjustment_requests

`tenant_id`, `proposal_id`, mensagem, identificador de sessão hashed, data do pedido e
data de resolução opcional. É append-only e nunca armazena IP em bruto.

### proposal_approval_snapshots

`tenant_id`, `proposal_id` único, snapshot, versão dos termos, sessão hashed e data.
O snapshot contém título, moeda, valor base, deltas, total e itens selecionados.

### proposal_events

`tenant_id`, `proposal_id`, tipo `opened` ou `selection_changed`, sessão hashed,
dispositivo/país opcionais, payload limitado e data. É append-only e sem PII.

## Regras e transições

| Evento | Pré-condição | Resultado |
|---|---|---|
| Publicar | rascunho completo e validade futura | `sent` e novo token hash |
| Abrir | link válido de proposta enviada | `viewed` e evento `opened` |
| Pedir ajuste | proposta válida | pedido registado e retorno a `draft` |
| Aprovar | proposta válida e seleção correta | snapshot único e `approved` |
| Expirar | validade ultrapassada sem aceite | `expired` |

## Funções de base de dados

- `approve_public_proposal`: valida token, estado, prazo e seleção; cria snapshot e
  atualiza estado numa transação.
- `request_public_adjustment`: valida link e prazo; cria pedido e devolve a proposta.
- `get_public_proposal`: devolve apenas a representação pública de proposta válida.

Funções públicas têm permissões mínimas e nunca expõem identificadores internos.
