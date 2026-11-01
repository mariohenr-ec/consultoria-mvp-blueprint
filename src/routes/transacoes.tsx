import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { AlertTriangle, CircleCheck, CircleDollarSign, FileText } from "lucide-react";
import { AlertList, ChartLegend, DataTable, DonutPanel, HBars, KpiCard, MiniSelect, PageHeader, Panel, RiskBadge, StatusBadge, TableToolbar } from "@/components/kit";
import { axis, findings } from "@/lib/data";
import { pageHead } from "@/lib/head";
import { useAnalyses } from "@/components/analysis-provider";
import { LiveAnalysisDashboard } from "@/components/live-analysis-dashboard";

export const Route = createFileRoute("/transacoes")({
  head: pageHead("Transações", "Análise e monitoramento de todas as transações para identificação de riscos e não conformidades."),
  component: Transactions,
});

const days = Array.from({ length: 13 }, (_, i) => ({
  d: ["01 Jun", "", "08 Jun", "", "", "15 Jun", "", "22 Jun", "", "", "29 Jun", "", ""][i] || `${i}`,
  a: [130, 148, 158, 128, 120, 160, 152, 158, 160, 130, 150, 172, 180][i]! * 1000,
  t: [18, 22, 32, 28, 25, 24, 28, 38, 30, 22, 26, 30, 32][i]! * 1000 * 0.6,
}));
const riskLevelTx: Record<string, "Crítico" | "Alto" | "Médio" | "Baixo"> = { "45859": "Baixo" };

function Transactions() {
  const { analyses } = useAnalyses();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("Todos os status");
  const [rk, setRk] = useState("Todos os riscos");
  const rows = findings
    .map((f) => ({ ...f, risk: riskLevelTx[f.id] ?? f.risk, value: f.id === "45859" ? "18.600,00" : f.value }))
    .filter((f) => (f.id + f.desc + f.supplier).toLowerCase().includes(q.toLowerCase()) && (st === "Todos os status" || f.status === st) && (rk === "Todos os riscos" || f.risk === rk));
  if (analyses.length) return <LiveAnalysisDashboard title="Transações" subtitle="Análise e monitoramento de todas as transações para identificação de riscos e não conformidades." />;
  return (
    <>
      <PageHeader title="Transações" subtitle="Análise e monitoramento de todas as transações para identificação de riscos e não conformidades." action="Nova análise" />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={FileText} tone="info" value="2,4 M" label="Transações analisadas" delta="+12%" />
        <KpiCard icon={AlertTriangle} tone="critical" value="37" label="Transações atípicas" delta="-28%" good={false} />
        <KpiCard icon={CircleDollarSign} tone="medium" value="R$ 18,6 M" label="Valor em transações atípicas" delta="-15%" good={false} />
        <KpiCard icon={CircleCheck} tone="low" value="92%" label="Transações em conformidade" delta="+5%" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Volume de transações" action={<MiniSelect options={["Por dia", "Por semana"]} />}>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <ComposedChart data={days} margin={{ top: 6, right: 6, left: -10 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="d" {...axis} tickFormatter={(v) => (v.includes("Jun") ? v : "")} interval={0} />
                <YAxis {...axis} tickFormatter={(v) => (v ? `${v / 1000}K` : "0")} />
                <Bar dataKey="a" fill="var(--info-soft)" barSize={18} radius={[3, 3, 0, 0]} />
                <Line dataKey="t" stroke="var(--critical)" strokeWidth={2} dot={{ r: 4, fill: "var(--critical)" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Transações analisadas", tone: "info" }, { label: "Transações atípicas", tone: "critical" }]} />
        </Panel>
        <Panel title="Distribuição por tipo de transação">
          <DonutPanel size={160} center="2,4 M" caption="transações" data={[
            { name: "Pagamentos", value: 38, tone: "info", display: "38%" },
            { name: "Transferências", value: 24, tone: "low", display: "24%" },
            { name: "Compras", value: 18, tone: "medium", display: "18%" },
            { name: "Recebimentos", value: 11, tone: "critical", display: "11%" },
            { name: "Ajustes", value: 6, tone: "soft", display: "6%" },
            { name: "Outros", value: 3, tone: "neutral", display: "3%" },
          ]} />
        </Panel>
        <Panel title="Transações por nível de risco" action={<MiniSelect options={["Por valor (R$)", "Por quantidade"]} />}>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <BarChart data={[{ n: "Crítico", v: 8.4, c: "var(--critical)" }, { n: "Alto", v: 5.2, c: "var(--high)" }, { n: "Médio", v: 3.1, c: "var(--medium)" }, { n: "Baixo", v: 1.1, c: "var(--low)" }]} margin={{ top: 20, left: -20 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="n" {...axis} />
                <YAxis {...axis} domain={[0, 10]} tickFormatter={(v) => (v ? `${v}M` : "0")} />
                <Bar dataKey="v" barSize={54}>
                  {["a", "b", "c", "d"].map((k, i) => <Cell key={k} fill={["var(--critical)", "var(--high)", "var(--medium)", "var(--low)"][i]} />)}
                  <LabelList dataKey="v" position="top" fontSize={12.5} fill="var(--foreground)" formatter={(v: number) => `R$ ${String(v).replace(".", ",")} M`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel className="mt-3" title="Transações recentes" action={<TableToolbar placeholder="Buscar por ID, descrição, fornecedor..." query={q} setQuery={setQ} filters={[{ value: st, onChange: setSt, options: ["Todos os status", "Aberto", "Em análise"] }, { value: rk, onChange: setRk, options: ["Todos os riscos", "Crítico", "Alto", "Médio", "Baixo"] }]} />}>
        <DataTable checkbox head={["Data", "ID", "Descrição", "Fornecedor/Cliente", "Valor (R$)", "Tipo", "Risco", "Status"]}
          rows={rows.map((f) => ({ key: f.id, cells: [f.date, f.id, f.desc.replace(" da política", ""), f.supplier, f.value, f.type, <RiskBadge level={f.risk} />, <StatusBadge status={f.status} />] }))} />
      </Panel>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Transações por fornecedor (top 5)">
          <HBars labelWidth={120} items={[["ABC Serviços LTDA", 1200, "R$ 1,2 M"], ["Tech Solutions", 980, "R$ 980 mil"], ["Global Tech", 760, "R$ 760 mil"], ["Omega Distribuidora", 540, "R$ 540 mil"], ["XYZ Comércio", 430, "R$ 430 mil"]].map(([l, v, d]) => ({ label: l as string, value: v as number, display: d as string }))} />
        </Panel>
        <Panel title="Evolução das transações atípicas" action={<MiniSelect options={["Últimos 6 meses"]} />}>
          <div className="h-[170px]">
            <ResponsiveContainer>
              <ComposedChart data={["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"].map((m, i) => ({ m, v: [10, 21, 18, 31, 26, 31][i] }))} margin={{ top: 6, right: 10, left: -24 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" {...axis} />
                <YAxis {...axis} domain={[0, 40]} />
                <Area dataKey="v" fill="var(--critical)" fillOpacity={0.1} stroke="none" />
                <Line dataKey="v" stroke="var(--critical)" strokeWidth={2} dot={{ r: 4, fill: "var(--critical)" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Principais padrões identificados">
          <AlertList chevron items={[
            { tone: "critical", title: "Pagamentos acima do limite", desc: "12 transações (32% das atípicas)" },
            { tone: "medium", title: "Transações fora do horário padrão", desc: "8 transações (22% das atípicas)" },
            { tone: "info", title: "Fornecedores sem cadastro", desc: "7 transações (19% das atípicas)" },
            { tone: "low", title: "Duplicidade de pagamentos", desc: "5 transações (14% das atípicas)" },
          ]} />
        </Panel>
      </div>
    </>
  );
}
