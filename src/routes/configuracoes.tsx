import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/kit";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/configuracoes")({
  head: pageHead("Configurações", "Preferências da plataforma de auditoria contínua Trianténa."),
  component: () => (
    <>
      <PageHeader title="Configurações" subtitle="Preferências de usuários, regras de risco e notificações." />
      <Panel title="Em breve">
        <p className="text-[14px] text-muted-foreground">Esta área será construída na próxima evolução do protótipo (usuários e perfis, regras de risco, limites de políticas e notificações).</p>
      </Panel>
    </>
  ),
});
