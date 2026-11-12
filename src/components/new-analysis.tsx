import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, Upload, Download, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAnalyses } from "./analysis-provider";
import { AnalysisAuth } from "./analysis-auth";
import { analysisSchema, evaluate, parseImport, money, type AnalysisInput, type TransactionInput } from "@/lib/analysis";
import { createAnalysis } from "@/lib/analysis.functions";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): TransactionInput => ({ id: "", date: today(), description: "", supplier: "", value: 0, category: "", type: "Pagamento", registered: true, approved: true, control: "Conforme" });
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (s: string) => void }) {
  return <label className="block text-sm">{label}<select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">{options.map(o => <option key={o}>{o}</option>)}</select></label>;
}
export function NewAnalysisDialog() {
  const state = useAnalyses();
  return <Dialog open={state.open} onOpenChange={state.setOpen}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Nova análise</DialogTitle><DialogDescription>{state.userId ? "Dados da análise" : "Acesso seguro"}</DialogDescription></DialogHeader>{state.loading ? <p>Carregando…</p> : state.userId ? <AnalysisForm key={state.userId} /> : <AnalysisAuth />}</DialogContent></Dialog>;
}
function AnalysisForm() {
  const { refresh, setOpen } = useAnalyses();
  const save = useServerFn(createAnalysis);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalysisInput>({ name: "", start_date: today(), end_date: today(), area: "", system: "", policy: "", reviewer: "", source: "Manual", threshold: 100000, transactions: [blank()] });
  const set = <K extends keyof AnalysisInput>(key: K, value: AnalysisInput[K]) => setData(d => ({ ...d, [key]: value }));
  const update = (index: number, field: keyof TransactionInput, value: unknown) => setData(d => ({ ...d, transactions: d.transactions.map((r, i) => i === index ? { ...r, [field]: value } : r) }));
  async function upload(file: File | undefined) {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Arquivo muito grande. Máximo: 10 MB.");
      let rows: unknown[][];
      if (/\.xlsx$/i.test(file.name)) { const { readSheet } = await import("read-excel-file/browser"); rows = await readSheet(file); }
      else if (/\.csv$/i.test(file.name)) {
        const { default: Papa } = await import("papaparse");
        const parsed = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true });
        if (parsed.errors.length) throw new Error("CSV inválido. Confira separadores e aspas.");
        rows = parsed.data;
      } else throw new Error("Envie um arquivo XLSX ou CSV.");
      const imported = parseImport(rows);
      if (imported.length > 5000) throw new Error("Máximo de 5.000 transações por análise.");
      set("transactions", imported);
      toast.success(`${imported.length} transações importadas para revisão`);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha na importação."); }
    finally { setBusy(false); }
  }
  function template() {
    const csv = "\uFEFFid;data;descricao;fornecedor;valor;tipo;categoria;cadastrado;aprovado;controle;risco;valor_nf;estoque_contabil;estoque_fisico;funcionario_cadastrado;valor_original\nTX-001;" + today() + ";Pagamento de serviços;Fornecedor exemplo;1500,00;Pagamento;Compras;Sim;Sim;Conforme;;1500,00;;;;\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "modelo-transacoes.csv"; a.click(); URL.revokeObjectURL(url);
  }
  function next() {
    setError("");
    if (step === 0) {
      if (!data.name.trim() || !data.area.trim() || !data.system.trim() || !data.reviewer.trim() || !data.start_date || !data.end_date || data.start_date > data.end_date || data.threshold < 0) { setError("Preencha os campos obrigatórios e confira o período e o limite."); return; }
    } else {
      const parsed = analysisSchema.safeParse(data);
      if (!parsed.success) { setError(parsed.error.issues.map(i => i.message).join(" ")); return; }
    }
    setStep(s => s + 1);
  }
  async function finish() {
    setError(""); setBusy(true);
    try { await save({ data: analysisSchema.parse(data) }); await refresh(); toast.success("Análise salva. Indicadores atualizados."); setOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  const evaluated = evaluate(data);
  const flagged = evaluated.filter(r => r.reasons.length || r.level !== "Baixo");
  return <div className="space-y-5">
    <ol className="flex gap-4 border-b pb-3 text-sm">{["Identificação", "Transações", "Revisão"].map((label, i) => <li key={label} className={i === step ? "font-semibold text-info" : "text-muted-foreground"}>{i + 1}. {label}</li>)}</ol>
    {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
      {([["name", "Nome da análise *"], ["area", "Área de negócio *"], ["system", "Sistema de origem *"], ["reviewer", "Responsável pela análise *"], ["policy", "Política / controle relacionado"]] as const).map(([key, label]) => <label key={key} className="block text-sm">{label}<Input value={data[key]} onChange={e => set(key, e.target.value)} /></label>)}
      <label className="block text-sm">Limite sem aprovação (R$) *<Input type="number" min={0} step="0.01" value={data.threshold} onChange={e => set("threshold", Number(e.target.value))} /></label>
      <label className="block text-sm">Início do período *<Input type="date" value={data.start_date} onChange={e => set("start_date", e.target.value)} /></label>
      <label className="block text-sm">Fim do período *<Input type="date" value={data.end_date} onChange={e => set("end_date", e.target.value)} /></label>
      <SelectField label="Forma de inclusão" value={data.source} options={["Manual", "Planilha"]} onChange={s => set("source", s as "Manual" | "Planilha")} />
    </div>}
    {step === 1 && <div className="space-y-4">
      {data.source === "Planilha" && <div className="flex flex-wrap items-center gap-3 border-b pb-4"><label className="text-sm"><Upload className="mb-1 h-5 w-5 text-info" />Planilha XLSX ou CSV<Input type="file" accept=".xlsx,.csv" disabled={busy} onChange={e => upload(e.target.files?.[0])} /></label><Button variant="outline" onClick={template}><Download />Baixar modelo CSV</Button></div>}
      {data.transactions.map((r, i) => <fieldset key={i} className="space-y-3 border-b pb-4"><legend className="flex w-full items-center justify-between text-sm font-semibold">Transação {i + 1}<Button variant="ghost" size="icon" aria-label={`Remover transação ${i + 1}`} disabled={data.transactions.length === 1} onClick={() => set("transactions", data.transactions.filter((_, n) => n !== i))}><Trash2 /></Button></legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {([["id", "ID *"], ["description", "Descrição *"], ["supplier", "Fornecedor / cliente *"], ["category", "Categoria *"]] as const).map(([field, label]) => <label key={field} className="text-sm">{label}<Input value={r[field]} onChange={e => update(i, field, e.target.value)} /></label>)}
          <label className="text-sm">Data *<Input type="date" value={r.date} onChange={e => update(i, "date", e.target.value)} /></label>
          <label className="text-sm">Valor (R$) *<Input type="number" min={0} step="0.01" value={r.value} onChange={e => update(i, "value", Number(e.target.value))} /></label>
          <SelectField label="Tipo" value={r.type} options={["Pagamento", "Transferência", "Compra", "Recebimento", "Ajuste", "Outros"]} onChange={v => update(i, "type", v)} />
          <SelectField label="Resultado do controle" value={r.control} options={["Conforme", "Não conforme", "Em análise", "Não aplicável"]} onChange={v => update(i, "control", v)} />
          <SelectField label="Classificação de risco" value={r.risk ?? "Automática"} options={["Automática", "Crítico", "Alto", "Médio", "Baixo"]} onChange={v => update(i, "risk", v === "Automática" ? undefined : v)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.registered} onChange={e => update(i, "registered", e.target.checked)} />Fornecedor cadastrado?</label>
          {([["invoice_value", "Valor da nota fiscal (R$)"], ["original_value", "Valor original antes de alteração (R$)"], ["book_qty", "Estoque contábil (qtd.)"], ["physical_qty", "Estoque físico (qtd.)"]] as const).map(([field, label]) => <label key={field} className="text-sm">{label}<Input type="number" step="0.01" placeholder="Opcional" value={r[field] ?? ""} onChange={e => update(i, field, e.target.value === "" ? undefined : Number(e.target.value))} /></label>)}
          {isPayroll(r) && <SelectField label="Funcionário consta no cadastro de RH?" value={r.employee_registered === undefined ? "Não informado" : r.employee_registered ? "Sim" : "Não"} options={["Não informado", "Sim", "Não"]} onChange={v => update(i, "employee_registered", v === "Não informado" ? undefined : v === "Sim")} />}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={r.approved} onChange={e => update(i, "approved", e.target.checked)} />Aprovação registrada?</label>
        </div>
      </fieldset>)}
      <Button variant="outline" onClick={() => set("transactions", [...data.transactions, { ...blank(), date: data.start_date }])}><Plus />Adicionar transação</Button>
    </div>}
    {step === 2 && <div className="space-y-4"><h3 className="text-lg font-semibold">{data.name}</h3><dl className="grid grid-cols-2 gap-2 text-sm"><dt>Transações</dt><dd>{data.transactions.length}</dd><dt>Valor total</dt><dd>{money(data.transactions.reduce((s, r) => s + r.value, 0))}</dd><dt>Achados identificados</dt><dd>{flagged.length}</dd><dt>Área / sistema</dt><dd>{data.area} / {data.system}</dd></dl><div className="max-h-60 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">ID</th><th>Risco</th><th>Resultado</th></tr></thead><tbody>{evaluated.map(r => <tr key={r.key} className="border-t"><td className="py-2">{r.id}</td><td>{r.level}</td><td>{r.reasons.join("; ") || "Sem ocorrências nas verificações"}</td></tr>)}</tbody></table></div></div>}
    {error && <p role="alert" className="text-sm text-critical">{error}</p>}
    <div className="flex justify-between border-t pt-4"><Button variant="outline" disabled={busy} onClick={() => step ? setStep(s => s - 1) : setOpen(false)}><ArrowLeft />{step ? "Voltar" : "Cancelar"}</Button>{step < 2 ? <Button disabled={busy} onClick={next}>Continuar<ArrowRight /></Button> : <Button disabled={busy} onClick={finish}><Check />{busy ? "Salvando…" : "Salvar análise"}</Button>}</div>
  </div>;
}