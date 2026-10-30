import type { Risk } from "@/components/kit";

export type Finding = {
  date: string;
  id: string;
  desc: string;
  category: string;
  value: string;
  risk: Risk;
  status: "Aberto" | "Em análise";
  system: string;
  supplier: string;
  type: string;
  area: string;
  control: string;
  owner: string;
};

export const findings: Finding[] = [
  { date: "12/06/2024", id: "45872", desc: "Pagamento acima do limite da política", category: "Compras", value: "250.000,00", risk: "Crítico", status: "Aberto", system: "ERP (SAP)", supplier: "ABC Serviços LTDA", type: "Pagamento", area: "Compras", control: "POL-COM-01", owner: "Ana Silva" },
  { date: "11/06/2024", id: "45871", desc: "Fornecedor sem cadastro", category: "Compras", value: "45.800,00", risk: "Alto", status: "Em análise", system: "ERP (SAP)", supplier: "Tech Solutions", type: "Transferência", area: "Compras", control: "POL-COM-02", owner: "Carlos" },
  { date: "10/06/2024", id: "45865", desc: "Transação atípica (valor)", category: "Pagamentos", value: "12.300,00", risk: "Alto", status: "Aberto", system: "Banco de dados", supplier: "XYZ Comércio", type: "Pagamento", area: "Financeiro", control: "POL-FIN-03", owner: "Marcos" },
  { date: "09/06/2024", id: "45860", desc: "Duplicidade de pagamento", category: "Pagamentos", value: "37.900,00", risk: "Médio", status: "Em análise", system: "ERP (SAP)", supplier: "Global Tech", type: "Pagamento", area: "Financeiro", control: "POL-FIN-04", owner: "Ana Silva" },
  { date: "08/06/2024", id: "45859", desc: "Segregação de funções", category: "Governança", value: "-", risk: "Médio", status: "Aberto", system: "Planilhas", supplier: "Omega Distribuidora", type: "Transferência", area: "TI", control: "POL-TI-01", owner: "Juliana" },
];

export const topRisks = [
  { label: "Pagamentos fora da política", value: 12, tone: "critical" as const },
  { label: "Fornecedores sem cadastro", value: 8, tone: "high" as const },
  { label: "Transações atípicas", value: 7, tone: "high" as const },
  { label: "Segregação de funções", value: 6, tone: "medium" as const },
  { label: "Duplicidade de pagamentos", value: 4, tone: "medium" as const },
  { label: "Outros", value: 3, tone: "neutral" as const },
];

export const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

export const actionPlans = [
  { id: "PA-2024-001", desc: "Revisar política de compras", finding: "Pagamento acima do limite", area: "Compras", owner: "Ana Silva", due: "15/06/2024", status: "Em andamento", progress: 60 },
  { id: "PA-2024-002", desc: "Implementar cadastro de fornecedores", finding: "Fornecedor sem cadastro", area: "Compras", owner: "Carlos Mendes", due: "20/06/2024", status: "Pendente", progress: 20 },
  { id: "PA-2024-003", desc: "Segregar funções no financeiro", finding: "Segregação de funções", area: "Financeiro", owner: "Juliana Costa", due: "30/06/2024", status: "Atrasado", progress: 40 },
  { id: "PA-2024-004", desc: "Ajustar controles de acesso", finding: "Controle de acesso inadequado", area: "TI", owner: "Marcos Lima", due: "10/07/2024", status: "Em andamento", progress: 75 },
  { id: "PA-2024-005", desc: "Padronizar conciliação bancária", finding: "Diferença em conciliação", area: "Financeiro", owner: "Ana Silva", due: "05/07/2024", status: "Concluído", progress: 100 },
];

export const axis = { tick: { fontSize: 12, fill: "var(--muted-foreground)" }, axisLine: false, tickLine: false } as const;
