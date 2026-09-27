import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'wouter';
import { DonationCategory, RegistrationRole, useRegisterUser } from '@workspace/api-client-react';
import type { RegistrationInput } from '@workspace/api-client-react';
import { ArrowRight, Building2, UserRound } from 'lucide-react';
import { AuthLayout } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/ecored';
import { cn } from '@/lib/utils';

const acceptedCategoryOptions = [
  [DonationCategory.electronics, 'Electrónicos'],
  [DonationCategory.plastics, 'Plásticos'],
  [DonationCategory.glass, 'Vidrio'],
  [DonationCategory.paper, 'Papel y cartón'],
  [DonationCategory.metal, 'Metal'],
  [DonationCategory.clothing, 'Ropa y textiles'],
  [DonationCategory.food, 'Alimentos'],
  [DonationCategory.other, 'Otros materiales'],
] as const;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const register = useRegisterUser();
  const [role, setRole] = useState<RegistrationInput['role']>(RegistrationRole.donor);
  const form = useForm<RegistrationInput>({ defaultValues: { name: '', email: '', password: '', role: RegistrationRole.donor, organizationName: '', municipality: '', description: '', acceptedCategories: [] } });
  const acceptedCategories = form.watch('acceptedCategories') ?? [];
  function chooseRole(next: RegistrationInput['role']) { setRole(next); form.setValue('role', next); }
  function submit(data: RegistrationInput) {
    if (role === RegistrationRole.organization && !data.acceptedCategories?.length) {
      form.setError('acceptedCategories', { type: 'validate', message: 'Selecciona al menos un tipo de material.' });
      return;
    }
    const payload = role === 'organization' ? data : {
      ...data,
      organizationName: undefined,
      municipality: undefined,
      description: undefined,
      acceptedCategories: undefined,
    };
    register.mutate({ data: payload }, { onSuccess: (session) => { sessionStorage.setItem('ecored-token', session.token); setLocation('/'); } });
  }
  return (
    <AuthLayout>
      <div className="mb-7"><p className="eyebrow">Empieza aquí</p><h2 className="page-title mt-3">Crea tu cuenta.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Elige cómo quieres participar en una red donde cada material cuenta.</p></div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => chooseRole(RegistrationRole.donor)} className={cn('rounded-xl border p-4 text-left transition-colors', role === 'donor' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card hover:bg-muted')} data-testid="button-role-donor"><UserRound className="mb-3 h-5 w-5 text-primary" /><span className="block text-sm font-semibold">Soy donante</span><span className="mt-1 block text-xs text-muted-foreground">Tengo materiales para compartir</span></button>
        <button type="button" onClick={() => chooseRole(RegistrationRole.organization)} className={cn('rounded-xl border p-4 text-left transition-colors', role === 'organization' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card hover:bg-muted')} data-testid="button-role-organization"><Building2 className="mb-3 h-5 w-5 text-primary" /><span className="block text-sm font-semibold">Soy organización</span><span className="mt-1 block text-xs text-muted-foreground">Recibo materiales para mi causa</span></button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4" data-testid="form-register">
          <FormField control={form.control} name="name" rules={{ required: 'Ingresa tu nombre', minLength: { value: 2, message: 'Usa al menos 2 caracteres' } }} render={({ field }) => <FormItem><FormLabel>Nombre completo</FormLabel><FormControl><Input {...field} autoComplete="name" placeholder="Tu nombre" data-testid="input-name" /></FormControl><FormMessage /></FormItem>} />
          {role === 'organization' && <>
            <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground" data-testid="notice-organization-verification">Tu perfil aparecerá en el directorio cuando administración verifique estos datos.</p>
            <FormField control={form.control} name="organizationName" rules={{ required: 'Ingresa el nombre de tu organización', minLength: { value: 2, message: 'Usa al menos 2 caracteres' } }} render={({ field }) => <FormItem><FormLabel>Nombre de la organización</FormLabel><FormControl><Input {...field} autoComplete="organization" placeholder="Nombre registrado" data-testid="input-organization-name" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="municipality" rules={{ required: 'Indica el municipio donde opera la organización', minLength: { value: 2, message: 'Usa al menos 2 caracteres' } }} render={({ field }) => <FormItem><FormLabel>Municipio</FormLabel><FormControl><Input {...field} autoComplete="address-level2" placeholder="Ej. Chihuahua" data-testid="input-municipality" /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="description" rules={{ required: 'Describe la causa y el trabajo de tu organización', minLength: { value: 10, message: 'Incluye al menos 10 caracteres' }, maxLength: { value: 700, message: 'Usa 700 caracteres o menos' } }} render={({ field }) => <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={3} placeholder="Cuéntanos qué hace la organización y cómo aprovechará los materiales." data-testid="input-organization-description" /></FormControl><FormMessage /></FormItem>} />
            <div className="space-y-2" data-testid="section-accepted-categories">
              <p className="text-sm font-medium">Materiales que recibes</p>
              <p className="text-xs text-muted-foreground">Selecciona al menos una categoría.</p>
              <div className="grid grid-cols-2 gap-2">
                {acceptedCategoryOptions.map(([value, label]) => (
                  <label key={value} className="flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={acceptedCategories.includes(value)}
                      onChange={(event) => {
                        const next = event.currentTarget.checked
                          ? [...acceptedCategories, value]
                          : acceptedCategories.filter((item) => item !== value);
                        form.setValue('acceptedCategories', next, { shouldDirty: true, shouldValidate: true });
                        if (next.length) form.clearErrors('acceptedCategories');
                      }}
                      data-testid={`checkbox-category-${value}`}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {form.formState.errors.acceptedCategories && <p className="text-sm text-destructive" role="alert" data-testid="status-categories-error">{form.formState.errors.acceptedCategories.message}</p>}
            </div>
          </>}
          <FormField control={form.control} name="email" rules={{ required: 'Ingresa tu correo' }} render={({ field }) => <FormItem><FormLabel>Correo electrónico</FormLabel><FormControl><Input {...field} autoComplete="email" type="email" placeholder="nombre@ejemplo.com" data-testid="input-email" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="password" rules={{ required: 'Crea una contraseña', minLength: { value: 10, message: 'Usa al menos 10 caracteres' } }} render={({ field }) => <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input {...field} autoComplete="new-password" type="password" placeholder="Mínimo 10 caracteres" data-testid="input-password" /></FormControl><FormMessage /></FormItem>} />
          {register.isError && <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" data-testid="status-register-error">{getErrorMessage(register.error)}</p>}
          <Button className="mt-2 w-full" size="lg" disabled={register.isPending} type="submit" data-testid="button-submit-register">{register.isPending ? 'Creando cuenta…' : 'Crear cuenta'} <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </Form>
      <p className="mt-7 text-center text-sm text-muted-foreground">¿Ya tienes una cuenta? <Link href="/login" className="font-semibold text-primary hover:underline" data-testid="link-login">Inicia sesión</Link></p>
    </AuthLayout>
  );
}
