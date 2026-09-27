import { Link } from 'wouter';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { ArrowUpRight, CheckCircle2, Clock3, PackageCheck, Plus, Scale, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, EmptyState, LoadingBlock } from '@/components/data-states';
import { categoryLabels, formatDate, formatQuantity, statusLabels, statusStyles } from '@/lib/ecored';

export default function DashboardPage({ user }: { user: User }) {
  const summary = useGetDashboardSummary();
  if (summary.isLoading) return <LoadingBlock label="Preparando tu resumen" />;
  if (summary.isError || !summary.data) return <ErrorState onRetry={() => summary.refetch()} />;
  const data = summary.data;
  const isOrganization = user.role === 'organization';
  const isAdmin = user.role === 'admin';
  const stats = [
    { label: isOrganization ? 'Donaciones recibidas' : 'Total de donaciones', value: data.donationCount, icon: PackageCheck, tone: 'bg-primary/10 text-primary' },
    { label: 'En revisión', value: data.pendingCount, icon: Clock3, tone: 'bg-amber-100 text-amber-800' },
    { label: 'Aceptadas', value: data.approvedCount, icon: CheckCircle2, tone: 'bg-sky-100 text-sky-800' },
    { label: 'Entregadas', value: data.deliveredCount, icon: Scale, tone: 'bg-emerald-100 text-emerald-800' },
  ];
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">{isOrganization ? 'Recepción de materiales' : isAdmin ? 'Control de la red' : 'Tu impacto, en movimiento'}</p>
        <h1 className="page-title mt-2">{isOrganization ? 'Resumen de recepción' : isAdmin ? 'Resumen general' : 'Resumen general'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOrganization
            ? 'Consulta las donaciones dirigidas a tu organización y confirma las entregas recibidas.'
            : isAdmin
              ? 'Consulta la actividad registrada en EcoRed.'
              : 'Una vista clara de lo que has puesto en circulación.'}
        </p>
      </div>
      <Link
        href={isOrganization ? '/donations' : isAdmin ? '/admin/review' : '/donations/new'}
        data-testid={isOrganization ? 'link-dashboard-inbox' : isAdmin ? 'link-dashboard-review' : 'link-dashboard-new'}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        {isOrganization
          ? <><PackageCheck className="h-4 w-4" /> Revisar donaciones recibidas</>
          : isAdmin
            ? <><ArrowUpRight className="h-4 w-4" /> Revisar registros</>
            : <><Plus className="h-4 w-4" /> Registrar donación</>}
      </Link>
    </div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon, tone }) => <Card key={label} data-testid={`card-stat-${label.toLowerCase().replaceAll(' ', '-')}`} className="overflow-hidden"><CardContent className="flex items-center gap-4 p-5"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-2xl font-bold tracking-[-0.04em]" data-testid={`text-stat-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p></div></CardContent></Card>)}</section>
    <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>{isOrganization ? 'Recepción reciente' : 'Actividad reciente'}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{isOrganization ? 'Últimas donaciones dirigidas a tu organización' : isAdmin ? 'Últimas donaciones registradas en la red' : 'Tus últimos materiales registrados'}</p></div><Link href={isOrganization ? '/donations' : isAdmin ? '/admin/review' : '/donations'} className="flex items-center gap-1 text-sm font-semibold text-primary" data-testid="link-view-all-donations">{isOrganization ? 'Abrir bandeja' : isAdmin ? 'Revisar' : 'Ver todo'} <ArrowUpRight className="h-4 w-4" /></Link></CardHeader><CardContent>{data.recentDonations.length === 0 ? <EmptyState title={isOrganization ? 'Aún no hay donaciones recibidas' : 'Aún no hay donaciones'} description={isOrganization ? 'Cuando se dirijan materiales a tu organización, aparecerán aquí.' : 'Registra tu primera donación para comenzar a ver tu impacto aquí.'} /> : <div className="divide-y">{data.recentDonations.map((donation) => <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0" key={donation.id} data-testid={`row-recent-donation-${donation.id}`}><div className="min-w-0"><p className="truncate text-sm font-semibold">{donation.title}</p><p className="mt-1 text-xs text-muted-foreground">{isOrganization ? `${donation.donorName} · ` : ''}{categoryLabels[donation.category]} · {formatDate(donation.createdAt)}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><Badge className={statusStyles[donation.status]}>{statusLabels[donation.status]}</Badge><span className="text-xs text-muted-foreground">{formatQuantity(donation)}</span></div></div>)}</div>}</CardContent></Card>
      <Card className="dotted-grid overflow-hidden"><CardHeader><p className="eyebrow">Balance de materiales</p><CardTitle className="mt-2 text-2xl">Lo que ya moviste importa.</CardTitle></CardHeader><CardContent><div className="rounded-2xl bg-sidebar p-5 text-sidebar-foreground"><p className="text-xs text-sidebar-foreground/60">Peso total registrado</p><p className="mt-2 font-mono text-4xl font-bold tracking-[-0.06em]" data-testid="text-total-weight">{data.totalWeightKg.toLocaleString('es-MX', { maximumFractionDigits: 2 })}<span className="ml-1 text-base font-medium text-sidebar-primary">kg</span></p><div className="mt-6 flex items-center justify-between border-t border-sidebar-border pt-4 text-xs text-sidebar-foreground/60"><span>Rechazadas</span><span className="flex items-center gap-1 text-sidebar-foreground"><XCircle className="h-3.5 w-3.5 text-rose-300" /> {data.rejectedCount}</span></div></div></CardContent></Card>
    </section>
  </div>;
}
