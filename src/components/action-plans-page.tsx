import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleX, ClipboardList, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAnalyses } from "./analysis-provider";
import { AnalysisAuth } from "./analysis-auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { DataTable, DonutPanel, HBars, KpiCard, PageHeader, Panel, StatusBadge, TableToolbar } from "./kit";
import { createActionPlan, listActionPlans } from "@/lib/action-plans.functions";
import { actionPlanSchema, planStatus, planTotals, type ActionPlan, type ActionPlanInput } from "@/lib/action-plans";
import { inPeriod } from "@/lib/analysis";

export function ActionPlansPage({ demo }: { demo: (onNew: () => void) => ReactNode }) {
  const { userId, period, setPeriod } = useAnalyses();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Todos os status");
  const [area, setArea] = useState("Todas as áreas");
  const [selected, setSelected] = useState<ActionPlan | null>(null);
  const client = useQueryClient();
  const fetchPlans = useServerFn(listActionPlans);
  const queryKey = ["action-plans", userId];
  const query = useQuery({ queryKey, queryFn: () => fetchPlans(), enabled: !!userId });
  const today = new Date().toISOString().slice(0, 10);
  const plans = (query.data ?? []).filter(p => inPeriod(p.due, period, today));
  const totals = planTotals(plans, today);
  const rows = plans.filter(p => `${p.id} ${p.description} ${p.finding} ${p.owner}`.toLowerCase().includes(q.toLowerCase()) && (status === "Todos os status" || planStatus(p, today) === status) && (area === "Todas as áreas" || p.area === area));
  const slices = [
    { name: "Em andamento", value: totals.ongoing, tone: "info" as const },
    { name: "Pendente", value: totals.pending, tone: "medium" as const },
    { name: "Concluído", value: totals.completed, tone: "low" as const },
    { name: "Atrasado", value: totals.overdue, tone: "critical" as const },
  ].map(s => ({ ...s, display: `${s.value} (${totals.total ? Math.round(s.value / totals.total * 100) : 0}%)` }));
  return <>
    {!userId ? demo(() => setOpen(true)) : <>
      <PageHeader title="Planos de ação" subtitle="Acompanhe as ações corretivas e preventivas da auditoria." action="Novo plano de ação" onAction={() => setOpen(true)} />
      {query.isPending ? <p role="status">Carregando planos de ação…</p> : query.isError ? <div role="alert" className="flex items-center gap-3"><p>Não foi possível carregar seus planos.</p><Button onClick={() => query.refetch()}>Tentar novamente</Button></div> : <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <KpiCard icon={ClipboardList} tone="info" value={String(totals.total)} label="Planos de ação" />
          <KpiCard plain icon={Clock} tone="info" value={String(totals.ongoing)} label="Em andamento" />
          <KpiCard plain icon={Clock} tone="medium" value={String(totals.pending)} label="Pendentes" />
          <KpiCard plain icon={CheckCircle2} tone="low" value={String(totals.completed)} label="Concluídos" />
          <KpiCard plain icon={CircleX} tone="critical" value={String(totals.overdue)} label="Atrasados" />
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          <Panel title="Status dos planos de ação">{plans.length ? <DonutPanel center={String(totals.total)} caption="planos" data={slices} /> : <p className="py-6 text-sm text-muted-foreground">Nenhum plano neste período.</p>}</Panel>
          <Panel title="Planos de ação por área"><HBars labelWidth={130} items={Object.entries(plans.reduce<Record<string, number>>((groups, p) => ({ ...groups, [p.area]: (groups[p.area] ?? 0) + 1 }), {})).map(([label, value]) => ({ label, value, tone: "info" }))} /></Panel>
        </div>
        <Panel className="mt-3" title="Lista de planos de ação" action={<TableToolbar placeholder="Buscar plano de ação..." query={q} setQuery={setQ} filters={[{ value: status, onChange: setStatus, options: ["Todos os status", "Pendente", "Em andamento", "Concluído", "Atrasado"] }, { value: area, onChange: setArea, options: ["Todas as áreas", ...new Set((query.data ?? []).map(p => p.area))] }]} />}>
          <DataTable onRowClick={id => setSelected(rows.find(p => p.id === id) ?? null)} head={["ID", "Descrição", "Achado relacionado", "Área", "Responsável", "Prazo", "Status", "Progresso"]} rows={rows.map(p => ({ key: p.id, cells: [`PA-${p.id.slice(0, 8).toUpperCase()}`, p.description, p.finding || "—", p.area, p.owner, p.due.split("-").reverse().join("/"), <StatusBadge status={planStatus(p, today)} />, `${p.progress}%`] }))} />
        </Panel>
      </>}
    </>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle>Novo plano de ação</DialogTitle><DialogDescription>{userId ? "Dados do plano" : "Entre para salvar seu plano de ação."}</DialogDescription></DialogHeader>{userId ? <ActionPlanForm onSaved={plan => {
      client.setQueryData<ActionPlan[]>(queryKey, old => [plan, ...(old ?? []).filter(p => p.id !== plan.id)]);
      void client.invalidateQueries({ queryKey });
      setPeriod("all"); setQ(""); setStatus("Todos os status"); setArea("Todas as áreas"); setOpen(false);
      toast.success("Plano de ação criado");
    }} onCancel={() => setOpen(false)} /> : <AnalysisAuth />}</DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={value => { if (!value) setSelected(null); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Plano de ação</DialogTitle><DialogDescription>{selected ? `PA-${selected.id.slice(0, 8).toUpperCase()}` : ""}</DialogDescription></DialogHeader>{selected && <dl className="grid grid-cols-[120px_1fr] gap-3 break-words text-sm"><dt>Descrição</dt><dd>{selected.description}</dd><dt>Achado</dt><dd>{selected.finding || "—"}</dd><dt>Área</dt><dd>{selected.area}</dd><dt>Responsável</dt><dd>{selected.owner}</dd><dt>Prazo</dt><dd>{selected.due.split("-").reverse().join("/")}</dd><dt>Status</dt><dd><StatusBadge status={planStatus(selected, today)} /></dd><dt>Progresso</dt><dd>{selected.progress}%</dd></dl>}</DialogContent></Dialog>
  </>;
}

function ActionPlanForm({ onSaved, onCancel }: { onSaved: (plan: ActionPlan) => void; onCancel: () => void }) {
  const save = useServerFn(createActionPlan);
  const [data, setData] = useState<ActionPlanInput>({ description: "", finding: "", area: "", owner: "", due: "", status: "Pendente", progress: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof ActionPlanInput>(key: K, value: ActionPlanInput[K]) => setData(old => ({ ...old, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const parsed = actionPlanSchema.safeParse(data);
    if (!parsed.success) { setError(parsed.error.issues.map(i => i.message).join(" ")); return; }
    setBusy(true);
    try { onSaved(await save({ data: parsed.data })); }
    catch { setError("Não foi possível salvar o plano. Seus dados foram mantidos; tente novamente."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm">Descrição *<Textarea required maxLength={1000} value={data.description} onChange={e => set("description", e.target.value)} /></label>
    <label className="block text-sm">Achado relacionado<Input maxLength={1000} value={data.finding} onChange={e => set("finding", e.target.value)} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Área *<Input required maxLength={200} value={data.area} onChange={e => set("area", e.target.value)} /></label><label className="block text-sm">Responsável *<Input required maxLength={200} value={data.owner} onChange={e => set("owner", e.target.value)} /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Prazo *<Input required type="date" value={data.due} onChange={e => set("due", e.target.value)} /></label><label className="block text-sm">Status<select value={data.status} onChange={e => { const status = actionPlanSchema.shape.status.parse(e.target.value); setData(old => ({ ...old, status, progress: status === "Concluído" ? 100 : status === "Pendente" ? 0 : old.progress })); }} className="h-9 w-full rounded-md border border-input bg-background px-2">{["Pendente", "Em andamento", "Concluído"].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <label className="block text-sm">Progresso (%)<Input type="number" min={0} max={100} required disabled={data.status !== "Em andamento"} value={data.progress} onChange={e => set("progress", Number(e.target.value))} /></label>
    {error && <p role="alert" className="text-sm text-critical">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Criar plano de ação"}</Button></DialogFooter>
  </form>;
}