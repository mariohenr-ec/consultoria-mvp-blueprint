import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { integrationSchema, type IntegrationConfig } from "./integration-configs";

export const listIntegrationConfigs = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<IntegrationConfig[]> => {
  const { data, error } = await context.supabase.from("integration_configs").select("id,name,type,system,source_reference,auth_method,frequency,owner,data_scope,notes,created_at").eq("user_id", context.userId).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as integrações.");
  return (data ?? []).map(row => ({ ...integrationSchema.parse(row), id: row.id, created_at: row.created_at }));
});
export const createIntegrationConfig = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => integrationSchema.parse(input)).handler(async ({ data, context }): Promise<IntegrationConfig> => {
  const { data: row, error } = await context.supabase.from("integration_configs").insert({ ...data, user_id: context.userId }).select("id,name,type,system,source_reference,auth_method,frequency,owner,data_scope,notes,created_at").single();
  if (error || !row) throw new Error("Não foi possível salvar a integração.");
  return { ...integrationSchema.parse(row), id: row.id, created_at: row.created_at };
});