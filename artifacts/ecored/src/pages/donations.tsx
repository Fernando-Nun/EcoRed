import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  DonationStatus,
  getGetDashboardSummaryQueryKey,
  getListDonationsQueryKey,
  useListDonations,
  useUpdateDonationStatus,
} from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { ArrowUpRight, Check, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, EmptyState, LoadingBlock } from '@/components/data-states';
import { categoryLabels, formatDate, formatQuantity, getErrorMessage, statusLabels, statusStyles } from '@/lib/ecored';

export default function DonationsPage({ user }: { user: User }) {
  const [status, setStatus] = useState<'all' | DonationStatus>('all');
  const queryClient = useQueryClient();
  const query = useListDonations(status === 'all' ? undefined : { status });
  const updateDonation = useUpdateDonationStatus();
  const isOrganization = user.role === 'organization';

  function changeDonationStatus(id: string, nextStatus: DonationStatus) {
    updateDonation.reset();
    updateDonation.mutate(
      { id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  }

  if (query.isLoading) return <LoadingBlock label="Cargando historial" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{isOrganization ? 'Recepción de materiales' : 'Trazabilidad'}</p>
          <h1 className="page-title mt-2">
            {isOrganization ? 'Donaciones recibidas' : user.role === 'admin' ? 'Donaciones' : 'Mis donaciones'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isOrganization
              ? 'Revisa los materiales dirigidos a tu organización y confirma la entrega cuando los recibas.'
              : user.role === 'admin'
                ? 'Consulta las donaciones registradas en EcoRed.'
                : 'Consulta el recorrido de cada material que has registrado.'}
          </p>
        </div>
        {user.role === 'donor' && (
          <Link href="/donations/new" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground" data-testid="link-new-donation">
            <Plus className="h-4 w-4" /> Nueva donación
          </Link>
        )}
      </div>

      {updateDonation.isError && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert" data-testid="status-delivery-error">
          {getErrorMessage(updateDonation.error)}
        </p>
      )}

      <Card>
        <CardHeader className="flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{isOrganization ? 'Bandeja de recepción' : 'Historial de donaciones'}</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="status-filter" className="sr-only">Filtrar por estado</label>
            <select
              id="status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | DonationStatus)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              data-testid="select-donation-status"
            >
              <option value="all">Todos los estados</option>
              <option value={DonationStatus.pending}>En revisión</option>
              <option value={DonationStatus.approved}>Aceptadas</option>
              <option value={DonationStatus.delivered}>Entregadas</option>
              <option value={DonationStatus.rejected}>Rechazadas</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {query.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={isOrganization ? 'Aún no recibes donaciones' : 'No hay donaciones con este filtro'}
                description={
                  isOrganization
                    ? 'Cuando una persona dirija materiales a tu organización, aparecerán aquí.'
                    : 'Prueba con otro estado o registra una nueva donación.'
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {query.data.map((donation) => (
                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between" key={donation.id} data-testid={`row-donation-${donation.id}`}>
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {categoryLabels[donation.category].slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold" data-testid={`text-donation-title-${donation.id}`}>{donation.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {isOrganization ? `Donante: ${donation.donorName}` : donation.recipientName}
                        {' · '}{categoryLabels[donation.category]}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Registrada el {formatDate(donation.createdAt)} · {formatQuantity(donation)}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{donation.description}</p>
                      {isOrganization && donation.status === DonationStatus.pending && (
                        <p className="mt-2 text-xs text-muted-foreground">Acéptala para indicar que tu organización puede recibirla. Después podrás confirmar la entrega.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Badge className={statusStyles[donation.status]} data-testid={`status-donation-${donation.id}`}>
                      {statusLabels[donation.status]}
                    </Badge>
                    {isOrganization && donation.status === DonationStatus.approved && (
                      <Button
                        size="sm"
                        disabled={updateDonation.isPending}
                        onClick={() => changeDonationStatus(donation.id, DonationStatus.delivered)}
                        data-testid={`button-confirm-delivery-${donation.id}`}
                      >
                        <Check className="h-4 w-4" />
                        {updateDonation.isPending ? 'Confirmando…' : 'Confirmar entrega'}
                      </Button>
                    )}
                    {isOrganization && donation.status === DonationStatus.pending && (
                      <Button
                        size="sm"
                        disabled={updateDonation.isPending}
                        onClick={() => changeDonationStatus(donation.id, DonationStatus.approved)}
                        data-testid={`button-accept-donation-${donation.id}`}
                      >
                        <Check className="h-4 w-4" />
                        {updateDonation.isPending ? 'Aceptando…' : 'Aceptar donación'}
                      </Button>
                    )}
                    {!isOrganization && <span className="text-muted-foreground" aria-hidden="true"><ArrowUpRight className="h-4 w-4" /></span>}
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
