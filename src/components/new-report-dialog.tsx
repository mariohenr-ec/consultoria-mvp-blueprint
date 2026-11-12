import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { money, number, percent, type Evaluated } from "@/lib/analysis";

type Stats = { rows: Evaluated[]; findings: Evaluated[]; count: number; total: number; atypicalValue: number; compliance: number | null };
const types = ["Executivo", "Riscos", "Conformidade", "Transações atípicas"];

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function NewReportDialog({ open, onOpenChange, stats, periodText, analysesCount }: { open: boolean; onOpenChange: (o: boolean) => void; stats: Stats; periodText: string; analysesCount: number }) {
  const [title, setTitle] = useState("Relatório de Auditoria Contínua");
  const [type, setType] = useState(types[0]!);
  const [author, setAuthor] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const exportDocx = async () => {
    if (!title.trim()) { toast.error("Informe o título do relatório"); return; }
    setBusy(true);
    try {
      const d = await import("docx");
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = d;
      const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
      const borders = { top: border, bottom: border, left: border, right: border };
      const widths = [1800, 3160, 1600, 1400, 1400];
      const cell = (t: string, i: number, head = false) => new TableCell({ borders, width: { size: widths[i]!, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, shading: { fill: head ? "DCE6F2" : "FFFFFF", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: t, bold: head, size: 18 })] })] });
      const list = type === "Conformidade" ? stats.rows.filter(r => r.control !== "Conforme") : stats.findings;
      const rows = list.slice(0, 50);
      const p = (t: string, bold = false) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, bold })] });
      const doc = new Document({
        styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
        sections: [{
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
          children: [
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: title.trim(), bold: true, size: 36 })] }),
            p(`Tipo: ${type} · Período: ${periodText}`),
            p(`Gerado em ${new Date().toLocaleString("pt-BR")}${author.trim() ? ` por ${author.trim()}` : ""}`),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Indicadores")] }),
            p(`Análises consideradas: ${number(analysesCount)}`),
            p(`Transações analisadas: ${number(stats.count)}`),
            p(`Achados de risco: ${number(stats.findings.length)}`),
            p(`Conformidade dos controles: ${stats.compliance === null ? "—" : percent(stats.compliance)}`),
            p(`Valor total analisado: ${money(stats.total)}`),
            p(`Valor em transações atípicas: ${money(stats.atypicalValue)}`),
            ...(notes.trim() ? [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Observações")] }), p(notes.trim())] : []),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(type === "Conformidade" ? "Não conformidades" : "Principais achados")] }),
            rows.length ? new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: widths, rows: [
              new TableRow({ tableHeader: true, children: ["Data", "Descrição", "Área", "Nível", "Valor"].map((t, i) => cell(t, i, true)) }),
              ...rows.map(r => new TableRow({ children: [r.date.split("-").reverse().join("/"), r.description, r.area, type === "Conformidade" ? r.control : r.level, money(r.value)].map((t, i) => cell(String(t), i)) })),
            ] }) : p("Nenhum registro no período selecionado."),
            ...(list.length > rows.length ? [p(`Exibidos ${rows.length} de ${list.length} registros.`)] : []),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      download(blob, `${title.trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_") || "relatorio"}.docx`);
      toast.success("Relatório exportado em DOCX");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o arquivo DOCX");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo relatório</DialogTitle>
          <DialogDescription>Monte o relatório com os dados das análises salvas ({periodText}) e exporte em DOCX.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="rep-title">Título</Label><Input id="rep-title" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label htmlFor="rep-type">Tipo de relatório</Label>
            <select id="rep-type" value={type} onChange={e => setType(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">{types.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="rep-author">Responsável</Label><Input id="rep-author" value={author} maxLength={80} onChange={e => setAuthor(e.target.value)} placeholder="Nome do auditor" /></div>
          <div className="grid gap-1.5"><Label htmlFor="rep-notes">Observações</Label><Textarea id="rep-notes" value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} placeholder="Conclusões, recomendações..." /></div>
          <p className="text-xs text-muted-foreground">{number(stats.count)} transações · {number(stats.findings.length)} achados serão incluídos.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={exportDocx} disabled={busy}><FileDown className="h-4 w-4" />{busy ? "Gerando..." : "Exportar em DOCX"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
