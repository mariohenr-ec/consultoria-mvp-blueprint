import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listAnalyses } from "@/lib/analysis.functions";
import type { Analysis, PeriodKey } from "@/lib/analysis";

type State = { analyses: Analysis[]; userId: string | null; email: string; loading: boolean; error: boolean; open: boolean; setOpen: (open: boolean) => void; refresh: () => Promise<void>; period: PeriodKey; setPeriod: (period: PeriodKey) => void };
const Context = createContext<State>({ analyses: [], userId: null, email: "", loading: true, error: false, open: false, setOpen: () => {}, refresh: async () => {}, period: "all", setPeriod: () => {} });
export const useAnalyses = () => useContext(Context);
export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<{ id: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const fetchAnalyses = useServerFn(listAnalyses);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) { setIdentity(data.user ? { id: data.user.id, email: data.user.email ?? "" } : null); setReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      setIdentity(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
      if (event === "SIGNED_OUT") client.removeQueries({ queryKey: ["analyses"] });
      else void client.invalidateQueries({ queryKey: ["analyses"] });
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [client]);
  const query = useQuery({ queryKey: ["analyses", identity?.id], queryFn: () => fetchAnalyses(), enabled: ready && !!identity });
  return <Context.Provider value={{ analyses: identity ? query.data ?? [] : [], userId: identity?.id ?? null, email: identity?.email ?? "", loading: !ready || (!!identity && query.isPending), error: query.isError, open, setOpen, refresh: async () => { await client.invalidateQueries({ queryKey: ["analyses"] }); } }}>{children}</Context.Provider>;
}