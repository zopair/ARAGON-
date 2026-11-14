# سجل المصادر الخارجية

كُتبت صفحات ARAGON وأدواتها وCSS/JavaScript الخاص بها لهذا المستودع دون نسخ مكتبات أو شفرة تطبيق خارجية. لا توجد تبعيات وقت تشغيل من npm أو خطوط/صور/خدمات تحميل خارجية.

## إجراءات GitHub Actions

تستخدم آلية الفحص والنشر إجراءات GitHub الرسمية التالية؛ كل مرجع في `.github/workflows/pages.yml` مثبت على commit SHA بدل وسم متحرك. روجعت مستودعات المصدر وملفات ترخيصها الرسمية في 2026-11-14، والترخيص المعلن لكل إجراء هو MIT:

- [`actions/checkout`](https://github.com/actions/checkout) — المرجع `3d3c42e5aac5ba805825da76410c181273ba90b1`، MIT.
- [`actions/configure-pages`](https://github.com/actions/configure-pages) — المرجع `983d7736d9b0ae728b81ab479565c72886d7745b`، MIT.
- [`actions/upload-pages-artifact`](https://github.com/actions/upload-pages-artifact) — المرجع `7b1f4a764d45c48632c6b24a0339c27f5614fb0b`، MIT.
- [`actions/deploy-pages`](https://github.com/actions/deploy-pages) — المرجع `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e`، MIT.

هذه الإجراءات تنفذ داخل GitHub Actions فقط. لا تحمل شفرة من هذه المستودعات إلى حزمة ملفات الموقع. راجع تحديثاتها وتراخيصها قبل تغيير المراجع المثبتة.

## ترخيص المشروع

لم يختر مالك المستودع ترخيصًا لشفرة ARAGON حتى الآن؛ لذلك لا يفترض هذا المستودع منح إذن إعادة الاستخدام أو التوزيع. إضافة ترخيص للمشروع تحتاج قرار المالك.
