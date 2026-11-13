import { describe, expect, it } from "vitest";
import { analysisSchema, evaluate, inPeriod, maxDate, parseImport, periodStart, summarize, toISODate, type Analysis, type AnalysisInput } from "@/lib/analysis";
const input: AnalysisInput = { name: "Teste", start_date: "2026-11-01", end_date: "2026-11-01", area: "Compras", system: "ERP", policy: "Política", reviewer: "Auditor", source: "Manual", threshold: 100000, transactions: [{ id: "T1", date: "2026-11-01", description: "Serviço", supplier: "Fornecedor", value: 150000, type: "Pagamento", category: "Compras", registered: true, approved: false, control: "Não conforme" }] };
describe("Novas análises", () => {
  const row = input.transactions.at(0);
  if (!row) throw new Error("Missing test transaction");
  it("updates transaction, risk, value and compliance totals from added analyses", () => {
    const analysis: Analysis = { ...input, id: "a", created_at: "2026-11-01" };
    expect(summarize([]).count).toBe(0);
    const stats = summarize([analysis]);
    expect(stats.count).toBe(1); expect(stats.findings.length).toBe(1); expect(stats.atypicalValue).toBe(150000); expect(stats.compliance).toBe(0);
    const added: Analysis = { ...analysis, id: "b", transactions: [{ ...row, id: "T2", value: 50, approved: true, control: "Conforme" }] };
    const combined = summarize([analysis, added]);
    expect(combined.count).toBe(2); expect(combined.total).toBe(150050); expect(combined.compliance).toBe(50);
  });
  it("flags unapproved values over the configured limit", () => { expect(evaluate(input)[0]?.level).toBe("Crítico"); });
  it("detects repeated supplier/date/value/type signatures", () => { expect(evaluate({ ...input, transactions: [row, { ...row, id: "T2" }] })[0]?.reasons).toContain("Possível duplicidade"); });
  it("validates period and duplicate transaction IDs", () => { expect(analysisSchema.safeParse({ ...input, end_date: "2026-10-01" }).success).toBe(false); expect(analysisSchema.safeParse({ ...input, transactions: [input.transactions[0], input.transactions[0]] }).success).toBe(false); });
  it("imports Brazilian CSV values and boolean answers", () => { const rows = parseImport([["id", "data", "descricao", "fornecedor", "valor", "tipo", "categoria", "cadastrado", "aprovado", "controle"], ["T1", "01/11/2026", "Serviço", "Fornecedor", "1.500,00", "Pagamento", "Compras", "Sim", "Não", "Conforme"]]); expect(rows[0]?.value).toBe(1500); expect(rows[0]?.approved).toBe(false); expect(rows[0]?.date).toBe("2026-11-01"); });
});
describe("Filtro de período", () => {
  it("converte datas brasileiras e com horário para ISO", () => {
    expect(toISODate("12/06/2024")).toBe("2024-06-12");
    expect(toISODate("30/06/2024 10:22")).toBe("2024-06-30");
    expect(toISODate("2026-11-05")).toBe("2026-11-05");
  });
  it("calcula o início da janela a partir da data de referência", () => {
    expect(periodStart("7d", "2024-06-12")).toBe("2024-06-06");
    expect(periodStart("30d", "2024-06-12")).toBe("2024-05-14");
    expect(periodStart("all", "2024-06-12")).toBeNull();
  });
  it("inclui só datas dentro da janela e tudo em 'Todos os períodos'", () => {
    expect(inPeriod("12/06/2024", "7d", "2024-06-12")).toBe(true);
    expect(inPeriod("06/06/2024", "7d", "2024-06-12")).toBe(true);
    expect(inPeriod("05/06/2024", "7d", "2024-06-12")).toBe(false);
    expect(inPeriod("01/01/2020", "all", "2024-06-12")).toBe(true);
  });
  it("usa a data mais recente do conjunto como referência", () => {
    expect(maxDate(["08/06/2024", "12/06/2024", "10/06/2024"])).toBe("2024-06-12");
  });
});describe("Importação de várias abas", () => {
  const h = ["id", "data", "descricao", "fornecedor", "valor", "tipo", "categoria", "cadastrado", "aprovado", "controle"];
  it("lê todas as abas com transações e ignora abas de instruções", async () => {
    const { parseWorkbook } = await import("@/lib/analysis");
    const r = parseWorkbook([{ sheet: "Instruções", data: [["Leia antes"]] }, { sheet: "Out", data: [h, ["T1", "01/10/2026", "a", "F", "10", "Pagamento", "C", "Sim", "Sim", "Conforme"]] }, { sheet: "Nov", data: [["Relatório"], h, ["T1", "2026-11-01", "b", "G", "20", "pagamento", "C", "S", "N", "não conforme"]] }]);
    expect(r.transactions.length).toBe(2);
    expect(r.transactions[1]?.id).toBe("Nov-T1");
    expect(r.transactions[1]?.control).toBe("Não conforme");
    expect(r.report[0]?.skipped).toBeTruthy();
  });
  it("reconhece cabeçalhos alternativos e números em vários formatos", async () => {
    const { parseWorkbook, toNumber } = await import("@/lib/analysis");
    const r = parseWorkbook([{ sheet: "A", data: [["Código", "Data", "Histórico", "Favorecido", "Valor (R$)", "Tipo", "Categoria", "Cadastrado", "Aprovado", "Controle"], ["X", 46327, "a", "F", "R$ 1.234,56", "Compra", "C", "Sim", "Sim", "Conforme"]] }]);
    expect(r.transactions[0]?.value).toBe(1234.56);
    expect(toNumber("1,234.50")).toBe(1234.5);
    expect(toNumber("1.500")).toBe(1500);
  });
});
