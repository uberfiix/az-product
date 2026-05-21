import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadAndLinkAsset, deleteAssetLink, setAssetRole, type AssetRole } from "@/lib/upload-assets";
import { Upload, Star, Trash2, ImageOff } from "lucide-react";
import { toast } from "sonner";

export function ProductAssetsTab({ productId, azCode }: { productId: string; azCode: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["product-assets", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_assets")
        .select("id, asset_role, sort_order, asset:assets(id, file_name, file_url, file_type, file_size)")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    const existing = items?.length ?? 0;
    const hasMain = items?.some((i: any) => i.asset_role === "main_image");
    let added = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (!f.type.startsWith("image/") && !f.type.startsWith("application/")) continue;
        const isFirst = !hasMain && existing === 0 && i === 0;
        await uploadAndLinkAsset({
          file: f,
          productId,
          azCode,
          role: isFirst ? "main_image" : "gallery",
          sortOrder: existing + i,
          folderPath: azCode,
        });
        added++;
      }
      toast.success(`تم رفع ${added} ملف`);
      qc.invalidateQueries({ queryKey: ["product-assets", productId] });
    } catch (e: any) {
      toast.error(e.message ?? "فشل الرفع");
    } finally {
      setBusy(false);
    }
  }, [items, productId, azCode, qc]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload(Array.from(e.dataTransfer.files));
  };

  const onMakeMain = async (linkId: string) => {
    // demote existing main → gallery, promote selected → main_image
    const current = items?.find((i: any) => i.asset_role === "main_image");
    try {
      if (current && current.id !== linkId) await setAssetRole(current.id, "gallery");
      await setAssetRole(linkId, "main_image");
      qc.invalidateQueries({ queryKey: ["product-assets", productId] });
      toast.success("تم تعيين الصورة الرئيسية");
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (linkId: string) => {
    try {
      await deleteAssetLink(linkId);
      qc.invalidateQueries({ queryKey: ["product-assets", productId] });
      toast.success("تم فك الربط");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <Card
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`p-8 surface-elevated border-2 border-dashed transition ${dragOver ? "border-accent bg-accent/5" : "border-border"}`}
      >
        <div className="text-center space-y-3">
          <div className="mx-auto size-12 rounded-full bg-accent/15 grid place-items-center">
            <Upload className="size-5 text-accent" />
          </div>
          <div>
            <div className="font-semibold">اسحب وأفلت الصور هنا</div>
            <div className="text-xs text-muted-foreground mt-1 num" dir="ltr">{azCode}</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => upload(Array.from(e.target.files ?? []))}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={busy} variant="outline" size="sm">
            {busy ? "جاري الرفع..." : "اختر ملفات"}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">جاري التحميل...</div>
      ) : !items?.length ? (
        <Card className="p-10 surface-elevated border-0 text-center text-muted-foreground">
          <ImageOff className="size-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">لا توجد أصول مرتبطة بهذا المنتج بعد</div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((it: any) => {
            const a = it.asset;
            const isMain = it.asset_role === "main_image";
            return (
              <Card key={it.id} className="surface-elevated border-0 overflow-hidden group relative">
                <div className="aspect-square bg-muted">
                  {a?.file_type?.startsWith("image/") ? (
                    <img src={a.file_url} alt={a.file_name} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="size-full grid place-items-center text-xs text-muted-foreground p-3 text-center">{a?.file_name}</div>
                  )}
                  {isMain && (
                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground gap-1">
                      <Star className="size-3 fill-current" /> رئيسية
                    </Badge>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  <div className="text-[11px] truncate" title={a?.file_name}>{a?.file_name}</div>
                  <div className="flex gap-1">
                    {!isMain && (
                      <Button size="sm" variant="ghost" className="h-7 flex-1 text-[10px] gap-1" onClick={() => onMakeMain(it.id)}>
                        <Star className="size-3" /> رئيسية
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => onDelete(it.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
