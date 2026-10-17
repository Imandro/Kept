'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/ui/animated'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMessage(json.error || 'Error al crear la cuenta')
        return
      }
      router.push('/login?registered=1')
    } catch {
      setErrorMessage('Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="relative w-full max-w-md z-10">
        <Card className="bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden">
          <CardHeader className="text-center p-8 pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground">
              <svg className="h-10 w-10 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Crear cuenta</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">Empieza a guardar con Kept</CardDescription>
          </CardHeader>

          {errorMessage && (
            <div className="mx-6 mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-center gap-2" role="alert">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <CardContent className="px-8 pb-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FadeIn delay={0.1}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input label="Nombre" type="text" placeholder="Tu nombre" error={form.formState.errors.name?.message} {...form.register('name')} disabled={isLoading} className="pl-10" autoComplete="name" />
                </div>
              </FadeIn>
              <FadeIn delay={0.15}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input label="Email" type="email" placeholder="tu@email.com" error={form.formState.errors.email?.message} {...form.register('email')} disabled={isLoading} className="pl-10" autoComplete="email" />
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input label="Contraseña" type={showPassword ? 'text' : 'password'} placeholder="••••••••" error={form.formState.errors.password?.message} {...form.register('password')} disabled={isLoading} className="pl-10 pr-12" autoComplete="new-password" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </FadeIn>
              <FadeIn delay={0.25}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <Input label="Confirmar contraseña" type={showPassword ? 'text' : 'password'} placeholder="••••••••" error={form.formState.errors.confirmPassword?.message} {...form.register('confirmPassword')} disabled={isLoading} className="pl-10" autoComplete="new-password" />
                </div>
              </FadeIn>
              <Button type="submit" size="lg" loading={isLoading} className="w-full h-12 text-lg">Crear cuenta</Button>
            </form>
          </CardContent>
          <Separator className="mx-8 my-6" />
          <CardFooter className="p-8 pt-4">
            <p className="text-center text-sm text-muted-foreground w-full">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">Inicia sesión</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}