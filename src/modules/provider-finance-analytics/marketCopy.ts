import { normalizePortalLocale } from "@core/i18n/config";

const copy = {
  fa: {
    title: "نبض اقتصاد سرویس و شفافیت درآمد", description: "ببینید سرویس‌های تکمیل‌شده چه مبلغ قابل‌پرداختی برای ارائه‌دهنده ساخته‌اند، بازگشت‌ها چه اثری داشته‌اند و درآمد تا چه حد روی چند سرویس متمرکز است.",
    gross: "ناخالص تسویه", payable: "قابل‌پرداخت ارائه‌دهنده", retained: "قابل‌پرداخت پس از برگشت اعمال‌شده", reversals: "برگشت اعمال‌شده",
    queueTitle: "سیگنال‌های اقتصادی نیازمند توجه", queueDescription: "این صف مشکلات حسابداری را اعلام نمی‌کند؛ فقط برگشت قابل‌توجه، تمرکز درآمد و مبالغ در مسیر تسویه را برای بررسی عملیاتی برجسته می‌کند.",
    empty: "در این بازه سیگنال اقتصادی قابل‌توجهی دیده نشد.", bookings: "رزرو تکمیل‌شده", providerShare: "سهم ثبت‌شده ارائه‌دهنده", refundDrag: "اثر برگشت", revenueShare: "سهم از قابل‌پرداخت حفظ‌شده",
    pending: "در انتظار دفتر", approved: "تاییدشده دفتر", paid: "پرداخت‌شده دفتر", refundSignal: "اثر برگشت بالا", concentrationSignal: "تمرکز درآمد", settlementSignal: "تسویه در جریان", settlements: "مشاهده تسویه‌ها",
    notice: "این نما سود خالص حسابداری نیست. هزینه‌های عملیاتی کامل ارائه‌دهنده در قراردادهای موجود ثبت نشده‌اند؛ بنابراین اعداد از charge line، payable، fee، reversal و ledger موجود ساخته می‌شوند و قوانین جبران/تسویه را تغییر نمی‌دهند.",
  },
  en: {
    title: "Service economics & revenue clarity pulse", description: "See how completed services translate into provider payable, how reversals affect it, and how concentrated retained payable is across services.",
    gross: "Settlement gross", payable: "Provider payable", retained: "Retained payable after applied reversals", reversals: "Applied reversals",
    queueTitle: "Economics signals worth attention", queueDescription: "This queue does not declare accounting problems. It highlights material reversal drag, revenue concentration and amounts still moving through the provider ledger.",
    empty: "No material economics signal is visible for this period.", bookings: "Completed bookings", providerShare: "Recorded provider share", refundDrag: "Reversal drag", revenueShare: "Share of retained payable",
    pending: "Ledger pending", approved: "Ledger approved", paid: "Ledger paid", refundSignal: "High reversal drag", concentrationSignal: "Revenue concentration", settlementSignal: "Settlement in progress", settlements: "View settlements",
    notice: "This is not accounting net profit. Complete provider operating costs are not present in the current contracts; the view therefore derives only from recorded charge lines, provider payable, fees, reversals and provider-ledger state and never changes compensation or settlement rules.",
  },
  ar: {
    title: "مؤشر اقتصاد الخدمة ووضوح الإيراد", description: "اعرض كيف تتحول الخدمات المكتملة إلى مستحقات للمزود، وكيف تؤثر الانعكاسات عليها، ومدى تركز المستحق المحتفظ به بين الخدمات.",
    gross: "إجمالي التسوية", payable: "مستحق المزود", retained: "المستحق بعد الانعكاسات المطبقة", reversals: "الانعكاسات المطبقة",
    queueTitle: "إشارات اقتصادية تستحق الانتباه", queueDescription: "لا تعلن هذه القائمة عن أخطاء محاسبية؛ بل تبرز أثر الانعكاسات وتركيز الإيراد والمبالغ التي ما زالت في مسار دفتر المزود.",
    empty: "لا توجد إشارة اقتصادية جوهرية في هذه الفترة.", bookings: "حجوزات مكتملة", providerShare: "حصة المزود المسجلة", refundDrag: "أثر الانعكاس", revenueShare: "حصة المستحق المحتفظ به",
    pending: "دفتر قيد الانتظار", approved: "دفتر معتمد", paid: "دفتر مدفوع", refundSignal: "أثر انعكاس مرتفع", concentrationSignal: "تركيز الإيراد", settlementSignal: "تسوية قيد التنفيذ", settlements: "عرض التسويات",
    notice: "هذا ليس صافي ربح محاسبي. تكاليف تشغيل المزود الكاملة غير موجودة في العقود الحالية؛ لذا يعتمد العرض فقط على بنود الرسوم والمستحقات والرسوم والانعكاسات وحالة دفتر المزود ولا يغير قواعد التعويض أو التسوية.",
  },
  tr: {
    title: "Hizmet ekonomisi ve gelir netliği göstergesi", description: "Tamamlanan hizmetlerin sağlayıcı alacağına nasıl dönüştüğünü, ters kayıtların etkisini ve tutulan alacağın hizmetler arasında ne kadar yoğunlaştığını görün.",
    gross: "Uzlaşma brütü", payable: "Sağlayıcı alacağı", retained: "Uygulanan ters kayıtlardan sonra alacak", reversals: "Uygulanan ters kayıtlar",
    queueTitle: "Dikkat gerektiren ekonomi sinyalleri", queueDescription: "Bu kuyruk muhasebe hatası ilan etmez; önemli ters kayıt etkisini, gelir yoğunlaşmasını ve sağlayıcı defterinde ilerleyen tutarları vurgular.",
    empty: "Bu dönem için belirgin bir ekonomi sinyali yok.", bookings: "Tamamlanan rezervasyon", providerShare: "Kayıtlı sağlayıcı payı", refundDrag: "Ters kayıt etkisi", revenueShare: "Tutulan alacak payı",
    pending: "Defter beklemede", approved: "Defter onaylı", paid: "Defter ödendi", refundSignal: "Yüksek ters kayıt etkisi", concentrationSignal: "Gelir yoğunlaşması", settlementSignal: "Uzlaşma sürüyor", settlements: "Uzlaşmaları gör",
    notice: "Bu muhasebe net kârı değildir. Sağlayıcının tüm işletme maliyetleri mevcut sözleşmelerde yoktur; görünüm yalnızca kayıtlı charge line, sağlayıcı alacağı, ücret, ters kayıt ve defter durumundan türetilir ve tazminat/uzlaşma kurallarını değiştirmez.",
  },
  es: {
    title: "Pulso de economía del servicio y claridad de ingresos", description: "Vea cómo los servicios completados se convierten en importe pagadero al proveedor, cómo afectan las reversiones y qué tan concentrado está el importe retenido.",
    gross: "Bruto de liquidación", payable: "Pagadero al proveedor", retained: "Pagadero retenido tras reversiones aplicadas", reversals: "Reversiones aplicadas",
    queueTitle: "Señales económicas para revisar", queueDescription: "La cola no declara problemas contables; resalta arrastre por reversiones, concentración de ingresos y montos aún en el libro del proveedor.",
    empty: "No hay una señal económica material en este periodo.", bookings: "Reservas completadas", providerShare: "Participación registrada del proveedor", refundDrag: "Impacto de reversión", revenueShare: "Parte del pagadero retenido",
    pending: "Libro pendiente", approved: "Libro aprobado", paid: "Libro pagado", refundSignal: "Alto impacto de reversión", concentrationSignal: "Concentración de ingresos", settlementSignal: "Liquidación en curso", settlements: "Ver liquidaciones",
    notice: "Esto no es beneficio neto contable. Los contratos actuales no contienen todos los costes operativos del proveedor; por ello la vista deriva solo de cargos, pagaderos, comisiones, reversiones y estado del libro y no modifica reglas de compensación o liquidación.",
  },
  ku: {
    title: "نیشاندەری ئابووری خزمەتگوزاری و ڕوونی داهات", description: "ببینە خزمەتگوزارییە تەواوبووەکان چۆن دەبنە بڕی پارەی پێویست بۆ دابینکەر، گەڕاندنەوەکان چ کاریگەرییەکیان هەیە و داهات چەند لە چەند خزمەتگوزاری کۆبووەتەوە.",
    gross: "کۆی گشتی تسویه", payable: "پارەی پێویست بۆ دابینکەر", retained: "پارەی ماوە دوای گەڕاندنەوەی جێبەجێکراو", reversals: "گەڕاندنەوەی جێبەجێکراو",
    queueTitle: "سیگناڵە ئابوورییەکانی پێویستی سەرنج", queueDescription: "ئەم ڕیزە کێشەی ژمێریاری ڕاناگەیەنێت؛ تەنها کاریگەری گەڕاندنەوە، کۆبوونەوەی داهات و بڕە لە پرۆسەی تسویه‌دا نیشان دەدات.",
    empty: "لەو ماوەیەدا سیگناڵێکی ئابووری گرنگ نییە.", bookings: "حجزی تەواوبوو", providerShare: "بەشی تۆمارکراوی دابینکەر", refundDrag: "کاریگەری گەڕاندنەوە", revenueShare: "بەشی پارەی ماوە",
    pending: "لە چاوەڕوانی ledger", approved: "ledger پەسەندکراو", paid: "ledger پارەدراو", refundSignal: "کاریگەری زۆری گەڕاندنەوە", concentrationSignal: "کۆبوونەوەی داهات", settlementSignal: "تسویه لە بەردەوامیدایە", settlements: "بینینی تسویه‌کان",
    notice: "ئەمە قازانجی پاکی ژمێریاری نییە. هەموو تێچووی کارگێڕی دابینکەر لە کۆنتراکتە ئێستاکاندا نییە؛ بۆیە تەنها لە charge line و payable و fee و reversal و ledger هەژمار دەکرێت و یاساکانی جبران یان تسویه ناگۆڕێت.",
  },
  de: {
    title: "Puls für Leistungsökonomie und Umsatzklarheit", description: "Sehen Sie, wie abgeschlossene Leistungen in Anbieter-Auszahlungen übergehen, wie Rückbuchungen wirken und wie stark der einbehaltene Auszahlungsbetrag konzentriert ist.",
    gross: "Abrechnungsbrutto", payable: "Anbieter-Auszahlungsbetrag", retained: "Auszahlungsbetrag nach angewandten Rückbuchungen", reversals: "Angewandte Rückbuchungen",
    queueTitle: "Ökonomische Signale zur Prüfung", queueDescription: "Die Liste erklärt keine Buchhaltungsfehler; sie hebt Rückbuchungsbelastung, Umsatzkonzentration und noch im Anbieter-Ledger laufende Beträge hervor.",
    empty: "Für diesen Zeitraum ist kein wesentliches ökonomisches Signal sichtbar.", bookings: "Abgeschlossene Buchungen", providerShare: "Erfasster Anbieteranteil", refundDrag: "Rückbuchungsbelastung", revenueShare: "Anteil am verbleibenden Auszahlungsbetrag",
    pending: "Ledger ausstehend", approved: "Ledger freigegeben", paid: "Ledger bezahlt", refundSignal: "Hohe Rückbuchungsbelastung", concentrationSignal: "Umsatzkonzentration", settlementSignal: "Abrechnung läuft", settlements: "Abrechnungen ansehen",
    notice: "Dies ist kein buchhalterischer Nettogewinn. Vollständige Betriebskosten des Anbieters liegen in den aktuellen Verträgen nicht vor; die Ansicht nutzt nur erfasste Charge Lines, Auszahlungsbeträge, Gebühren, Rückbuchungen und Ledger-Status und ändert keine Vergütungs- oder Abrechnungsregeln.",
  },
  fr: {
    title: "Indicateur d’économie des services et de clarté des revenus", description: "Voyez comment les services terminés deviennent un montant dû au prestataire, l’effet des reprises et la concentration du montant conservé entre les services.",
    gross: "Brut de règlement", payable: "Montant dû au prestataire", retained: "Montant conservé après reprises appliquées", reversals: "Reprises appliquées",
    queueTitle: "Signaux économiques à examiner", queueDescription: "Cette file ne déclare pas d’erreur comptable ; elle met en évidence l’impact des reprises, la concentration des revenus et les montants encore en cours dans le grand livre prestataire.",
    empty: "Aucun signal économique significatif n’est visible sur cette période.", bookings: "Réservations terminées", providerShare: "Part prestataire enregistrée", refundDrag: "Impact des reprises", revenueShare: "Part du montant conservé",
    pending: "Grand livre en attente", approved: "Grand livre approuvé", paid: "Grand livre payé", refundSignal: "Impact de reprise élevé", concentrationSignal: "Concentration des revenus", settlementSignal: "Règlement en cours", settlements: "Voir les règlements",
    notice: "Il ne s’agit pas du bénéfice net comptable. Les coûts d’exploitation complets du prestataire ne figurent pas dans les contrats actuels ; la vue repose uniquement sur les lignes de frais, montants dus, commissions, reprises et états du grand livre, sans modifier les règles de compensation ou de règlement.",
  },
} as const;

export function providerEconomicsCopy(locale?: string | null) {
  return copy[normalizePortalLocale(locale).locale];
}
