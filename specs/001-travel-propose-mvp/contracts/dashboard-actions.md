# Contract: Dashboard Actions

As ações exigem sessão autenticada, autorização por papel e RLS. Acesso insuficiente
devolve `403` sem revelar dados de outro tenant.

## Rascunho e publicação

`MEMBER` cria e altera apenas propostas cujo proprietário é o próprio. `ADMIN` e
`OWNER` consultam as propostas do tenant. Publicar requer rascunho completo, validade
futura e pelo menos uma opção selecionável; persiste apenas o hash do token.

## Pipeline

`OWNER` e `ADMIN` recebem propostas e indicadores essenciais do tenant. `MEMBER`
recebe apenas as próprias propostas. Acima de 50 registos, a paginação é obrigatória.
