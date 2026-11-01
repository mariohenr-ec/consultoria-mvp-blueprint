import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, CircleDot, Clock, FileText, Plus, User } from "lucide-react";
import { ChartLegend, DataTable, DonutPanel, HBars, KpiCard, MiniSelect, PageHeader, Panel, RiskBadge, StatusBadge, TableToolbar, soon } from "@/components/kit";
import { axis, findings, topRisks, type Finding } from "@/lib/data";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";
import { useAnalyses } from "@/components/analysis-provider";
import { LiveAnalysisDashboard } from "@/components/live-analysis-dashboard";

export const Route = createFileRoute("/riscos")({
  head: pageHead("Riscos", "Identificação, análise e monitoramento de riscos com base em 100% das transações."),
  component: Risks,
});

const weeks = Array.from({ length: 14 }, (_, i) => ({
  w: i,
  b: [4, 5, 6, 6, 7, 6, 6, 5, 6, 4, 5, 6, 6, 5][i],
  m: [3, 3, 4, 5, 5, 4, 5, 4, 4, 3, 3, 4, 5, 4][i],
  a: [2, 2, 3, 4, 3, 4, 3, 3, 3, 3, 3, 3, 4, 4][i],
  c: [1, 1, 2, 2, 1, 2, 1, 2, 1, 1, 2, 1, 2, 2][i],
}));
const wkLabel: Record<number, string> = { 0: "01 Jun", 3: "08 Jun", 6: "15 Jun", 9: "22 Jun", 12: "29 Jun" };

function Risks() {
  const { analyses } = useAnalyses();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("Todos os status");
  const [cat, setCat] = useState("Todas as categorias");
  const [sel, setSel] = useState<string>("45872");
  const rows = findings.filter((f) => (f.id + f.desc + f.supplier).toLowerCase().includes(q.toLowerCase()) && (st === "Todos os status" || f.status === st) && (cat === "Todas as categorias" || f.category === cat));
  const current = findings.find((f) => f.id === sel);
  if (analyses.length) return <LiveAnalysisDashboard title="Riscos" subtitle="Identificação, análise e monitoramento de riscos nas análises salvas." />;
  return (
    <>
      <PageHeader title="Riscos" subtitle="Identificação, análise e monitoramento de riscos com base em 100% das transações." action="Nova regra de risco" />
      <div className="grid grid-cols-4 gap-3">
        <KpiCard plain icon={AlertTriangle} tone="critical" value="37" label="Achados de risco" delta="+28%" good={false} />
        <KpiCard plain icon={CircleDot} tone="critical" value="12" label="Riscos críticos" sub="32% do total" subTone="critical" />
        <KpiCard plain icon={Circle} tone="medium" value="18" label="Riscos médios" sub="49% do total" subTone="medium" />
        <KpiCard plain icon={CheckCircle2} tone="low" value="7" label="Riscos baixos" sub="19% do total" subTone="low" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Evolução dos riscos" action={<MiniSelect options={["Por semana", "Por dia"]} />}>
          <div className="flex items-center">
            <div className="h-[160px] flex-1">
              <ResponsiveContainer>
                <BarChart data={weeks} margin={{ left: -24, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="w" {...axis} interval={0} tickFormatter={(v) => wkLabel[v] ?? ""} />
                  <YAxis {...axis} domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} />
                  <Bar dataKey="b" stackId="s" fill="var(--low)" barSize={16} />
                  <Bar dataKey="m" stackId="s" fill="var(--medium)" />
                  <Bar dataKey="a" stackId="s" fill="var(--high)" />
                  <Bar dataKey="c" stackId="s" fill="var(--critical)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="ml-2 flex flex-col gap-2 text-[12.5px]">
              {(["Crítico:critical", "Alto:high", "Médio:medium", "Baixo:low"]).map((s) => { const [l, t] = s.split(":"); return <li key={l} className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: `var(--${t})` }} />{l}</li>; })}
            </ul>
          </div>
        </Panel>
        <Panel title="Riscos por categoria" action={<MiniSelect options={["Por quantidade", "Por valor"]} />}>
          <HBars items={topRisks} labelWidth={180} />
        </Panel>
        <Panel title="Origem dos riscos">
          <DonutPanel center="37" caption="achados" data={[
            { name: "Compras", value: 14, tone: "info", display: "14 (38%)" },
            { name: "Despesas", value: 9, tone: "low", display: "9 (24%)" },
            { name: "Pagamentos", value: 7, tone: "critical", display: "7 (19%)" },
            { name: "Receitas", value: 4, tone: "medium", display: "4 (11%)" },
            { name: "Outros", value: 3, tone: "neutral", display: "3 (8%)" },
          ]} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Lista de riscos identificados" action={<TableToolbar placeholder="Buscar transação, fornecedor, descrição..." query={q} setQuery={setQ} filters={[{ value: st, onChange: setSt, options: ["Todos os status", "Aberto", "Em análise"] }, { value: cat, onChange: setCat, options: ["Todas as categorias", "Compras", "Pagamentos", "Governança"] }]} />}>
        <DataTable checkbox selected={sel} onRowClick={setSel} head={["Data", "ID", "Descrição", "Categoria", "Valor (R$)", "Risco", "Status", "Sistema"]}
          rows={rows.map((f) => ({ key: f.id, cells: [f.date, `#${f.id}`, f.desc, f.category, f.value, <RiskBadge level={f.risk} />, <StatusBadge status={f.status} />, f.system] }))} />
        <p className="mt-2 text-[12px] text-muted-foreground">Clique em um risco para ver o detalhamento abaixo.</p>
      </Panel>
      {current && <RiskDetail f={current} />}
    </>
  );
}

const tabs = ["Detalhes", "Contexto", "Evidências (3)", "Transações relacionadas (2)", "Histórico", "Análise de IA"];

function RiskDetail({ f }: { f: Finding }) {
  const [tab, setTab] = useState<string>(tabs[0]!);
  const [steps, setSteps] = useState([
    { t: "Investigar a transação", who: "Ana Silva", d: "15/06/2024", s: "Em andamento" },
    { t: "Solicitar documentação", who: "Ana Silva", d: "20/06/2024", s: "Pendente" },
    { t: "Revisar política de compras", who: "Carlos", d: "30/06/2024", s: "Pendente" },
    { t: "Validar e encerrar", who: "Carlos", d: "05/07/2024", s: "Pendente" },
  ]);
  return (
    <Panel className="mt-3">
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mb-3 flex items-center gap-2 text-[14px] font-medium"><ArrowLeft className="h-4 w-4" /> Voltar</button>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 h-7 w-7 text-critical" />
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-[18px] font-semibold">{f.desc}</h3>
              <RiskBadge level={f.risk} /> <StatusBadge status={f.status === "Aberto" ? "Aberto" : "Em análise"} />
            </div>
            <p className="text-[14px] text-muted-foreground">Transação identificada com valor acima do limite da política de {f.category.toLowerCase()}.</p>
          </div>
        </div>
        <span className="text-[13px] text-muted-foreground">#{f.id}</span>
      </div>
      <div className="mt-3 flex gap-8 border-b text-[13.5px]">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t as string)} className={cn("-mb-px border-b-2 px-2 pb-2", tab === t ? "border-info font-medium text-info" : "border-transparent text-muted-foreground")}>{t}</button>
        ))}
      </div>
      {tab !== "Detalhes" ? (
        <div className="py-10 text-center text-[13.5px] text-muted-foreground">A aba “{tab}” será disponibilizada na próxima evolução do protótipo.</div>
      ) : (
        <div className="mt-3 grid grid-cols-[1fr_1.2fr_1fr_1.1fr] gap-3">
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[13px]">
            {[["Data", f.date], ["Valor", `R$ ${f.value}`], ["Fornecedor", f.supplier], ["Categoria", f.category], ["Centro de custo", "TI"], ["Sistema", f.system]].map(([k, v]) => (<><dt key={k}>{k}</dt><dd>{v}</dd></>))}
          </dl>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 rounded-lg bg-critical/10 p-3 text-[12.5px]">
              <AlertTriangle className="h-5 w-5 shrink-0 text-critical" />
              <div><div className="font-semibold">Regra de risco violada</div>Pagamentos acima de R$ 100.000,00 precisam de aprovação do diretor financeiro.</div>
            </div>
            <div className="flex gap-3 rounded-lg bg-muted p-3 text-[12.5px]">
              <Clock className="h-5 w-5 shrink-0" />
              <div><div className="font-semibold">Impacto potencial</div>Risco de fraude, pagamento indevido ou falta de compliance com a política interna.</div>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex justify-between"><span className="text-[14px] font-semibold">Evidências</span><button onClick={() => soon("Todas as evidências")} className="text-[12px] text-info">Ver todas (3)</button></div>
            {[["Comprovante de pagamento.pdf", "156 KB"], ["Nota fiscal #9932.pdf", "320 KB"], ["Política de compras (v2).pdf", "1,2 MB"]].map(([n, s]) => (
              <button key={n} onClick={() => soon(n ?? "")} className="flex w-full items-center gap-3 py-1.5 text-left text-[12.5px]"><FileText className="h-6 w-6 text-info" strokeWidth={1.5} /><span>{n}<div className="text-muted-foreground">{s}</div></span></button>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between"><span className="text-[14px] font-semibold">Plano de ação</span>
              <button onClick={() => setSteps((s) => [...s, { t: "Nova ação", who: "Carlos", d: "10/07/2024", s: "Pendente" }])} className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[12px] text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Nova ação</button>
            </div>
            <ol className="flex flex-col gap-2">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px]">
                  <span className={cn("mt-1 h-3 w-3 shrink-0 rounded-full border-2", i === 0 ? "border-info bg-info" : "border-neutral")} />
                  <div className="flex-1"><div className="font-medium">{i + 1}. {s.t}</div><div className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{s.who} &nbsp;{s.d}</div></div>
                  <StatusBadge status={s.s} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <ChartLegend items={[]} />
    </Panel>
  );
}
