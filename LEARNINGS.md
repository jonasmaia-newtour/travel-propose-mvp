# Aprendizados técnicos

Entradas curtas e reutilizáveis para este e futuros projetos. Registar apenas depois de confirmar a causa e a solução.

## Ambiente e ferramentas

- **`npm.ps1` bloqueado no PowerShell** — causa: política de execução do Windows; solução: usar `npm.cmd` e `npx.cmd`.
- **Git recusa worktree com `dubious ownership`** — causa: worktree criado pelo utilizador e executado no sandbox; solução: adicionar apenas o caminho exato a `safe.directory`.
- **Scripts Superpowers não executam** — causa: Bash indisponível no Windows; solução: reproduzir o protocolo manualmente com workspace ignorado, briefs, relatórios e ledger.
- **Branch Protection e Rulesets retornam 403** — causa: repositório privado sem GitHub Pro; solução: manter PR+CI como gate operacional até atualizar o plano, sem tornar o repositório público.
- **GitHub CLI alterna 503/404** — causa possível: incidente em API/Actions; solução: consultar `githubstatus.com` antes de repetir chamadas, mas ainda inspecionar logs porque uma falha real pode coexistir com a indisponibilidade.

## Next.js e interface

- **`create-next-app` recusa a raiz** — causa: diretório já contém documentação; solução: gerar numa pasta temporária isolada e copiar apenas os artefactos necessários.
- **Build falha ao obter Geist** — causa: `next/font/google` exige rede durante o build; solução: remover a fonte remota e usar uma pilha local de fontes.
- **Template viola regras do produto** — causa: copy, links externos, idioma inglês e cores arbitrárias gerados por defeito; solução: remover o template antes do primeiro commit.
- **Next.js modifica `AGENTS.md`** — causa: Next 16 acrescenta regras locais ao executar `next dev`; solução: rever e versionar o bloco gerado para manter o worktree limpo.
- **`tsconfig.tsbuildinfo` aparece no Git** — causa: TypeScript incremental; solução: ignorar `*.tsbuildinfo`.

## Qualidade e testes

- **Shadcn rejeita `--base-color`** — causa: opção alterada na versão atual do CLI; solução: usar os defaults suportados, remover artefactos extras e configurar tokens em `app/globals.css`.
- **Instalação npm fica sem resposta** — causa: falha transitória de rede; solução: diagnosticar com `npm.cmd view`, usar timeout e retries limitados e não esperar indefinidamente.
- **Vitest avisa sobre ESM** — causa: configuração ESM carregada como CommonJS; solução: declarar `"type": "module"` no `package.json`.
- **Vitest tenta executar testes Playwright** — causa: padrão global recolhe `tests/e2e`; solução: limitar `test.include` aos testes unitários no `vitest.config.ts`.
- **Typecheck local passa e falha na CI com `LayoutProps`** — causa: `.next` local contém tipos globais gerados que não existem numa instalação limpa; solução: tipar o layout explicitamente com `ReactNode` e validar sem `.next`.
- **axe falha na página vazia** — causa: ausência de `<title>` e `<h1>`; solução: criar baseline acessível mínimo antes da landing completa.
- **E2E passa, mas não encerra no sandbox Windows** — causa: Playwright usa `taskkill /T /F` no teardown e o sandbox bloqueia a operação; solução: executar localmente com permissão elevada. Na CI Linux, o Playwright termina o grupo com `SIGKILL`.
- **Zod `result.error.errors` vs `result.error.issues`** — causa: Zod v3+ usa a propriedade `.issues` (não `.errors`); aceder a `.errors` lança `Cannot read properties of undefined`; solução: usar sempre `result.error.issues`.
- **`typeof window` como guarda de servidor falha em jsdom** — causa: o ambiente jsdom do Vitest define `window`, fazendo a guarda rejeitar todas as chamadas a funções de servidor; solução: remover a guarda de runtime e confiar em convenção de nomenclatura + TypeScript.
- **`NODE_ENV` é `readonly` em `NodeJS.ProcessEnv`** — causa: `@types/node` declara `NODE_ENV` como readonly, impedindo atribuição direta nos testes; solução: fazer cast para `Record<string, string | undefined>` — ex: `(process.env as MutableEnv)['NODE_ENV'] = 'test'`.
- **E2E falha com `element(s) not found` em botão de server action** — causa: ao clicar em "Guardar rascunho"/"Publicar", a ação de servidor demora mais que o timeout default do expect (5s) — vários roundtrips ao Supabase — e o `useFormStatus` muda o label do botão para "A guardar…" durante o pending, fazendo `getByRole('button', { name: 'Guardar rascunho' })` não encontrar o elemento; solução: passar timeout explícito (30s) nos asserts que seguem uma submissão de server action.

## Git e protocolo de entrega

- **Push direto em `main` é proibido** — causa: trabalho feito sem criar worktree e branch de feature; solução: antes de qualquer fase, criar `git worktree add .worktrees/<branch> -b <branch>`, trabalhar nesse worktree, abrir PR, aguardar CI verde e fazer squash merge. O `.worktrees/` já existe e está no `.gitignore`.
- **Repetir o commit após um revert não resolve a violação** — causa: após o revert de um commit direto em `main`, o agente voltou a commitar o mesmo conteúdo em `main`; solução: nunca commitar em `main`; mover o trabalho para uma worktree/branch e prosseguir por PR.
- **CI silenciosa em push a `main`** — causa: o workflow usa `branches-ignore: [main]`, logo pushes diretos nunca são verificados; solução: manter o workflow ativo também em `push` a `main` para detetar quebras mesmo sem GitHub Pro (rulesets continuam a devolver 403).
- **CI silenciosa em PR com conflitos de merge** — causa: o GitHub Actions não cria runs de `pull_request` enquanto o PR não é mergável (nem `synchronize` nem `reopened` são processados); solução: resolver os conflitos; os runs aparecem automaticamente assim que o PR fica mergável. Não é preciso re-disparar nem contactar o suporte.

- **`npm ci` incompleto deixa `node_modules` sem pacotes** — causa: instalação interrompida; `node_modules` fica só com `.vite`/`.vite-temp` e o `npm run test` resolve vitest do cache global com transforms obsoletos; solução: verificar `node_modules/.bin/vitest.cmd` e `npm ls vitest` após o `npm ci`, e limpar `node_modules/.vite` antes de re-correr.
- **Vitest não resolve imports relativos com níveis a menos** — causa: ficheiro em `tests/unit/proposal/` precisa de `../../../` (três níveis) até à raiz, não `../../`; solução: contar os níveis a partir do diretório do ficheiro, não do `tests/unit/`.

## Supabase e infraestrutura

- **Sequência obrigatória: `supabase init` antes de `supabase link`** — causa: `supabase link` pressupõe `config.toml` local; sem ele o comando falha; solução: executar `supabase init` primeiro para gerar a estrutura local, depois `supabase link --project-ref <ref>`.
- **`supabase link` não exige password da base de dados** — causa: o link apenas associa o `project_ref` ao diretório local; a password só é necessária para operações de migração direta; solução: `supabase link --project-ref <ref>` é suficiente para configurar o ambiente local.
- **Ficheiros SQL gravados como UTF-16LE no Windows** — causa: `Set-Content` do PowerShell 5.1 usa UTF-16LE por omissão; o git trata o ficheiro como binário e o Postgres recusa executá-lo; solução: escrever sempre UTF-8 sem BOM com LF (ex: `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding($false)))`) e validar a codificação antes de commitar.
- **`Get-Content` mostra mojibake em UTF-8 sem BOM** — causa: o PowerShell 5.1 lê com a codepage ANSI quando não há BOM; solução: ler com `-Encoding UTF8` ou `git show` para confirmar o conteúdo real antes de alterar um ficheiro.
- **`oklch` não é tipo PostgreSQL** — causa: valores de cor CSS usados como tipo de coluna; solução: guardar cores como `text` e aplicar tokenização no frontend, nunca tipos de cor no schema.
- **Trigger referencia função inexistente** — causa: `CREATE TRIGGER ... execute function update_updated_at_column()` sem a função ser criada na mesma migração, antes dos triggers; o `CREATE TRIGGER` falha; solução: criar `update_updated_at_column()` como primeira migração.
- **`current_setting('app.user_id')` em políticas RLS falha em runtime** — causa: o parâmetro nunca é definido na sessão da aplicação; solução: usar `auth.uid()` do Supabase para identificar o utilizador autenticado nas policies.
- **Seed falha com `cannot insert a non-DEFAULT value into column "email"`** — causa: em versões recentes do Supabase, `auth.identities.email` é uma coluna gerada a partir de `identity_data`; o insert explícito é recusado (428C9); solução: omitir `email` do insert e garantir `identity_data` com `'email'` no JSON.
- **CI fica pendurada no passo "Install Playwright browser" sem sair** — causa: flake recorrente do runner/CDN no download do navegador (1 em cada ~3 runs, já observado nos PRs #13/#14/#16/#17/#19/#20); os mesmos PRs passam em ~2 min após `gh run cancel` + `gh run rerun` (runner/CDN diferentes); solução imediata: cancelar e re-disparar o run; solução a implementar antes da Fase 8: cache do Playwright (`actions/cache` no `.cache/ms-playwright`), retry automático do passo no workflow ou pin da versão do browser.
- **E2E perde sessão/flake de auth a partir de runners do GitHub Actions** — causa: o Supabase Auth tem limites de rate **por IP** e os IPs dos runners são partilhados por milhares de jobs (outros repos consomem o orçamento); além disso, o `signInWithPassword` chegou a demorar ~30 s a responder (latência/congestionamento da rede do runner), fazendo o teste desistir; o login devolve a MESMA mensagem "E-mail ou palavra-passe incorretos" para qualquer erro (incluindo 429), impossibilitando distinguir falha real de rate limit; solução: (1) subir os limites de auth no dashboard Supabase; (2) reduzir sign-ins com `storageState` (setup login uma vez por papel, ~15→3 por run) e setup em série; (3) separar o E2E completo do CI de PRs — no PR só lint/typecheck/unit/axe (sem auth), o E2E completo corre nightly (cron 03:00 UTC) e manual (`workflow_dispatch`).
- **Token do Supabase CLI no Windows via Credential Manager** — causa: `~/.supabase/access-token` não existe em todas as versões do CLI no Windows; o token vive no Windows Credential Manager como `LegacyGeneric:target=Supabase CLI:supabase`; solução: ler com PInvoke `CredRead` (advapi32, tipo 1) e descodificar o `CredentialBlob` como **ASCII/UTF-8** (não Unicode — o blob é ASCII; descodificar como Unicode trunca o token a metade); usar o PAT (`sbp_…`) com a Management API — ex.: `POST /v1/projects/{ref}/database/query` com body `{"query": "select email, banned_until from auth.users …"}` — permite diagnosticar bans e sessões sem dashboard.
