CREATE TABLE public.action_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 description text NOT NULL,
 finding text NOT NULL DEFAULT '',
 area text NOT NULL,
 owner text NOT NULL,
 due date NOT NULL,
 status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em andamento', 'Concluído')),
 progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.action_plans TO authenticated;
GRANT ALL ON public.action_plans TO service_role;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read action plans" ON public.action_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners create action plans" ON public.action_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX action_plans_owner_created_idx ON public.action_plans (user_id, created_at DESC);