# REGRAS GLOBAIS DE ENGENHARIA DE SOFTWARE AGÊNTICA — PRODUTO MULTI-ORGANIZAÇÃO (RULE.md)

Este documento é a **diretiva operacional de desenvolvimento** para a IA e para o desenvolvedor em projetos pessoais de padrão enterprise. Todo software deve ser concebido desde o Dia 1 como um **produto multi-organização autônomo, desacoplado e distribuível (B2B / White-Label)**, pronto para uso interno ou para ser vendido/disponibilizado a empresas externas com total independência de gestão e isolamento absoluto de dados.

---

## 1. PROTOCOLO OPERACIONAL E HARNESS DA IA

- **Auto-Verificação Pré-Entrega (Obrigatória):**
  1. *Compilação/Lint:* Zero erros e zero warnings novos (`npm run lint`, `tsc --noEmit`).
  2. *Tipagem Estrita:* Proibido `any`, `unknown` não refinado ou `@ts-ignore`. Tudo estritamente tipado.
  3. *Importações:* Nenhuma dependência órfã ou módulo quebrado.
  4. *Testes:* Executar a suíte e garantir cobertura mínima (lógica de domínio ≥ 90%, restante ≥ 70%).
  5. *Regra do "Não Piorar":* Não degradar código ou testes que já funcionavam.
- **Debugging & Recuperação de Erros:**
  - Diagnóstico obrigatório via stack trace completo antes de tentar correções.
  - Formular hipótese explícita antes de editar código.
  - **Limite de 3 Tentativas:** Se falhar 3 vezes consecutivas no mesmo bug, **PARAR** e apresentar: (1) o que foi tentado, (2) o que falhou, (3) hipóteses e pedido de ajuda.
  - **Proibido Mascarar Erros:** Nunca usar `catch {}` vazio, desativar asserções ou silenciar linters.
- **Comunicação:**
  - Ambiguidade em requisitos → perguntar antes de assumir premissas.
  - Tarefas com > 2 ficheiros → apresentar plano técnico e aguardar confirmação.
  - Nunca inventar funcionalidades fora do escopo aprovado.

---

## 2. ESTRUTURA MÍNIMA DE REPOSITÓRIO (SCAFFOLDING OBRIGATÓRIO)

Ao inicializar qualquer novo repositório, o agente deve garantir a presença dos seguintes ficheiros estruturais:

- `README.md`: Propósito do produto, stack, instruções de arranque e comandos de teste.
- `CONTRIBUTING.md`: Guia de contribuição local e particularidades do projeto.
- `SECURITY.md`: Política de reporte responsável de vulnerabilidades.
- `CODEOWNERS`: Definição de responsabilidade de módulos.
- `.gitignore` e `.gitattributes`: Normalização de fins de linha (`* text=auto eol=lf`) e bloqueio de ficheiros binários/locais.
- `.github/PULL_REQUEST_TEMPLATE.md`: Modelo oficial de Pull Request.
- `.env.example`: Template de variáveis de ambiente com documentação de cada chave.
- `AGENTS.md` / `RULE.md`: Contexto vivo e regras de desenvolvimento para assistentes de IA.

---

## 3. ARQUITETURA DE PRODUTO MULTI-ORGANIZAÇÃO AUTÔNOMA (B2B / WHITE-LABEL)

O software é desenhado como um produto independente: você é o dono do código, mas cada empresa compradora opera, gere e administra o seu próprio ambiente com total autonomia e isolamento:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ORGANIZAÇÃO / EMPRESA CLIENTE (TENANT)               │
│  ├── Workspace & Identidade Visual (Logo, Cores e Nome do Tenant)      │
│  ├── Painel de Auto-Gestão (Administração independente de utilizadores)│
│  ├── Gestão Própria de Membros e RBAC (Owner, Admin, Member, Guest)    │
│  ├── Configurações, Parâmetros e Políticas Internas do Tenant          │
│  └── Políticas de Isolamento RLS na Base de Dados (Zero Data Leakage)  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Isolamento Absoluto de Dados (Zero Cross-Company Data Leakage):**
  - Toda tabela que armazena dados de organizações deve conter `tenant_id` indexado.
  - O isolamento é imposto no nível da base de dados via **Row-Level Security (RLS)**. Nenhuma empresa pode aceder, visualizar ou inferir dados de outra organização sob nenhuma hipótese.
- **Auto-Gestão Completa (Self-Service Administration):**
  - Cada empresa cliente possui os seus próprios administradores (`OWNER` / `ADMIN`), capazes de convidar colaboradores, revogar acessos e definir permissões sem qualquer dependência ou intervenção externa.
- **Zero Regras ou Marcas Hardcoded:**
  - Proibido codificar regras de negócio, logos, nomes ou termos fixos de uma empresa específica no código-fonte. Tudo deve ser lido dinamicamente das configurações da organização (suporte nativo a White-Label).
- **Desacoplamento e Flexibilidade de Distribuição:**
  - A aplicação deve estar preparada para operar tanto em **Nuvem Partilhada Multi-Tenant** (múltiplas empresas no mesmo cluster isoladas por RLS) quanto para ser empacotada como **Instância Dedicada / On-Premise** (Docker / Kubernetes isolado para um cliente corporativo).
- **Feature Flags por Tenant:**
  - Funcionalidades controladas por feature flags para rollout gradual, A/B testing e kill switches de emergência por organização.
- **Auditoria e Logs Isolados por Organização:**
  - Registar sempre `tenant_id`, `user_id` e timestamp em logs estruturados para auditoria e rastreabilidade independente de cada empresa.

---

## 4. RBAC (ROLE-BASED ACCESS CONTROL)

- **Hierarquia de Perfis por Organização:**
  - `OWNER`: Dono da organização, gestão global da conta e exportação de dados.
  - `ADMIN`: Administrador da empresa, gestão de membros, convites e configurações operacionais.
  - `MEMBER`: Utilizador padrão, operação diária das funcionalidades do software.
  - `GUEST`: Utilizador convidado ou auditor, acesso restrito de apenas leitura.
- **Enforcement em 3 Camadas:**
  1. *Camada Visual (UI):* Ocultar botões, menus e ações não autorizadas para o perfil do utilizador.
  2. *Camada de API / Server Functions:* Validar perfil e permissão antes de processar qualquer mutação (*fail-fast* 403 Forbidden).
  3. *Camada de Dados (BD):* Políticas RLS restritivas validando o perfil do utilizador na sessão.

---

## 5. IDIOMAS, INTERNACIONALIZAÇÃO (i18n) & NOMENCLATURA

- **Convenção de Idioma no Código:**
  - **Identificadores em Inglês:** Nomes de variáveis, funções, classes, métodos, ficheiros, tabelas e colunas devem ser escritos estritamente em **Inglês** (ex: `calculateTax()`, `userProfile`, `invoiceItems`).
  - **Documentação e Comentários em Português:** Comentários de código, docstrings explicativas, Pull Requests e documentação de arquitetura devem ser escritos em **Português**.
- **Zero Strings Hardcoded:** Proibido escrever textos de UI diretamente no JSX/HTML. Todo texto visível deve usar chaves de tradução (ex: `t('auth.login.submit')`).
- **Padrão de Idioma na UI:** Português de Portugal (**PT-PT**) como idioma base padrão, estruturado para suporte imediato a Inglês (**EN**) e outros idiomas.
- **Localização de Formatos:** Formatação de moedas (`Intl.NumberFormat`), datas (`Intl.DateTimeFormat`) e números respeitando o locale do tenant/utilizador.

---

## 6. ACESSIBILIDADE (WCAG AA) & EXPERIÊNCIA DO UTILIZADOR

- **Semântica HTML5:** Utilizar `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<button>` nativos.
- **Teclado & Foco:** Navegação completa por teclado com anéis de foco claramente visíveis (`focus-visible`).
- **Contraste & Cores:** Contraste mínimo de 4.5:1 para texto normal. **Proibido usar cores hardcoded** — usar sempre tokens globais do tema.
- **Testes de Acessibilidade Automáticos:** Integrar `axe-core` ou `@axe-core/playwright` na CI para deteção precoce de violações WCAG.
- **Resiliência Visual (Error Boundaries):** Envolver tabelas, gráficos e formulários complexos em Error Boundaries. Se um widget quebrar, o restante da aplicação permanece funcional (zero ecrã branco).
- **4 Estados Visuais Obrigatórios para Operações Assíncronas:**
  1. *Loading:* Skeleton screens para carregamento inicial; spinners para botões de ação.
  2. *Error:* Mensagem contextual clara em PT-PT com botão de repetição (*retry*).
  3. *Empty State:* Ilustração/ícone + mensagem explicativa + botão de Call-to-Action.
  4. *Optimistic Updates:* Resposta visual imediata em ações frequentes com reversão automática em caso de falha.
- **Design Responsivo Mobile-First:** Testar resoluções 375px (mobile), 768px (tablet) e 1440px (desktop).
- **Performance Budgets:** LCP < 2.5s, CLS < 0.1, FID/INP < 100ms, Lighthouse ≥ 90.

---

## 7. PRINCÍPIOS DE CÓDIGO LIMPO E ARQUITETURA

- **SOLID:**
  - **S (Single Responsibility):** Cada ficheiro, hook ou componente tem uma única responsabilidade.
  - **O (Open/Closed):** Componentes extensíveis via composição (`children`), sem edição direta de código consolidado.
  - **L (Liskov Substitution):** Subtipos substituem tipos base sem alterar comportamento.
  - **I (Interface Segregation):** Interfaces pequenas, focadas e coesas.
  - **D (Dependency Inversion):** Dependa de abstrações/interfaces, não de classes concretas.
- **DRY, KISS e YAGNI:** Inspecionar e reutilizar código existente; sem abstrações especulativas para o futuro; manter a solução simples e elegante.
- **Arquitetura Decoupled:**
  - *Componentes Visuais:* Puramente apresentacionais ("burros"), recebem dados e disparam callbacks via props.
  - *Lógica de Estado:* Extraída para custom hooks ou serviços de domínio.
  - *Funções Puras:* Cálculos e regras de negócio isoladas em `utils/` ou `domain/` sem dependência de framework.
- **Guideline de 250 Linhas por Ficheiro:** Ficheiros que excedam 250 linhas devem ser revistos para possível fatiamento. Exceções aceites para migrações, schemas complexos e ficheiros gerados.

---

## 8. VALIDAÇÃO, SEGURANÇA E RGPD

- **Validação Dupla com Zod:** Todos os formulários e rotas de API/Server Actions devem validar payloads com Zod (`safeParse`). Schemas compartilhados em `schemas/`.
- **Prevenção de XSS:** Todo texto do utilizador sanitizado com `DOMPurify`. Markdown externo sanitizado com `rehype-sanitize`. Proibido `dangerouslySetInnerHTML` sem sanitização.
- **Prevenção de SQLi:** Utilizar unicamente queries parametrizadas ou ORMs tipados. Proibida concatenação de strings em SQL.
- **Security Headers:** `Content-Security-Policy` restritiva (default-src 'self', sem `unsafe-inline`/`unsafe-eval` em produção), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000`, `Permissions-Policy: camera=(), microphone=()`.
- **Rate Limiting:** Obrigatório em rotas de autenticação, pagamentos e chamadas de IA.
- **Higiene de Segredos:** Zero segredos ou `.env` no repositório. `.env.example` commitado com todas as chaves documentadas; validação no arranque (*fail-fast*).
- **Conformidade com o RGPD (5 Direitos):**
  1. *Apagamento (Art. 17):* Rotina de anonimização ou exclusão a pedido.
  2. *Portabilidade (Art. 20):* Exportação estruturada (JSON/CSV) por organização/utilizador.
  3. *Consentimento Explícito:* Registo auditável com timestamp; proibido pré-marcar checkboxes.
  4. *Privacidade:* Página pública com prazos de retenção documentados.
  5. *Minimização:* IPs anonimizados em logs após período de diagnóstico.

---

## 9. BASE DE DADOS, LOGGING E ENGENHARIA DE DADOS

- **Migrações Versionadas:** Nenhuma alteração de schema manual em produção; todas versionadas em arquivos de migração.
- **Higiene de Tabelas:**
  - Triggers automáticos para atualizar timestamp em colunas `updated_at`.
  - Tipos **ENUM** para valores controlados (status, perfil, prioridade), nunca texto livre.
  - Índices para todas as chaves estrangeiras, `tenant_id` e colunas de busca frequente.
- **Paginação Server-Side:** Listas ou tabelas com > 50 itens devem ser obrigatoriamente paginadas no servidor.
- **Logging Estruturado (JSON):**
  - Níveis: `ERROR`, `WARN`, `INFO`, `DEBUG`. Cada entrada com `timestamp`, `tenant_id`, `user_id`, `trace_id` e `message`.
  - **Proibido logar PII** (passwords, tokens, dados pessoais). IPs anonimizados conforme RGPD.
- **Backups e Disaster Recovery:**
  - Backups automatizados diários com retenção mínima de 30 dias. RPO ≤ 24h, RTO ≤ 4h.
  - Procedimento de restauração documentado e testado periodicamente.

---

## 10. GESTÃO DE DEPENDÊNCIAS E SUPPLY CHAIN

- **Auditoria Contínua:** Executar `npm audit` (ou equivalente) na CI; vulnerabilidades críticas/altas bloqueiam o merge.
- **Atualizações Automatizadas:** Configurar Dependabot ou Renovate para PRs automáticos de atualização.
- **Critérios de Adoção:** Antes de adicionar uma nova dependência, avaliar: manutenção ativa, licença compatível (MIT/Apache 2.0), impacto no bundle size e alternativas nativas.

---

## 11. API VERSIONING E CONTRATOS

- **Versionamento por Path:** APIs expostas a clientes seguem o padrão `/api/v1/`, `/api/v2/`.
- **Política de Deprecação:** Versões anteriores mantidas por no mínimo 6 meses após lançamento da nova versão, com header `Deprecation` e data de fim de vida.
- **Changelog de API:** Manter `CHANGELOG.md` atualizado com breaking changes, adições e correções.

---

## 12. GITHUB FLOW PESSOAL, COMMITS E PRS

- **Ramo Permanente Único:** `main` (sempre estável e deployável).
- **Ramos Curtos (≤ 5 dias úteis):** `<tipo>/<descricao-com-hifens>` (ex: `feat/auth-social`, `fix/arredondamento-iva`, `ai/relatorio-vendas`).
- **Inspeção Pré-Commit Obrigatória:** Antes de cada commit, executar obrigatoriamente `git diff --staged` para garantir que apenas o diff pretendido seja commitado.
- **Push Seguro e Histórico:** Proibido `git push --force` (usar apenas `git push --force-with-lease` no ramo próprio). Proibido reescrever história de `main` (usar `git revert`).
- **Conventional Commits (≤ 72 caracteres):**
  - Formato: `<tipo>(<âmbito-opcional>): <assunto-no-imperativo>`
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Exemplos: `feat(auth): adicionar suporte a login com google`, `fix(faturas): corrigir calculo de taxas`.
- **Pull Requests (≤ 400 linhas alteradas):**
  - Abertura precoce em Draft com modelo completo (O que muda, Porquê, Como validar, Risco e reversão, Verificação).
  - **Autoaprovação Consciente:** Como projeto pessoal, o autor inspeciona a CI verde, valida os testes locais e aprova/mergeia o seu próprio PR por **Squash and Merge**, apagando o ramo de trabalho em seguida.

---

## 13. GOVERNANÇA DE IA & RESPONSABILIDADE

- **Liberdade de Ferramentas com Rigor de Harness:** Permissão para utilizar qualquer assistente avançado (Antigravity, Agy, Claude Code, Cursor, Codex), aplicando rigorosamente os protocolos deste documento.
- **Responsabilidade & Coautoria:** O autor humano é 100% responsável pelo código gerado. Declarar `Co-authored-by: <agente> <email>` quando a IA gerar parte substancial.
- **Proteção de Segredos:** Proibido colar chaves de produção ou dados reais em assistentes de IA.

---

## 14. AMBIENTES, CI/CD E RESPOSTA A INCIDENTES

- **Ambientes Padronizados:** `desenvolvimento` → `staging` → `producao`.
- **Construção Única:** O artefacto compila uma vez em `main` e é promovido entre ambientes.
- **Pirâmide de Testes (Cobertura ≥ 70%):**
  - *Unitários / Integração:* Vitest / Jest / PyTest para schemas Zod, serviços e regras de negócio.
  - *E2E (Playwright):* Fluxos críticos (Onboarding, Login, Pagamento) utilizando seletores semânticos acessíveis (`getByRole`, `getByLabel`).
- **Observabilidade:**
  - Health checks obrigatórios (`/healthz`, `/readyz`). Métricas de latência, error rate e saturação. Alertas para anomalias críticas.
- **Protocolo de Incidente de Segredos (6 Passos):**
  1. *Revogar credencial imediatamente.*
  2. *Emitir nova chave e atualizar segredo de ambiente.*
  3. *Verificar logs de auditoria do serviço afetado.*
  4. *Limpar histórico Git com `git filter-repo`.*
  5. *Atualizar variáveis de ambiente em produção.*
  6. *Registar causa e prevenção em `docs/decisoes/`.*

---

## 15. TABELA DE PROIBIÇÕES ABSOLUTAS

| # | Proibição Absoluta | Risco Crítico |
|---|---|---|
| 1 | Proibido dados de uma empresa serem acessados por outra (Cross-Tenant Leakage) | Violação crítica de segurança e quebra de confidencialidade |
| 2 | Proibido regras ou marcas de empresas hardcoded no código | Impossibilidade de distribuição e quebra do white-label |
| 3 | Proibido usar tipos genéricos (`any`, casts cegos) | Erros graves em tempo de execução |
| 4 | Proibido silenciar erros (`catch {}` vazio sem log) | Falhas invisíveis e suporte impossível |
| 5 | Proibido renderizar HTML não sanitizado no frontend | Vulnerabilidade XSS crítica |
| 6 | Proibido hardcodar credenciais ou ficheiros `.env` no Git | Exposição de chaves e infraestrutura |
| 7 | Proibido strings de UI hardcoded sem i18n | Impossibilidade de internacionalização |
| 8 | Proibido identificadores de código (variáveis, funções) em português | Quebra da convenção internacional de código |
| 9 | Proibido commitar sem inspecionar `git diff --staged` | Envio acidental de segredos, logs e ficheiros indesejados |
| 10 | Proibido carregar listagens > 50 itens sem paginação no backend | Degradação massiva de memória e performance |
| 11 | Proibido pré-marcar checkboxes de consentimento | Violação direta do RGPD |
| 12 | Proibido ficheiros com > 250 linhas sem justificação documentada | Acúmulo de débito técnico e perda de modularidade |
| 13 | Proibido push direto em `main` sem passar por PR e CI verde | Perda de rastreabilidade e risco de quebra em produção |
| 14 | Proibido logar PII, tokens ou passwords | Violação de RGPD e exposição de dados sensíveis |
| 15 | Proibido adicionar dependências sem avaliar licença, manutenção e segurança | Risco legal e vulnerabilidades na supply chain |
