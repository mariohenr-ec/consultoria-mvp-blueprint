import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Accessibility, CheckCircle2, Eye, RefreshCw, Volume2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/kit";
import { Switch } from "@/components/ui/switch";
import { pageHead } from "@/lib/head";
import { applyA11y, defaultA11y, loadA11y, speak, type A11y, type Cvd } from "@/lib/a11y";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracoes")({
  head: pageHead("Configurações", "Versão do sistema e preferências de acessibilidade da plataforma Trianténa."),
  component: Settings,
});

const VERSION = "1.2.0";
const changelog = [
  { v: "1.2.0", date: "31/10/2026", notes: ["Acessibilidade: esquemas de cores para daltonismo e audiodescrição", "Exportação em PDF e XLSX", "Alertas clicáveis com mensagem em destaque"] },
  { v: "1.1.0", date: "31/10/2026", notes: ["Novo logotipo Trianténa", "Central de notificações e menu do usuário com Log out"] },
  { v: "1.0.0", date: "31/10/2026", notes: ["Primeira versão do protótipo com 7 módulos de auditoria contínua"] },
];

const palettes: { id: Cvd; label: string; desc: string; swatch: string[] }[] = [
  { id: "none", label: "Padrão", desc: "Cores originais do sistema", swatch: ["oklch(0.64 0.22 25)", "oklch(0.72 0.18 50)", "oklch(0.85 0.16 88)", "oklch(0.68 0.17 150)", "oklch(0.63 0.18 256)"] },
  { id: "deutan", label: "Deuteranopia", desc: "Dificuldade com verde", swatch: ["oklch(0.55 0.17 40)", "oklch(0.75 0.15 70)", "oklch(0.9 0.15 100)", "oklch(0.55 0.15 250)", "oklch(0.72 0.12 230)"] },
  { id: "protan", label: "Protanopia", desc: "Dificuldade com vermelho", swatch: ["oklch(0.55 0.17 40)", "oklch(0.75 0.15 70)", "oklch(0.9 0.15 100)", "oklch(0.55 0.15 250)", "oklch(0.72 0.12 230)"] },
  { id: "tritan", label: "Tritanopia", desc: "Dificuldade com azul e amarelo", swatch: ["oklch(0.6 0.22 20)", "oklch(0.65 0.2 350)", "oklch(0.75 0.1 200)", "oklch(0.55 0.1 190)", "oklch(0.45 0.12 300)"] },
  { id: "mono", label: "Monocromático", desc: "Escala de cinza com alto contraste", swatch: ["oklch(0.3 0 0)", "oklch(0.45 0 0)", "oklch(0.6 0 0)", "oklch(0.75 0 0)", "oklch(0.88 0 0)"] },
];

function Settings() {
  const [s, setS] = useState<A11y>(defaultA11y);
  useEffect(() => setS(loadA11y()), []);
  const update = (patch: Partial<A11y>) => {
    const next = { ...s, ...patch };
    setS(next);
    applyA11y(next);
  };

  return (
    <>
      <PageHeader title="Configurações" subtitle="Versão do sistema e preferências de acessibilidade." />
      <div className="grid grid-cols-[1fr_1.6fr] gap-3">
        <Panel title="Versão do sistema">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-low/10 text-low"><CheckCircle2 className="h-6 w-6" /></span>
            <div className="flex-1">
              <div className="text-[20px] font-bold">v{VERSION}</div>
              <div className="text-[12.5px] text-muted-foreground">Sistema atualizado · 31/10/2026</div>
            </div>
            <button onClick={() => toast.success("Você já está na versão mais recente", { description: `Trianténa v${VERSION}` })} className="flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-[12.5px] font-medium hover:bg-muted">
              <RefreshCw className="h-4 w-4" /> Verificar atualizações
            </button>
          </div>
          <h4 className="mb-2 mt-4 text-[13px] font-semibold">Histórico de atualizações</h4>
          <ol className="flex flex-col gap-3">
            {changelog.map((c, i) => (
              <li key={c.v} className="border-l-2 pl-3" style={{ borderColor: i === 0 ? "var(--info)" : "var(--border)" }}>
                <div className="text-[13px] font-semibold">v{c.v} <span className="font-normal text-muted-foreground">· {c.date}</span></div>
                <ul className="mt-1 list-disc pl-4 text-[12.5px] text-muted-foreground">{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Acessibilidade" action={<Accessibility className="h-5 w-5 text-info" />}>
          <section>
            <h4 className="flex items-center gap-2 text-[13.5px] font-semibold"><Eye className="h-4 w-4" /> Esquema de cores para daltônicos</h4>
            <p className="mb-3 text-[12.5px] text-muted-foreground">Ajusta as cores de status, gráficos e indicadores em todo o sistema.</p>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Esquema de cores">
              {palettes.map((p) => (
                <button key={p.id} role="radio" aria-checked={s.cvd === p.id} onClick={() => update({ cvd: p.id })}
                  className={cn("rounded-lg border p-2.5 text-left transition-colors hover:bg-muted", s.cvd === p.id && "border-info ring-2 ring-info/30")}>
                  <div className="mb-2 flex gap-0.5">{p.swatch.map((c) => <span key={c} className="h-4 flex-1 rounded-sm" style={{ background: c }} />)}</div>
                  <div className="text-[12.5px] font-semibold">{p.label}</div>
                  <div className="text-[11px] leading-tight text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 border-t pt-4">
            <h4 className="flex items-center gap-2 text-[13.5px] font-semibold"><Volume2 className="h-4 w-4" /> Audiodescrição (PcD)</h4>
            <div className="mt-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-[13px] font-medium">Ler em voz alta os elementos da tela</div>
                <div className="text-[12px] text-muted-foreground">Narra títulos, botões e linhas de tabela ao passar o mouse ou navegar com Tab.</div>
              </div>
              <Switch checked={s.audio} aria-label="Ativar audiodescrição" onCheckedChange={(v) => { update({ audio: v }); speak(v ? "Audiodescrição ativada" : "Audiodescrição desativada", s.rate); }} />
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-lg border p-3">
              <label htmlFor="rate" className="text-[13px] font-medium">Velocidade da voz</label>
              <input id="rate" type="range" min={0.6} max={1.6} step={0.1} value={s.rate} onChange={(e) => update({ rate: Number(e.target.value) })} className="flex-1 accent-primary" />
              <span className="w-10 text-right text-[12.5px] tabular-nums">{s.rate.toFixed(1)}x</span>
              <button onClick={() => speak("Painel de auditoria contínua Trianténa. Conformidade geral de 92 por cento.", s.rate)} className="h-8 rounded-md border px-3 text-[12px] hover:bg-muted">Testar voz</button>
            </div>
          </section>

          <section className="mt-5 border-t pt-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-[13px] font-medium">Texto ampliado</div>
                <div className="text-[12px] text-muted-foreground">Aumenta o tamanho das letras para facilitar a leitura.</div>
              </div>
              <Switch checked={s.largeText} aria-label="Texto ampliado" onCheckedChange={(v) => update({ largeText: v })} />
            </div>
          </section>
        </Panel>
      </div>
    </>
  );
}
