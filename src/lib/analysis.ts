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

export function parseImport(rows: unknown[][]): TransactionInput[] {
  if (rows.length < 2) throw new Error("A planilha precisa de cabeçalhos e pelo menos uma transação.");
  const headers = (rows[0] ?? []).map(h => String(h ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const required = ["id", "data", "descricao", "fornecedor", "valor", "tipo", "categoria", "cadastrado", "aprovado", "controle"];
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length) throw new Error(`Colunas ausentes: ${missing.join(", ")}.`);
  return rows.slice(1).filter(row => row.some(v => v !== null && v !== "")).map((row, index) => {
    const get = (h: string) => row[headers.indexOf(h)];
    const text = (h: string) => String(get(h) ?? "").trim();
    const bool = (h: string) => {
      const value = text(h).toLowerCase();
      if (["sim", "true", "1"].includes(value)) return true;
      if (["nao", "não", "false", "0"].includes(value)) return false;
      throw new Error(`Linha ${index + 2}: ${h} deve ser Sim ou Não.`);
    };
    const toNum = (raw: unknown, t: string) => typeof raw === "number" ? raw : Number(t.replace(/R\$\s*/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
    const num = (h: string) => { if (!headers.includes(h) || text(h) === "") return undefined; const n = toNum(get(h), text(h)); if (!Number.isFinite(n)) throw new Error(`Linha ${index + 2}: ${h} deve ser numérico.`); return n; };
    const optBool = (h: string) => headers.includes(h) && text(h) !== "" ? bool(h) : undefined;
    const rawValue = get("valor");
    const rawDate = get("data");
    const dateText = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : text("data").replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1");
    const parsed = transactionSchema.safeParse({ id: text("id"), date: dateText, description: text("descricao"), supplier: text("fornecedor"), value: typeof rawValue === "number" ? rawValue : Number(text("valor").replace(/R\$\s*/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")), type: text("tipo"), category: text("categoria"), registered: bool("cadastrado"), approved: bool("aprovado"), control: text("controle"), risk: text("risco") || undefined, invoice_value: num("valor_nf"), book_qty: num("estoque_contabil"), physical_qty: num("estoque_fisico"), employee_registered: optBool("funcionario_cadastrado"), original_value: num("valor_original") });
    if (!parsed.success) throw new Error(`Linha ${index + 2}: confira data, valor, tipo, controle e campos obrigatórios.`);
    return parsed.data;
  });
}