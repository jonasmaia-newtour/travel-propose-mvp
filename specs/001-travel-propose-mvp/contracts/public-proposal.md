# Contract: Public Proposal API v1

Todos os endpoints públicos usam `/api/v1/public/proposals/{token}`. Token inválido,
expirado ou inexistente devolve `404` com mensagem genérica.

## GET /

Devolve título, marca da agência, moeda, termos, validade, secções e itens. Nunca
devolve IDs internos, `tenant_id`, dados de utilizadores ou hashes.

## POST /events

Entrada: `eventType` (`opened` ou `selection_changed`), `sessionId`, seleção opcional,
dispositivo e país opcionais. Resposta: `204`; aplica rate limit e ignora dados sensíveis.

## POST /adjustments

Entrada: mensagem de 1 a 2000 caracteres e `sessionId`. Resposta: `202` para pedido
aceite; estado inválido ou expiração devolve `409`.

## POST /approval

Entrada: itens selecionados, versão dos termos, `termsAccepted: true`, `sessionId`.
Sucesso: `201` e recibo público. Seleção inválida: `422`; proposta expirada, aprovada
ou alterada: `409`.
