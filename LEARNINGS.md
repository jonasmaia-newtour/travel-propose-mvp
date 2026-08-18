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

## Git e protocolo de entrega

- **Push direto em `main` é proibido** — causa: trabalho feito sem criar worktree e branch de feature; solução: antes de qualquer fase, criar `git worktree add .worktrees/<branch> -b <branch>`, trabalhar nesse worktree, abrir PR, aguardar CI verde e fazer squash merge. O `.worktrees/` já existe e está no `.gitignore`.

## Supabase e infraestrutura

- **Sequência obrigatória: `supabase init` antes de `supabase link`** — causa: `supabase link` pressupõe `config.toml` local; sem ele o comando falha; solução: executar `supabase init` primeiro para gerar a estrutura local, depois `supabase link --project-ref <ref>`.
- **`supabase link` não exige password da base de dados** — causa: o link apenas associa o `project_ref` ao diretório local; a password só é necessária para operações de migração direta; solução: `supabase link --project-ref <ref>` é suficiente para configurar o ambiente local.
