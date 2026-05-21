import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, HardDrive, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/assets/")({
  head: () => ({ meta: [{ title: "إدارة الأصول — Alazab PAOP" }] }),
  component: AssetsIndex,
});

function AssetsIndex() {
  const { data: stats } = useQuery({
    queryKey: ["assets-stats"],
    queryFn: async () => {
      const [{ count: total }, { count: linked }, { data: bytes }] = await Promise.all([
        supabase.from("assets").select("*", { count: "exact", head: true }),
        supabase.from("product_assets").select("*", { count: "exact", head: true }),
        supabase.from("assets").select("file_size"),
      ]);
      const totalBytes = (bytes ?? []).reduce((s, r: any) => s + (r.file_size || 0), 0);
      return { total: total ?? 0, linked: linked ?? 0, totalBytes };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["assets-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("id, file_name, file_url, file_size, file_type, folder_path, created_at")
        .order("created_at", { ascending: false })
        .limit(36);
      return data ?? [];
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الأصول</h1>
          <p className="text-sm text-muted-foreground mt-1">صور المنتجات والملفات المرتبطة</p>
        </div>
        <Link to="/assets/bulk-upload">
          <Button className="gap-2"><Upload className="size-4" /> رفع مجلد كامل</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="إجمالي الأصول" value={(stats?.total ?? 0).toLocaleString("en")} icon={ImageIcon} />
        <StatCard label="ارتباطات بمنتجات" value={(stats?.linked ?? 0).toLocaleString("en")} icon={Layers} />
        <StatCard label="حجم التخزين" value={formatBytes(stats?.totalBytes ?? 0)} icon={HardDrive} />
      </div>

      <Card className="p-5 surface-elevated border-0">
        <h3 className="font-bold mb-4">أحدث الأصول</h3>
        {!recent?.length ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            لا توجد أصول بعد. ابدأ بـ <Link to="/assets/bulk-upload" className="text-accent">رفع مجلد كامل</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
            {recent.map((a) => (
              <div key={a.id} className="group relative aspect-square rounded-md overflow-hidden bg-muted border">
                {a.file_type?.startsWith("image/") ? (
                  <img src={a.file_url} alt={a.file_name} loading="lazy" className="size-full object-cover" />
                ) : (
                  <div className="size-full grid place-items-center text-muted-foreground text-[10px] p-2 text-center">{a.file_name}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition">
                  {a.folder_path || a.file_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-5 surface-elevated border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1 num" dir="ltr">{value}</div>
        </div>
        <div className="size-10 rounded-md bg-accent/15 text-accent grid place-items-center">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function formatBytes(b: number) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}
