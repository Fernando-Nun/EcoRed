import { Building2, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useListOrganizations } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState, EmptyState, LoadingBlock } from '@/components/data-states';
import { categoryLabels } from '@/lib/ecored';

export default function OrganizationsPage() {
  const [search, setSearch] = useState('');
  const query = useListOrganizations();
  if (query.isLoading) return <LoadingBlock label="Cargando directorio" />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />;
  const organizations = query.data.filter((organization) => organization.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Red de aliados</p><h1 className="page-title mt-2">Organizaciones</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Conoce las organizaciones verificadas, su ubicación y los materiales que reciben.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar organización" data-testid="input-search-organizations" /></div></div>
    {organizations.length === 0 ? <EmptyState title={query.data.length === 0 ? 'Aún no hay organizaciones verificadas' : 'No encontramos organizaciones'} description={query.data.length === 0 ? 'Las organizaciones aparecerán aquí cuando completen su verificación.' : 'Prueba con otro término de búsqueda.'} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{organizations.map((organization) => <Card key={organization.id} className="group transition-transform hover:-translate-y-0.5" data-testid={`card-organization-${organization.id}`}><CardHeader><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/25 text-primary"><Building2 className="h-5 w-5" /></span><span className="text-xs font-semibold text-primary">Verificada</span></div><CardTitle className="pt-2 text-lg" data-testid={`text-organization-${organization.id}`}>{organization.name}</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-accent-foreground" /> {organization.municipality}</div><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{organization.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{organization.acceptedCategories.map((category) => <span key={category} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">{categoryLabels[category]}</span>)}</div></CardContent></Card>)}</div>}
  </div>;
}
