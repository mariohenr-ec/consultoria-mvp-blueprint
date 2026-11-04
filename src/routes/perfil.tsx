import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Pencil, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/kit";
import { AnalysisAuth } from "@/components/analysis-auth";
import { useAnalyses } from "@/components/analysis-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, saveProfile, type Profile } from "@/lib/profile.functions";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/perfil")({
  head: pageHead("Meu perfil", "Dados de acesso e informações profissionais do auditor apresentadas no sistema."),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId, email, loading } = useAnalyses();
  return (
    <>
      <PageHeader title="Meu perfil" subtitle="Dados de acesso e informações profissionais apresentadas no sistema." />
      {loading ? <p role="status">Carregando…</p> : userId ? <ProfileForm key={userId} email={email} /> : (
        <Panel title="Acesso seguro"><p className="mb-3 text-sm text-muted-foreground">Entre na sua conta para ver e editar seu perfil.</p><AnalysisAuth /></Panel>
      )}
    </>
  );
}

const fields = [
  ["full_name", "Nome completo"],
  ["cpf", "CPF"],
  ["crea", "CREA / registro profissional"],
  ["role_title", "Cargo"],
  ["company", "Empresa"],
  ["phone", "Telefone"],
] as const;

function ProfileForm({ email }: { email: string }) {
  const load = useServerFn(getProfile);
  const save = useServerFn(saveProfile);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void load().then(setProfile).catch(() => setError("Não foi possível carregar o perfil.")); }, [load]);
  if (error) return <p role="alert" className="text-sm text-critical">{error}</p>;
  if (!profile) return <p role="status">Carregando perfil…</p>;
  const editing = draft !== null;
  const shown = draft ?? profile;
  async function submit() {
    if (!draft) return;
    setBusy(true); setError("");
    try {
      await save({ data: draft });
      setProfile(draft); setDraft(null);
      toast.success("Perfil atualizado.");
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return (
    <Panel title="Informações do auditor" action={editing ? (
      <div className="flex gap-2">
        <Button variant="outline" disabled={busy} onClick={() => setDraft(null)}><X />Cancelar</Button>
        <Button disabled={busy} onClick={submit}><Check />{busy ? "Salvando…" : "Salvar"}</Button>
      </div>
    ) : <Button variant="outline" onClick={() => setDraft({ ...profile })}><Pencil />Editar</Button>}>
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-8 w-8" /></div>
        <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">E-mail de acesso</dt><dd className="font-medium">{email}</dd></div>
          {fields.map(([key, label]) => (
            <div key={key}>
              <dt className="text-muted-foreground">{label}</dt>
              {editing ? <Input aria-label={label} value={shown[key]} onChange={e => setDraft(d => d ? { ...d, [key]: e.target.value } : d)} className="mt-1" placeholder={key === "cpf" ? "000.000.000-00" : "Não informado"} /> : <dd className="font-medium">{shown[key] || "Não informado"}</dd>}
            </div>
          ))}
        </dl>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-critical">{error}</p>}
    </Panel>
  );
}
