import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { actionPlanSchema, type ActionPlan } from "./action-plans";

export const listActionPlans = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<ActionPlan[]> => {
  const { data, error } = await context.supabase.from("action_plans").select("id,description,finding,area,owner,due,status,progress,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os planos de ação.");
  return (data ?? []).map(row => ({ ...actionPlanSchema.parse(row), id: row.id, created_at: row.created_at }));
});

export const createActionPlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => actionPlanSchema.parse(input)).handler(async ({ data, context }): Promise<ActionPlan> => {
  const { data: row, error } = await context.supabase.from("action_plans").insert({ ...data, user_id: context.userId }).select("id,description,finding,area,owner,due,status,progress,created_at").single();
  if (error || !row) throw new Error("Não foi possível salvar o plano. Tente novamente.");
  return { ...actionPlanSchema.parse(row), id: row.id, created_at: row.created_at };
});