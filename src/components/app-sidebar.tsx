import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, Image, FileText, DollarSign, Truck,
  Warehouse, Copy, Upload, Download, Network, Sparkles, Settings, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/lib/auth";

const sections = [
  {
    label: "نظرة عامة",
    items: [
      { title: "لوحة التحكم", to: "/dashboard", icon: LayoutDashboard, phase: 1 },
    ],
  },
  {
    label: "البيانات الأساسية",
    items: [
      { title: "المنتجات والخدمات", to: "/products", icon: Package, phase: 1 },
      { title: "إدارة الأصول", to: "/assets", icon: Image, phase: 1 },
      { title: "إدارة المحتوى", to: "/content", icon: FileText, phase: 2 },
    ],
  },
  {
    label: "التسعير والموردين",
    items: [
      { title: "محرك التسعير", to: "/pricing", icon: DollarSign, phase: 3 },
      { title: "الموردون", to: "/suppliers", icon: Truck, phase: 3 },
      { title: "مخزون الموردين", to: "/supplier-inventory", icon: Warehouse, phase: 3 },
    ],
  },
  {
    label: "العمليات",
    items: [
      { title: "مراجعة التكرار", to: "/duplicates", icon: Copy, phase: 5 },
      { title: "مركز الاستيراد", to: "/import", icon: Upload, phase: 4 },
      { title: "مركز التصدير", to: "/export", icon: Download, phase: 4 },
      { title: "مركز API", to: "/api-center", icon: Network, phase: 4 },
      { title: "مساعد AI", to: "/ai-review", icon: Sparkles, phase: 5 },
    ],
  },
  {
    label: "النظام",
    items: [
      { title: "الإعدادات", to: "/settings", icon: Settings, phase: 1 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const role = useUserRole();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
          <div className="size-9 shrink-0 rounded-md bg-accent text-accent-foreground grid place-items-center font-bold">AZ</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sidebar-foreground truncate">Alazab PAOP</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">Product Asset Operations</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((sec) => (
          <SidebarGroup key={sec.label}>
            {!collapsed && <SidebarGroupLabel>{sec.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {sec.items.map((item) => {
                  const active = currentPath === item.to || currentPath.startsWith(item.to + "/");
                  const built = item.phase <= 2;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.to} className="flex items-center gap-2">
                          <item.icon className="size-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.title}</span>
                              {!built && (
                                <span className="text-[9px] num bg-sidebar-accent text-sidebar-foreground/70 rounded px-1.5 py-0.5">P{item.phase}</span>
                              )}
                            </>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2 space-y-2">
          {!collapsed && role && (
            <div className="text-[10px] text-sidebar-foreground/60 px-2">
              الدور: <span className="text-accent font-semibold">{role === "admin" ? "مدير" : role === "editor" ? "محرر" : "مشاهد"}</span>
            </div>
          )}
          <SidebarMenuButton onClick={signOut} tooltip="تسجيل خروج">
            <LogOut className="size-4" />
            {!collapsed && <span>تسجيل خروج</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
