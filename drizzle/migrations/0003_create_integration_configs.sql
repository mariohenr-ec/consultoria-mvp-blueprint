CREATE TABLE public.integration_configs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL,
 type text NOT NULL CHECK (type IN ('ERP', 'Banco de dados', 'Planilhas', 'API', 'Outros')),
 system text NOT NULL,
 source_reference text NOT NULL DEFAULT '',
 auth_method text NOT NULL CHECK (auth_method IN ('Sem autenticação', 'OAuth', 'Chave de API', 'Usuário e senha', 'A definir')),
 frequency text NOT NULL,
 owner text NOT NULL,
 data_scope text NOT NULL,
 notes text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.integration_configs TO authenticated;
GRANT ALL ON public.integration_configs TO service_role;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read integration configs" ON public.integration_configs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners create integration configs" ON public.integration_configs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX integration_configs_owner_created_idx ON public.integration_configs (user_id, created_at DESC);