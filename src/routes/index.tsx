import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, CartesianGrid, ComposedChart, Area, Line, ResponsiveContainer, XAxis, YAxis, LabelList, BarChart } from "recharts";
import { AlertTriangle, ClipboardList, FileText, ShieldCheck, Database, Cloud, FileSpreadsheet } from "lucide-react";
import { ChartLegend, DataTable, DotStatus, DonutPanel, HBars, KpiCard, LinkButton, PageHeader, Panel, RiskBadge, StatusBadge, soon } from "@/components/kit";
import { axis, findings, months, topRisks } from "@/lib/data";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/")({
  head: pageHead("Visão geral", "Panorama da auditoria contínua com os principais indicadores e achados em tempo real."),
  component: Overview,
});

const compliance = months.map((m, i) => ({ m, conf: [55, 66, 74, 70, 78, 84][i], tx: [42, 48, 55, 55, 60, 67][i] }));

function Overview() {
  return (
    <>
      <PageHeader title="Visão geral" subtitle="Panorama da auditoria contínua com os principais indicadores e achados em tempo real." />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={FileText} tone="info" value="2,4 M" label="Transações analisadas" delta="+12%" />
        <KpiCard icon={AlertTriangle} tone="critical" value="37" label="Achados de risco" delta="-28%" good={false} />
        <KpiCard icon={ShieldCheck} tone="low" value="92%" label="Conformidade geral" delta="+5%" />
        <KpiCard icon={ClipboardList} tone="medium" value="48" label="Planos de ação ativos" delta="+20%" />
      </div>

      <div className="mt-3 grid grid-cols-[1.35fr_1.1fr_1.1fr] gap-3">
        <Panel title="Conformidade ao longo do tempo">
          <div className="h-[190px]">
            <ResponsiveContainer>
              <ComposedChart data={compliance} margin={{ top: 14, right: 20, left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" {...axis} />
                <YAxis {...axis} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Bar dataKey="tx" fill="var(--info-soft)" barSize={20} radius={[3, 3, 0, 0]} />
                <Area dataKey="conf" fill="var(--low)" fillOpacity={0.12} stroke="none" />
                <Line dataKey="conf" stroke="var(--low)" strokeWidth={2.5} dot={{ r: 5, fill: "var(--low)" }}>
                  <LabelList dataKey="conf" content={(p: any) => (p.index === 5 ? <g><rect x={p.x - 20} y={p.y - 30} width={40} height={22} rx={5} fill="var(--low)" /><text x={p.x} y={p.y - 15} textAnchor="middle" fill="white" fontSize={13} fontWeight={600}>92%</text></g> : null)} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Conformidade geral", tone: "low" }, { label: "Achados de risco", tone: "critical" }, { label: "Transações analisadas", tone: "info", square: true, soft: true }]} />
        </Panel>
        <Panel title="Principais riscos detectados" suffix="(últimos 30 dias)">
          <HBars items={topRisks} labelWidth={185} />
        </Panel>
        <Panel title="Distribuição dos achados">
          <DonutPanel center="37" caption="achados" data={[
            { name: "Crítico", value: 12, tone: "critical", display: "12 (32%)" },
            { name: "Alto", value: 14, tone: "high", display: "14 (38%)" },
            { name: "Médio", value: 7, tone: "medium", display: "7 (19%)" },
            { name: "Baixo", value: 4, tone: "low", display: "4 (11%)" },
          ]} />
        </Panel>
      </div>

      <Panel className="mt-3" title="Últimos achados de risco" action={<Link to="/riscos"><LinkButton onClick={() => {}}>Ver todos os achados</LinkButton></Link>}>
        <DataTable
          head={["Data", "ID", "Descrição", "Categoria", "Valor (R$)", "Risco", "Status", "Sistema"]}
          rows={findings.map((f) => ({ key: f.id, cells: [f.date, `#${f.id}`, f.desc, f.category, f.value, <RiskBadge level={f.risk} />, <StatusBadge status={f.status} />, f.system] }))}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Planos de ação" action={<Link to="/planos-de-acao"><LinkButton onClick={() => {}}>Ver todos os planos</LinkButton></Link>}>
          <DonutPanel center="48" caption="planos" data={[
            { name: "Em andamento", value: 22, tone: "info", display: "" },
            { name: "Pendente", value: 18, tone: "medium", display: "" },
            { name: "Concluído", value: 6, tone: "low", display: "" },
            { name: "Atrasado", value: 2, tone: "critical", display: "" },
          ]} />
        </Panel>
        <Panel title="Transações por sistema">
          <div className="h-[160px]">
            <ResponsiveContainer>
              <BarChart layout="vertical" data={[
                { s: "ERP (SAP)", v: 1200, l: "1,2 M", o: 1 }, { s: "Banco de dados", v: 620, l: "620 mil", o: 1 }, { s: "Planilhas", v: 420, l: "420 mil", o: 0.6 },
                { s: "Sistemas financeiros", v: 180, l: "180 mil", o: 0.45 }, { s: "Outros", v: 60, l: "60 mil", o: 0.35 },
              ]} margin={{ right: 60 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="s" width={130} {...axis} tick={{ fontSize: 12.5, fill: "var(--foreground)" }} />
                <Bar dataKey="v" fill="var(--info)" barSize={16}>
                  <LabelList dataKey="l" position="right" fontSize={12.5} fill="var(--foreground)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Integrações ativas" action={<Link to="/integracoes" className="inline-flex h-8 items-center rounded-md border px-3 text-[12px] hover:bg-muted">Gerenciar</Link>}>
          <ul className="flex flex-col gap-3 text-[12.5px]">
            {[
              { icon: <span className="rounded bg-info px-1 text-[10px] font-bold italic text-primary-foreground">SAP</span>, n: "ERP (SAP)", t: "10 minutos" },
              { icon: <Database className="h-5 w-5 text-info" />, n: "Banco de dados", t: "5 minutos" },
              { icon: <FileSpreadsheet className="h-5 w-5 text-low" />, n: "Planilhas (Excel)", t: "2 minutos" },
              { icon: <Cloud className="h-5 w-5 fill-info text-info" />, n: "Outros sistemas (API)", t: "15 minutos" },
            ].map((i) => (
              <li key={i.n} className="grid grid-cols-[32px_1fr_1.4fr] items-start gap-2">
                <span className="grid h-6 place-items-center">{i.icon}</span>
                <span className="pt-0.5">{i.n}</span>
                <span>
                  <DotStatus label="Conectado" tone="low" />
                  <div className="text-muted-foreground">Última sincronização há {i.t}</div>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
