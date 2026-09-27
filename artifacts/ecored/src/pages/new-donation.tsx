import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { DonationCategory, DonationUnit, getGetDashboardSummaryQueryKey, getListDonationsQueryKey, useCreateDonation, useListOrganizations } from '@workspace/api-client-react';
import type { DonationInput } from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState, LoadingBlock } from '@/components/data-states';
import { categoryLabels, getErrorMessage } from '@/lib/ecored';

export default function NewDonationPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const organizations = useListOrganizations();
  const createDonation = useCreateDonation();
  const form = useForm<DonationInput>({ defaultValues: { recipientId: '', category: DonationCategory.plastics, title: '', description: '', quantity: 1, unit: DonationUnit.kg } });
  const selectedCategory = form.watch('category');
  const eligibleOrganizations = (organizations.data ?? []).filter((organization) =>
    organization.acceptedCategories.includes(selectedCategory),
  );
  function submit(data: DonationInput) {
    createDonation.mutate({ data: { ...data, quantity: Number(data.quantity) } }, { onSuccess: (donation) => { queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/donations'); } });
  }
  if (organizations.isLoading) return <LoadingBlock label="Cargando organizaciones" />;
  if (organizations.isError) return <ErrorState onRetry={() => organizations.refetch()} />;
  return <div className="mx-auto max-w-[900px] space-y-8">
    <div><Link href="/donations" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary" data-testid="link-back-donations"><ArrowLeft className="h-4 w-4" /> Volver a donaciones</Link><p className="eyebrow">Nuevo registro</p><h1 className="page-title mt-2">Pon un material en movimiento.</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Elige una organización verificada que reciba la categoría del material que vas a donar.</p></div>
    <Card><CardHeader className="border-b"><CardTitle>Detalles de la donación</CardTitle><p className="text-sm text-muted-foreground">Los campos con asterisco son necesarios para revisar tu registro.</p></CardHeader><CardContent className="pt-6"><Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-6" data-testid="form-new-donation">
      <FormField control={form.control} name="title" rules={{ required: 'Escribe un título', minLength: { value: 2, message: 'Usa al menos 2 caracteres' } }} render={({ field }) => <FormItem><FormLabel>¿Qué estás donando?</FormLabel><FormControl><Input {...field} placeholder="Ej. Cajas de cartón limpias" data-testid="input-donation-title" /></FormControl><FormMessage /></FormItem>} />
      <div className="grid gap-6 md:grid-cols-2"><FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Categoría</FormLabel><FormControl><select {...field} onChange={(event) => { field.onChange(event); const nextCategory = event.target.value as DonationInput['category']; const nextEligible = (organizations.data ?? []).filter((organization) => organization.acceptedCategories.includes(nextCategory)); if (!nextEligible.some((organization) => organization.id === form.getValues('recipientId'))) form.setValue('recipientId', '', { shouldDirty: true, shouldValidate: true }); }} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm" data-testid="select-donation-category">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="recipientId" rules={{ required: 'Selecciona una organización' }} render={({ field }) => <FormItem><FormLabel>Organización destinataria</FormLabel><FormControl><select {...field} disabled={eligibleOrganizations.length === 0} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60" data-testid="select-donation-recipient"><option value="">{eligibleOrganizations.length ? 'Selecciona una organización' : 'No hay organizaciones para esta categoría'}</option>{eligibleOrganizations.map((organization) => <option value={organization.id} key={organization.id}>{organization.name}</option>)}</select></FormControl><FormMessage />{eligibleOrganizations.length === 0 && <p className="text-xs text-muted-foreground" role="status">{organizations.data?.length ? 'Prueba otra categoría: las organizaciones verificadas no reciben este material.' : 'Todavía no hay organizaciones verificadas disponibles para recibir donaciones.'}</p>}</FormItem>} /></div>
      <div className="grid gap-6 md:grid-cols-[1fr_180px]"><FormField control={form.control} name="quantity" rules={{ required: 'Ingresa una cantidad', min: { value: 0.01, message: 'La cantidad debe ser mayor a cero' } }} render={({ field }) => <FormItem><FormLabel>Cantidad</FormLabel><FormControl><Input {...field} type="number" step="0.01" min="0.01" data-testid="input-donation-quantity" /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="unit" render={({ field }) => <FormItem><FormLabel>Unidad</FormLabel><FormControl><select {...field} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm" data-testid="select-donation-unit"><option value={DonationUnit.kg}>Kilogramos</option><option value={DonationUnit.pieces}>Piezas</option><option value={DonationUnit.liters}>Litros</option></select></FormControl><FormMessage /></FormItem>} /></div>
      <FormField control={form.control} name="description" rules={{ required: 'Agrega una descripción', minLength: { value: 5, message: 'Cuéntanos un poco más' } }} render={({ field }) => <FormItem><FormLabel>Descripción y condiciones</FormLabel><FormControl><Textarea {...field} rows={5} placeholder="Describe el estado, la preparación y cualquier detalle para la organización." data-testid="textarea-donation-description" /></FormControl><FormMessage /></FormItem>} />
      {createDonation.isError && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" data-testid="status-create-donation-error">{getErrorMessage(createDonation.error)}</p>}
      <div className="flex flex-col-reverse justify-end gap-3 border-t pt-6 sm:flex-row"><Link href="/donations" className="inline-flex min-h-9 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium" data-testid="link-cancel-donation">Cancelar</Link><Button type="submit" disabled={createDonation.isPending || eligibleOrganizations.length === 0} data-testid="button-submit-donation">{createDonation.isPending ? 'Guardando…' : 'Registrar donación'} {createDonation.isPending ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</Button></div>
    </form></Form></CardContent></Card>
  </div>;
}
