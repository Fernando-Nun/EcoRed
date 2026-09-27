import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useHealthCheck } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { BarChart3, Building2, ClipboardCheck, FilePlus2, Home, LogOut, Menu, Recycle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppShellProps = { user: User; children: React.ReactNode };

export function AppShell({ user, children }: AppShellProps) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const health = useHealthCheck();
  const nav = [
    { href: '/', label: 'Resumen', icon: Home, visible: true },
    { href: '/donations', label: user.role === 'organization' ? 'Bandeja de recepción' : 'Donaciones', icon: BarChart3, visible: true },
    { href: '/organizations', label: 'Organizaciones', icon: Building2, visible: true },
    { href: '/donations/new', label: 'Nueva donación', icon: FilePlus2, visible: user.role === 'donor' },
    { href: '/admin/review', label: 'Revisión', icon: ClipboardCheck, visible: user.role === 'admin' },
  ].filter((item) => item.visible);

  function logout() {
    sessionStorage.removeItem('ecored-token');
    setLocation('/login');
  }

  return (
    <div className="min-h-[100dvh] bg-background lg:flex">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Recycle className="h-5 w-5" />
            </span>
            <span className="font-mono text-xl font-bold tracking-[-0.05em]">EcoRed</span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú" data-testid="button-close-menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">Espacio de trabajo</p>
          <nav className="space-y-1" aria-label="Navegación principal">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto space-y-4 p-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <div className="flex items-center gap-2 text-xs text-sidebar-foreground/65">
              <span className={cn('h-2 w-2 rounded-full', health.isSuccess ? 'bg-emerald-400' : 'bg-amber-400')} />
              {health.isSuccess ? 'Servicio conectado' : 'Comprobando servicio'}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sidebar-foreground/50">Cada entrega deja una huella visible.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-bold text-sidebar-primary">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-sidebar-foreground/50">{user.role === 'organization' ? 'Organización' : user.role === 'donor' ? 'Donante' : 'Administrador'}</p>
            </div>
            <button onClick={logout} className="text-sidebar-foreground/50 hover:text-sidebar-primary" aria-label="Cerrar sesión" data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar navegación" data-testid="button-overlay-menu" />}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b bg-background/90 px-5 backdrop-blur-sm lg:px-10">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú" data-testid="button-open-menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden text-sm text-muted-foreground lg:block">Plataforma de economía circular</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block" data-testid="text-header-user">Hola, {user.name.split(' ')[0]}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user.name.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 top-20 h-72 w-72 rounded-full border-[36px] border-sidebar-primary/20" />
        <div className="absolute bottom-12 right-24 h-44 w-44 rounded-full border-[22px] border-sidebar-primary/10" />
        <Link href="/" className="relative flex items-center gap-3" data-testid="link-auth-brand">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Recycle className="h-5 w-5" /></span>
          <span className="font-mono text-2xl font-bold tracking-[-0.05em]">EcoRed</span>
        </Link>
        <div className="relative max-w-md">
          <p className="eyebrow text-sidebar-primary">Materiales que conectan</p>
          <h1 className="mt-5 font-mono text-5xl font-bold leading-[1.05] tracking-[-0.06em]">Dale otra vuelta a lo que aún tiene valor.</h1>
          <p className="mt-6 max-w-sm leading-relaxed text-sidebar-foreground/65">Una red confiable para transformar tus materiales en impacto local, con seguimiento en cada paso.</p>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">EcoRed · Economía circular en México</p>
      </section>
      <section className="flex min-h-[100dvh] flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-20">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Recycle className="h-5 w-5" /></span>
          <span className="font-mono text-xl font-bold tracking-[-0.05em]">EcoRed</span>
        </div>
        <div className="mx-auto w-full max-w-[460px]">{children}</div>
      </section>
    </div>
  );
}
