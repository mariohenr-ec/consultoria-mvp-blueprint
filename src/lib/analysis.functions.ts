import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analysisSchema, type Analysis } from "./analysis";
import type { Json } from "@/integrations/supabase/types";

export const listAnalyses = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result: Analysis[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await context.supabase.from("audit_analyses").select("*").order("created_at", { ascending: false }).order("id").range(offset, offset + 99);
    if (error) throw new Error("Não foi possível carregar as análises.");
    for (const row of data ?? []) result.push({ ...analysisSchema.parse(row), id: row.id, created_at: row.created_at });
    if ((data?.length ?? 0) < 100) break;
  }
  return result;
});
export const createAnalysis = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => analysisSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: saved, error } = await context.supabase.from("audit_analyses").insert({ ...data, user_id: context.userId, transactions: data.transactions as unknown as Json }).select("id").single();
  if (error || !saved) throw new Error("Não foi possível salvar a análise. Tente novamente.");
  return saved;
});