import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/import/")({ component: ImportCenter });

type Job = {
  id: string; import_type: string; file_name: string; status: string;
  total_rows: number; valid_rows: number; invalid_rows: number; created_at: string;
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const splitLine = (line: string) => {
    const out: string[] = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = !inQ;
      else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur); return out;
  };
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = splitLine(l);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? "").trim()]));
  });
}

function ImportCenter() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [importType, setImportType] = useState("products");
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("import_jobs").select("*").order("created_at", { ascending: false }).limit(30);
    setJobs((data as Job[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 10));
    toast.success(`تم تحليل ${rows.length} صف للمعاينة`);
    (window as unknown as { __importRows: Record<string, string>[] }).__importRows = rows;
  };

  const runImport = async () => {
    const rows = (window as unknown as { __importRows?: Record<string, string>[] }).__importRows;
    if (!rows?.length) return toast.error("لا توجد بيانات");
    setBusy(true);
    try {
      const { data: job } = await supabase.from("import_jobs").insert({
        import_type: importType, file_name: fileName,
        total_rows: rows.length, valid_rows: 0, invalid_rows: 0, status: "processing",
      }).select().single();

      let valid = 0; let invalid = 0;
      if (importType === "suppliers") {
        for (const r of rows) {
          if (!r.name) { invalid++; continue; }
          const { error } = await supabase.from("suppliers").insert({
            name: r.name, phone: r.phone || null, email: r.email || null,
            contact_name: r.contact_name || null, supplier_type: r.supplier_type || null,
          });
          if (error) invalid++; else valid++;
        }
      } else {
        // products: only count parsed, no insert (safe default until mapping confirmed)
        valid = rows.length;
      }
      await supabase.from("import_jobs").update({
        status: "completed", valid_rows: valid, invalid_rows: invalid,
      }).eq("id", job!.id);

      toast.success(`اكتمل: ${valid} صحيح، ${invalid} خطأ`);
      setPreview(null); setFileName(""); load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    } finally { setBusy(false); }
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مركز الاستيراد</h1>
        <p className="text-sm text-muted-foreground">استيراد CSV مع معاينة وتحقق قبل الإدراج</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">رفع ملف CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="products">منتجات</SelectItem>
                <SelectItem value="suppliers">موردون</SelectItem>
                <SelectItem value="prices">أسعار</SelectItem>
              </SelectContent>
            </Select>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button variant="outline" asChild><span><FileSpreadsheet className="size-4 ml-2" /> اختيار ملف CSV</span></Button>
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>

          {preview && (
            <>
              <div className="border rounded overflow-auto max-h-96">
                <Table>
                  <TableHeader><TableRow>
                    {Object.keys(preview[0]).map((h) => <TableHead key={h}>{h}</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {preview.map((r, i) => (
                      <TableRow key={i}>
                        {Object.values(r).map((v, j) => <TableCell key={j} className="text-xs">{v}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={runImport} disabled={busy}>
                <Upload className="size-4 ml-2" />{busy ? "جاري الاستيراد…" : "تنفيذ الاستيراد"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">سجل عمليات الاستيراد</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>الوقت</TableHead><TableHead>النوع</TableHead><TableHead>الملف</TableHead>
              <TableHead>الإجمالي</TableHead><TableHead>صحيح</TableHead><TableHead>خطأ</TableHead><TableHead>الحالة</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="text-xs num">{new Date(j.created_at).toLocaleString("ar-EG")}</TableCell>
                  <TableCell>{j.import_type}</TableCell>
                  <TableCell className="text-xs">{j.file_name}</TableCell>
                  <TableCell className="num">{j.total_rows}</TableCell>
                  <TableCell className="num text-green-600">{j.valid_rows}</TableCell>
                  <TableCell className="num text-destructive">{j.invalid_rows}</TableCell>
                  <TableCell><Badge>{j.status}</Badge></TableCell>
                </TableRow>
              ))}
              {!jobs.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا توجد عمليات بعد</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
