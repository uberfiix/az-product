import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Mail, Phone, Truck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/suppliers/")({
  head: () => ({ meta: [{ title: "الموردون — Alazab PAOP" }] }),
  component: SuppliersList,
});

const TIER_LABEL: Record<string, string> = {
  first_tier: "درجة أولى",
  second_tier: "درجة ثانية",
  backup: "احتياطي",
};

function SuppliersList() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["suppliers", q],
    queryFn: async () => {
      let query = supabase.from("suppliers").select("*").order("created_at", { ascending: false });
      if (q) query = query.or(`name.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="size-6 text-accent" /> الموردون</h1>
          <p className="text-xs text-muted-foreground mt-1 num">إجمالي: {rows.length} مورد</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 ml-1" /> مورد جديد</Button></DialogTrigger>
          <SupplierForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["suppliers"] }); }} />
        </Dialog>
      </div>

      <Card className="p-3 surface-elevated border-0">
        <div className="relative">
          <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم، البريد، الهاتف..." className="pr-9" />
        </div>
      </Card>

      <Card className="surface-elevated border-0 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا يوجد موردون</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
            {rows.map((s: any) => (
              <Card key={s.id} className="p-4 hover:border-accent transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{s.name}</h3>
                    {s.contact_name && <p className="text-xs text-muted-foreground truncate mt-0.5">{s.contact_name}</p>}
                  </div>
                  <span className="text-[10px] bg-accent/15 text-accent rounded px-2 py-0.5 whitespace-nowrap">{TIER_LABEL[s.supplier_tier] ?? s.supplier_tier}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-accent truncate"><Mail className="size-3 shrink-0" />{s.email}</a>}
                  {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-accent num" dir="ltr"><Phone className="size-3 shrink-0" />{s.phone}</a>}
                  {s.notes && <p className="text-[10px] text-muted-foreground/70 pt-1 truncate">{s.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SupplierForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "", supplier_tier: "second_tier", notes: "" });
  const m = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("suppliers").insert({
        name: form.name.trim(),
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
        supplier_tier: form.supplier_tier as any,
        notes: form.notes || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم إضافة المورد"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });
  const F = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target.value });
  return (
    <DialogContent dir="rtl">
      <DialogHeader><DialogTitle>مورد جديد</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>اسم المورد *</Label><Input value={form.name} onChange={F("name")} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>اسم المسؤول</Label><Input value={form.contact_name} onChange={F("contact_name")} /></div>
          <div>
            <Label>الدرجة</Label>
            <Select value={form.supplier_tier} onValueChange={(v) => setForm({ ...form, supplier_tier: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="first_tier">درجة أولى</SelectItem>
                <SelectItem value="second_tier">درجة ثانية</SelectItem>
                <SelectItem value="backup">احتياطي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>البريد</Label><Input type="email" value={form.email} onChange={F("email")} /></div>
          <div><Label>الهاتف</Label><Input value={form.phone} onChange={F("phone")} dir="ltr" /></div>
        </div>
        <div><Label>ملاحظات</Label><Textarea rows={3} value={form.notes} onChange={F("notes")} /></div>
      </div>
      <DialogFooter><Button onClick={() => m.mutate()} disabled={m.isPending}>{m.isPending ? "جاري الحفظ..." : "حفظ"}</Button></DialogFooter>
    </DialogContent>
  );
}
