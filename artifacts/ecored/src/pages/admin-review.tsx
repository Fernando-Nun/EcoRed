import { useQueryClient } from '@tanstack/react-query';
import {
  DonationStatus,
  getGetDashboardSummaryQueryKey,
  getListDonationsQueryKey,
  getListOrganizationsForReviewQueryKey,
  getListOrganizationsQueryKey,
  useListDonations,
  useListOrganizationsForReview,
  useUpdateDonationStatus,
  useUpdateOrganizationVerification,
} from '@workspace/api-client-react';
import type { Organization } from '@workspace/api-client-react';
import { Building2, Check, Filter, MapPin, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, EmptyState, LoadingBlock } from '@/components/data-states';
import { categoryLabels, formatDate, formatQuantity, getErrorMessage, statusLabels, statusStyles } from '@/lib/ecored';

export default function AdminReviewPage() {
  const [status, setStatus] = useState<DonationStatus>(DonationStatus.pending);
  const queryClient = useQueryClient();
  const donationQuery = useListDonations({ status });
  const organizationQuery = useListOrganizationsForReview();
  const updateDonation = useUpdateDonationStatus();
  const updateOrganization = useUpdateOrganizationVerification();

  function setDonationStatus(id: string, next: DonationStatus) {
    updateDonation.reset();
    updateDonation.mutate(
      { id, data: { status: next } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  }

  function setOrganizationVerification(id: string, isVerified: boolean) {
    updateOrganization.mutate(
      { id, data: { isVerified } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrganizationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListOrganizationsForReviewQueryKey() });
        },
      },
    );
  }

  if (donationQuery.isLoading || organizationQuery.isLoading) {
    return <LoadingBlock label="Cargando registros para revisar" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Control de calidad</p>
        <h1 className="page-title mt-2">Revisión y confianza</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Valida donaciones y organizaciones antes de que cada conexión avance.
        </p>
      </div>

      <OrganizationReview
        query={organizationQuery}
        isPending={updateOrganization.isPending}
        error={updateOrganization.isError ? getErrorMessage(updateOrganization.error) : null}
        onDecision={setOrganizationVerification}
      />

      {updateDonation.isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert" data-testid="status-admin-donation-error">
          {getErrorMessage(updateDonation.error)}
        </p>
      )}

      <Card>
        <CardHeader className="flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Revisión de donaciones</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {donationQuery.data?.length ?? 0} registros en este estado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as DonationStatus)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              data-testid="select-review-status"
            >
              <option value={DonationStatus.pending}>En revisión</option>
              <option value={DonationStatus.approved}>Aceptadas</option>
              <option value={DonationStatus.delivered}>Entregadas</option>
              <option value={DonationStatus.rejected}>Rechazadas</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {donationQuery.isError ? (
            <div className="p-6"><ErrorState onRetry={() => donationQuery.refetch()} /></div>
          ) : donationQuery.data?.length === 0 ? (
            <div className="p-6">
              <EmptyState title="La cola está al día" description="No hay donaciones con este estado para revisar." />
            </div>
          ) : (
            <div className="divide-y">
              {donationQuery.data?.map((donation) => (
                <div className="space-y-4 p-6" key={donation.id} data-testid={`row-review-${donation.id}`}>
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{donation.title}</h3>
                        <Badge className={statusStyles[donation.status]}>{statusLabels[donation.status]}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {donation.donorName} → {donation.recipientName}
                      </p>
                    </div>
                    <div className="text-left text-xs text-muted-foreground md:text-right">
                      <p>{categoryLabels[donation.category]} · {formatQuantity(donation)}</p>
                      <p className="mt-1">{formatDate(donation.createdAt)}</p>
                    </div>
                  </div>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{donation.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {status === DonationStatus.pending && (
                      <>
                        <Button size="sm" disabled={updateDonation.isPending} onClick={() => setDonationStatus(donation.id, DonationStatus.approved)} data-testid={`button-approve-${donation.id}`}>
                          <Check className="h-4 w-4" /> Aprobar
                        </Button>
                        <Button size="sm" variant="outline" disabled={updateDonation.isPending} onClick={() => setDonationStatus(donation.id, DonationStatus.rejected)} data-testid={`button-reject-${donation.id}`}>
                          <X className="h-4 w-4" /> Rechazar
                        </Button>
                      </>
                    )}
                    {status === DonationStatus.approved && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-delivery-owner-${donation.id}`}>
                        La organización receptora acepta la donación y confirma la entrega desde su bandeja.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type OrganizationReviewProps = {
  query: ReturnType<typeof useListOrganizationsForReview>;
  isPending: boolean;
  error: string | null;
  onDecision: (id: string, isVerified: boolean) => void;
};

function OrganizationReview({ query, isPending, error, onDecision }: OrganizationReviewProps) {
  if (query.isError) {
    return (
      <section className="space-y-4">
        <div><p className="eyebrow">Red de aliados</p><h2 className="mt-2 font-mono text-2xl font-bold tracking-[-0.04em]">Verificación de organizaciones</h2></div>
        <ErrorState onRetry={() => query.refetch()} />
      </section>
    );
  }

  const organizations = (query.data ?? []) as Organization[];
  const pendingCount = organizations.filter((organization) => !organization.isVerified).length;

  return (
    <section className="space-y-4" data-testid="section-organization-review">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Red de aliados</p>
          <h2 className="mt-2 font-mono text-2xl font-bold tracking-[-0.04em]">Verificación de organizaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">Confirma quién puede recibir materiales dentro de EcoRed.</p>
        </div>
        <Badge className={pendingCount > 0 ? 'border-amber-200 bg-amber-100 text-amber-800' : 'border-emerald-200 bg-emerald-100 text-emerald-800'} data-testid="status-organization-pending-count">
          {pendingCount > 0 ? `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'} de verificación` : 'Sin pendientes'}
        </Badge>
      </div>
      {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" data-testid="status-organization-error">{error}</p>}
      {organizations.length === 0 ? (
        <EmptyState title="No hay organizaciones para revisar" description="Las nuevas organizaciones aparecerán aquí cuando completen su registro." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {organizations.map((organization) => (
            <Card key={organization.id} data-testid={`card-organization-review-${organization.id}`}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg" data-testid={`text-organization-review-name-${organization.id}`}>{organization.name}</CardTitle>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {organization.municipality}</p>
                  </div>
                </div>
                <Badge className={organization.isVerified ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-amber-200 bg-amber-100 text-amber-800'} data-testid={`status-organization-verification-${organization.id}`}>
                  {organization.isVerified ? <><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verificada</> : <><ShieldAlert className="mr-1 h-3.5 w-3.5" /> Pendiente</>}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{organization.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {organization.acceptedCategories.map((category) => <span key={category} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">{categoryLabels[category]}</span>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                  {!organization.isVerified && <Button size="sm" disabled={isPending} onClick={() => onDecision(organization.id, true)} data-testid={`button-verify-organization-${organization.id}`}><Check className="h-4 w-4" /> Aprobar organización</Button>}
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => onDecision(organization.id, false)} data-testid={`button-suspend-organization-${organization.id}`}><X className="h-4 w-4" /> {organization.isVerified ? 'Suspender' : 'Suspender registro'}</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}