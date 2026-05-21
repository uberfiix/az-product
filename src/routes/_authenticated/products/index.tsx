import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/products/")({
  head: () => ({ meta: [{ title: "المنتجات والخدمات — Alazab PAOP" }] }),
  component: ProductsList,
});

const PAGE = 50;

function ProductsList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["products", q, status, page],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, az_code, egs_code, name_ar, name_en, item_type, status, gpc_family, sector_ar, confidence_level", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,az_code.ilike.%${q}%`);
      if (status !== "all") query = query.eq("status", status as any);
      const { data, count, error } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const total = data?.count ?? 0;
  const pages = Math.ceil(total / PAGE);

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">المنتجات والخدمات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="num">{total.toLocaleString("en-US")}</span> بند في الكتالوج
          </p>
        </div>
      </div>

      <Card className="p-4 surface-elevated border-0">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو AZ Code..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              className="pr-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="needs_review">يحتاج مراجعة</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="archived">مؤرشف</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="surface-elevated border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase">
              <tr>
                <th className="text-right p-3 font-semibold">AZ Code</th>
                <th className="text-right p-3 font-semibold">الاسم بالعربي</th>
                <th className="text-right p-3 font-semibold">Name EN</th>
                <th className="text-right p-3 font-semibold">العائلة</th>
                <th className="text-right p-3 font-semibold">القطاع</th>
                <th className="text-right p-3 font-semibold">الثقة</th>
                <th className="text-right p-3 font-semibold">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>}
              {!isLoading && data?.rows.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد نتائج</td></tr>
              )}
              {data?.rows.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-secondary/30 cursor-pointer">
                  <td className="p-3 num text-xs" dir="ltr">
                    <Link to="/products/$id" params={{ id: p.id }} className="text-accent hover:underline">{p.az_code}</Link>
                  </td>
                  <td className="p-3"><Link to="/products/$id" params={{ id: p.id }} className="hover:underline">{p.name_ar}</Link></td>
                  <td className="p-3 text-muted-foreground" dir="ltr">{p.name_en}</td>
                  <td className="p-3 text-xs">{p.gpc_family || "—"}</td>
                  <td className="p-3 text-xs">{p.sector_ar || "—"}</td>
                  <td className="p-3 text-xs">{p.confidence_level || "—"}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t bg-secondary/30 text-xs">
          <div className="text-muted-foreground num" dir="ltr">
            Page {page + 1} / {pages || 1} · {total.toLocaleString("en-US")} rows
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 rounded border disabled:opacity-50">السابق</button>
            <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} className="px-3 py-1 rounded border disabled:opacity-50">التالي</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: "معتمد", cls: "bg-success/15 text-success" },
    draft: { label: "مسودة", cls: "bg-muted text-muted-foreground" },
    needs_review: { label: "مراجعة", cls: "bg-warning/15 text-warning" },
    rejected: { label: "مرفوض", cls: "bg-destructive/15 text-destructive" },
    archived: { label: "مؤرشف", cls: "bg-muted text-muted-foreground" },
  };
  const v = map[status] ?? { label: status, cls: "bg-secondary" };
  return <span className={`text-[10px] px-2 py-0.5 rounded ${v.cls}`}>{v.label}</span>;
}
