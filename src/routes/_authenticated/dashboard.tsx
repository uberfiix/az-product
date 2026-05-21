import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Package, CheckCircle2, Clock, AlertTriangle, Image, DollarSign,
  Truck, Network, Copy, ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحة التحكم — Alazab PAOP" }] }),
  component: Dashboard,
});

async function fetchStats() {
  const [products, approved, draft, needsReview, assets, suppliers, prices, integrations, dups] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "needs_review"),
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("suppliers").select("*", { count: "exact", head: true }),
    supabase.from("prices").select("*", { count: "exact", head: true }),
    supabase.from("api_integrations").select("*", { count: "exact", head: true }),
    supabase.from("duplicate_groups").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);
  return {
    products: products.count ?? 0,
    approved: approved.count ?? 0,
    draft: draft.count ?? 0,
    needsReview: needsReview.count ?? 0,
    assets: assets.count ?? 0,
    suppliers: suppliers.count ?? 0,
    prices: prices.count ?? 0,
    integrations: integrations.count ?? 0,
    dups: dups.count ?? 0,
  };
}

async function fetchRecent() {
  const { data } = await supabase
    .from("products")
    .select("id, az_code, name_ar, item_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function fetchTypeBreakdown() {
  const { data } = await supabase.from("products").select("gpc_family");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    const k = r.gpc_family || "غير مصنف";
    counts[k] = (counts[k] ?? 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const { data: recent } = useQuery({ queryKey: ["recent"], queryFn: fetchRecent });
  const { data: families } = useQuery({ queryKey: ["families"], queryFn: fetchTypeBreakdown });

  const kpis = [
    { label: "إجمالي البنود", value: stats?.products, icon: Package, tone: "primary" },
    { label: "بنود معتمدة", value: stats?.approved, icon: CheckCircle2, tone: "success" },
    { label: "مسودات", value: stats?.draft, icon: Clock, tone: "muted" },
    { label: "تحتاج مراجعة", value: stats?.needsReview, icon: AlertTriangle, tone: "warning" },
    { label: "الأصول الرقمية", value: stats?.assets, icon: Image, tone: "primary" },
    { label: "سجلات الأسعار", value: stats?.prices, icon: DollarSign, tone: "primary" },
    { label: "الموردون", value: stats?.suppliers, icon: Truck, tone: "primary" },
    { label: "تكاملات API", value: stats?.integrations, icon: Network, tone: "primary" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة شاملة على حالة المنصة والبيانات المعتمدة</p>
        </div>
        <Link to="/products" className="text-sm text-accent font-semibold flex items-center gap-1 hover:underline">
          استعراض كل البنود <ArrowLeft className="size-4 rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4 surface-elevated border-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-bold mt-1 num">{k.value?.toLocaleString("en-US") ?? "—"}</div>
              </div>
              <div className="size-9 rounded-md bg-secondary grid place-items-center">
                <k.icon className="size-4 text-primary" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 surface-elevated border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">آخر البنود المضافة</h3>
            <Link to="/products" className="text-xs text-accent hover:underline">عرض الكل</Link>
          </div>
          <div className="divide-y">
            {(recent ?? []).map((p: any) => (
              <Link
                key={p.id}
                to="/products/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between py-3 hover:bg-secondary/50 rounded-md px-2 -mx-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.name_ar}</div>
                  <div className="text-[11px] text-muted-foreground num mt-0.5" dir="ltr">{p.az_code}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5 surface-elevated border-0">
          <h3 className="font-bold mb-4">التوزيع حسب العائلة (GPC)</h3>
          <div className="space-y-2">
            {(families ?? []).map(([name, count]) => {
              const max = families?.[0]?.[1] ?? 1;
              const pct = ((count as number) / (max as number)) * 100;
              return (
                <div key={name as string}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{name}</span>
                    <span className="num text-muted-foreground">{(count as number).toLocaleString("en-US")}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5 surface-elevated border-0">
        <div className="flex items-center gap-2 mb-2">
          <Copy className="size-4 text-warning" />
          <h3 className="font-bold">حوكمة البيانات</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          النظام يلتزم بسياسات صارمة: لا حذف نهائي، كل تعديل مسجَّل في audit_logs، التصدير محصور بالبنود
          المعتمدة، تعديل الأسعار يحفظ التاريخ تلقائياً، ولا يتم اعتماد بند بدون البيانات الأساسية الكاملة.
        </p>
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
  return <span className={`text-[10px] px-2 py-0.5 rounded ${v.cls} shrink-0`}>{v.label}</span>;
}
