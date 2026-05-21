
# Alazab PAOP — خطة البناء

نطاق الطلب ضخم جدًا (12+ وحدة، 15+ جدول، API كامل، AI). لا يمكن بناؤه كله في رسالة واحدة بجودة إنتاجية. سأبنيه على **5 مراحل متتابعة**، كل مرحلة قابلة للتشغيل وتُسلَّم وتُختبر قبل التالية.

ملف `Alazab_Catalog_Final.xlsx` يحتوي **2,794 بند حقيقي** بأعمدة: AZ Code, EGS, المسار التشغيلي, الاسم AR/EN, الوصف AR/EN, GPC Brick/Class/Family/Segment, مستوى الثقة. سيُستورد فعليًا في المرحلة 1.

---

## المرحلة 1 — الأساس + استيراد الكتالوج (هذه الرسالة)

**الهدف:** نظام تشغيلي يعرض الكتالوج الحقيقي ويسمح بالتصفح والبحث والاعتماد.

- تفعيل Lovable Cloud (Supabase + Storage + Auth).
- مخطط قاعدة البيانات الكامل (15 جدول مذكور في الطلب) + RLS + Audit triggers.
- استيراد 2,794 بند من الإكسل إلى جدول `products`.
- تخطيط تصميم احترافي عربي/RTL (سايدبار + Dashboard + Products list/details).
- شاشة Dashboard بإحصائيات حقيقية من DB.
- شاشة Products (جدول + بحث + فلاتر + اعتماد جماعي).
- شاشة Product Details (Tabs: Overview / Assets / Pricing / Suppliers / Audit Log).
- Auth بسيط (Email + كلمة سر) + جدول `user_roles` (admin/editor/viewer).

## المرحلة 2 — Assets Manager + Content

- Drag & Drop upload إلى Supabase Storage.
- جدول `assets` + `product_assets` مع الأدوار (Main/Gallery/Before/After/...).
- Grid + List view, reorder, tagging, ربط/فك ربط، كشف غير المرتبط.
- محرر محتوى متعدد الأنواع (Product/Service/AI Knowledge/...).

## المرحلة 3 — Pricing Engine + Suppliers + Supplier Inventory

- جداول `prices`, `price_history`, `suppliers`, `supplier_inventory`.
- شاشة Pricing مع مقارنة موردين، اعتماد سعر، Audit كامل.
- إدارة موردين بالدرجات (First/Second/Backup/...).
- Supplier Inventory Mirror + ربط SKU المورد بالمنتج الداخلي.
- استيراد CSV/XLSX من الموردين.

## المرحلة 4 — API Layer + Import/Export Center

- TanStack server routes تحت `/api/public/*` لكل الـ endpoints المذكورة (Products, Assets, Pricing, Suppliers, Export).
- API Key management + Webhook logs + Sync history.
- Export Center: Daftra / ERPNext / Postgres / AI Knowledge / JSON.
- Import Center: CSV/XLSX validation + dry-run.

## المرحلة 5 — AI Review + Duplicate Detection + Polish

- اقتراحات AI (اسم/وصف/تصنيف/Tags) عبر Lovable AI Gateway.
- كشف التكرار المعنوي (`duplicate_groups`).
- ربط ذكي للصور بالمنتجات.
- مراجعة بشرية إلزامية لكل اقتراح.

---

## ملاحظات حاكمة (تُطبَّق في كل المراحل)

- **لا حذف نهائي** — كل الجداول فيها `status` + soft delete.
- **Audit Log** على كل تعديل عبر Postgres trigger يكتب في `audit_logs`.
- **RLS** على كل الجداول حسب الدور.
- **الكود الداخلي** `AZ-{TYPE}-{CATEGORY}-{FAMILY}-{SERIAL}` يُولَّد عبر دالة DB.
- **No placeholders** — كل البيانات الظاهرة من DB حقيقي.

---

## ما سأبنيه فعليًا في هذه الرسالة (المرحلة 1)

1. تفعيل Lovable Cloud.
2. Migration واحد ينشئ كل الـ 15 جدول + ENUMs + indexes + triggers + RLS + دالة توليد AZ Code.
3. Script يستورد 2,794 بند من الإكسل إلى `products`.
4. Design system عربي/RTL (Cairo + Inter, palette ترابي/كحلي احترافي للنظام التشغيلي).
5. Layout: Sidebar (13 عنصر) + Header + RTL.
6. صفحات: Login, Dashboard, Products list, Product details (Overview tab فقط — باقي التابات placeholder واضح "قيد البناء — المرحلة X").
7. Auth + user_roles.

**التابات غير المبنية في هذه المرحلة ستظهر بوضوح كـ "Coming in Phase N"** — وليست placeholders صامتة. هذا شفافية وليس كود تجريبي.

بعد موافقتك على هذه الخطة، أبدأ المرحلة 1 فورًا. وفي نهاية كل مرحلة أسألك قبل الانتقال للتالية.
