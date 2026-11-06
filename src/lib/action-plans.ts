import { z } from "zod";

export const actionPlanSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição.").max(1000),
  finding: z.string().trim().max(1000),
  area: z.string().trim().min(1, "Informe a área.").max(200),
  owner: z.string().trim().min(1, "Informe o responsável.").max(200),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe um prazo válido.").refine(value => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Informe um prazo válido."),
  status: z.enum(["Pendente", "Em andamento", "Concluído"]),
  progress: z.number().int().min(0).max(100),
});
export type ActionPlanInput = z.infer<typeof actionPlanSchema>;
export type ActionPlan = ActionPlanInput & { id: string; created_at: string };
export function planStatus(plan: ActionPlanInput, today: string) {
  return plan.status !== "Concluído" && plan.due < today ? "Atrasado" : plan.status;
}
export function planTotals(plans: ActionPlan[], today: string) {
  return { total: plans.length, pending: plans.filter(p => planStatus(p, today) === "Pendente").length, ongoing: plans.filter(p => planStatus(p, today) === "Em andamento").length, completed: plans.filter(p => planStatus(p, today) === "Concluído").length, overdue: plans.filter(p => planStatus(p, today) === "Atrasado").length };
}