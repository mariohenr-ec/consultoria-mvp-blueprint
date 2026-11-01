import { describe, expect, it } from "vitest";
import { analysisSchema, evaluate, parseImport, summarize, type Analysis, type AnalysisInput } from "@/lib/analysis";
const input: AnalysisInput = { name: "Teste", start_date: "2026-11-01", end_date: "2026-11-01", area: "Compras", system: "ERP", policy: "Política", reviewer: "Auditor", source: "Manual", threshold: 100000, transactions: [{ id: "T1", date: "2026-11-01", description: "Serviço", supplier: "Fornecedor", value: 150000, type: "Pagamento", category: "Compras", registered: true, approved: false, control: "Não conforme" }] };
describe("Novas análises", () => {
  it("updates transaction, risk, value and compliance totals from added analyses", () => {
    const analysis: Analysis = { ...input, id: "a", created_at: "2026-11-01" };
    expect(summarize([]).count).toBe(0);
    const stats = summarize([analysis]);
    expect(stats.count).toBe(1); expect(stats.findings.length).toBe(1); expect(stats.atypicalValue).toBe(150000); expect(stats.compliance).toBe(0);
    const added: Analysis = { ...analysis, id: "b", transactions: [{ ...input.transactions[0], id: "T2", value: 50, approved: true, control: "Conforme" }] };
    const combined = summarize([analysis, added]);
    expect(combined.count).toBe(2); expect(combined.total).toBe(150050); expect(combined.compliance).toBe(50);
  });
  it("flags unapproved values over the configured limit", () => { expect(evaluate(input)[0]?.level).toBe("Crítico"); });
  it("detects repeated supplier/date/value/type signatures", () => { expect(evaluate({ ...input, transactions: [input.transactions[0], { ...input.transactions[0], id: "T2" }] })[0]?.reasons).toContain("Possível duplicidade"); });
  it("validates period and duplicate transaction IDs", () => { expect(analysisSchema.safeParse({ ...input, end_date: "2026-10-01" }).success).toBe(false); expect(analysisSchema.safeParse({ ...input, transactions: [input.transactions[0], input.transactions[0]] }).success).toBe(false); });
  it("imports Brazilian CSV values and boolean answers", () => { const rows = parseImport([["id", "data", "descricao", "fornecedor", "valor", "tipo", "categoria", "cadastrado", "aprovado", "controle"], ["T1", "01/11/2026", "Serviço", "Fornecedor", "1.500,00", "Pagamento", "Compras", "Sim", "Não", "Conforme"]]); expect(rows[0]?.value).toBe(1500); expect(rows[0]?.approved).toBe(false); expect(rows[0]?.date).toBe("2026-11-01"); });
});