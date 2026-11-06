import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Clock, Server } from "lucide-react";
import { toast } from "sonner";
import { useAnalyses } from "./analysis-provider";
import { AnalysisAuth } from "./analysis-auth";
import { PageHeader, Panel, DataTable, TableToolbar, DotStatus, KpiCard, DonutPanel } from "./kit";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { integrationTypes, authMethods, frequencies, integrationSchema, type IntegrationInput, type IntegrationConfig } from "@/lib/integration-configs";
import { createIntegrationConfig, listIntegrationConfigs } from "@/lib/integration-configs.functions";
import { inPeriod } from "@/lib/analysis";

export function IntegrationConfigsPage({ demo }: { demo: (onNew: () => void) => ReactNode }) {
  const { userId, period, setPeriod } = useAnalyses();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<IntegrationConfig | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("Todos os tipos");
  const client = useQueryClient();
  const fetchConfigs = useServerFn(listIntegrationConfigs);
  const queryKey = ["integration-configs", userId];
  const query = useQuery({ queryKey, queryFn: () => fetchConfigs(), enabled: !!userId });
  const today = new Date().toISOString().slice(0, 10);
  const configs = (query.data ?? []).filter(c => inPeriod(c.created_at, period, today));
  const rows = configs.filter(c => `${c.name} ${c.system} ${c.owner}`.toLowerCase().includes(q.toLowerCase()) && (type === "Todos os tipos" || c.type === type));
  return <>
    {!userId ? demo(() => setOpen(true)) : <>
      <PageHeader title="Integrações" subtitle="Fontes de dados configuradas para a auditoria contínua." action="Nova integração" onAction={() => setOpen(true)} />
      {query.isPending ? <p role="status">Carregando integrações…</p> : query.isError ? <div role="alert" className="flex gap-3"><p>Não foi possível carregar as integrações.</p><Button onClick={() => query.refetch()}>Tentar novamente</Button></div> : <>
        <div className="grid gap-3 sm:grid-cols-3"><KpiCard icon={Server} tone="info" value={String(configs.length)} label="Integrações cadastradas" /><KpiCard icon={Clock} tone="medium" value={String(configs.length)} label="Aguardando conexão" /><KpiCard icon={Database} tone="low" value="0" label="Registros sincronizados" /></div>
        {configs.length > 0 && <div className="mt-3"><Panel title="Tipos de fonte de dados"><DonutPanel center={String(configs.length)} caption="fontes" data={integrationTypes.map((name, i) => { const value = configs.filter(c => c.type === name).length; return { name, value, tone: (["info", "low", "medium", "critical", "neutral"] as const)[i] ?? "info", display: `${value} (${Math.round(value / configs.length * 100)}%)` }; })} /></Panel></div>}
        <Panel className="mt-3" title="Integrações configuradas" action={<TableToolbar placeholder="Buscar integração..." query={q} setQuery={setQ} filters={[{ value: type, onChange: setType, options: ["Todos os tipos", ...integrationTypes] }]} />}>
          <DataTable onRowClick={id => setSelected(rows.find(c => c.id === id) ?? null)} head={["Nome", "Tipo", "Sistema", "Status", "Última sincronização", "Frequência", "Responsável", "Registros"]} rows={rows.map(c => ({ key: c.id, cells: [c.name, c.type, c.system, <DotStatus label="Aguardando conexão" tone="medium" chip />, "—", c.frequency, c.owner, "0"] }))} />
        </Panel>
      </>}
    </>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>Nova integração</DialogTitle><DialogDescription>{userId ? "Configuração da fonte · Aguardando conexão e autorização do serviço" : "Entre para salvar suas integrações."}</DialogDescription></DialogHeader>{userId ? <IntegrationForm onCancel={() => setOpen(false)} onSaved={config => {
      client.setQueryData<IntegrationConfig[]>(queryKey, old => [config, ...(old ?? []).filter(c => c.id !== config.id)]);
      void client.invalidateQueries({ queryKey }); setPeriod("all"); setQ(""); setType("Todos os tipos"); setOpen(false); toast.success("Integração cadastrada", { description: "Aguardando conexão com o serviço." });
    }} /> : <AnalysisAuth />}</DialogContent></Dialog>
    <Dialog open={!!selected} onOpenChange={value => { if (!value) setSelected(null); }}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.name ?? "Integração"}</DialogTitle><DialogDescription>Aguardando conexão</DialogDescription></DialogHeader>{selected && <dl className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 break-words text-sm">{[["Tipo", selected.type], ["Sistema", selected.system], ["Endereço", selected.source_reference || "—"], ["Autenticação", selected.auth_method], ["Frequência", selected.frequency], ["Responsável", selected.owner], ["Dados a importar", selected.data_scope], ["Observações", selected.notes || "—"]].map(([label, value]) => <div key={label} className="contents"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl>}</DialogContent></Dialog>
  </>;
}

function IntegrationForm({ onSaved, onCancel }: { onSaved: (config: IntegrationConfig) => void; onCancel: () => void }) {
  const save = useServerFn(createIntegrationConfig);
  const [data, setData] = useState<IntegrationInput>({ name: "", type: "API", system: "", source_reference: "", auth_method: "A definir", frequency: "Manual", owner: "", data_scope: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = <K extends keyof IntegrationInput>(key: K, value: IntegrationInput[K]) => setData(old => ({ ...old, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); const parsed = integrationSchema.safeParse(data);
    if (!parsed.success) { setError(parsed.error.issues.map(i => i.message).join(" ")); return; }
    setBusy(true); try { onSaved(await save({ data: parsed.data })); } catch { setError("Não foi possível salvar. Confira os dados e tente novamente."); } finally { setBusy(false); }
  }
  return <form className="space-y-4" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Nome da integração *<Input required maxLength={200} value={data.name} onChange={e => set("name", e.target.value)} /></label><label className="block text-sm">Tipo de fonte *<select className="h-9 w-full rounded-md border border-input bg-background px-2" value={data.type} onChange={e => set("type", integrationSchema.shape.type.parse(e.target.value))}>{integrationTypes.map(t => <option key={t}>{t}</option>)}</select></label></div>
    <label className="block text-sm">Sistema / plataforma *<Input required maxLength={200} value={data.system} onChange={e => set("system", e.target.value)} /></label>
    <label className="block text-sm">Endereço da fonte (sem credenciais)<Input type="url" maxLength={1000} placeholder="https://" value={data.source_reference} onChange={e => set("source_reference", e.target.value)} /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Método de autenticação<select className="h-9 w-full rounded-md border border-input bg-background px-2" value={data.auth_method} onChange={e => set("auth_method", integrationSchema.shape.auth_method.parse(e.target.value))}>{authMethods.map(t => <option key={t}>{t}</option>)}</select></label><label className="block text-sm">Frequência desejada<select className="h-9 w-full rounded-md border border-input bg-background px-2" value={data.frequency} onChange={e => set("frequency", integrationSchema.shape.frequency.parse(e.target.value))}>{frequencies.map(t => <option key={t}>{t}</option>)}</select></label></div>
    <label className="block text-sm">Responsável *<Input required maxLength={200} value={data.owner} onChange={e => set("owner", e.target.value)} /></label>
    <label className="block text-sm">Dados a importar *<Textarea required maxLength={1000} value={data.data_scope} onChange={e => set("data_scope", e.target.value)} /></label>
    <label className="block text-sm">Observações (sem senhas ou chaves)<Textarea maxLength={2000} value={data.notes} onChange={e => set("notes", e.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-critical">{error}</p>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Adicionar integração"}</Button></DialogFooter>
  </form>;
}