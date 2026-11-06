import { describe, expect, it } from "vitest";
import { actionPlanSchema, planTotals, type ActionPlan } from "@/lib/action-plans";
const plan: ActionPlan = { id: "p1", created_at: "2026-11-06", description: "Revisar compras", finding: "Pagamento sem aprovação", area: "Compras", owner: "Auditor", due: "2026-11-10", status: "Pendente", progress: 0 };
describe("Planos criados", () => {
  it("inclui cada novo plano nos totais da lista", () => {
    expect(planTotals([], "2026-11-06").total).toBe(0);
    expect(planTotals([plan], "2026-11-06").total).toBe(1);
    expect(planTotals([plan, { ...plan, id: "p2" }], "2026-11-06").total).toBe(2);
  });
  it("valida os campos necessários antes de salvar", () => {
    expect(actionPlanSchema.safeParse(plan).success).toBe(true);
    expect(actionPlanSchema.safeParse({ ...plan, description: "" }).success).toBe(false);
    expect(actionPlanSchema.safeParse({ ...plan, due: "2026-02-30" }).success).toBe(false);
  });
});