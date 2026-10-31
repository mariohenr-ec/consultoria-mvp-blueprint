import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Clock, FileText, FileWarning, ShieldCheck } from "lucide-react";
import { AlertList, ChartLegend, DataTable, DonutPanel, HBars, KpiCard, MiniSelect, PageHeader, Panel, RiskBadge, StatusBadge, TableToolbar } from "@/components/kit";
import { axis, findings, months } from "@/lib/data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/conformidade")({
  head: pageHead("Conformidade", "Acompanhe o nível de conformidade da empresa por área, sistema e política interna."),
  component: Compliance,
});

const sevMap = { Crítico: "Alto", Alto: "Alto", Médio: "Médio", Baixo: "Baixo" } as const;
const sevLabel = { Alto: "Alta", Médio: "Média", Baixo: "Baixa" } as const;
const sevOverride: Record<string, "Alto" | "Médio" | "Baixo"> = { "45865": "Médio", "45859": "Baixo" };

function Compliance() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("Todas as áreas");
  const [st, setSt] = useState("Todos os status");
  const rows = findings.filter((f) => (f.desc + f.control).toLowerCase().includes(q.toLowerCase()) && (area === "Todas as áreas" || f.area === area) && (st === "Todos os status" || f.status === st));
  return (
    <>
      <PageHeader title="Conformidade" subtitle="Acompanhe o nível de conformidade da empresa, por área, sistema e política interna." />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={ShieldCheck} tone="low" value="92%" label="Conformidade geral" delta="+5%" />
        <KpiCard icon={FileWarning} tone="critical" value="37" label="Não conformidades" delta="-28%" good={false} />
        <KpiCard icon={FileText} tone="info" value="124" label="Controles avaliados" delta="+12%" />
        <KpiCard icon={Clock} tone="medium" value="18" label="Não conformidades em aberto" delta="-22%" good={false} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Evolução da conformidade" action={<MiniSelect options={["Últimos 6 meses", "Últimos 12 meses"]} />}>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <ComposedChart data={months.map((m, i) => ({ m, v: [55, 66, 72, 69, 78, 82][i] }))} margin={{ top: 14, right: 22, left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" {...axis} />
                <YAxis {...axis} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Area dataKey="v" fill="var(--low)" fillOpacity={0.12} stroke="none" />
                <Line dataKey="v" stroke="var(--low)" strokeWidth={2.5} dot={{ r: 5, fill: "var(--low)" }}>
                  <LabelList content={(p: any) => (p.index === 5 ? <g><rect x={p.x - 22} y={p.y - 32} width={44} height={22} rx={5} fill="var(--low)" /><text x={p.x} y={p.y - 17} textAnchor="middle" fill="white" fontSize={13} fontWeight={600}>92%</text></g> : null)} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Conformidade geral", tone: "low" }, { label: "Controles conformes", tone: "info" }, { label: "Não conformidades", tone: "critical" }]} />
        </Panel>
        <Panel title="Conformidade por área de negócio" action={<MiniSelect options={["Por área"]} />}>
          <HBars max={100} labelWidth={110} items={[["Compras", 96, "low"], ["Financeiro", 89], ["Vendas", 87], ["Recursos Humanos", 92], ["TI", 85], ["Outros", 90]].map(([l, v, t]) => ({ label: l as string, value: v as number, display: `${v}%`, tone: (t as any) ?? "info" }))} />
        </Panel>
        <Panel title="Conformidade por sistema" action={<MiniSelect options={["Por sistema"]} />}>
          <HBars max={100} labelWidth={120} items={[["ERP (SAP)", 95, "low"], ["Banco de dados", 88], ["Planilhas (Excel)", 82], ["Sistemas financeiros", 90], ["RH (Totvs)", 86], ["Outros (APIs)", 89]].map(([l, v, t]) => ({ label: l as string, value: v as number, display: `${v}%`, tone: (t as any) ?? "info" }))} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Principais não conformidades" action={<TableToolbar placeholder="Buscar por descrição, controle..." query={q} setQuery={setQ} filters={[{ value: area, onChange: setArea, options: ["Todas as áreas", "Compras", "Financeiro", "TI"] }, { value: st, onChange: setSt, options: ["Todos os status", "Aberto", "Em análise"] }]} />}>
        <DataTable checkbox head={["Data", "ID", "Descrição", "Área", "Sistema", "Controle relacionado", "Severidade", "Status", "Responsável"]}
          rows={rows.map((f) => { const s = sevOverride[f.id] ?? sevMap[f.risk]; return { key: f.id, cells: [f.date, `#${f.id}`, f.desc, f.area, f.system, f.control, <RiskBadge level={s} label={sevLabel[s]} />, <StatusBadge status={f.status} />, f.owner] }; })} />
      </Panel>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Status dos controles">
          <DonutPanel center="124" caption="controles" data={[
            { name: "Conformes", value: 88, tone: "low", display: "" },
            { name: "Não conformes", value: 24, tone: "critical", display: "" },
            { name: "Em análise", value: 8, tone: "info", display: "" },
            { name: "Não aplicáveis", value: 4, tone: "neutral", display: "" },
          ]} />
        </Panel>
        <Panel title="Conformidade por política" action={<MiniSelect options={["Por política"]} />}>
          <HBars max={100} labelWidth={130} items={[["Política de Compras", 95, "low"], ["Política Financeira", 88], ["Política de TI", 84], ["Política de RH", 91], ["Política Antifraude", 87], ["Outras políticas", 89]].map(([l, v, t]) => ({ label: l as string, value: v as number, display: `${v}%`, tone: (t as any) ?? "info" }))} />
        </Panel>
        <Panel title="Tendências e alertas">
          <AlertList items={[
            { tone: "critical", title: "Aumento de não conformidades em Compras", desc: "+28% em relação ao período anterior", when: "há 2 horas" },
            { tone: "medium", title: "Controle POL-FIN-04 com recorrência", desc: "5 ocorrências no último mês", when: "há 4 horas" },
            { tone: "info", title: "Melhora de 6% na conformidade de TI", desc: "Comparado ao período anterior", when: "há 1 dia" },
            { tone: "low", title: "Todos os controles críticos avaliados", desc: "0 pendências em controles críticos", when: "há 2 dias" },
          ]} />
        </Panel>
      </div>
    </>
  );
}
