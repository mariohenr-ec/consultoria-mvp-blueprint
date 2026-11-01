import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AnalysisAuth() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage("Confira seu e-mail para redefinir a senha.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMessage("Confira seu e-mail para confirmar a conta antes de entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch { setMessage("Não foi possível concluir. Confira seus dados e tente novamente."); }
    finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setBusy(true); setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (result.error) setMessage("Não foi possível entrar. Tente novamente.");
    } catch { setMessage("Não foi possível entrar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-sm space-y-4 py-4">
    <h3 className="text-lg font-semibold">{mode === "signup" ? "Criar conta" : mode === "reset" ? "Recuperar acesso" : "Entrar para salvar análises"}</h3>
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">E-mail<Input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
      {mode !== "reset" && <label className="block text-sm">Senha<Input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : mode === "reset" ? "Enviar recuperação" : "Entrar"}</Button>
    </form>
    {message && <p role="status" className="text-sm text-info">{message}</p>}
    {mode !== "reset" && <div className="space-y-2"><Button variant="outline" disabled={busy} className="w-full" onClick={() => social("google")}>Continuar com Google</Button><Button className="lovable-auth-button w-full" disabled={busy} onClick={() => social("lovable")}>Continue with Lovable</Button></div>}
    <div className="flex flex-wrap gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}>{mode === "signup" ? "Já tenho conta" : "Criar conta"}</Button><Button variant="link" onClick={() => { setMode(mode === "reset" ? "login" : "reset"); setMessage(""); }}>{mode === "reset" ? "Voltar" : "Esqueci minha senha"}</Button></div>
  </div>;
}