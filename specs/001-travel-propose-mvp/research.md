# Research: TravelPropose MVP

## Autenticação de sessões

**Decision**: Usar sessões por cookie com `@supabase/ssr` e clientes distintos para
browser e servidor.

**Rationale**: O guia oficial recomenda `@supabase/ssr` em frameworks SSR; a sessão
fica disponível tanto para componentes no servidor como para interações no browser e
o proxy renova tokens. Rotas autenticadas são dinâmicas e não são colocadas em cache.

**Alternatives considered**: Armazenamento no browser foi rejeitado porque impede a
autorização consistente no servidor; um provedor de autenticação adicional foi
rejeitado por aumentar dependências externas.

**Sources**: [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework),
[Supabase advanced SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Isolamento de dados

**Decision**: Ativar RLS em todas as tabelas expostas e aplicar políticas por
organização e papel; dar acesso público apenas por funções ou endpoints que validam o
token da proposta.

**Rationale**: RLS funciona como camada final de defesa e políticas são avaliadas em
cada acesso. Funções não recebem RLS automaticamente, pelo que permissões de execução
serão mínimas e revistas.

**Alternatives considered**: Filtrar somente no código da aplicação foi rejeitado por
não garantir isolamento quando uma nova query é acrescentada.

**Sources**: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

## Aceite de proposta

**Decision**: Executar a validação de prazo, validação da seleção, criação do snapshot
e alteração de estado numa única função transacional no PostgreSQL.

**Rationale**: Evita aprovações duplicadas e o caso em que a proposta expira entre
leitura e escrita. O endpoint expõe apenas um contrato de sucesso ou conflito.

**Alternatives considered**: Múltiplas escritas do cliente foram rejeitadas por não
serem atómicas e por exporem regras comerciais.

## Interface e performance

**Decision**: Renderizar landing e página pública no servidor; manter interatividade
de seleção apenas na parte necessária da página; usar shadcn/ui e tokens de tema.

**Rationale**: Componentes no servidor não aumentam o JavaScript do cliente e o App
Router permite separar conteúdo estático de interações.

**Alternatives considered**: SPA integral foi rejeitada por piorar a primeira carga e
exigir SSR adicional para cumprir o objetivo da página pública.

**Sources**: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist),
[shadcn/ui installation](https://ui.shadcn.com/docs/installation/next).

## Qualidade e entrega

**Decision**: Vitest cobre domínio e schemas; Playwright e axe cobrem jornadas e
acessibilidade; cada fase fecha lint, typecheck e testes relevantes antes do PR.

**Rationale**: Separa regras puras de fluxos web e permite encontrar regressões de
segurança e experiência antes da integração.

**Alternatives considered**: Apenas E2E foi rejeitado por tornar a deteção de erros de
domínio lenta e pouco precisa.
