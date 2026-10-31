import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Home,
  Info,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ArrowLeftRight,
  ClipboardList,
  CheckCircle2,
  Triangle,
} from "lucide-react";
import { LogOut, User } from "lucide-react";
import logo from "@/assets/triantena-logotipo.png.asset.json";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialNotifs = [
  { id: 1, tone: "critical" as const, title: "Pagamento acima do limite", desc: "Transação #45872 de R$ 250.000,00 no ERP.", when: "Há 10 min" },
  { id: 2, tone: "high" as const, title: "Fornecedor sem cadastro", desc: "Achado #45871 aguarda análise.", when: "Há 1 h" },
  { id: 3, tone: "info" as const, title: "Integração com alerta", desc: "Sistema de Compras com falha de sincronização.", when: "Há 3 h" },
];

function NotificationsBell() {
  const [items, setItems] = useState(initialNotifs.map((n) => ({ ...n, read: false })));
  const unread = items.filter((i) => !i.read).length;
  return (
    <Popover>
      <PopoverTrigger className="relative" aria-label="Notificações">
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-critical text-[9px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-[14px] font-semibold">Notificações</span>
          <button
            className="text-[12px] text-info hover:underline disabled:opacity-50"
            disabled={unread === 0}
            onClick={() => setItems((p) => p.map((i) => ({ ...i, read: true })))}
          >
            Marcar todas como lidas
          </button>
        </div>
        <ul className="max-h-80 overflow-auto">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setItems((p) => p.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
                className={cn("flex w-full gap-3 border-b px-4 py-3 text-left hover:bg-muted", !n.read && "bg-info/5")}
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.read ? "var(--neutral)" : toneVar[n.tone] }} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[13px]", !n.read && "font-semibold")}>{n.title}</span>
                  <span className="block text-[12px] text-muted-foreground">{n.desc}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{n.when}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2.5 text-center">
          <Link to="/riscos" className="text-[12px] font-medium text-info hover:underline">Ver todos os achados</Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Tones ---------- */
export type Tone = "critical" | "high" | "medium" | "low" | "info" | "neutral" | "violet" | "soft";
export const toneVar: Record<Tone, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
  info: "var(--info)",
  neutral: "var(--neutral)",
  violet: "var(--violet)",
  soft: "var(--info-soft)",
};
const toneText: Record<Tone, string> = {
  critical: "text-critical",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
  info: "text-info",
  neutral: "text-muted-foreground",
  violet: "text-violet",
  soft: "text-info",
};
const toneSoft: Record<Tone, string> = {
  critical: "bg-critical/10 text-critical",
  high: "bg-high/10 text-high",
  medium: "bg-medium/15 text-high",
  low: "bg-low/10 text-low",
  info: "bg-info/10 text-info",
  neutral: "bg-neutral/20 text-muted-foreground",
  violet: "bg-violet/10 text-violet",
  soft: "bg-info-soft/30 text-info",
};

export const soon = (what: string) => toast.info(`${what}`, { description: "Disponível na próxima evolução do protótipo." });

/* ---------- Layout ---------- */
const nav = [
  { to: "/", label: "Visão geral", icon: Home },
  { to: "/conformidade", label: "Conformidade", icon: ShieldCheck },
  { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { to: "/riscos", label: "Riscos", icon: AlertTriangle },
  { to: "/planos-de-acao", label: "Planos de ação", icon: FileCheck2 },
  { to: "/integracoes", label: "Integrações", icon: Network },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardList },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[190px] flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-3 pb-4 pt-4">
          <div className="overflow-hidden rounded-lg bg-card">
            <img src={logo.url} alt="Trianténa — Sapientia, Unitas, Legatum" className="h-auto w-full scale-110" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2.5">
          {nav.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                )}
              >
                <n.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/configuracoes"
          className={cn(
            "mx-2.5 mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] hover:bg-sidebar-accent/60",
            path.startsWith("/configuracoes") && "bg-sidebar-accent",
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Configurações
        </Link>
      </aside>
      <main className="ml-[190px] min-w-0 flex-1 px-5 pb-6 pt-4">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  period = "Últimos 30 dias",
  action,
}: {
  title: string;
  subtitle: string;
  period?: string;
  action?: string;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
        <p className="text-[16px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-5">
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md text-left outline-none">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">CA</div>
              <div className="leading-tight">
                <div className="text-[14px] font-semibold">Carlos</div>
                <div className="text-[12px] text-muted-foreground">Auditor Interno</div>
              </div>
              <ChevronDown className="ml-3 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-[13px]">Carlos</div>
                <div className="text-[11px] font-normal text-muted-foreground">carlos@triantena.com</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes"><User className="h-4 w-4" />Meu perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/configuracoes"><Settings className="h-4 w-4" />Configurações</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-critical focus:text-critical"
                onSelect={() => toast.success("Você saiu da sua conta", { description: "Sessão encerrada (simulação do protótipo)." })}
              >
                <LogOut className="h-4 w-4" />Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelect value={period} />
          {action && (
            <button
              onClick={() => soon(action)}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> {action}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function PeriodSelect({ value }: { value: string }) {
  const [v, setV] = useState(value);
  const opts = Array.from(new Set([value, "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias", "Jan/2024 – Jun/2024"]));
  return (
    <label className="relative flex h-9 items-center gap-2 rounded-md border bg-card pl-3 pr-8 text-[13px] shadow-card">
      <Calendar className="h-4 w-4" strokeWidth={1.75} />
      <select value={v} onChange={(e) => setV(e.target.value)} className="appearance-none bg-transparent outline-none">
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4" />
    </label>
  );
}

/* ---------- Cards ---------- */
export function Panel({
  title,
  suffix,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  suffix?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-card", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[15.5px] font-semibold">
            {title}
            {suffix && <span className="font-normal text-muted-foreground"> {suffix}</span>}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MiniSelect({ options }: { options: string[] }) {
  return (
    <label className="relative flex h-8 items-center rounded-md border bg-card pl-3 pr-7 text-[12px]">
      <select className="appearance-none bg-transparent outline-none">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5" />
    </label>
  );
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick ?? (() => soon(String(children)))} className="flex h-8 items-center gap-1.5 rounded-md border bg-card px-3 text-[12px] hover:bg-muted">
      {children} <span aria-hidden>→</span>
    </button>
  );
}

export function KpiCard({
  icon: Icon,
  tone,
  value,
  label,
  delta,
  good = true,
  sub,
  subTone,
  plain,
}: {
  icon: React.ElementType;
  tone: Tone;
  value: string;
  label: string;
  delta?: string;
  good?: boolean;
  sub?: string;
  subTone?: Tone;
  plain?: boolean;
}) {
  const up = delta?.startsWith("+");
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4 shadow-card">
      <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-xl", !plain && toneSoft[tone], plain && toneText[tone])}>
        <Icon className={plain ? "h-11 w-11" : "h-8 w-8"} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <div className="text-[26px] font-bold leading-none">{value}</div>
        <div className="mt-1 text-[15px] text-foreground/80">{label}</div>
        {delta && (
          <div className="mt-1.5 flex items-center gap-2 text-[13px]">
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium", good ? toneSoft.low : toneSoft.critical)}>
              <Triangle className={cn("h-2.5 w-2.5 fill-current", !up && "rotate-180")} />
              {delta.replace(/^[+-]/, (m) => (m === "+" ? "+" : "-"))}
            </span>
            <span className="text-muted-foreground">vs. período anterior</span>
          </div>
        )}
        {sub && (
          <div className={cn("mt-1.5 flex items-center gap-1.5 text-[14px] font-medium", toneText[subTone ?? "neutral"])}>
            {sub === "Normal" && <span className="h-2.5 w-2.5 rounded-full bg-low" />}
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Charts ---------- */
export type Slice = { name: string; value: number; tone: Tone; display?: string };

export function Donut({ data, center, caption, size = 150 }: { data: Slice[]; center: string; caption: string; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="64%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={toneVar[d.tone]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[28px] font-bold leading-none">{center}</div>
          <div className="mt-1 text-[13px]">{caption}</div>
        </div>
      </div>
    </div>
  );
}

export function DonutLegend({ data }: { data: Slice[] }) {
  return (
    <ul className="flex flex-1 flex-col gap-3 text-[13.5px]">
      {data.map((d) => (
        <li key={d.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full" style={{ background: toneVar[d.tone] }} />
            {d.name}
          </span>
          <span className="tabular-nums">{d.display ?? d.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function DonutPanel(props: { data: Slice[]; center: string; caption: string; size?: number }) {
  return (
    <div className="flex items-center gap-6 py-1">
      <Donut {...props} />
      <DonutLegend data={props.data} />
    </div>
  );
}

export type Bar = { label: string; value: number; display?: string; tone?: Tone; soft?: boolean };
export function HBars({ items, max, labelWidth = 170, valueInside }: { items: Bar[]; max?: number; labelWidth?: number; valueInside?: boolean }) {
  const m = max ?? Math.max(...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-3 text-[13px]">
          <span className="shrink-0 truncate" style={{ width: labelWidth }}>
            {i.label}
          </span>
          <div className="relative h-[18px] flex-1 rounded-sm bg-muted">
            <div
              className={cn("h-full rounded-sm", i.soft && "opacity-60")}
              style={{ width: `${(i.value / m) * 100}%`, background: toneVar[i.tone ?? "info"] }}
            />
            {valueInside && <span className="absolute inset-y-0 flex items-center pl-2" style={{ left: `${(i.value / m) * 100}%` }}>{i.display ?? i.value}</span>}
          </div>
          {!valueInside && <span className="w-14 shrink-0 text-right tabular-nums">{i.display ?? i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

export function ChartLegend({ items }: { items: { label: string; tone: Tone; square?: boolean; soft?: boolean }[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-[12.5px]">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2">
          <span
            className={cn("h-3 w-3", i.square ? "rounded-sm" : "rounded-full", i.soft && "opacity-40")}
            style={{ background: toneVar[i.tone] }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Badges ---------- */
export type Risk = "Crítico" | "Alto" | "Médio" | "Baixo";
export const riskTone: Record<Risk, Tone> = { Crítico: "critical", Alto: "critical", Médio: "medium", Baixo: "low" };

export function RiskBadge({ level, label }: { level: Risk; label?: string }) {
  const Icon = level === "Médio" ? AlertCircle : AlertTriangle;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[12.5px]", toneSoft[riskTone[level]])}>
      {level === "Baixo" ? <span className="h-2.5 w-2.5 rounded-full bg-low" /> : <Icon className={cn("h-3.5 w-3.5", level === "Médio" && "fill-high text-card")} />}
      {label ?? level}
    </span>
  );
}

const statusTone: Record<string, Tone> = {
  Aberto: "critical",
  "Em análise": "info",
  "Em andamento": "info",
  Pendente: "medium",
  Concluído: "low",
  Atrasado: "critical",
  Executivo: "info",
  Riscos: "critical",
  Conformidade: "low",
  "Planos de Ação": "medium",
  Transações: "violet",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-[12.5px]", toneSoft[statusTone[status] ?? "neutral"])}>{status}</span>;
}

export function DotStatus({ label, tone, square, chip }: { label: string; tone: Tone; square?: boolean; chip?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[12.5px]", chip && cn("rounded px-1.5 py-0.5", toneSoft[tone]), !chip && tone !== "neutral" && toneText[tone])}>
      <span className={cn("h-3 w-3", square ? "rounded-sm" : "rounded-full")} style={{ background: toneVar[tone] }} />
      {label}
    </span>
  );
}

/* ---------- Table ---------- */
export function TableToolbar({
  placeholder,
  filters,
  query,
  setQuery,
  extra,
}: {
  placeholder: string;
  filters: { value: string; onChange: (v: string) => void; options: string[] }[];
  query: string;
  setQuery: (q: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-9 w-[260px] items-center gap-2 rounded-md border bg-card px-3 text-[12.5px]">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
      {filters.map((f, i) => (
        <label key={i} className="relative flex h-9 items-center rounded-md border bg-card pl-3 pr-8 text-[12.5px]">
          <select value={f.value} onChange={(e) => f.onChange(e.target.value)} className="appearance-none bg-transparent outline-none">
            {f.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4" />
        </label>
      ))}
      {extra ?? (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-[13px] font-medium outline-none hover:bg-muted">
            <Download className="h-4 w-4" /> Exportar <ChevronDown className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => toast.success("Exportação em PDF iniciada", { description: "O arquivo PDF será baixado em instantes." })}>
              <FileText className="h-4 w-4 text-critical" /> Exportar em PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast.success("Exportação em XLSX iniciada", { description: "A planilha Excel será baixada em instantes." })}>
              <FileText className="h-4 w-4 text-low" /> Exportar em XLSX
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function DataTable({ head, rows, checkbox, onRowClick, selected }: { head: string[]; rows: { key: string; cells: ReactNode[] }[]; checkbox?: boolean; onRowClick?: (k: string) => void; selected?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-max text-[13px]">
        <thead className="bg-table-head text-left">
          <tr>
            {checkbox && <th className="w-10 px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-primary" /></th>}
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap border-l px-3 py-2 font-semibold first:border-l-0">{h}</th>
            ))}
            <th className="border-l px-3 py-2 font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={head.length + 2} className="px-3 py-6 text-center text-muted-foreground">Nenhum resultado encontrado.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.key} onClick={() => onRowClick?.(r.key)} className={cn("border-t", onRowClick && "cursor-pointer hover:bg-muted/60", selected === r.key && "bg-info/5")}>
              {checkbox && <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="h-4 w-4 accent-primary" /></td>}
              {r.cells.map((c, i) => (
                <td key={i} className="whitespace-nowrap border-l px-3 py-2 first:border-l-0">{c}</td>
              ))}
              <td className="border-l px-3 py-2">
                <div className="flex items-center gap-5">
                  <button aria-label="Visualizar" onClick={(e) => { if (!onRowClick) { e.stopPropagation(); soon("Visualização detalhada"); } }}><Eye className="h-4 w-4" /></button>
                  <button aria-label="Mais ações" onClick={(e) => { e.stopPropagation(); soon("Mais ações"); }}><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Alert list ---------- */
export type AlertItem = { tone: Tone; title: string; desc: string; when?: string };
const alertIcon: Record<string, React.ElementType> = { critical: AlertTriangle, medium: AlertTriangle, info: Info, low: CheckCircle2 };
export function AlertList({ items, chevron }: { items: AlertItem[]; chevron?: boolean }) {
  const [open, setOpen] = useState<AlertItem | null>(null);
  const OpenIcon = open ? alertIcon[open.tone] ?? Info : Info;
  return (
    <>
      <ul className="flex flex-col gap-2">
        {items.map((a) => {
          const Icon = alertIcon[a.tone] ?? Info;
          return (
            <li key={a.title}>
              <button onClick={() => setOpen(a)} className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-md", toneSoft[a.tone])}>
                  <Icon className={cn("h-5 w-5", a.tone === "medium" && "text-high")} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{a.title}</div>
                  <div className="truncate text-[12px] text-muted-foreground">{a.desc}</div>
                </div>
                {a.when && <span className="self-start whitespace-nowrap text-[11.5px] text-muted-foreground">{a.when}</span>}
                {chevron && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
            </li>
          );
        })}
      </ul>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          {open && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", toneSoft[open.tone])}>
                    <OpenIcon className={cn("h-6 w-6", open.tone === "medium" && "text-high")} />
                  </span>
                  <DialogTitle className="text-[17px] leading-snug">{open.title}</DialogTitle>
                </div>
                <DialogDescription className="pt-2 text-[14px]">{open.desc}</DialogDescription>
              </DialogHeader>
              {open.when && <p className="text-[12px] text-muted-foreground">Registrado {open.when}</p>}
              <DialogFooter>
                <button onClick={() => setOpen(null)} className="h-9 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Entendi</button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export { FileText };
