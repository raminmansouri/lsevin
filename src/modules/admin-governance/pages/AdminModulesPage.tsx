import {
  Boxes,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  KeyRound,
  Layers3,
  Route,
  Search,
  ShieldAlert,
  ToggleLeft,
  UsersRound,
  Workflow,
} from "lucide-react";
import type { ModulePageProps } from "@core/modules/types";
import { listModuleRuntimeCatalog, type ModuleRuntimeCatalogItem, type ModuleRuntimePageItem } from "@core/modules/state";
import { getPortalLocale } from "@core/i18n/server";
import { translateUiText } from "@core/i18n/uiText";
import {
  localizeModuleCategory,
  localizeModuleDescription,
  localizeModuleName,
  localizeModuleRouteDescription,
  localizeModuleRouteTitle,
  localizeModuleScope,
} from "@core/modules/catalogText";
import { Badge } from "@core/ui/Badge";
import { Button, LinkButton } from "@core/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@core/ui/Card";
import { Input, Select } from "@core/ui/Field";
import { PageHeader } from "@core/ui/PageHeader";
import { StatCard } from "@core/ui/StatCard";
import { UiText } from "@core/ui/UiText";
import { formatDateTime, formatNumber } from "@core/lib/format";
import { setModuleStateAction } from "../actions";

function read(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function humanizeTechnicalValue(value: string) {
  const part = value.split(".").at(-1) || value;
  return part.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function AdminModulesPage({ searchParams }: ModulePageProps) {
  const portalLocale = await getPortalLocale();
  const query = read(searchParams.q).trim().toLowerCase();
  const status = read(searchParams.status);
  const category = read(searchParams.category);
  const modules = await listModuleRuntimeCatalog();
  const categories = [...new Set(modules.map((module) => module.category))].sort();
  const filtered = modules.filter((module) => {
    const localizedName = localizeModuleName(module.id, module.name, portalLocale.header);
    const routeText = module.pages.map((page) => `${page.title} ${page.path} ${page.key}`).join(" ");
    const capabilityText = module.capabilities.join(" ");
    const matchesQuery = !query || `${module.name} ${localizedName} ${module.id} ${module.description} ${module.databaseSchema ?? ""} ${routeText} ${capabilityText}`.toLowerCase().includes(query);
    const matchesStatus = !status || (status === "enabled" ? module.enabled : !module.enabled);
    const matchesCategory = !category || module.category === category;
    return matchesQuery && matchesStatus && matchesCategory;
  });
  const enabledCount = modules.filter((module) => module.enabled).length;
  const disabledCount = modules.length - enabledCount;
  const protectedCount = modules.filter((module) => module.protected).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module management"
        description="Review every registered Providers Portal module, see its purpose and complete page inventory, and enable or disable it without deleting code, data or migrations."
        action={<LinkButton href="/admin/audit" variant="secondary"><UiText text="Audit center" /></LinkButton>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Registered modules" value={modules.length} />
        <StatCard icon={CheckCircle2} label="Enabled modules" value={enabledCount} />
        <StatCard icon={ToggleLeft} label="Disabled modules" value={disabledCount} />
        <StatCard icon={ShieldAlert} label="Protected modules" value={protectedCount} />
      </div>

      <Card>
        <CardContent>
          <form action="/admin/modules" method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" />
              <Input name="q" defaultValue={read(searchParams.q)} className="pl-9" placeholder="Search module, page, route, schema or description" />
            </div>
            <Select name="status" defaultValue={status}>
              <option value="">{translateUiText("All states", portalLocale.header)}</option>
              <option value="enabled">{translateUiText("Enabled", portalLocale.header)}</option>
              <option value="disabled">{translateUiText("Disabled", portalLocale.header)}</option>
            </Select>
            <Select name="category" defaultValue={category}>
              <option value="">{translateUiText("All categories", portalLocale.header)}</option>
              {categories.map((item) => <option key={item} value={item}>{localizeModuleCategory(item, portalLocale.header)}</option>)}
            </Select>
            <Button type="submit"><UiText text="Filter" /></Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {filtered.map((module) => {
          const localizedName = localizeModuleName(module.id, module.name, portalLocale.header);
          const localizedDescription = localizeModuleDescription(module.id, module.description, portalLocale.header);
          return (
            <Card key={module.id} className={!module.enabled ? "border-amber-300 bg-amber-50/30" : undefined}>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{localizedName}</CardTitle>
                      <Badge variant={module.enabled ? "success" : "warning"}><UiText text={module.enabled ? "Enabled" : "Disabled"} /></Badge>
                      <Badge variant="neutral">{localizeModuleCategory(module.category, portalLocale.header)}</Badge>
                      {module.protected ? <Badge variant="danger"><UiText text="Protected" /></Badge> : null}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground" data-no-auto-translate>{module.id} · v{module.version}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1"><Route size={13} /> {formatNumber(module.routeCount, portalLocale.header)} <UiText text="pages" /></span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1"><Route size={13} /> {formatNumber(module.apiRouteCount, portalLocale.header)} <UiText text="API routes" /></span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1"><Database size={13} /> <UiText text={module.databaseSchema ? "Dedicated database schema" : "Shared database schema"} /></span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <ModuleOverview module={module} localizedDescription={localizedDescription} locale={portalLocale.header} />
                {module.disabledByReleaseSafety ? (
                  <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4" data-release-safety-disabled={module.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <ShieldAlert size={18} className="text-amber-700" />
                      <div className="font-bold text-amber-950"><UiText text="Disabled by release safety policy" /></div>
                      <Badge variant="warning"><UiText text={module.releaseSafetyIssue === "placeholder_admin_context" ? "Incomplete administration workflow" : "Missing or incomplete LSevin frontend"} /></Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-900"><UiText text={module.releaseSafetyNote || "This module is disabled until its incomplete workflow is corrected and verified."} /></p>
                    <p className="mt-2 text-xs leading-5 text-amber-800"><UiText text="A SUPERADMIN may enable it from this page for controlled development or testing, but it should remain disabled in production until the blocking issue is resolved." /></p>
                  </div>
                ) : null}
                <ModulePages module={module} locale={portalLocale.header} />
                <ModuleApiRoutes module={module} locale={portalLocale.header} />

                {module.protected ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <UiText text="This recovery module is always enabled so administrators cannot lock themselves out of module management." />
                  </div>
                ) : (
                  <form action={setModuleStateAction} className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-slate-50/70 p-4 sm:flex-row sm:items-center">
                    <input type="hidden" name="moduleId" value={module.id} />
                    <input type="hidden" name="enabled" value={module.enabled ? "false" : "true"} />
                    <div>
                      <div className="text-sm font-semibold text-slate-900"><UiText text={module.enabled ? "Disable this module" : "Enable this module"} /></div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        <UiText text="The change applies to navigation, pages and API routes. The administrator and change time are recorded automatically." />
                      </p>
                    </div>
                    <Button type="submit" variant={module.enabled ? "danger" : "primary"}>
                      {module.enabled ? <UiText text="Disable module" /> : <UiText text="Enable module" />}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!filtered.length ? (
        <Card><CardContent><p className="text-sm text-muted-foreground"><UiText text="No modules match the selected filters." /></p></CardContent></Card>
      ) : null}
    </div>
  );
}

function ModuleOverview({ module, localizedDescription, locale }: { module: ModuleRuntimeCatalogItem; localizedDescription: string; locale: string }) {
  const workflowTitles = module.pages.slice(0, 6).map((page, index) => localizeModuleRouteTitle({ moduleId: module.id, moduleName: module.name, route: page, index, locale }));
  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4" data-module-overview={module.id}>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-950"><Layers3 size={16} /><UiText text="Detailed module overview" /></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <OverviewBlock icon={Workflow} title="What this module does">
          <p className="text-sm leading-6 text-slate-700">{localizedDescription}</p>
        </OverviewBlock>
        <OverviewBlock icon={UsersRound} title="Who uses this module">
          <div className="flex flex-wrap gap-2">
            {module.scopes.map((scope) => <Badge key={scope} variant={scope === "admin" ? "danger" : scope === "provider" ? "brand" : scope === "public" ? "success" : "neutral"}>{localizeModuleScope(scope, locale)}</Badge>)}
          </div>
        </OverviewBlock>
        <OverviewBlock icon={FileText} title="Main workflows">
          {workflowTitles.length ? <ul className="space-y-1.5 text-sm text-slate-700">{workflowTitles.map((title) => <li key={title} className="flex gap-2"><span aria-hidden>•</span><span>{title}</span></li>)}</ul> : <p className="text-sm text-muted-foreground"><UiText text="No page workflows are registered." /></p>}
        </OverviewBlock>
        <OverviewBlock icon={Database} title="Architecture and data">
          <dl className="space-y-2 text-xs">
            <OverviewDetail label="Database schema" value={module.databaseSchema || translateUiText("Shared database schema", locale)} technical={Boolean(module.databaseSchema)} />
            <OverviewDetail label="Migrations" value={formatNumber(module.migrationCount, locale)} />
            <OverviewDetail label="Capabilities" value={formatNumber(module.capabilityCount, locale)} />
            <OverviewDetail label="Install mode" value={translateUiText(module.installMode === "required" ? "Required" : "Optional", locale)} />
            <OverviewDetail label="Last state change" value={module.updatedAt ? formatDateTime(module.updatedAt, locale) : translateUiText(module.disabledByReleaseSafety ? "Default disabled by release safety" : "Default enabled state", locale)} />
            {module.updatedByName ? <OverviewDetail label="Changed by" value={module.updatedByName} /> : null}
          </dl>
        </OverviewBlock>
      </div>
      {module.capabilities.length ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground"><UiText text="Capabilities provided" /></div>
          <div className="mt-2 flex flex-wrap gap-2">
            {module.capabilities.map((capability) => <span key={capability} title={capability}><Badge variant="neutral"><span data-no-auto-translate>{humanizeTechnicalValue(capability)}</span></Badge></span>)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function OverviewBlock({ icon: Icon, title, children }: { icon: typeof Workflow; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Icon size={14} /><UiText text={title} /></div>
      {children}
    </div>
  );
}

function OverviewDetail({ label, value, technical = false }: { label: string; value: React.ReactNode; technical?: boolean }) {
  return <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground"><UiText text={label} /></dt><dd className="text-right font-semibold text-slate-800" {...(technical ? { "data-no-auto-translate": true } : {})}>{value}</dd></div>;
}

function ModulePages({ module, locale }: { module: ModuleRuntimeCatalogItem; locale: string }) {
  return (
    <section className="rounded-xl border-2 border-emerald-100 bg-emerald-50/30" data-module-pages={module.id} data-module-page-count={module.pages.length}>
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-4 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-950"><FileText size={16} /><UiText text="Pages in this module" /></div>
          <p className="mt-1 text-xs text-muted-foreground"><UiText text="All registered pages are shown below. Static pages can be opened directly; dynamic pages show the values required in their route." /></p>
        </div>
        <Badge variant="brand">{formatNumber(module.pages.length, locale)}</Badge>
      </div>
      {module.pages.length ? (
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {module.pages.map((page, index) => <ModulePageCard key={page.key} module={module} page={page} index={index} locale={locale} />)}
        </div>
      ) : (
        <p className="p-4 text-sm text-muted-foreground"><UiText text="No page routes are registered for this module." /></p>
      )}
    </section>
  );
}

function ModulePageCard({ module, page, index, locale }: { module: ModuleRuntimeCatalogItem; page: ModuleRuntimePageItem; index: number; locale: string }) {
  const title = localizeModuleRouteTitle({ moduleId: module.id, moduleName: module.name, route: page, index, locale });
  const description = localizeModuleRouteDescription({ moduleId: module.id, moduleName: module.name, route: page, locale });
  return (
    <article className="flex min-h-52 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-module-page={page.key}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-950">{title}</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground" data-no-auto-translate>{page.key}</div>
        </div>
        <Badge variant={page.scope === "admin" ? "danger" : page.scope === "provider" ? "brand" : page.scope === "public" ? "success" : "neutral"}>{localizeModuleScope(page.scope, locale)}</Badge>
      </div>
      <p className="mt-3 flex-1 text-xs leading-5 text-muted-foreground">{description}</p>
      <code className="mt-3 block overflow-x-auto rounded bg-slate-950 px-3 py-2 text-[11px] text-slate-100" data-no-auto-translate>{page.path}</code>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {page.permission ? <Badge variant="neutral"><KeyRound size={11} className="mr-1" /><span data-no-auto-translate>{page.permission}</span></Badge> : <Badge variant="success"><UiText text="No explicit permission required" /></Badge>}
        {!module.enabled ? (
          <Badge variant="warning"><UiText text="Module disabled" /></Badge>
        ) : page.dynamicParameters.length ? (
          <>
            <Badge variant="warning"><UiText text="Dynamic page" /></Badge>
            {page.dynamicParameters.map((parameter) => <Badge key={parameter} variant="neutral"><UiText text="Required parameter" />: <span className="ml-1 font-mono" data-no-auto-translate>{parameter}</span></Badge>)}
          </>
        ) : page.href ? (
          <LinkButton href={page.href} variant="secondary" size="sm"><ExternalLink size={13} /><UiText text="Open page" /></LinkButton>
        ) : null}
      </div>
    </article>
  );
}

function ModuleApiRoutes({ module, locale }: { module: ModuleRuntimeCatalogItem; locale: string }) {
  if (!module.apiRoutes.length) return null;
  return (
    <details className="rounded-lg border border-border bg-slate-50/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-900">
        <span className="inline-flex items-center gap-2"><Route size={16} /><UiText text="API routes" /></span>
        <Badge variant="neutral">{formatNumber(module.apiRoutes.length, locale)}</Badge>
      </summary>
      <div className="divide-y divide-border border-t border-border">
        {module.apiRoutes.map((api) => (
          <div key={api.key} className="grid gap-2 px-4 py-3 text-xs lg:grid-cols-[80px_1fr_auto] lg:items-center">
            <Badge variant="brand">{api.method}</Badge>
            <div className="min-w-0">
              <code className="block overflow-x-auto rounded bg-slate-950 px-2 py-1.5 text-[11px] text-slate-100" data-no-auto-translate>{api.path}</code>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground" data-no-auto-translate>{api.key}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {api.public ? <Badge variant="success"><UiText text="Public API" /></Badge> : null}
              {api.permission ? <Badge variant="neutral"><KeyRound size={11} className="mr-1" /><span data-no-auto-translate>{api.permission}</span></Badge> : null}
              {api.dynamicParameters.length ? <Badge variant="warning"><UiText text="Requires route parameters" /></Badge> : null}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
