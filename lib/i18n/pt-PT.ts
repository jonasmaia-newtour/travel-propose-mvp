/**
 * Catálogo PT-PT da interface (T052).
 * Centraliza todos os textos visíveis da landing e áreas comuns,
 * preparado para i18n desde o início (FR-020). Sem strings hardcoded no JSX.
 * Estrutura plana por domínio para facilitar tipagem e testes.
 */
export const ptPT = {
  common: {
    brand: 'TravelPropose',
    entrar: 'Entrar',
  },
  landing: {
    hero: {
      title: 'Propostas de viagem interativas, com aceite auditável',
      subtitle:
        'O TravelPropose substitui propostas estáticas e conversas dispersas por links seguros: o viajante simula opções, pede ajustes e aprova a combinação — tudo registado numa única fonte de verdade.',
    },
    cta: {
      login: {
        title: 'Entrar na plataforma',
        description: 'Acesso da agência: pipeline, propostas e equipa.',
        label: 'Entrar',
        href: '/login' as const,
      },
      dashboard: {
        title: 'Painel da agência (demo)',
        description: 'Demonstração com Owner, Manager e Agent (newtour-test).',
        label: 'Abrir painel',
        href: '/dashboard' as const,
      },
      proposal: {
        title: 'Proposta de exemplo',
        description: 'Simule opções e veja o total atualizar como um viajante.',
        label: 'Abrir proposta',
      },
    },
    roadmap: {
      title: 'Roadmap — o que fica para depois do MVP',
      description:
        'Funcionalidades adiadas de forma explícita para manter o foco no fluxo de proposta interativa.',
      items: [
        {
          title: 'Convites e gestão de membros',
          description: 'Convites por e-mail e gestão autónoma de papéis por organização.',
        },
        {
          title: 'Faturação e subscrições',
          description: 'Planos, limites e gestão de subscrição por tenant.',
        },
        {
          title: 'Integrações externas',
          description: 'GDS, consolidadoras, CRM, pagamentos e outros serviços de negócio.',
        },
        {
          title: 'Relatórios avançados',
          description: 'Rankings, métricas históricas e análises por agência.',
        },
        {
          title: 'Notificações em tempo real',
          description: 'Alertas de abertura, ajuste e aceite sem polling.',
        },
      ],
    },
    footer: 'TravelPropose — MVP em desenvolvimento.',
  },
} as const;

export type PtPT = typeof ptPT;
