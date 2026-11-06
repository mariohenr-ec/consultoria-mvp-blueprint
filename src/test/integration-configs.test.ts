import { describe, expect, it } from "vitest";
import { integrationSchema } from "@/lib/integration-configs";
const input = { name: "ERP Financeiro", type: "API", system: "ERP", source_reference: "https://example.com/api", auth_method: "OAuth", frequency: "Diária", owner: "Auditor", data_scope: "Pagamentos", notes: "" };
describe("Cadastro de integrações", () => {
  it("aceita todos os dados do cadastro e exige identificação, responsável e escopo", () => {
    expect(integrationSchema.safeParse(input).success).toBe(true);
    for (const key of ["name", "system", "owner", "data_scope"]) expect(integrationSchema.safeParse({ ...input, [key]: "" }).success).toBe(false);
  });
  it("não aceita credenciais ou tokens na referência da fonte", () => {
    expect(integrationSchema.safeParse({ ...input, source_reference: "https://user:secret@example.com" }).success).toBe(false);
    expect(integrationSchema.safeParse({ ...input, source_reference: "https://example.com?token=private" }).success).toBe(false);
    expect(integrationSchema.safeParse({ ...input, source_reference: "javascript:alert(1)" }).success).toBe(false);
  });
});