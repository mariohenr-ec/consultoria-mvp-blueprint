import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().trim().min(1).max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(1).max(500), supplier: z.string().trim().min(1).max(200),
  value: z.number().finite().nonnegative(), type: z.enum(["Pagamento", "Transferência", "Compra", "Recebimento", "Ajuste", "Outros"]),
  category: z.string().trim().min(1).max(200), registered: z.boolean(), approved: z.boolean(),
  control: z.enum(["Conforme", "Não conforme", "Em análise", "Não aplicável"]),
  risk: z.enum(["Crítico", "Alto", "Médio", "Baixo"]).optional(),
  invoice_value: z.number().finite().nonnegative().optional(),
  book_qty: z.number().finite().optional(),
  physical_qty: z.number().finite().optional(),
  employee_registered: z.boolean().optional(),
  original_value: z.number().finite().nonnegative().optional(),
});
export const isPayroll = (r: { category: string; description: string }) => /sal[aá]ri|folha|pro.?labore|holerite/i.test(`${r.category} ${r.description}`);
export const RULES = {
  invoice: "Divergência entre nota fiscal e pagamento",
  stock: "Estoque físico diferente do contábil",
  ghost: "Funcionário fictício ou não cadastrado",
  payroll: "Pagamento salarial irregular",
  split: "Possível fracionamento de despesa",
  change: "Alteração suspeita em dado financeiro",
} as const;
export const analysisSchema = z.object({
  name: z.string().trim().min(1).max(200), start_date: z.string(), end_date: z.string(),
  area: z.string().trim().min(1).max(200), system: z.string().trim().min(1).max(200),
  policy: z.string().max(500), reviewer: z.string().trim().min(1).max(200),
  source: z.enum(["Manual", "Planilha"]), threshold: z.number().finite().nonnegative(),
  transactions: z.array(transactionSchema).min(1).max(5000),
}).superRefine((data, ctx) => {
  const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  if (!validDate(data.start_date) || !validDate(data.end_date) || data.start_date > data.end_date) ctx.addIssue({ code: "custom", message: "Informe um período válido." });
  const ids = new Set<string>();
  for (const row of data.transactions) {
    if (!validDate(row.date) || row.date < data.start_date || row.date > data.end_date) ctx.addIssue({ code: "custom", message: `Transação ${row.id}: data fora do período ou inválida.` });
    if (ids.has(row.id)) ctx.addIssue({ code: "custom", message: `ID duplicado: ${row.id}.` });
    ids.add(row.id);
  }
});
export type TransactionInput = z.infer<typeof transactionSchema>;
export type AnalysisInput = z.infer<typeof analysisSchema>;
export type Analysis = AnalysisInput & { id: string; created_at: string };
export type Evaluated = TransactionInput & { key: string; area: string; system: string; policy: string; reviewer: string; analysis: string; reasons: string[]; level: "Crítico" | "Alto" | "Médio" | "Baixo" };

export function evaluate(analysis: AnalysisInput, prefix = analysis.name): Evaluated[] {
  const signatures = new Map<string, number>();
  for (const row of analysis.transactions) {
    const signature = `${row.supplier.toLowerCase()}|${row.date}|${row.value}|${row.type}`;
    signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
  }
  const month = (d: string) => d.slice(0, 7);
  const groups = new Map<string, { n: number; sum: number }>();
  const payrollCount = new Map<string, number>();
  const payrollValues = analysis.transactions.filter(isPayroll).map(r => r.value).sort((a, b) => a - b);
  const median = payrollValues.length ? payrollValues[Math.floor(payrollValues.length / 2)]! : 0;
  for (const row of analysis.transactions) {
    if (row.value <= analysis.threshold && row.value > 0) {
      const k = `${row.supplier.toLowerCase()}|${month(row.date)}`;
      const g = groups.get(k) ?? { n: 0, sum: 0 };
      groups.set(k, { n: g.n + 1, sum: g.sum + row.value });
    }
    if (isPayroll(row)) { const k = `${row.supplier.toLowerCase()}|${month(row.date)}`; payrollCount.set(k, (payrollCount.get(k) ?? 0) + 1); }
  }
  return analysis.transactions.map(row => {
    const reasons: string[] = [];
    const sm = `${row.supplier.toLowerCase()}|${month(row.date)}`;
    if (row.invoice_value !== undefined && Math.abs(row.invoice_value - row.value) > Math.max(0.01, row.invoice_value * 0.01)) reasons.push(RULES.invoice);
    if (row.book_qty !== undefined && row.physical_qty !== undefined && row.book_qty !== row.physical_qty) reasons.push(RULES.stock);
    if (row.employee_registered === false) reasons.push(RULES.ghost);
    if (isPayroll(row) && ((payrollCount.get(sm) ?? 0) > 1 || (payrollValues.length >= 3 && row.value > median * 2))) reasons.push(RULES.payroll);
    const g = groups.get(sm);
    if (g && g.n >= 2 && g.sum > analysis.threshold && row.value <= analysis.threshold) reasons.push(RULES.split);
    if (row.original_value !== undefined && row.original_value > 0 && Math.abs(row.value - row.original_value) / row.original_value > 0.1) reasons.push(RULES.change);
    if (row.value > analysis.threshold && !row.approved) reasons.push("Valor acima do limite sem aprovação");
    if (!row.registered) reasons.push("Fornecedor sem cadastro");
    if ((signatures.get(`${row.supplier.toLowerCase()}|${row.date}|${row.value}|${row.type}`) ?? 0) > 1) reasons.push("Possível duplicidade");
    if (row.control === "Não conforme") reasons.push("Controle não conforme");
    const level = row.risk ?? (reasons.includes("Valor acima do limite sem aprovação") || reasons.includes(RULES.ghost) || reasons.includes(RULES.change) ? "Crítico" : reasons.includes(RULES.invoice) || reasons.includes(RULES.split) || reasons.includes(RULES.payroll) ? "Alto" : reasons.includes("Fornecedor sem cadastro") ? "Alto" : reasons.length ? "Médio" : "Baixo");
    return { ...row, key: `${prefix}:${row.id}`, area: analysis.area, system: analysis.system, policy: analysis.policy, reviewer: analysis.reviewer, analysis: analysis.name, reasons, level };
  });
}
export function summarize(analyses: Analysis[]) {
  const rows = analyses.flatMap(a => evaluate(a, a.id));
  const findings = rows.filter(r => r.reasons.length || r.level !== "Baixo");
  const applicable = rows.filter(r => r.control === "Conforme" || r.control === "Não conforme");
  return { rows, findings, count: rows.length, total: rows.reduce((n, r) => n + r.value, 0), atypicalValue: findings.reduce((n, r) => n + r.value, 0), compliance: applicable.length ? applicable.filter(r => r.control === "Conforme").length / applicable.length * 100 : null };
}
export type PeriodKey = "7d" | "30d" | "90d" | "all";
export const periodOptions: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "90d", label: "Últimos 90 dias" },
  { key: "all", label: "Todos os períodos" },
];
export const periodLabel = (key: PeriodKey) => periodOptions.find(o => o.key === key)?.label ?? key;
const periodDays: Record<PeriodKey, number | null> = { "7d": 7, "30d": 30, "90d": 90, all: null };
export const toISODate = (s: string) => { const d = s.slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : d.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1"); };
export function periodStart(period: PeriodKey, ref: string): string | null {
  const days = periodDays[period];
  if (days === null) return null;
  const d = new Date(`${toISODate(ref)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}
export function inPeriod(date: string, period: PeriodKey, ref: string): boolean {
  const start = periodStart(period, ref);
  if (!start) return true;
  const iso = toISODate(date);
  return iso >= start && iso <= toISODate(ref);
}
export const maxDate = (dates: string[]) => dates.map(toISODate).sort().at(-1) ?? new Date().toISOString().slice(0, 10);

export const number = (n: number) => n.toLocaleString("pt-BR");
export const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const percent = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const HEADER_ALIASES: Record<string, string[]> = {
  id: ["id", "codigo", "cod", "identificador", "n", "numero", "transacao", "id_transacao"],
  data: ["data", "date", "data_transacao", "data_lancamento", "dt", "vencimento", "data_pagamento"],
  descricao: ["descricao", "historico", "description", "detalhe", "descricao_transacao"],
  fornecedor: ["fornecedor", "cliente", "fornecedor_cliente", "favorecido", "beneficiario", "supplier", "contraparte", "funcionario"],
  valor: ["valor", "valor_pago", "montante", "value", "amount", "valor_total", "total"],
  tipo: ["tipo", "type", "tipo_transacao", "natureza"],
  categoria: ["categoria", "category", "centro_de_custo", "conta", "grupo"],
  cadastrado: ["cadastrado", "fornecedor_cadastrado", "registered", "cadastro"],
  aprovado: ["aprovado", "aprovacao", "approved", "aprovacao_registrada"],
  controle: ["controle", "resultado_controle", "resultado_do_controle", "status_controle", "control"],
  risco: ["risco", "classificacao_risco", "nivel_risco", "risk"],
  valor_nf: ["valor_nf", "valor_nota", "valor_nota_fiscal", "nf", "nota_fiscal"],
  estoque_contabil: ["estoque_contabil", "qtd_contabil", "saldo_contabil"],
  estoque_fisico: ["estoque_fisico", "qtd_fisica", "contagem_fisica", "inventario"],
  funcionario_cadastrado: ["funcionario_cadastrado", "cadastro_rh", "consta_rh"],
  valor_original: ["valor_original", "valor_anterior", "valor_antes"],
};
const REQUIRED = ["id", "data", "descricao", "fornecedor", "valor", "tipo", "categoria", "cadastrado", "aprovado", "controle"];
const OPTIONS = {
  type: ["Pagamento", "Transferência", "Compra", "Recebimento", "Ajuste", "Outros"],
  control: ["Conforme", "Não conforme", "Em análise", "Não aplicável"],
  risk: ["Crítico", "Alto", "Médio", "Baixo"],
};
const pick = (list: string[], v: string) => list.find(o => norm(o) === norm(v)) ?? v;
function mapHeaders(row: unknown[]) {
  const map = new Map<string, number>();
  row.forEach((h, i) => { const n = norm(h); for (const [key, aliases] of Object.entries(HEADER_ALIASES)) if (!map.has(key) && aliases.includes(n)) map.set(key, i); });
  return map;
}
export function toNumber(raw: unknown): number {
  if (typeof raw === "number") return raw;
  let t = String(raw ?? "").replace(/R\$|\s/g, "");
  const neg = /^\(.*\)$/.test(t); t = t.replace(/[()]/g, "");
  if (t.includes(",") && t.includes(".")) t = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  else if (t.includes(",")) t = t.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  const n = t === "" ? NaN : Number(t);
  return neg ? -n : n;
}
function toDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  if (typeof raw === "number" && raw > 20000 && raw < 80000) return new Date(Date.UTC(1899, 11, 30) + raw * 86400000).toISOString().slice(0, 10);
  const t = String(raw ?? "").trim();
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  m = t.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2]!.padStart(2, "0")}-${m[3]!.padStart(2, "0")}`;
  return t;
}
export type SheetResult = { sheet: string; imported: number; skipped?: string };
/** Lê uma ou várias abas. Abas sem as colunas obrigatórias (ex.: instruções) são ignoradas. */
export function parseWorkbook(sheets: { sheet: string; data: unknown[][] }[]): { transactions: TransactionInput[]; report: SheetResult[] } {
  const transactions: TransactionInput[] = []; const report: SheetResult[] = []; const errors: string[] = [];
  const multi = sheets.length > 1;
  for (const { sheet, data } of sheets) {
    const rows = data.filter(r => Array.isArray(r) && r.some(v => v !== null && v !== undefined && String(v).trim() !== ""));
    if (!rows.length) { report.push({ sheet, imported: 0, skipped: "aba vazia" }); continue; }
    const headerIndex = rows.slice(0, 15).findIndex(r => { const m = mapHeaders(r); return REQUIRED.filter(k => m.has(k)).length >= 5; });
    if (headerIndex < 0) { if (!multi) throw new Error(`Colunas ausentes: ${REQUIRED.join(", ")}.`); report.push({ sheet, imported: 0, skipped: "sem cabeçalho de transações" }); continue; }
    const headers = mapHeaders(rows[headerIndex]!);
    const missing = REQUIRED.filter(k => !headers.has(k));
    const where = (line: number) => multi ? `Aba "${sheet}", linha ${line}` : `Linha ${line}`;
    if (missing.length) { errors.push(`${multi ? `Aba "${sheet}": c` : "C"}olunas ausentes: ${missing.join(", ")}.`); continue; }
    const body = rows.slice(headerIndex + 1);
    if (!body.length) { report.push({ sheet, imported: 0, skipped: "sem transações" }); continue; }
    let count = 0;
    body.forEach((row, n) => {
      const line = data.indexOf(row) + 1 || headerIndex + n + 2;
      const get = (h: string) => headers.has(h) ? row[headers.get(h)!] : undefined;
      const text = (h: string) => String(get(h) ?? "").trim();
      const issues: string[] = [];
      const bool = (h: string, required: boolean) => {
        const v = norm(get(h)); if (v === "") { if (required) issues.push(`${h} vazio`); return undefined; }
        if (["sim", "s", "true", "1", "yes", "x", "verdadeiro"].includes(v)) return true;
        if (["nao", "n", "false", "0", "no", "falso"].includes(v)) return false;
        issues.push(`${h} deve ser Sim ou Não`); return undefined;
      };
      const num = (h: string) => { if (text(h) === "") return undefined; const v = toNumber(get(h)); if (!Number.isFinite(v)) { issues.push(`${h} deve ser numérico`); return undefined; } return v; };
      const value = toNumber(get("valor"));
      if (!Number.isFinite(value)) issues.push("valor inválido");
      const candidate = { id: text("id"), date: toDate(get("data")), description: text("descricao"), supplier: text("fornecedor"), value: Math.abs(value), type: pick(OPTIONS.type, text("tipo") || "Outros"), category: text("categoria"), registered: bool("cadastrado", true), approved: bool("aprovado", true), control: pick(OPTIONS.control, text("controle") || "Não aplicável"), risk: text("risco") ? pick(OPTIONS.risk, text("risco")) : undefined, invoice_value: num("valor_nf"), book_qty: num("estoque_contabil"), physical_qty: num("estoque_fisico"), employee_registered: bool("funcionario_cadastrado", false), original_value: num("valor_original") };
      const parsed = transactionSchema.safeParse(candidate);
      if (!parsed.success) issues.push(...parsed.error.issues.map(i => { const f = String(i.path[0] ?? ""); return { id: "id vazio", date: "data inválida", description: "descrição vazia", supplier: "fornecedor vazio", type: `tipo deve ser ${OPTIONS.type.join("/")}`, control: `controle deve ser ${OPTIONS.control.join("/")}`, risk: `risco deve ser ${OPTIONS.risk.join("/")}`, category: "categoria vazia" }[f] ?? `${f} inválido`; }));
      if (issues.length) { errors.push(`${where(line)}: ${[...new Set(issues)].join(", ")}.`); return; }
      const tx = parsed.data!;
      if (multi && transactions.some(t => t.id === tx.id)) tx.id = `${sheet}-${tx.id}`.slice(0, 100);
      transactions.push(tx); count++;
    });
    report.push({ sheet, imported: count });
  }
  if (errors.length) throw new Error(errors.slice(0, 6).join(" ") + (errors.length > 6 ? ` (+${errors.length - 6} outros problemas)` : ""));
  if (!transactions.length) throw new Error("Nenhuma aba contém transações. Use o modelo como referência para os cabeçalhos.");
  return { transactions, report };
}
export function parseImport(rows: unknown[][]): TransactionInput[] {
  if (rows.length < 2) throw new Error("A planilha precisa de cabeçalhos e pelo menos uma transação.");
  return parseWorkbook([{ sheet: "Planilha", data: rows }]).transactions;
}
