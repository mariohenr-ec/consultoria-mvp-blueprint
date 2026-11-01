import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/lib/head";
export const Route = createFileRoute("/reset-password")({ head: pageHead("Redefinir senha", "Redefina sua senha de acesso às análises da Trianténa."), component: Reset });
function Reset() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery");
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <div className="mx-auto max-w-sm space-y-4 py-12"><h1 className="text-2xl font-semibold">Redefinir senha</h1>{recovery ? <form className="space-y-3" onSubmit={async e => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password }); setMessage(error ? "Não foi possível atualizar a senha." : "Senha atualizada."); }}><label>Nova senha<Input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label><Button type="submit">Salvar senha</Button></form> : <p>Abra o link de recuperação enviado ao seu e-mail.</p>}<p role="status">{message}</p></div>;
}