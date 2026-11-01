CREATE TABLE public.audit_analyses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL,
 start_date date NOT NULL,
 end_date date NOT NULL,
 area text NOT NULL,
 system text NOT NULL,
 policy text NOT NULL DEFAULT '',
 reviewer text NOT NULL,
 source text NOT NULL,
 threshold numeric NOT NULL,
 transactions jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_analyses TO authenticated;
GRANT ALL ON public.audit_analyses TO service_role;
ALTER TABLE public.audit_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own analyses" ON public.audit_analyses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Create own analyses" ON public.audit_analyses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX audit_analyses_owner_created ON public.audit_analyses(user_id, created_at DESC);