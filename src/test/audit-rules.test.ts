import { describe, expect, it } from "vitest";
import { evaluate, parseImport, RULES, type AnalysisInput, type TransactionInput } from "@/lib/analysis";
const base: TransactionInput = { id: "T1", date: "2026-11-02", description: "Serviço", supplier: "Fornecedor", value: 1000, type: "Pagamento", category: "Compras", registered: true, approved: true, control: "Conforme" };
const run = (transactions: TransactionInput[], threshold = 100000) => evaluate({ name: "R", start_date: "2026-11-01", end_date: "2026-11-30", area: "A", system: "S", policy: "", reviewer: "X", source: "Manual", threshold, transactions } as AnalysisInput);
describe("Regras de auditoria ampliadas", () => {
  it("nota fiscal divergente do pagamento", () => { expect(run([{ ...base, invoice_value: 800 }])[0]!.reasons).toContain(RULES.invoice); expect(run([{ ...base, invoice_value: 1000 }])[0]!.reasons).not.toContain(RULES.invoice); });
  it("estoque físico diferente do contábil", () => { expect(run([{ ...base, book_qty: 100, physical_qty: 92 }])[0]!.reasons).toContain(RULES.stock); });
  it("funcionário não cadastrado é crítico", () => { const r = run([{ ...base, category: "Folha de pagamento", employee_registered: false }])[0]!; expect(r.reasons).toContain(RULES.ghost); expect(r.level).toBe("Crítico"); });
  it("salário pago duas vezes no mês ao mesmo funcionário", () => { const p = { ...base, category: "Salários", supplier: "João" }; expect(run([p, { ...p, id: "T2", date: "2026-11-20" }])[0]!.reasons).toContain(RULES.payroll); });
  it("fracionamento abaixo do limite somando acima dele", () => { const r = run([{ ...base, value: 6000 }, { ...base, id: "T2", value: 6000, date: "2026-11-05" }], 10000); expect(r[0]!.reasons).toContain(RULES.split); expect(run([{ ...base, value: 4000 }, { ...base, id: "T2", value: 4000 }], 10000)[0]!.reasons).not.toContain(RULES.split); });
  it("alteração acima de 10% do valor original", () => { expect(run([{ ...base, original_value: 800 }])[0]!.reasons).toContain(RULES.change); expect(run([{ ...base, original_value: 980 }])[0]!.reasons).not.toContain(RULES.change); });
  it("importa as novas colunas da planilha", () => { const [r] = parseImport([["id","data","descricao","fornecedor","valor","tipo","categoria","cadastrado","aprovado","controle","valor_nf","funcionario_cadastrado"],["T1","2026-11-02","x","y","100,00","Pagamento","Salários","Sim","Sim","Conforme","90,00","Não"]]); expect(r!.invoice_value).toBe(90); expect(r!.employee_registered).toBe(false); });
});
