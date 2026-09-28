'use client'

import * as React from 'react'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useApp } from './app-store'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const { changeOwnPassword } = useApp()
  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) reset()
    onOpenChange(value)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (next !== confirm) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    const result = changeOwnPassword(current, next)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success('Mot de passe modifié', { description: 'Utilisez-le lors de votre prochaine connexion.' })
    handleOpenChange(false)
  }

  const mismatch = confirm.length > 0 && next !== confirm

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Confirmez votre mot de passe actuel puis choisissez-en un nouveau (8 caractères minimum).
          </DialogDescription>
        </DialogHeader>
        <form id="change-password-form" onSubmit={submit}>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="pw-current">Ancien mot de passe</FieldLabel>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value)
                  setError(null)
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="pw-next">Nouveau mot de passe</FieldLabel>
              <Input
                id="pw-next"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={next}
                onChange={(e) => {
                  setNext(e.target.value)
                  setError(null)
                }}
              />
            </Field>
            <Field data-invalid={mismatch || undefined}>
              <FieldLabel htmlFor="pw-confirm">Confirmer le nouveau mot de passe</FieldLabel>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={mismatch || undefined}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setError(null)
                }}
              />
              {mismatch && (
                <FieldDescription className="text-destructive">
                  Les deux mots de passe doivent être identiques.
                </FieldDescription>
              )}
              {error && <FieldDescription className="text-destructive">{error}</FieldDescription>}
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="change-password-form">
            <KeyRound data-icon="inline-start" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
