import type { PortalLocale } from "@core/i18n/config";

export type ApprovalMessageKey =
  | "migrationRequired"
  | "locationRequired"
  | "countryInvalid"
  | "cityInvalid"
  | "providerTypeMismatch"
  | "fieldTooLong"
  | "referenceMissing"
  | "applicationMissing"
  | "providerMissing"
  | "providerRequired"
  | "providerTypeMissing"
  | "approvalFailed";

const messages: Record<PortalLocale, Record<ApprovalMessageKey, string>> = {
  en: {
    migrationRequired: "The onboarding administration migration is missing. Run the database migration container successfully, then retry approval.",
    locationRequired: "Country and city are required when creating a provider. Select them from the LSevin location catalog.",
    countryInvalid: "The country was not found in the LSevin location catalog. Select a valid country.",
    cityInvalid: "The city was not found under the selected country. Select a valid city.",
    providerTypeMismatch: "The selected existing provider has a different provider type. Choose a matching provider or create a new one.",
    fieldTooLong: "One of the provider contact or location values exceeds the LSevin database limit. Shorten the value and retry.",
    referenceMissing: "A referenced user, provider type, location, or provider no longer exists. Reload the application and repair the missing reference before approval.",
    applicationMissing: "The application no longer exists.",
    providerMissing: "The selected provider no longer exists.",
    providerRequired: "Choose an existing provider before using attach mode.",
    providerTypeMissing: "The application references a missing provider type and cannot be approved.",
    approvalFailed: "Approval failed. Check the server terminal for the database error, make sure the migration container completed successfully, and retry.",
  },
  fa: {
    migrationRequired: "مهاجرت بخش مدیریت ورود ارائه‌دهندگان اجرا نشده است. کانتینر مهاجرت پایگاه‌داده را با موفقیت اجرا کنید و سپس دوباره تأیید را انجام دهید.",
    locationRequired: "برای ساخت ارائه‌دهنده، انتخاب کشور و شهر الزامی است. آن‌ها را از فهرست مکان‌های السوین انتخاب کنید.",
    countryInvalid: "کشور انتخاب‌شده در فهرست مکان‌های السوین یافت نشد. یک کشور معتبر انتخاب کنید.",
    cityInvalid: "شهر انتخاب‌شده زیرمجموعه کشور انتخابی نیست یا یافت نشد. یک شهر معتبر انتخاب کنید.",
    providerTypeMismatch: "نوع ارائه‌دهنده پروفایل موجود با درخواست متفاوت است. یک ارائه‌دهنده هم‌نوع انتخاب کنید یا ارائه‌دهنده جدید بسازید.",
    fieldTooLong: "یکی از مقادیر تماس یا مکان از محدودیت پایگاه‌داده السوین طولانی‌تر است. مقدار را کوتاه کنید و دوباره تلاش کنید.",
    referenceMissing: "یکی از ارجاعات کاربر، نوع ارائه‌دهنده، مکان یا ارائه‌دهنده دیگر وجود ندارد. درخواست را تازه‌سازی و ارجاع ناموجود را پیش از تأیید اصلاح کنید.",
    applicationMissing: "این درخواست دیگر وجود ندارد.",
    providerMissing: "ارائه‌دهنده انتخاب‌شده دیگر وجود ندارد.",
    providerRequired: "پیش از استفاده از حالت اتصال، یک ارائه‌دهنده موجود انتخاب کنید.",
    providerTypeMissing: "درخواست به نوع ارائه‌دهنده ناموجود ارجاع دارد و قابل تأیید نیست.",
    approvalFailed: "تأیید انجام نشد. خطای پایگاه‌داده را در ترمینال سرور بررسی کنید، مطمئن شوید کانتینر مهاجرت با موفقیت تمام شده است و دوباره تلاش کنید.",
  },
  ar: {
    migrationRequired: "ترحيل إدارة الانضمام مفقود. شغّل حاوية ترحيل قاعدة البيانات بنجاح ثم أعد محاولة الموافقة.",
    locationRequired: "يجب اختيار الدولة والمدينة عند إنشاء مزوّد. اخترهما من دليل مواقع LSevin.",
    countryInvalid: "لم يتم العثور على الدولة في دليل مواقع LSevin. اختر دولة صالحة.",
    cityInvalid: "لم يتم العثور على المدينة ضمن الدولة المحددة. اختر مدينة صالحة.",
    providerTypeMismatch: "نوع المزوّد المحدد يختلف عن نوع الطلب. اختر مزوّدًا مطابقًا أو أنشئ مزوّدًا جديدًا.",
    fieldTooLong: "إحدى قيم التواصل أو الموقع تتجاوز حد قاعدة بيانات LSevin. اختصر القيمة ثم أعد المحاولة.",
    referenceMissing: "لم يعد المستخدم أو نوع المزوّد أو الموقع أو المزوّد المشار إليه موجودًا. أعد تحميل الطلب وأصلح المرجع المفقود قبل الموافقة.",
    applicationMissing: "لم يعد الطلب موجودًا.",
    providerMissing: "لم يعد المزوّد المحدد موجودًا.",
    providerRequired: "اختر مزوّدًا قائمًا قبل استخدام وضع الربط.",
    providerTypeMissing: "يشير الطلب إلى نوع مزوّد مفقود ولا يمكن الموافقة عليه.",
    approvalFailed: "فشلت الموافقة. تحقق من خطأ قاعدة البيانات في طرفية الخادم، وتأكد من اكتمال حاوية الترحيل بنجاح ثم أعد المحاولة.",
  },
  tr: {
    migrationRequired: "Katılım yönetimi geçişi eksik. Veritabanı migration containerını başarıyla çalıştırın ve onayı yeniden deneyin.",
    locationRequired: "Sağlayıcı oluştururken ülke ve şehir zorunludur. Bunları LSevin konum kataloğundan seçin.",
    countryInvalid: "Ülke LSevin konum kataloğunda bulunamadı. Geçerli bir ülke seçin.",
    cityInvalid: "Şehir seçilen ülke altında bulunamadı. Geçerli bir şehir seçin.",
    providerTypeMismatch: "Seçilen mevcut sağlayıcının türü farklı. Eşleşen bir sağlayıcı seçin veya yeni bir sağlayıcı oluşturun.",
    fieldTooLong: "Sağlayıcı iletişim veya konum değerlerinden biri LSevin veritabanı sınırını aşıyor. Değeri kısaltıp yeniden deneyin.",
    referenceMissing: "Başvurunun bağlı olduğu kullanıcı, sağlayıcı türü, konum veya sağlayıcı artık mevcut değil. Başvuruyu yenileyin ve onaydan önce eksik referansı düzeltin.",
    applicationMissing: "Başvuru artık mevcut değil.",
    providerMissing: "Seçilen sağlayıcı artık mevcut değil.",
    providerRequired: "Bağlama modunu kullanmadan önce mevcut bir sağlayıcı seçin.",
    providerTypeMissing: "Başvuru eksik bir sağlayıcı türüne bağlı ve onaylanamaz.",
    approvalFailed: "Onay başarısız oldu. Sunucu terminalindeki veritabanı hatasını kontrol edin, migration containerının başarıyla tamamlandığından emin olun ve yeniden deneyin.",
  },
  es: {
    migrationRequired: "Falta la migración de administración de incorporación. Ejecuta correctamente el contenedor de migración de la base de datos y vuelve a intentar la aprobación.",
    locationRequired: "El país y la ciudad son obligatorios al crear un proveedor. Selecciónalos en el catálogo de ubicaciones de LSevin.",
    countryInvalid: "El país no se encontró en el catálogo de ubicaciones de LSevin. Selecciona un país válido.",
    cityInvalid: "La ciudad no se encontró dentro del país seleccionado. Selecciona una ciudad válida.",
    providerTypeMismatch: "El proveedor existente seleccionado tiene otro tipo. Elige uno coincidente o crea un proveedor nuevo.",
    fieldTooLong: "Uno de los valores de contacto o ubicación supera el límite de la base de datos de LSevin. Acórtalo y vuelve a intentarlo.",
    referenceMissing: "Un usuario, tipo de proveedor, ubicación o proveedor referenciado ya no existe. Recarga la solicitud y corrige la referencia antes de aprobar.",
    applicationMissing: "La solicitud ya no existe.",
    providerMissing: "El proveedor seleccionado ya no existe.",
    providerRequired: "Selecciona un proveedor existente antes de usar el modo de vinculación.",
    providerTypeMissing: "La solicitud hace referencia a un tipo de proveedor ausente y no puede aprobarse.",
    approvalFailed: "La aprobación falló. Revisa el error de base de datos en la terminal del servidor, asegúrate de que el contenedor de migración haya terminado correctamente y vuelve a intentarlo.",
  },
  ku: {
    migrationRequired: "کۆچکردنی بەڕێوەبردنی پەیوەستبوون جێبەجێ نەکراوە. کۆنتەینەری کۆچکردنی بنکەدراوە بە سەرکەوتوویی جێبەجێ بکە و دووبارە پەسەندکردن هەوڵ بدە.",
    locationRequired: "لە کاتی دروستکردنی دابینکەر، وڵات و شار پێویستن. لە کاتەلۆگی شوێنی LSevin هەڵیان بژێرە.",
    countryInvalid: "وڵاتەکە لە کاتەلۆگی شوێنی LSevin نەدۆزرایەوە. وڵاتێکی دروست هەڵبژێرە.",
    cityInvalid: "شارەکە لە ژێر وڵاتی هەڵبژێردراو نەدۆزرایەوە. شارێکی دروست هەڵبژێرە.",
    providerTypeMismatch: "جۆری دابینکەری هەبووی هەڵبژێردراو جیاوازە. دابینکەرێکی هاوتا هەڵبژێرە یان نوێیەک دروست بکە.",
    fieldTooLong: "یەکێک لە نرخەکانی پەیوەندی یان شوێن سنووری بنکەدراوەی LSevin تێپەڕاندووە. کورتی بکەوە و دووبارە هەوڵ بدە.",
    referenceMissing: "بەکارهێنەر، جۆری دابینکەر، شوێن یان دابینکەری ئاماژەپێکراو چیتر بوونی نییە. داواکاری نوێ بکەرەوە و پێش پەسەندکردن ئاماژەی ون چاک بکەرەوە.",
    applicationMissing: "داواکارییەکە چیتر بوونی نییە.",
    providerMissing: "دابینکەری هەڵبژێردراو چیتر بوونی نییە.",
    providerRequired: "پێش بەکارهێنانی دۆخی بەستنەوە، دابینکەرێکی هەبوو هەڵبژێرە.",
    providerTypeMissing: "داواکارییەکە ئاماژە بە جۆری دابینکەری ون دەکات و ناتوانرێت پەسەند بکرێت.",
    approvalFailed: "پەسەندکردن سەرکەوتوو نەبوو. هەڵەی بنکەدراوە لە تێرمیناڵی سێرڤەر بپشکنە، دڵنیابە کۆنتەینەری کۆچکردن بە سەرکەوتوویی تەواو بووە و دووبارە هەوڵ بدە.",
  },
  de: {
    migrationRequired: "Die Onboarding-Administrationsmigration fehlt. Führen Sie den Datenbank-Migrationscontainer erfolgreich aus und versuchen Sie die Genehmigung erneut.",
    locationRequired: "Land und Stadt sind beim Erstellen eines Anbieters erforderlich. Wählen Sie beide aus dem LSevin-Standortkatalog aus.",
    countryInvalid: "Das Land wurde im LSevin-Standortkatalog nicht gefunden. Wählen Sie ein gültiges Land.",
    cityInvalid: "Die Stadt wurde unter dem ausgewählten Land nicht gefunden. Wählen Sie eine gültige Stadt.",
    providerTypeMismatch: "Der ausgewählte bestehende Anbieter hat einen anderen Anbietertyp. Wählen Sie einen passenden Anbieter oder erstellen Sie einen neuen.",
    fieldTooLong: "Ein Kontakt- oder Standortwert überschreitet das Limit der LSevin-Datenbank. Kürzen Sie den Wert und versuchen Sie es erneut.",
    referenceMissing: "Ein referenzierter Benutzer, Anbietertyp, Standort oder Anbieter existiert nicht mehr. Laden Sie den Antrag neu und reparieren Sie die fehlende Referenz vor der Genehmigung.",
    applicationMissing: "Der Antrag existiert nicht mehr.",
    providerMissing: "Der ausgewählte Anbieter existiert nicht mehr.",
    providerRequired: "Wählen Sie einen bestehenden Anbieter, bevor Sie den Verknüpfungsmodus verwenden.",
    providerTypeMissing: "Der Antrag verweist auf einen fehlenden Anbietertyp und kann nicht genehmigt werden.",
    approvalFailed: "Die Genehmigung ist fehlgeschlagen. Prüfen Sie den Datenbankfehler im Serverterminal, stellen Sie sicher, dass der Migrationscontainer erfolgreich abgeschlossen wurde, und versuchen Sie es erneut.",
  },
  fr: {
    migrationRequired: "La migration d’administration de l’intégration est absente. Exécutez avec succès le conteneur de migration de la base de données, puis réessayez l’approbation.",
    locationRequired: "Le pays et la ville sont obligatoires lors de la création d’un prestataire. Sélectionnez-les dans le catalogue de lieux LSevin.",
    countryInvalid: "Le pays n’a pas été trouvé dans le catalogue de lieux LSevin. Sélectionnez un pays valide.",
    cityInvalid: "La ville n’a pas été trouvée sous le pays sélectionné. Sélectionnez une ville valide.",
    providerTypeMismatch: "Le prestataire existant sélectionné a un autre type. Choisissez un prestataire correspondant ou créez-en un nouveau.",
    fieldTooLong: "Une valeur de contact ou de localisation dépasse la limite de la base LSevin. Raccourcissez-la puis réessayez.",
    referenceMissing: "Un utilisateur, type de prestataire, lieu ou prestataire référencé n’existe plus. Rechargez la demande et réparez la référence avant approbation.",
    applicationMissing: "La demande n’existe plus.",
    providerMissing: "Le prestataire sélectionné n’existe plus.",
    providerRequired: "Sélectionnez un prestataire existant avant d’utiliser le mode de rattachement.",
    providerTypeMissing: "La demande référence un type de prestataire manquant et ne peut pas être approuvée.",
    approvalFailed: "L’approbation a échoué. Consultez l’erreur de base de données dans le terminal du serveur, vérifiez que le conteneur de migration s’est terminé correctement, puis réessayez.",
  },
};

export function onboardingApprovalMessage(locale: PortalLocale, key: ApprovalMessageKey) {
  return messages[locale][key];
}
