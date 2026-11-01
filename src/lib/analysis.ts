import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().trim().min(1).max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().min(1).max(500), supplier: z.string().trim().min(1).max(200),
  value: z.number().finite().nonnegative(), type: z.enum(["Pagamento", "Transferência", "Compra", "Recebimento", "Ajuste", "Outros"]),
  category: z.string().trim().min(1).max(200), registered: z.boolean(), approved: z.boolean(),
  control: z.enum(["Conforme", "Não conforme", "Em análise", "Não aplicável"]),
  risk: z.enum(["Crítico", "Alto", "Médio", "Baixo"]).optional(),
});
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
  return analysis.transactions.map(row => {
    const reasons: string[] = [];
    if (row.value > analysis.threshold && !row.approved) reasons.push("Valor acima do limite sem aprovação");
    if (!row.registered) reasons.push("Fornecedor sem cadastro");
    if ((signatures.get(`${row.supplier.toLowerCase()}|${row.date}|${row.value}|${row.type}`) ?? 0) > 1) reasons.push("Possível duplicidade");
    if (row.control === "Não conforme") reasons.push("Controle não conforme");
    const level = row.risk ?? (reasons.includes("Valor acima do limite sem aprovação") ? "Crítico" : reasons.includes("Fornecedor sem cadastro") ? "Alto" : reasons.length ? "Médio" : "Baixo");
    return { ...row, key: `${prefix}:${row.id}`, area: analysis.area, system: analysis.system, policy: analysis.policy, reviewer: analysis.reviewer, analysis: analysis.name, reasons, level };
  });
}
export function summarize(analyses: Analysis[]) {
  const rows = analyses.flatMap(a => evaluate(a, a.id));
  const findings = rows.filter(r => r.reasons.length || r.level !== "Baixo");
  const applicable = rows.filter(r => r.control === "Conforme" || r.control === "Não conforme");
  return { rows, findings, count: rows.length, total: rows.reduce((n, r) => n + r.value, 0), atypicalValue: findings.reduce((n, r) => n + r.value, 0), compliance: applicable.length ? applicable.filter(r => r.control === "Conforme").length / applicable.length * 100 : null };
}
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
    const rawValue = get("valor");
    const rawDate = get("data");
    const dateText = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : text("data").replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, "$3-$2-$1");
    const parsed = transactionSchema.safeParse({ id: text("id"), date: dateText, description: text("descricao"), supplier: text("fornecedor"), value: typeof rawValue === "number" ? rawValue : Number(text("valor").replace(/R\$\s*/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")), type: text("tipo"), category: text("categoria"), registered: bool("cadastrado"), approved: bool("aprovado"), control: text("controle"), risk: text("risco") || undefined });
    if (!parsed.success) throw new Error(`Linha ${index + 2}: confira data, valor, tipo, controle e campos obrigatórios.`);
    return parsed.data;
  });
}