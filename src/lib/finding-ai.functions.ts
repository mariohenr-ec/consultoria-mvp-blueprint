import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  id: z.string().max(100),
  description: z.string().max(500),
  supplier: z.string().max(200),
  category: z.string().max(200),
  value: z.number().finite().nonnegative(),
  date: z.string().max(10),
  level: z.string().max(20),
  reasons: z.array(z.string().max(300)).max(10),
  analysis: z.string().max(200),
  policy: z.string().max(500),
  reviewer: z.string().max(200),
  system: z.string().max(200),
  type: z.string().max(50),
  control: z.string().max(50),
  history: z.object({ sameType: z.number().int().nonnegative(), sameSupplier: z.number().int().nonnegative(), total: z.number().int().nonnegative() }),
});

function extractText(response: { output?: unknown[] }): string {
  const parts: string[] = [];
  for (const item of response.output ?? []) {
    const message = item as { type?: string; content?: unknown[] };
    if (message.type !== "message") continue;
    for (const block of message.content ?? []) {
      const text = block as { type?: string; text?: string };
      if (text.type === "output_text" && text.text) parts.push(text.text);
    }
  }
  return parts.join("\n").trim();
}

export const analyzeFinding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(input => inputSchema.parse(input)).handler(async ({ data }) => {
  const prompt = [
    `Achado #${data.id}: ${data.description}.`,
    `Fornecedor/cliente: ${data.supplier}. Categoria: ${data.category}. Tipo: ${data.type}.`,
    `Valor: R$ ${data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Data: ${data.date}. Risco: ${data.level}.`,
    `Ocorrências nas verificações: ${data.reasons.join("; ") || "classificação informada manualmente"}.`,
    `Resultado do controle: ${data.control}. Política relacionada: ${data.policy || "não informada"}.`,
    `Análise: "${data.analysis}" (sistema ${data.system}), responsável: ${data.reviewer}.`,
    `Histórico nas análises salvas: ${data.history.sameType} transações do mesmo tipo, ${data.history.sameSupplier} com o mesmo fornecedor, de um total de ${data.history.total} transações analisadas.`,
  ].join(" ");
  try {
    const response = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: "Você é um auditor sênior de conformidade. Responda em português do Brasil, em texto corrido com duas seções marcadas exatamente como 'Resumo do que foi feito' e 'Sugestões de próximos passos' (esta última com 3 a 5 itens numerados). Seja objetivo, sem introduções nem formatação em markdown além dos itens numerados.",
      input: `Analise este achado de auditoria e resuma o andamento até agora, depois sugira os próximos passos práticos. ${prompt}`,
    });
    const text = extractText(response);
    if (!text) return { text: "", error: "A IA não retornou conteúdo. Tente novamente." };
    return { text, error: "" };
  } catch (e) {
    if (e instanceof GatewayError) return { text: "", error: "O serviço de IA está indisponível no momento. Tente novamente em instantes." };
    throw e;
  }
});
