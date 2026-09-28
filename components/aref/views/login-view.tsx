'use client'

import * as React from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { APP_TITLE } from '@/lib/aref/data'
import { useApp } from '../app-store'

export function LoginView() {
  const { login } = useApp()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = login(email, password)
    if (!result.ok) setError(result.error)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <img
            src="/logo.png"
            alt="Logo AREF"
            className="mx-auto mb-4 h-40 w-auto rounded-md bg-card object-contain p-2"
          />
          <CardTitle className="text-xl text-balance">{APP_TITLE}</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte pour accéder au tableau de bord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={submit} className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                />
              </Field>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    aria-invalid={error ? true : undefined}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError(null)
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
              </Field>
            </FieldGroup>
            <Button type="submit" className="w-full">
              <LogIn data-icon="inline-start" />
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
