import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronRight, CircleCheck, Clock, Cloud, Database, FileSpreadsheet, FileText, Plus, RefreshCw, Server } from "lucide-react";
import { AlertList, ChartLegend, DataTable, DonutPanel, DotStatus, KpiCard, MiniSelect, PageHeader, Panel, TableToolbar, soon, type Tone } from "@/components/kit";
import { axis } from "@/lib/data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/integracoes")({
  head: pageHead("Integrações", "Conecte suas fontes de dados e mantenha as informações sempre atualizadas para análise contínua."),
  component: Integrations,
});

const Sap = () => <span className="rounded bg-info px-1 text-[10px] font-bold italic text-primary-foreground">SAP</span>;
const icons: Record<string, React.ReactNode> = {
  ERP: <Sap />, "Banco de dados": <Database className="h-5 w-5 text-info" />, Planilhas: <FileSpreadsheet className="h-5 w-5 text-low" />,
  API: <Cloud className="h-5 w-5 fill-info text-info" />, Compras: <FileText className="h-5 w-5 text-info" />, Outros: <Cloud className="h-5 w-5 fill-info text-info" />,
};
const integrations: { n: string; type: string; icon: string; sys: string; st: string; tone: Tone; last: string; freq: string; reg: string }[] = [
  { n: "ERP Principal", type: "ERP", icon: "ERP", sys: "SAP", st: "Conectado", tone: "low", last: "há 10 minutos", freq: "Automática (15 min)", reg: "1.245.320" },
  { n: "Banco Financeiro", type: "Banco de dados", icon: "Banco de dados", sys: "SQL Server", st: "Conectado", tone: "low", last: "há 5 minutos", freq: "Automática (5 min)", reg: "620.451" },
  { n: "Planilhas de Controles", type: "Planilhas", icon: "Planilhas", sys: "Excel Online", st: "Conectado", tone: "low", last: "há 2 minutos", freq: "Automática (2 min)", reg: "48.230" },
  { n: "Sistema de RH", type: "API", icon: "API", sys: "Workday (API)", st: "Com alerta", tone: "medium", last: "há 15 minutos", freq: "Automática (15 min)", reg: "12.458" },
  { n: "Sistema de Compras", type: "API", icon: "Compras", sys: "Oracle (API)", st: "Conectado", tone: "low", last: "há 8 minutos", freq: "Automática (10 min)", reg: "310.987" },
  { n: "Sistema de Vendas", type: "Banco de dados", icon: "Banco de dados", sys: "PostgreSQL", st: "Em sincronização", tone: "info", last: "há 1 minuto", freq: "Automática (5 min)", reg: "—" },
  { n: "Auditório Externo", type: "Outros", icon: "Outros", sys: "API Externa", st: "Inativa", tone: "neutral", last: "—", freq: "Manual", reg: "—" },
];
const vol = ["20 Jun", "21 Jun", "22 Jun", "23 Jun", "24 Jun", "25 Jun", "26 Jun"].map((d, i) => ({ d, t: [10, 11, 11, 10, 12, 15, 17][i], c: [7, 9, 8, 7, 8, 11, 10][i], p: [1, 1, 1, 1, 1, 1, 1][i], o: [12, 11, 12, 12, 13, 12, 14][i] }));

function Integrations() {
  const [q, setQ] = useState("");
  const [st, setSt] = useState("Todos os status");
  const [tp, setTp] = useState("Todos os tipos");
  const [alerts, setAlerts] = useState(true);
  const rows = integrations.filter((i) => (i.n + i.sys).toLowerCase().includes(q.toLowerCase()) && (st === "Todos os status" || i.st === st) && (tp === "Todos os tipos" || i.type === tp));
  return (
    <>
      <PageHeader title="Integrações" subtitle="Conecte suas fontes de dados e mantenha as informações sempre atualizadas para análise contínua." action="Nova integração" />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={Server} tone="info" value="5" label="Integrações ativas" delta="+25%" />
        <KpiCard icon={RefreshCw} tone="low" value="98%" label="Taxa de sincronização" delta="+6%" />
        <KpiCard icon={Clock} tone="medium" value="12 min" label="Última sincronização" sub="Normal" subTone="low" />
        <KpiCard icon={AlertTriangle} tone="critical" value="2" label="Integrações com alertas" delta="+100%" good={false} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Status das integrações">
          <DonutPanel center="7" caption="integrações" data={[
            { name: "Ativas", value: 5, tone: "low", display: "5  (71%)" },
            { name: "Em sincronização", value: 1, tone: "info", display: "1  (14%)" },
            { name: "Com alertas", value: 1, tone: "medium", display: "1  (14%)" },
            { name: "Inativas", value: 0, tone: "critical", display: "0  (0%)" },
          ]} />
        </Panel>
        <Panel title="Volume de dados importados" action={<MiniSelect options={["Últimos 7 dias"]} />}>
          <div className="h-[160px]">
            <ResponsiveContainer>
              <BarChart data={vol} margin={{ left: -22, top: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="d" {...axis} />
                <YAxis {...axis} tickFormatter={(v) => (v ? `${v}K` : "0")} />
                <Bar dataKey="t" stackId="s" fill="var(--info)" barSize={28} />
                <Bar dataKey="c" stackId="s" fill="var(--low)" fillOpacity={0.75} />
                <Bar dataKey="p" stackId="s" fill="var(--medium)" />
                <Bar dataKey="o" stackId="s" fill="var(--info-soft)" fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Transações", tone: "info", square: true }, { label: "Controles", tone: "low", square: true }, { label: "Planos de ação", tone: "medium", square: true }, { label: "Outros", tone: "neutral", square: true }]} />
        </Panel>
        <Panel title="Tipos de fonte de dados">
          <DonutPanel center="7" caption="fontes" data={[
            { name: "ERP (SAP)", value: 2, tone: "info", display: "2  (29%)" },
            { name: "Banco de dados", value: 2, tone: "low", display: "2  (29%)" },
            { name: "Planilhas (Excel)", value: 1, tone: "medium", display: "1  (14%)" },
            { name: "APIs", value: 1, tone: "critical", display: "1  (14%)" },
            { name: "Outros", value: 1, tone: "neutral", display: "1  (14%)" },
          ]} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Integrações configuradas" action={<TableToolbar placeholder="Buscar integração..." query={q} setQuery={setQ}
        filters={[{ value: st, onChange: setSt, options: ["Todos os status", "Conectado", "Com alerta", "Em sincronização", "Inativa"] }, { value: tp, onChange: setTp, options: ["Todos os tipos", "ERP", "Banco de dados", "Planilhas", "API", "Outros"] }]}
        extra={<button onClick={() => soon("Nova integração")} className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Nova integração</button>} />}>
        <DataTable head={["Nome", "Tipo", "Sistema", "Status", "Última sincronização", "Frequência", "Registros (últ. 30 dias)"]}
          rows={rows.map((i) => ({ key: i.n, cells: [<span className="flex items-center gap-3"><span className="grid w-6 place-items-center">{icons[i.icon]}</span>{i.n}</span>, i.type, i.sys,
            i.tone === "low" ? <DotStatus label={i.st} tone="low" /> : <DotStatus label={i.st} tone={i.tone} square chip />, i.last, <span className="text-info/90">{i.freq}</span>, i.reg] }))} />
      </Panel>
      <div className="mt-3 grid grid-cols-[1fr_1.2fr_1.1fr] gap-3">
        <Panel title="Últimas atividades de integração">
          <ul className="flex flex-col gap-2.5">
            {([["low", "Sincronização concluída – ERP Principal", "1.245.320 registros importados", "há 10 min"], ["low", "Sincronização concluída – Banco Financeiro", "620.451 registros importados", "há 5 min"], ["medium", "Falha de sincronização – Sistema de RH", "Timeout na conexão com a API", "há 15 min"], ["info", "Sincronização em andamento – Sistema de Vendas", "Processando dados (45%)", "há 1 min"], ["low", "Sincronização concluída – Planilhas de Controles", "48.230 registros importados", "há 2 min"]] as const).map(([t, a, b, w]) => (
              <li key={a} className="flex items-center gap-3 text-[12.5px]">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: `var(--${t === "low" ? "low" : t === "medium" ? "medium" : "info"})` }} />
                <div className="min-w-0 flex-1"><div className="truncate">{a}</div><div className="text-muted-foreground">{b}</div></div>
                <span className="text-[11.5px] text-muted-foreground">{w}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Mapeamento de dados">
          <p className="-mt-2 mb-3 text-[12.5px] text-muted-foreground">Visualize como os dados são unificados para análise.</p>
          <div className="grid grid-cols-[1fr_auto_1.1fr] items-center gap-3">
            <div className="rounded-lg bg-muted p-3 text-[12px]">
              <div className="mb-2 font-medium">Fontes de dados</div>
              {[["ERP", "ERP (SAP)"], ["Banco de dados", "Banco de dados"], ["Planilhas", "Planilhas (Excel)"], ["API", "API (RH)"], ["Outros", "Outros sistemas"]].map(([k, l]) => (
                <div key={l} className="flex items-center gap-2 py-1"><span className="grid w-6 place-items-center">{icons[k as string]}</span>{l}</div>
              ))}
            </div>
            <div className="flex flex-col items-center text-center text-[12.5px] font-medium">
              <Database className="h-14 w-14 text-low" strokeWidth={1.4} />Base unificada<br />de transações
            </div>
            <div className="rounded-lg border p-3 text-[11.5px]">
              <div className="mb-2 font-medium">Dados padronizados</div>
              {["Elimina dados em silos", "Padroniza formatos", "Mantém atualização automática", "Valida e trata inconsistências", "Histórico completo e auditável"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 py-1"><CircleCheck className="h-4 w-4 shrink-0 fill-low text-card" />{t}</div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Alertas e notificações" action={<button onClick={() => setAlerts(false)} className="h-8 rounded-md border px-3 text-[12px] hover:bg-muted">Marcar todos como lidos</button>}>
          {alerts ? (
            <AlertList items={[
              { tone: "critical", title: "Falha na sincronização – Sistema de RH", desc: "Timeout na conexão com a API", when: "há 15 min" },
              { tone: "medium", title: "Atraso na atualização – Sistema de Compras", desc: "Última sincronização há 2 horas", when: "há 2 horas" },
              { tone: "info", title: "Nova integração disponível", desc: "Sistema de Contas a Pagar detectado", when: "há 1 dia" },
              { tone: "low", title: "Sincronização concluída – ERP Principal", desc: "1.245.320 registros importados", when: "há 1 dia" },
            ]} />
          ) : <p className="py-10 text-center text-[13px] text-muted-foreground">Nenhum alerta não lido.</p>}
        </Panel>
      </div>
    </>
  );
}
