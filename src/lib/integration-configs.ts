import { z } from "zod";

export const integrationTypes = ["ERP", "Banco de dados", "Planilhas", "API", "Outros"] as const;
export const authMethods = ["A definir", "Sem autenticação", "OAuth", "Chave de API", "Usuário e senha"] as const;
export const frequencies = ["Manual", "A cada 5 minutos", "A cada 15 minutos", "A cada hora", "Diária", "Semanal"] as const;
export const integrationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  type: z.enum(integrationTypes),
  system: z.string().trim().min(1, "Informe o sistema.").max(200),
  source_reference: z.string().trim().max(1000).refine(value => {
    if (!value) return true;
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash; }
    catch { return false; }
  }, "Use um endereço HTTP/HTTPS sem senha, parâmetros ou tokens."),
  auth_method: z.enum(authMethods),
  frequency: z.enum(frequencies),
  owner: z.string().trim().min(1, "Informe o responsável.").max(200),
  data_scope: z.string().trim().min(1, "Informe os dados a importar.").max(1000),
  notes: z.string().trim().max(2000),
});
export type IntegrationInput = z.infer<typeof integrationSchema>;
export type IntegrationConfig = IntegrationInput & { id: string; created_at: string };