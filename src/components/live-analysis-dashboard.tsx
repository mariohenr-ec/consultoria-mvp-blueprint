import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { FileText, AlertTriangle, ShieldCheck, ClipboardList, Database, Coins } from "lucide-react";
import { useAnalyses } from "./analysis-provider";
import { summarize, money, number, percent, type Evaluated } from "@/lib/analysis";
import { KpiCard, PageHeader, Panel, DonutPanel, HBars, DataTable, RiskBadge, AlertList, type Tone } from "./kit";
import { LiveRiskDetail } from "./live-risk-detail";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { axis } from "@/lib/data";

export function LiveAnalysisDashboard({ title, subtitle }: { title: string; subtitle: string }) {
  const { analyses, loading, error, refresh } = useAnalyses();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Evaluated | null>(null);
  const stats = summarize(analyses);
  const isCompliance = title === "Conformidade";
  const isRisks = title === "Riscos";
  const isPlans = title === "Planos de ação";
  const isIntegrations = title === "Integrações";
  const isReports = title === "Relatórios";
  const grouped = (rows: Evaluated[], key: "area" | "system" | "category" | "type" | "supplier") => Object.entries(rows.reduce<Record<string, number>>((groups, r) => ({ ...groups, [r[key]]: (groups[r[key]] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const riskSlices = ([['Crítico', 'critical'], ['Alto', 'high'], ['Médio', 'medium'], ['Baixo', 'low']] as const).map(([name, tone]) => {
    const value = stats.findings.filter(r => r.level === name).length;
    return { name, tone, value, display: `${number(value)} (${percent(stats.findings.length ? value / stats.findings.length * 100 : 0)})` };
  });
  const controls = ([['Conforme', 'low'], ['Não conforme', 'critical'], ['Em análise', 'info'], ['Não aplicável', 'neutral']] as const).map(([name, tone]) => {
    const value = stats.rows.filter(r => r.control === name).length;
    return { name, tone, value, display: percent(stats.count ? value / stats.count * 100 : 0) };
  });
  const types = grouped(stats.rows, "type").map(([name, value], i) => ({ name, value, tone: (["info", "low", "medium", "critical", "neutral", "soft"] as Tone[])[i % 6] ?? "info", display: percent(value / stats.count * 100) }));
  const series = Object.entries(stats.rows.reduce<Record<string, { total: number; risks: number }>>((groups, r) => {
    const current = groups[r.date] ?? { total: 0, risks: 0 };
    groups[r.date] = { total: current.total + 1, risks: current.risks + (r.reasons.length || r.level !== "Baixo" ? 1 : 0) };
    return groups;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date: date.split("-").reverse().join("/"), ...v }));
  const visible = (isRisks ? stats.findings : isCompliance ? stats.rows.filter(r => r.control !== "Conforme") : stats.rows).filter(r => `${r.id} ${r.description} ${r.supplier} ${r.area}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <PageHeader title={title} subtitle={subtitle} action="Nova análise" />
    {loading ? <p role="status">Carregando análises…</p> : error ? <div role="alert" className="flex items-center gap-3"><p>Não foi possível carregar suas análises.</p><Button onClick={() => refresh()}>Tentar novamente</Button></div> : <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm text-muted-foreground"><span>{number(analyses.length)} análises salvas · Todos os períodos</span><span>{analyses.at(-1)?.start_date} — {analyses[0]?.end_date}</span></div>
      <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
        <KpiCard icon={FileText} tone="info" value={number(stats.count)} label="Transações analisadas" />
        <KpiCard icon={AlertTriangle} tone="critical" value={number(stats.findings.length)} label="Achados de risco" />
        <KpiCard icon={ShieldCheck} tone="low" value={stats.compliance === null ? "—" : percent(stats.compliance)} label="Conformidade dos controles" />
        <KpiCard icon={isIntegrations ? Database : isPlans ? ClipboardList : Coins} tone="medium" value={isPlans ? "0" : isIntegrations ? number(analyses.filter(a => a.source === "Planilha").length) : money(stats.total)} label={isPlans ? "Planos de ação criados" : isIntegrations ? "Importações de planilhas" : "Valor total analisado"} />
      </div>
      {!isPlans && <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title={isCompliance ? "Status dos controles" : "Distribuição dos achados"}><DonutPanel center={number(isCompliance ? stats.count : stats.findings.length)} caption={isCompliance ? "controles" : "achados"} data={isCompliance ? controls : riskSlices} /></Panel>
        <Panel title="Volume por data"><div className="h-[190px]"><ResponsiveContainer><BarChart data={series} margin={{ left: -20, right: 10 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="date" {...axis} /><YAxis {...axis} allowDecimals={false} /><Bar dataKey="total" name="Transações" fill="var(--info)" /><Bar dataKey="risks" name="Achados" fill="var(--critical)" /></BarChart></ResponsiveContainer></div><div className="flex gap-4 text-xs"><span className="text-info">Transações</span><span className="text-critical">Achados</span></div></Panel>
        <Panel title={isIntegrations ? "Registros por sistema" : isCompliance ? "Conformidade por área" : "Achados por área"}>
          <HBars labelWidth={110} items={grouped(isIntegrations || isCompliance ? stats.rows : stats.findings, isIntegrations ? "system" : "area").map(([label, value]) => {
            const rows = stats.rows.filter(r => r.area === label && ["Conforme", "Não conforme"].includes(r.control));
            const compliance = rows.length ? rows.filter(r => r.control === "Conforme").length / rows.length * 100 : 0;
            return { label, value: isCompliance ? compliance : value, display: isCompliance ? (rows.length ? percent(compliance) : "—") : number(value), tone: "info" };
          })} />
        </Panel>
      </div>}
      {isPlans ? <Panel className="mt-3" title="Planos de ação"><p className="py-8 text-sm text-muted-foreground">Nenhum plano de ação foi criado para estas análises.</p></Panel> : isIntegrations || isReports ? <Panel className="mt-3" title={isIntegrations ? "Análises por fonte de dados" : "Análises disponíveis"}><DataTable head={["Nome", "Período", "Área", "Sistema", "Origem", "Transações", "Responsável"]} rows={analyses.map(a => ({ key: a.id, cells: [a.name, `${a.start_date} — ${a.end_date}`, a.area, a.system, a.source, number(a.transactions.length), a.reviewer] }))} /></Panel> : <Panel className="mt-3" title={isRisks ? "Lista de riscos identificados" : isCompliance ? "Principais não conformidades" : "Transações recentes"} action={<Input aria-label="Buscar transações" placeholder="Buscar ID, descrição, fornecedor…" value={query} onChange={e => setQuery(e.target.value)} className="w-72" />}><DataTable onRowClick={key => setSelected(visible.find(r => r.key === key) ?? null)} head={["Data", "ID", "Descrição", "Categoria", "Fornecedor", "Valor (R$)", "Risco", "Controle", "Sistema"]} rows={visible.map(r => ({ key: r.key, cells: [r.date.split("-").reverse().join("/"), r.id, r.description, r.category, r.supplier, money(r.value), <RiskBadge level={r.level} />, r.control, r.system] }))} />{visible.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nenhum registro encontrado.</p>}</Panel>}
      {selected && <LiveRiskDetail row={selected} analysis={analyses.find(a => selected.key.startsWith(a.id))} all={stats.rows} />}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Panel title="Distribuição por tipo"><DonutPanel center={number(stats.count)} caption="transações" data={types} /></Panel>
        <Panel title="Valor em transações atípicas"><div className="text-2xl font-semibold">{money(stats.atypicalValue)}</div><HBars labelWidth={110} items={grouped(stats.findings, "category").map(([label, value]) => ({ label, value, tone: "critical" }))} /></Panel>
        <Panel title="Tendências e alertas"><AlertList items={stats.findings.slice(0, 5).map(r => ({ tone: r.level === "Crítico" ? "critical" : r.level === "Alto" ? "high" : "medium", title: `${r.id} — ${r.description}`, desc: r.reasons.join("; ") || `Classificação informada: ${r.level}`, when: r.date }))} />{!stats.findings.length && <p className="text-sm text-muted-foreground">Nenhum achado nas análises salvas.</p>}</Panel>
      </div>
    </>}
  </>;
}