import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CheckCircle2, CircleX, ClipboardList, Clock, Check } from "lucide-react";
import { AlertList, ChartLegend, DataTable, DonutPanel, HBars, KpiCard, MiniSelect, PageHeader, Panel, StatusBadge, TableToolbar, soon } from "@/components/kit";
import { actionPlans, axis, months } from "@/lib/data";
import { pageHead } from "@/lib/head";
import { cn } from "@/lib/utils";
import { useAnalyses } from "@/components/analysis-provider";
import { LiveAnalysisDashboard } from "@/components/live-analysis-dashboard";

export const Route = createFileRoute("/planos-de-acao")({
  head: pageHead("Planos de ação", "Acompanhe, gerencie e garanta a execução das ações corretivas e preventivas da auditoria."),
  component: Plans,
});

const evo = months.map((m, i) => ({ m, c: [4, 6, 7, 8, 9, 10][i], e: [5, 6, 8, 10, 13, 14][i], p: [6, 8, 11, 12, 14, 17][i], a: [1, 1, 2, 2, 2, 3][i] }));

function Plans() {
  const { analyses } = useAnalyses();
  const [q, setQ] = useState("");
  const [st, setSt] = useState("Todos os status");
  const [ar, setAr] = useState("Todas as áreas");
  const rows = actionPlans.filter((p) => (p.id + p.desc + p.finding).toLowerCase().includes(q.toLowerCase()) && (st === "Todos os status" || p.status === st) && (ar === "Todas as áreas" || p.area === ar));
  if (analyses.length) return <LiveAnalysisDashboard title="Planos de ação" subtitle="Acompanhe as ações corretivas das análises salvas." />;
  return (
    <>
      <PageHeader title="Planos de ação" subtitle="Acompanhe, gerencie e garanta a execução das ações corretivas e preventivas da auditoria." action="Novo plano de ação" />
      <div className="grid grid-cols-5 gap-3">
        <KpiCard icon={ClipboardList} tone="info" value="48" label="Planos de ação" delta="+20%" />
        <KpiCard plain icon={Clock} tone="critical" value="22" label="Em andamento" sub="46% do total" subTone="info" />
        <KpiCard plain icon={CheckCircle2} tone="medium" value="18" label="Pendentes" sub="38% do total" subTone="medium" />
        <KpiCard plain icon={CheckCircle2} tone="low" value="6" label="Concluídos" sub="13% do total" subTone="low" />
        <KpiCard plain icon={CircleX} tone="critical" value="2" label="Atrasados" sub="4% do total" subTone="critical" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Evolução dos planos de ação" action={<MiniSelect options={["Últimos 6 meses"]} />}>
          <div className="h-[170px]">
            <ResponsiveContainer>
              <BarChart data={evo} margin={{ left: -24, top: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="m" {...axis} />
                <YAxis {...axis} />
                <Bar dataKey="c" stackId="s" fill="var(--low)" barSize={34} />
                <Bar dataKey="e" stackId="s" fill="var(--info)" />
                <Bar dataKey="p" stackId="s" fill="var(--medium)" />
                <Bar dataKey="a" stackId="s" fill="var(--critical)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend items={[{ label: "Concluídos", tone: "low" }, { label: "Em andamento", tone: "info" }, { label: "Pendentes", tone: "medium" }, { label: "Atrasados", tone: "critical" }]} />
        </Panel>
        <Panel title="Status dos planos de ação">
          <DonutPanel center="48" caption="planos" data={[
            { name: "Em andamento", value: 22, tone: "info", display: "22 (46%)" },
            { name: "Pendentes", value: 18, tone: "medium", display: "18 (38%)" },
            { name: "Concluídos", value: 6, tone: "low", display: "6 (13%)" },
            { name: "Atrasados", value: 2, tone: "critical", display: "2 (4%)" },
          ]} />
        </Panel>
        <Panel title="Planos de ação por área" action={<MiniSelect options={["Por quantidade"]} />}>
          <HBars labelWidth={120} items={[["Compras", 14], ["Financeiro", 9], ["Vendas", 6], ["TI", 5], ["Recursos Humanos", 4], ["Outros", 10]].map(([l, v]) => ({ label: l as string, value: v as number, tone: "info", soft: true }))} />
        </Panel>
      </div>
      <Panel className="mt-3" title="Lista de planos de ação" action={<TableToolbar placeholder="Buscar plano de ação..." query={q} setQuery={setQ} filters={[{ value: st, onChange: setSt, options: ["Todos os status", "Em andamento", "Pendente", "Atrasado", "Concluído"] }, { value: ar, onChange: setAr, options: ["Todas as áreas", "Compras", "Financeiro", "TI"] }]} />}>
        <DataTable checkbox head={["ID", "Descrição", "Achado relacionado", "Área", "Responsável", "Prazo", "Status", "Progresso"]}
          rows={rows.map((p) => ({ key: p.id, cells: [p.id, p.desc, p.finding, p.area, p.owner, p.due, <StatusBadge status={p.status} />,
            <div className="flex items-center gap-3"><div className="h-2 w-[90px] rounded-full bg-muted"><div className={cn("h-full rounded-full", p.progress === 100 ? "bg-low" : "bg-info")} style={{ width: `${p.progress}%`, opacity: p.status === "Pendente" || p.status === "Atrasado" ? 0.5 : 1 }} /></div>{p.progress}%</div>] }))} />
      </Panel>
      <div className="mt-3 grid grid-cols-[1.25fr_0.9fr_1.1fr] gap-3">
        <Panel title="Plano de ação em destaque" action={<button onClick={() => soon("Todos os destaques")} className="text-[12.5px] text-info">Ver todos →</button>}>
          <div className="mb-3 flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-medium/15 text-high"><Clock className="h-6 w-6" /></span>
            <div><div className="flex items-center gap-3 text-[15px] font-semibold">Implementar cadastro de fornecedores <StatusBadge status="Pendente" /></div><div className="text-[12.5px] text-muted-foreground">Achado: Fornecedor sem cadastro (#45871)</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <dl className="grid grid-cols-[95px_1fr] gap-y-2">
              <dt>ID</dt><dd>PA-2024-002</dd><dt>Área</dt><dd>Compras</dd><dt>Responsável</dt><dd>Carlos Mendes</dd><dt>Prazo</dt><dd>20/06/2024</dd>
              <dt>Progresso</dt><dd className="flex items-center gap-2"><span className="h-2 flex-1 rounded-full bg-muted"><span className="block h-full w-1/5 rounded-full bg-info" /></span>20%</dd>
            </dl>
            <ol className="flex flex-col gap-3 border-l pl-3 text-[12.5px]">
              {[["1. Elaborar procedimento", "05/06/2024", "done"], ["2. Validar com a área de Compras", "15/06/2024", "now"], ["3. Implementar no sistema", "20/06/2024", ""], ["4. Monitorar execução", "30/06/2024", ""]].map(([t, d, s]) => (
                <li key={t} className="flex items-center gap-2">
                  <span className={cn("grid h-3.5 w-3.5 place-items-center rounded-full", s === "done" ? "bg-low text-primary-foreground" : s === "now" ? "bg-info" : "bg-neutral")}>{s === "done" && <Check className="h-2.5 w-2.5" />}</span>
                  <span className="flex-1">{t}</span><span>{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </Panel>
        <Panel title="Progresso por prazo" action={<MiniSelect options={["Por prazo"]} />}>
          <DonutPanel size={130} center="48" caption="planos" data={[
            { name: "No prazo", value: 28, tone: "low", display: "28 (58%)" },
            { name: "A vencer (≤ 7 dias)", value: 10, tone: "medium", display: "10 (21%)" },
            { name: "Atrasados", value: 10, tone: "critical", display: "10 (21%)" },
          ]} />
        </Panel>
        <Panel title="Principais alertas" action={<button onClick={() => soon("Todos os alertas")} className="text-[12.5px] text-info">Ver todos →</button>}>
          <AlertList items={[
            { tone: "critical", title: "2 planos de ação em atraso", desc: "Compras (1) e Financeiro (1)", when: "há 1 dia" },
            { tone: "medium", title: "5 planos vencem em até 7 dias", desc: "Ações em Compras, TI e Financeiro", when: "há 2 dias" },
            { tone: "info", title: "42% dos planos ainda pendentes", desc: "18 de 48 planos não iniciados ou em andamento", when: "há 2 dias" },
            { tone: "low", title: "6 planos de ação concluídos", desc: "Aumento de 50% em relação ao período anterior", when: "há 3 dias" },
          ]} />
        </Panel>
      </div>
    </>
  );
}
