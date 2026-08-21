-- Migration: 20260821000009_telemetry_policy
-- Permite ao dashboard ler a telemetria do próprio tenant.
-- A tabela proposal_events já tem RLS sem leitura; concede-se select
-- apenas ao próprio tenant via current_organization_id().

grant select on proposal_events to authenticated;

create policy proposal_events_select_own
  on proposal_events for select
  to authenticated
  using (tenant_id = current_organization_id());

comment on policy proposal_events_select_own on proposal_events is 'Leitura apenas dos eventos do próprio tenant.';
