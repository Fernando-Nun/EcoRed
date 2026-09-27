import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'wouter';
import { useLoginUser } from '@workspace/api-client-react';
import type { LoginInput } from '@workspace/api-client-react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/ecored';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const login = useLoginUser();
  const form = useForm<LoginInput>({ defaultValues: { email: '', password: '' } });
  function submit(data: LoginInput) {
    login.mutate({ data }, { onSuccess: (session) => { sessionStorage.setItem('ecored-token', session.token); setLocation('/'); } });
  }
  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="eyebrow">Bienvenido de vuelta</p>
        <h2 className="page-title mt-3">Entra a tu red.</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Consulta tus donaciones, sigue su recorrido y encuentra nuevas oportunidades de impacto.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-5" data-testid="form-login">
          <FormField control={form.control} name="email" rules={{ required: 'Ingresa tu correo' }} render={({ field }) => (
            <FormItem><FormLabel>Correo electrónico</FormLabel><FormControl><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input {...field} className="pl-10" type="email" autoComplete="email" placeholder="nombre@ejemplo.com" data-testid="input-email" /></div></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" rules={{ required: 'Ingresa tu contraseña' }} render={({ field }) => (
            <FormItem><FormLabel>Contraseña</FormLabel><FormControl><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input {...field} className="pl-10" type="password" autoComplete="current-password" placeholder="Tu contraseña" data-testid="input-password" /></div></FormControl><FormMessage /></FormItem>
          )} />
          {login.isError && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" data-testid="status-login-error">{getErrorMessage(login.error, 'El correo o la contraseña no son correctos.')}</p>}
          <Button className="w-full" size="lg" disabled={login.isPending} type="submit" data-testid="button-submit-login">{login.isPending ? 'Validando…' : 'Iniciar sesión'} <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </Form>
      <p className="mt-8 text-center text-sm text-muted-foreground">¿Aún no tienes una cuenta? <Link href="/register" className="font-semibold text-primary hover:underline" data-testid="link-register">Regístrate</Link></p>
    </AuthLayout>
  );
}
