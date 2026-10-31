import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, ClipboardList, FileText, ShieldCheck } from "lucide-react";
import { ChartLegend, DataTable, DonutPanel, HBars, KpiCard, MiniSelect, PageHeader, Panel, StatusBadge, TableToolbar, DotStatus, type Tone } from "@/components/kit";
import { axis, months } from "@/lib/data";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({
  head: pageHead("Relatórios", "Acompanhamento dos resultados da auditoria contínua com visões gerenciais e operacionais."),
  component: Reports,
});

type Rep = { date: string; name: string; type: string; period: string; by: string };
const initial: Rep[] = [
  { date: "30/06/2024 10:22", name: "Relatório Executivo – Auditoria Contínua", type: "Executivo", period: "Jun/2024", by: "Carlos" },
  { date: "28/06/2024 15:17", name: "Mapa de Riscos e Tendências", type: "Riscos", period: "Jun/2024", by: "Carlos" },
  { date: "25/06/2024 09:41", name: "Conformidade por Área de Negócio", type: "Conformidade", period: "Jun/2024", by: "Carlos" },
  { date: "20/06/2024 14:03", name: "Status dos Planos de Ação", type: "Planos de Ação", period: "Jun/2024", by: "Ana Silva" },
  { date: "15/06/2024 11:28", name: "Transações Atípicas e Anomalias", type: "Transações", period: "Mai/2024", by: "Carlos" },
];
const models: { title: string; desc: string; icon: React.ElementType; tone: Tone; type: string }[] = [
  { title: "Relatório Executivo", desc: "Visão geral dos resultados, principais achados e recomendações.", icon: FileText, tone: "info", type: "Executivo" },
  { title: "Mapa de Riscos", desc: "Distribuição dos riscos, tendências e análise por categoria.", icon: AlertTriangle, tone: "critical", type: "Riscos" },
  { title: "Conformidade", desc: "Indicadores de conformidade por área, sistema e período.", icon: ShieldCheck, tone: "low", type: "Conformidade" },
  { title: "Planos de Ação", desc: "Acompanhamento de ações, prazos e responsáveis.", icon: ClipboardList, tone: "medium", type: "Planos de Ação" },
  { title: "Transações Atípicas", desc: "Análise detalhada de transações com anomalias.", icon: BarChart3, tone: "violet", type: "Transações" },
];
const solid: Record<Tone, string> = { info: "bg-info", critical: "bg-critical", low: "bg-low", medium: "bg-medium", violet: "bg-violet", high: "bg-high", neutral: "bg-neutral", soft: "bg-info-soft" };

function Reports() {
  const [reps, setReps] = useState(initial);
  const [q, setQ] = useState("");
  const [tp, setTp] = useState("Todos os tipos");
  const [per, setPer] = useState("Últimos 6 meses");
  const gen = (m: (typeof models)[number]) => {
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    setReps((r) => [{ date: `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`, name: `${m.title} – Gerado agora`, type: m.type, period: "Jun/2024", by: "Carlos" }, ...r]);
    toast.success(`${m.title} gerado`, { description: "Disponível na lista de relatórios gerados." });
  };
  const rows = reps.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()) && (tp === "Todos os tipos" || r.type === tp));
  return (
    <>
      <PageHeader title="Relatórios" subtitle="Acompanhamento dos resultados da auditoria contínua com visões gerenciais e operacionais." period="Jan/2024 – Jun/2024" action="Gerar relatório" />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard plain icon={FileText} tone="neutral" value="2,4 M" label="Transações analisadas" delta="+12%" />
        <KpiCard plain icon={AlertTriangle} tone="critical" value="37" label="Achados de risco" delta="-28%" good={false} />
        <KpiCard plain icon={ShieldCheck} tone="low" value="92%" label="Conformidade geral" delta="+5%" />
        <KpiCard plain icon={ClipboardList} tone="medium" value="48" label="Planos de ação gerados" delta="+20%" />
      </div>
      <div className="mt-3 grid grid-cols-[1.4fr_1.1fr_1.1fr] gap-3">
        <Panel title="Evolução dos principais indicadores" action={<MiniSelect options={["Últimos 6 meses"]} />}>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <ComposedChart data={months.map((m, i) => ({ m, t: [330, 345, 380, 380, 380, 395][i]! * 1000, a: [12, 22, 20, 12, 18, 12][i]!, c: [78, 83, 87, 84, 86, 91][i]! }))} margin={{ left: -6, right: -6, top: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" {...axis} />
                <YAxis yAxisId="l" {...axis} tickFormatter={(v) => (v ? `${v / 1000}K` : "0")} domain={[0, 500000]} />
                <YAxis yAxisId="r" orientation="right" {...axis} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Bar yAxisId="l" dataKey="t" fill="var(--info-soft)" barSize={22} radius={[3, 3, 0, 0]} />
                <Line yAxisId="r" dataKey="a" stroke="var(--critical)" strokeWidth={2} dot={{ r: 4, fill: "var(--critical)" }} />
                <Line yAxisId="r" dataKey="c" stroke="var(--low)" strokeWidth={2} dot={{ r: 4, fill: "var(--low)" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Transações analisadas", tone: "info" }, { label: "Achados de risco", tone: "critical" }, { label: "Conformidade (%)", tone: "low" }]} />
        </Panel>
        <Panel title="Achados por área de negócio" action={<MiniSelect options={["Por quantidade"]} />}>
          <HBars valueInside labelWidth={100} max={18} items={[["Compras", 14, "critical"], ["Financeiro", 9, "high"], ["Vendas", 6, "medium"], ["Recursos Humanos", 4, "info"], ["TI", 3, "info"], ["Outros", 1, "neutral"]].map(([l, v, t]) => ({ label: l as string, value: v as number, tone: t as Tone }))} />
        </Panel>
        <Panel title="Tipos de relatórios gerados">
          <DonutPanel center="48" caption="relatórios" data={[
            { name: "Relatório Executivo", value: 18, tone: "info", display: "18 (38%)" },
            { name: "Relatório de Riscos", value: 12, tone: "low", display: "12 (25%)" },
            { name: "Conformidade", value: 8, tone: "medium", display: "8 (17%)" },
            { name: "Planos de Ação", value: 6, tone: "critical", display: "6 (12%)" },
            { name: "Transações Atípicas", value: 4, tone: "neutral", display: "4 (8%)" },
          ]} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Relatórios gerados" action={<TableToolbar placeholder="Buscar relatórios..." query={q} setQuery={setQ} filters={[{ value: tp, onChange: setTp, options: ["Todos os tipos", ...models.map((m) => m.type)] }, { value: per, onChange: setPer, options: ["Últimos 6 meses", "Últimos 30 dias"] }]} />}>
        <DataTable head={["", "Data de geração", "Nome do relatório", "Tipo", "Período", "Status", "Gerado por"]}
          rows={rows.map((r, i) => ({ key: r.date + i, cells: [<FileText className="h-4 w-4 text-info" />, r.date, r.name, <StatusBadge status={r.type} />, r.period, <DotStatus label="Concluído" tone="neutral" />, r.by] }))} />
      </Panel>
      <Panel className="mt-3" title="Modelos de relatórios disponíveis">
        <p className="-mt-2 mb-3 text-[13px] text-muted-foreground">Gere relatórios personalizados conforme a necessidade da sua auditoria.</p>
        <div className="grid grid-cols-5 gap-3">
          {models.map((m) => (
            <div key={m.title} className="flex flex-col rounded-lg border p-4">
              <div className="flex gap-3">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg text-primary-foreground", solid[m.tone])}><m.icon className="h-6 w-6" /></span>
                <div><div className="text-[14px] font-semibold">{m.title}</div><p className="mt-1 text-[12.5px] text-muted-foreground">{m.desc}</p></div>
              </div>
              <button onClick={() => gen(m)} className="mt-4 h-10 rounded-md border text-[13.5px] font-medium hover:bg-muted">Gerar relatório</button>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
