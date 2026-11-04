import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Clock, FileText, Sparkles, User } from "lucide-react";
import { money, number, percent, type Analysis, type Evaluated } from "@/lib/analysis";
import { analyzeFinding } from "@/lib/finding-ai.functions";
import { DataTable, HBars, KpiCard, Panel, RiskBadge } from "./kit";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const tabs = ["Detalhes", "Contexto", "Evidências", "Transações relacionadas", "Histórico", "Análise de IA"] as const;

export function LiveRiskDetail({ row, analysis, all }: { row: Evaluated; analysis: Analysis | undefined; all: Evaluated[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Detalhes");
  const related = all.filter(r => r.key !== row.key && (r.supplier === row.supplier || (r.category === row.category && r.type === row.type))).slice(0, 5);
  const sameType = all.filter(r => r.type === row.type);
  const sameSupplier = all.filter(r => r.supplier === row.supplier);
  const byMonth = Object.entries(sameType.reduce<Record<string, number>>((m, r) => ({ ...m, [r.date.slice(0, 7)]: (m[r.date.slice(0, 7)] ?? 0) + 1 }), {})).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const compliant = sameType.filter(r => r.control === "Conforme").length;
  return (
    <Panel className="mt-3">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 h-7 w-7 text-critical" />
          <div>
            <div className="flex items-center gap-3"><h3 className="text-[18px] font-semibold">{row.description}</h3><RiskBadge level={row.level} /></div>
            <p className="text-[14px] text-muted-foreground">Transação {row.id} da análise “{row.analysis}”.</p>
          </div>
        </div>
        <span className="text-[13px] text-muted-foreground">#{row.id}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-8 border-b text-[13.5px]">
        {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 px-2 pb-2", tab === t ? "border-info font-medium text-info" : "border-transparent text-muted-foreground")}>{t}</button>)}
      </div>
      {tab === "Detalhes" && (
        <div className="mt-3 grid grid-cols-[1fr_1.2fr] gap-3">
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-[13px]">
            {[["Data", row.date.split("-").reverse().join("/")], ["Valor", money(row.value)], ["Fornecedor", row.supplier], ["Categoria", row.category], ["Tipo", row.type], ["Sistema", row.system], ["Análise", row.analysis], ["Política", row.policy || "Não informada"], ["Responsável", row.reviewer]].map(([k, v]) => (<div key={k} className="contents"><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 rounded-lg bg-critical/10 p-3 text-[12.5px]">
              <AlertTriangle className="h-5 w-5 shrink-0 text-critical" />
              <div><div className="font-semibold">Ocorrências nas verificações</div>{row.reasons.join("; ") || `Classificação de risco informada manualmente: ${row.level}.`}</div>
            </div>
            <div className="flex gap-3 rounded-lg bg-muted p-3 text-[12.5px]">
              <Clock className="h-5 w-5 shrink-0" />
              <div><div className="font-semibold">Impacto potencial</div>Risco de fraude, pagamento indevido ou falta de compliance com a política interna.</div>
            </div>
          </div>
        </div>
      )}
      {tab === "Contexto" && (
        <div className="mt-4 max-w-2xl">
          <p className="mb-3 text-[13px] text-muted-foreground">Linha do tempo: da origem da transação até o registro do achado.</p>
          <ol className="flex flex-col">
            {[
              { t: `Transação ${row.id} registrada na fonte (${row.system})`, d: row.date.split("-").reverse().join("/"), who: row.supplier },
              ...(analysis ? [
                { t: `Incluída na análise “${analysis.name}” por ${analysis.source === "Planilha" ? "importação de planilha" : "preenchimento manual"}`, d: new Date(analysis.created_at).toLocaleString("pt-BR"), who: analysis.reviewer },
                { t: `Verificações automáticas executadas sobre ${number(analysis.transactions.length)} transações`, d: new Date(analysis.created_at).toLocaleString("pt-BR"), who: "Motor de análise" },
              ] : []),
              { t: `Achado classificado como ${row.level}`, d: row.date.split("-").reverse().join("/"), who: row.reasons.length ? row.reasons.join("; ") : "Classificação manual" },
              { t: "Responsável pela análise designado", d: analysis ? new Date(analysis.created_at).toLocaleString("pt-BR") : "—", who: row.reviewer },
            ].map((e, i, arr) => (
              <li key={`${e.t}-${i}`} className="flex gap-3 text-[13px]">
                <span className="flex flex-col items-center"><span className={cn("mt-1 h-3 w-3 shrink-0 rounded-full border-2", i === arr.length - 1 ? "border-info bg-info" : "border-neutral")} />{i < arr.length - 1 && <span className="w-px flex-1 bg-border" />}</span>
                <div className="pb-4"><div className="font-medium">{e.t}</div><div className="text-muted-foreground">{e.d} · {e.who}</div></div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {tab === "Evidências" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-[14px] font-semibold">Arquivos anexados</div>
            <div className="flex items-center gap-3 py-1.5 text-[12.5px] text-muted-foreground"><FileText className="h-6 w-6 text-info" strokeWidth={1.5} />Nenhum anexo enviado para esta transação. O envio de arquivos estará disponível na próxima evolução.</div>
          </div>
          <div className="rounded-lg border p-3 text-[12.5px]">
            <div className="mb-1 text-[14px] font-semibold">Dados estatísticos mundiais</div>
            <p className="mb-2 text-muted-foreground">Comprovam o impacto potencial destacado:</p>
            <ul className="flex list-disc flex-col gap-2 pl-4">
              <li>Organizações perdem em média <strong>5% da receita anual</strong> com fraudes ocupacionais — ACFE, Report to the Nations 2024.</li>
              <li>A perda mediana por caso de fraude é de <strong>US$ 145 mil</strong>, e pagamentos sem aprovação adequada estão entre os esquemas mais comuns — ACFE 2024.</li>
              <li>Empresas sem controles automatizados de contas a pagar registram duplicidades e pagamentos indevidos de até <strong>1,5% das despesas</strong> — estimativas de mercado (IOFM/APQC).</li>
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">Fontes externas, exibidas apenas como referência ilustrativa no protótipo.</p>
          </div>
        </div>
      )}
      {tab === "Transações relacionadas" && (
        <div className="mt-4">
          <p className="mb-2 text-[13px] text-muted-foreground">Transações das suas análises salvas intimamente relacionadas: mesmo fornecedor ou mesma categoria e tipo.</p>
          {related.length ? <DataTable head={["Data", "ID", "Descrição", "Fornecedor", "Valor (R$)", "Relação"]}
            rows={related.map(r => ({ key: r.key, cells: [r.date.split("-").reverse().join("/"), r.id, r.description, r.supplier, money(r.value), r.supplier === row.supplier ? "Mesmo fornecedor" : "Mesma categoria e tipo"] }))} /> : <p className="py-4 text-sm text-muted-foreground">Nenhuma transação relacionada encontrada nas análises salvas.</p>}
        </div>
      )}
      {tab === "Histórico" && (
        <div className="mt-4">
          <p className="mb-3 text-[13px] text-muted-foreground">Quantas vezes este tipo de transação ({row.type}) ocorreu nas suas análises salvas.</p>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard plain icon={AlertTriangle} tone="critical" value={number(sameType.length)} label="Ocorrências do mesmo tipo" sub="todas as análises" subTone="critical" />
            <KpiCard plain icon={User} tone="high" value={number(sameSupplier.length)} label="Com o mesmo fornecedor" sub={row.supplier} />
            <KpiCard plain icon={Clock} tone="medium" value={byMonth.length ? (sameType.length / byMonth.length).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"} label="Média mensal" sub="ocorrências/mês" />
            <KpiCard plain icon={FileText} tone="low" value={percent(sameType.length ? compliant / sameType.length * 100 : 0)} label="Conformes" sub={`${number(compliant)} de ${number(sameType.length)}`} subTone="low" />
          </div>
          <div className="mt-3 rounded-lg border p-3">
            <div className="mb-2 text-[14px] font-semibold">Ocorrências por mês</div>
            {byMonth.length ? <HBars labelWidth={90} items={byMonth.map(([ym, value], i) => ({ label: ym.split("-").reverse().join("/"), value, tone: (i === byMonth.length - 1 ? "critical" : "high") as "critical" | "high" }))} /> : <p className="text-sm text-muted-foreground">Sem ocorrências anteriores.</p>}
          </div>
        </div>
      )}
      {tab === "Análise de IA" && <AiAnalysis row={row} history={{ sameType: sameType.length, sameSupplier: sameSupplier.length, total: all.length }} />}
    </Panel>
  );
}

function AiAnalysis({ row, history }: { row: Evaluated; history: { sameType: number; sameSupplier: number; total: number } }) {
  const run = useServerFn(analyzeFinding);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  async function generate() {
    setBusy(true); setError("");
    try {
      const result = await run({ data: { id: row.id, description: row.description, supplier: row.supplier, category: row.category, value: row.value, date: row.date, level: row.level, reasons: row.reasons, analysis: row.analysis, policy: row.policy, reviewer: row.reviewer, system: row.system, type: row.type, control: row.control, history } });
      if (result.error) setError(result.error);
      else setText(result.text);
    } catch { setError("Não foi possível gerar a análise. Tente novamente."); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-4 max-w-3xl">
      {!text && !busy && (
        <div className="py-6 text-center">
          <p className="mb-3 text-[13.5px] text-muted-foreground">Gere com IA um resumo do que foi feito até agora e sugestões dos próximos passos, com base nos dados reais deste achado e das suas análises salvas.</p>
          <Button onClick={generate}><Sparkles /> Gerar análise</Button>
        </div>
      )}
      {busy && <p role="status" className="py-6 text-center text-[13.5px] text-muted-foreground">Gerando análise com IA…</p>}
      {error && <div className="py-4 text-center"><p role="alert" className="mb-3 text-sm text-critical">{error}</p><Button variant="outline" onClick={generate}>Tentar novamente</Button></div>}
      {text && (
        <div className="flex flex-col gap-3 text-[13px]">
          <div className="rounded-lg bg-muted p-3">
            <div className="mb-1 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-info" /> Análise gerada por IA</div>
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Gerada a partir dos dados reais do achado e das análises salvas. Revise antes de tomar decisões.</p>
            <Button variant="outline" disabled={busy} onClick={generate}>Gerar novamente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
