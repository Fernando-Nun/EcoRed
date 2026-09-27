import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingBlock({ label = 'Cargando información' }: { label?: string }) {
  return <div className="space-y-3" data-testid="state-loading"><div className="h-5 w-40 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /><p className="text-sm text-muted-foreground">{label}…</p></div>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="surface flex flex-col items-center justify-center gap-3 p-10 text-center" data-testid="state-error"><AlertTriangle className="h-8 w-8 text-destructive" /><h3 className="font-semibold">No pudimos cargar esta vista</h3><p className="max-w-sm text-sm text-muted-foreground">Revisa tu conexión e intenta de nuevo.</p><Button variant="outline" onClick={onRetry} data-testid="button-retry">Intentar de nuevo <RefreshCw className="h-4 w-4" /></Button></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="surface flex flex-col items-center justify-center gap-3 p-12 text-center" data-testid="state-empty"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Inbox className="h-6 w-6" /></span><h3 className="font-semibold">{title}</h3><p className="max-w-sm text-sm text-muted-foreground">{description}</p></div>;
}
