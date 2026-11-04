import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const profileSchema = z.object({
  full_name: z.string().trim().max(200),
  cpf: z.string().trim().max(14).regex(/^(\d{3}\.\d{3}\.\d{3}-\d{2})?$/, "CPF deve estar no formato 000.000.000-00."),
  crea: z.string().trim().max(30),
  role_title: z.string().trim().max(100),
  company: z.string().trim().max(200),
  phone: z.string().trim().max(20),
});
export type ProfileInput = z.infer<typeof profileSchema>;
export type Profile = ProfileInput & { email: string };

const empty: ProfileInput = { full_name: "", cpf: "", crea: "", role_title: "", company: "", phone: "" };

export const getProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<Profile> => {
  const { data, error } = await context.supabase.from("profiles").select("*").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o perfil.");
  const email = typeof context.claims?.email === "string" ? context.claims.email : "";
  if (!data) return { ...empty, email };
  return { ...profileSchema.parse(data), email };
});

export const saveProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => profileSchema.parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("profiles").upsert({ ...data, user_id: context.userId, updated_at: new Date().toISOString() });
  if (error) throw new Error("Não foi possível salvar o perfil. Tente novamente.");
  return { ok: true };
});
