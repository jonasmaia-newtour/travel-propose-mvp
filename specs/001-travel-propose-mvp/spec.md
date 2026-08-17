# Feature Specification: TravelPropose MVP

**Feature Branch**: `001-travel-propose-mvp`

**Created**: 2026-08-17

**Status**: Approved design; ready for phased planning

**Input**: Plataforma B2B para agências criarem propostas de viagem interativas,
partilharem-nas por link seguro e obterem aceite auditável, sem integrações externas
de negócio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar e publicar proposta modular (Priority: P1)

Um Agent da agência `newtour-test` cria uma proposta com opções de escolha única e
múltipla, define o prazo de validade e publica um link para o viajante.

**Why this priority**: É a origem do fluxo comercial e entrega valor à agência antes
de qualquer análise avançada.

**Independent Test**: Um Agent autenticado cria, guarda e publica uma proposta; o
sistema apresenta-lhe um link seguro acessível sem login.

**Acceptance Scenarios**:

1. **Given** um Agent autenticado com uma proposta em rascunho, **When** adiciona
   secções e itens válidos e publica a proposta, **Then** a proposta muda para
   enviada e é criado um link único para o viajante.
2. **Given** uma proposta em rascunho incompleta, **When** o Agent a guarda sem
   publicar, **Then** a proposta permanece em rascunho e não pode ser acedida
   publicamente.

---

### User Story 2 - Simular e aprovar uma proposta pública (Priority: P1)

Um viajante abre o link de uma proposta válida, combina as opções disponíveis,
consulta o total e aprova a seleção final sem criar conta.

**Why this priority**: Converte a proposta numa experiência interativa que reduz a
troca de mensagens e permite fechar a venda.

**Independent Test**: Um utilizador sem sessão abre um link válido, altera opções e
aprova uma combinação; recebe confirmação com o valor congelado.

**Acceptance Scenarios**:

1. **Given** uma proposta enviada e válida, **When** o viajante seleciona opções,
   **Then** vê imediatamente o valor total e a simulação de pagamento atualizados.
2. **Given** uma proposta válida, **When** o viajante aceita os termos e aprova a
   combinação, **Then** recebe confirmação e a proposta deixa de aceitar alterações.
3. **Given** uma proposta expirada, **When** o viajante abre o link, **Then** não
   pode aprovar e recebe uma opção para pedir atualização da cotação.

---

### User Story 3 - Pedir ajuste sem sair da proposta (Priority: P2)

Um viajante que precisa de alteração envia uma observação através da proposta pública
e o Agent recebe a proposta de volta para revisão.

**Why this priority**: Mantém a negociação no mesmo contexto e conserva o histórico
comercial.

**Independent Test**: Um viajante envia uma observação numa proposta válida e o Agent
vê o pedido associado à proposta, que fica disponível para edição.

**Acceptance Scenarios**:

1. **Given** uma proposta enviada ou visualizada, **When** o viajante envia uma
   observação de ajuste, **Then** a observação é registada e a proposta regressa a
   rascunho.
2. **Given** uma proposta devolvida para revisão, **When** o Agent altera e publica
   novamente a proposta, **Then** o pedido de ajuste anterior mantém-se no histórico.

---

### User Story 4 - Acompanhar o pipeline segundo o papel (Priority: P2)

Owner, Manager e Agent consultam a atividade da agência segundo as respetivas
permissões e acompanham o estado das propostas.

**Why this priority**: Permite à agência perceber o andamento comercial sem aumentar
o escopo com relatórios avançados.

**Independent Test**: Cada papel autenticado acede ao respetivo painel e apenas vê as
propostas permitidas pelo seu papel.

**Acceptance Scenarios**:

1. **Given** um Owner ou Manager autenticado, **When** abre o pipeline, **Then** vê
   todas as propostas da sua agência e os indicadores essenciais.
2. **Given** um Agent autenticado, **When** abre o seu painel, **Then** vê apenas as
   suas propostas e pode iniciar uma nova.

---

### User Story 5 - Conhecer o produto e explorar a demonstração (Priority: P3)

Um visitante compreende o propósito da plataforma na landing page e escolhe entrar no
ambiente de demonstração ou ver uma proposta pública de exemplo.

**Why this priority**: Apoia a demonstração do MVP e torna visível a direção futura
do produto.

**Independent Test**: Um visitante abre a página inicial e consegue alcançar ambos os
destinos a partir dos CTAs principais.

**Acceptance Scenarios**:

1. **Given** um visitante na landing page, **When** escolhe entrar na plataforma,
   **Then** é encaminhado para autenticação.
2. **Given** um visitante na landing page, **When** escolhe ver uma proposta de
   exemplo, **Then** abre uma proposta pública demonstrável.

### Edge Cases

- Um token inexistente, inválido ou revogado não revela informação sobre propostas ou
  organizações e apresenta uma mensagem genérica.
- Duas tentativas de aprovação da mesma proposta resultam num único aceite válido.
- O prazo expira entre a seleção do viajante e a confirmação: a aprovação é recusada
  sem gravar uma seleção parcial.
- Uma seleção inválida para uma secção de escolha única impede a aprovação e orienta o
  viajante a corrigir a escolha.
- Um utilizador de uma organização nunca consegue ver, adivinhar ou alterar dados de
  outra organização.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar a agência de demonstração
  `newtour-test` com utilizadores autenticados nos papéis Owner, Manager e Agent.
- **FR-002**: O sistema MUST isolar todos os dados organizacionais e impedir qualquer
  leitura ou mutação entre organizações.
- **FR-003**: O sistema MUST permitir ao Agent criar, guardar e editar propostas em
  rascunho que lhe pertençam.
- **FR-004**: O sistema MUST permitir que uma proposta tenha valor base, secções
  ordenadas e itens de escolha única ou múltipla com variações de preço.
- **FR-005**: O sistema MUST impedir a publicação sem título, prazo de validade,
  valor base e pelo menos uma opção selecionável.
- **FR-006**: O sistema MUST publicar uma proposta através de link público único que
  não exponha o identificador interno da proposta.
- **FR-007**: O sistema MUST permitir ao viajante consultar uma proposta pública
  válida sem autenticação.
- **FR-008**: O sistema MUST recalcular o total e a simulação de pagamento de acordo
  com as opções selecionadas pelo viajante.
- **FR-009**: O sistema MUST permitir ao viajante pedir um ajuste com uma observação
  e preservar a observação no histórico da proposta.
- **FR-010**: O sistema MUST impedir aprovações depois da validade da proposta.
- **FR-011**: O sistema MUST criar um registo imutável de cada aceite com itens,
  valores, termos e instante de aprovação.
- **FR-012**: O sistema MUST garantir que a aprovação acontece no máximo uma vez por
  proposta publicada.
- **FR-013**: O sistema MUST manter os estados `draft`, `sent`, `viewed`,
  `revision_requested`, `approved` e `expired` e permitir apenas as transições
  aprovadas.
- **FR-014**: O sistema MUST registar a abertura da proposta e as alterações de
  seleção sem guardar IP em bruto, cookies de terceiros ou dados pessoais não
  necessários.
- **FR-015**: O sistema MUST permitir ao Owner consultar todas as propostas e os
  indicadores essenciais da agência.
- **FR-016**: O sistema MUST permitir ao Manager consultar o pipeline e todas as
  propostas da agência, sem gerir a identidade visual da agência.
- **FR-017**: O sistema MUST limitar o Agent às suas próprias propostas e permitir-lhe
  criar, editar em rascunho e publicar propostas.
- **FR-018**: O sistema MUST apresentar uma landing page em PT-PT com CTAs para
  autenticação e proposta de exemplo, mais um roadmap de funcionalidades adiadas.
- **FR-019**: O sistema MUST apresentar estados claros de carregamento, vazio, erro e
  repetição em operações assíncronas relevantes.
- **FR-020**: O sistema MUST manter todos os textos visíveis prontos para tradução e
  cumprir os requisitos de acessibilidade aplicáveis a navegação por teclado, foco e
  contraste.

### Key Entities *(include if feature involves data)*

- **Organização**: agência isolada, com identidade visual e membros.
- **Perfil**: pessoa autenticada associada a uma organização e papel de acesso.
- **Proposta**: oferta comercial de um Agent com estado, prazo, valor base e link
  público.
- **Secção de proposta**: grupo ordenado de opções de escolha única ou múltipla.
- **Item de proposta**: opção incluída numa secção, com descrição e variação de valor.
- **Pedido de ajuste**: observação enviada pelo viajante que devolve a proposta para
  revisão.
- **Snapshot de aceite**: registo imutável da combinação, dos valores e dos termos
  aprovados.
- **Evento de proposta**: registo de interação anónimo para acompanhamento comercial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um Agent de demonstração cria e publica uma proposta com pelo menos
  duas secções em menos de dois minutos, sem assistência.
- **SC-002**: Um viajante abre uma proposta válida em rede móvel e consulta uma
  combinação de opções em menos de três segundos em 95% das tentativas de teste.
- **SC-003**: Um viajante conclui a simulação e o aceite de uma proposta válida em no
  máximo três passos de decisão após abrir o link.
- **SC-004**: 100% dos testes de isolamento verificam que um utilizador não acede a
  dados de outra organização.
- **SC-005**: 100% das aprovações de teste guardam uma seleção, valor final, termos e
  instante de aprovação e não permitem uma segunda aprovação.
- **SC-006**: Os quatro fluxos críticos — autenticação, publicação, ajuste e aceite —
  são verificáveis de ponta a ponta antes de cada entrega de fase.

## Assumptions

- A primeira demonstração opera com uma única agência pré-criada e três utilizadores
  de demonstração; gestão de membros e convites ficam fora do MVP.
- Todos os preços, opções e condições comerciais são geridos manualmente dentro da
  plataforma, sem sincronização com sistemas externos.
- A simulação de pagamento é informativa e não inicia nem processa pagamentos.
- A proposta de exemplo da landing page usa dados fictícios e pode ser reposta entre
  demonstrações.
- Relatórios avançados, notificações em tempo real, faturação e integrações externas
  são funcionalidades futuras apresentadas no roadmap.
