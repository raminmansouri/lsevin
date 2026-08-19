import Link from "next/link";
import { Globe2, LogIn, Search, UserPlus, Wrench } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import { isLocalDevAuthEnabled, listLocalDevLoginUsers } from "@core/auth/localDevAuth";
import { safeReturnTo } from "@core/auth/sso";

const copy = {
  fa: {
    title: "ورود به پنل ارائه‌دهندگان",
    body: "با همان حساب السوین وارد شوید. اگر قبلاً در السوین وارد شده باشید، بدون ورود دوباره به پنل منتقل می‌شوید.",
    login: "ادامه با حساب السوین",
    register: "ساخت حساب جدید",
    language: "زبان",
    localTitle: "ورود محلی برای توسعه",
    localBody: "یک کاربر فعال از دیتابیس محلی انتخاب کنید. این مسیر فقط در محیط توسعه فعال است و در production قابل استفاده نیست.",
    search: "جستجوی نام، ایمیل یا شناسه کاربر",
    searchButton: "جستجو",
    chooseUser: "انتخاب کاربر",
    signInLocal: "ورود محلی",
    noUsers: "کاربر فعالی با این جستجو پیدا نشد.",
    roles: "نقش‌ها",
    memberships: "عضویت ارائه‌دهنده",
  },
  en: {
    title: "Sign in to Providers Portal",
    body: "Use the same LSevin account. If you are already signed in on LSevin, you will continue without another login.",
    login: "Continue with LSevin",
    register: "Create a new account",
    language: "Language",
    localTitle: "Local development sign-in",
    localBody: "Choose an active user from the restored local database. This path exists only in development and is disabled in production.",
    search: "Search name, email, or user ID",
    searchButton: "Search",
    chooseUser: "Choose user",
    signInLocal: "Sign in locally",
    noUsers: "No active users matched this search.",
    roles: "Roles",
    memberships: "Provider memberships",
  },
  ar: {
    title: "تسجيل الدخول إلى بوابة مقدمي الخدمات",
    body: "استخدم حساب السوین نفسه. إذا كنت مسجلاً في السوین فستتابع دون تسجيل دخول جديد.",
    login: "المتابعة بحساب السوین",
    register: "إنشاء حساب جديد",
    language: "اللغة",
    localTitle: "تسجيل دخول محلي للتطوير",
    localBody: "اختر مستخدمًا نشطًا من قاعدة البيانات المحلية. هذا المسار متاح في بيئة التطوير فقط.",
    search: "ابحث بالاسم أو البريد أو معرّف المستخدم",
    searchButton: "بحث",
    chooseUser: "اختر المستخدم",
    signInLocal: "دخول محلي",
    noUsers: "لم يتم العثور على مستخدمين نشطين.",
    roles: "الأدوار",
    memberships: "عضويات المزوّد",
  },
  tr: {
    title: "Sağlayıcı Portalına giriş",
    body: "Aynı LSevin hesabını kullanın. LSevin'de zaten oturum açtıysanız tekrar giriş yapmadan devam edersiniz.",
    login: "LSevin ile devam et",
    register: "Yeni hesap oluştur",
    language: "Dil",
    localTitle: "Yerel geliştirme girişi",
    localBody: "Yerel veritabanındaki aktif bir kullanıcıyı seçin. Bu yol yalnızca geliştirme ortamında açıktır.",
    search: "Ad, e-posta veya kullanıcı kimliği ara",
    searchButton: "Ara",
    chooseUser: "Kullanıcı seç",
    signInLocal: "Yerel giriş",
    noUsers: "Eşleşen aktif kullanıcı bulunamadı.",
    roles: "Roller",
    memberships: "Sağlayıcı üyelikleri",
  },
  es: {
    title: "Iniciar sesión en el Portal de Proveedores",
    body: "Use la misma cuenta de LSevin. Si ya inició sesión en LSevin, continuará sin volver a identificarse.",
    login: "Continuar con LSevin",
    register: "Crear una cuenta",
    language: "Idioma",
    localTitle: "Inicio de sesión local de desarrollo",
    localBody: "Elija un usuario activo de la base local restaurada. Esta vía solo existe en desarrollo.",
    search: "Buscar nombre, correo o ID de usuario",
    searchButton: "Buscar",
    chooseUser: "Elegir usuario",
    signInLocal: "Entrar localmente",
    noUsers: "No se encontraron usuarios activos.",
    roles: "Roles",
    memberships: "Membresías de proveedor",
  },
  ku: {
    title: "چوونەژوورەوە بۆ پۆرتاڵی دابینکەران",
    body: "هەمان هەژماری LSevin بەکاربهێنە. ئەگەر پێشتر چوویتە ژوورەوە، بەبێ چوونەژوورەوەی دووبارە بەردەوام دەبیت.",
    login: "بە LSevin بەردەوام بە",
    register: "هەژماری نوێ دروست بکە",
    language: "زمان",
    localTitle: "چوونەژوورەوەی ناوخۆیی بۆ گەشەپێدان",
    localBody: "بەکارهێنەرێکی چالاک لە بنکەدراوەی ناوخۆ هەڵبژێرە. ئەم ڕێگایە تەنها لە development چالاکە.",
    search: "گەڕان بە ناو، ئیمەیڵ یان ناسنامە",
    searchButton: "گەڕان",
    chooseUser: "بەکارهێنەر هەڵبژێرە",
    signInLocal: "چوونەژوورەوەی ناوخۆیی",
    noUsers: "بەکارهێنەری چالاک نەدۆزرایەوە.",
    roles: "ڕۆڵەکان",
    memberships: "ئەندامێتی پێشکەشکار",
  },
  de: {
    title: "Beim Anbieterportal anmelden",
    body: "Verwenden Sie dasselbe LSevin-Konto. Wenn Sie bereits bei LSevin angemeldet sind, geht es ohne erneute Anmeldung weiter.",
    login: "Mit LSevin fortfahren",
    register: "Neues Konto erstellen",
    language: "Sprache",
    localTitle: "Lokale Entwicklungsanmeldung",
    localBody: "Wählen Sie einen aktiven Benutzer aus der lokalen Datenbank. Dieser Weg ist nur in der Entwicklung verfügbar.",
    search: "Name, E-Mail oder Benutzer-ID suchen",
    searchButton: "Suchen",
    chooseUser: "Benutzer auswählen",
    signInLocal: "Lokal anmelden",
    noUsers: "Keine aktiven Benutzer gefunden.",
    roles: "Rollen",
    memberships: "Anbieter-Mitgliedschaften",
  },
  fr: {
    title: "Connexion au portail des prestataires",
    body: "Utilisez le même compte LSevin. Si vous êtes déjà connecté à LSevin, vous continuerez sans nouvelle connexion.",
    login: "Continuer avec LSevin",
    register: "Créer un compte",
    language: "Langue",
    localTitle: "Connexion locale de développement",
    localBody: "Choisissez un utilisateur actif dans la base locale restaurée. Cette voie est disponible uniquement en développement.",
    search: "Rechercher un nom, e-mail ou ID utilisateur",
    searchButton: "Rechercher",
    chooseUser: "Choisir l’utilisateur",
    signInLocal: "Connexion locale",
    noUsers: "Aucun utilisateur actif trouvé.",
    roles: "Rôles",
    memberships: "Adhésions prestataire",
  },
} as const;

export async function AuthEntryPage({ mode, returnTo, query }: { mode: "signin" | "signup"; returnTo?: string; query?: string }) {
  const locale = await getPortalLocale();
  const t = copy[locale.locale];
  const safeReturn = safeReturnTo(returnTo);
  const encodedReturn = encodeURIComponent(safeReturn);
  const localAuth = isLocalDevAuthEnabled();
  const localUsers = localAuth ? await listLocalDevLoginUsers(query || "") : [];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-950">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white">LS</div>
          <LocaleSwitcher currentLocale={locale.locale} label={t.language} />
        </div>

        {localAuth ? (
          <>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
              <Wrench size={14} /> LOCAL DEVELOPMENT
            </div>
            <h1 className="mt-3 text-3xl font-black">{t.localTitle}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t.localBody}</p>

            <form method="get" action="/login" className="mt-6 flex gap-2">
              <input type="hidden" name="returnTo" value={safeReturn} />
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="q"
                  defaultValue={query || ""}
                  placeholder={t.search}
                  className="w-full rounded-xl border border-slate-200 py-3 pe-3 ps-10 text-sm outline-none focus:border-emerald-700"
                />
              </label>
              <button type="submit" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold hover:bg-slate-50">{t.searchButton}</button>
            </form>

            {localUsers.length ? (
              <form method="post" action="/api/auth/local/login" className="mt-4 space-y-4">
                <input type="hidden" name="returnTo" value={safeReturn} />
                <div>
                  <label htmlFor="local-user" className="mb-2 block text-sm font-bold">{t.chooseUser}</label>
                  <select id="local-user" name="userId" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-700">
                    {localUsers.map((user) => {
                      const detail = [user.email, user.roles, user.providerMemberships ? `${t.memberships}: ${user.providerMemberships}` : ""].filter(Boolean).join(" · ");
                      return <option key={user.id} value={user.id}>{user.fullName}{detail ? ` — ${detail}` : ""}</option>;
                    })}
                  </select>
                </div>
                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white">
                  <LogIn size={17} /> {t.signInLocal}
                </button>
                <p className="text-xs text-slate-500">{t.roles}: {localUsers.filter((user) => user.roles).slice(0, 4).map((user) => `${user.fullName}: ${user.roles}`).join(" · ") || "—"}</p>
              </form>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{t.noUsers}</div>
            )}
          </>
        ) : (
          <>
            <div className="mt-7 flex items-center gap-2 text-sm font-bold text-emerald-800"><Globe2 size={17} /> LSevin</div>
            <h1 className="mt-2 text-3xl font-black">{t.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t.body}</p>
            <div className="mt-7 grid gap-3">
              <Link href={`/api/auth/start?mode=${mode}&returnTo=${encodedReturn}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white"><LogIn size={17} /> {mode === "signin" ? t.login : t.register}</Link>
              {mode === "signin" ? <Link href={`/register?returnTo=${encodedReturn}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold"><UserPlus size={17} /> {t.register}</Link> : <Link href={`/login?returnTo=${encodedReturn}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold"><LogIn size={17} /> {t.login}</Link>}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
