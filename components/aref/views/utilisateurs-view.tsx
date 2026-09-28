'use client'

import * as React from 'react'
import { Check, Copy, KeyRound, Pencil, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DP_ENTITIES, ENTITIES } from '@/lib/aref/data'
import type { EntityId, Program, RoleId, User } from '@/lib/aref/types'
import {
  ROLE_LABEL,
  canEditUser,
  canResetPassword,
  generatePassword,
  initials,
  isProgramManager,
} from '@/lib/aref/utils'
import { useApp, useCurrentUser } from '../app-store'
import { ExportExcelButton } from '../export-button'

type Draft = Omit<User, 'id'>

export function UtilisateursView() {
  const { users, programs, addUser, updateUser, resetPassword } = useApp()
  const actor = useCurrentUser()
  const isArefAdmin = actor.roleId === 'admin_aref'
  const ownEntity = ENTITIES.find((e) => e.id === actor.entityId)!

  const visibleUsers = isArefAdmin ? users : users.filter((u) => u.entityId === actor.entityId)

  const allowedRoles: RoleId[] = isArefAdmin
    ? ['admin_aref', 'gest_aref', 'admin_dp', 'gest_dp']
    : ['gest_dp']
  const allowedEntities = isArefAdmin ? ENTITIES : [ownEntity]

  const [dialog, setDialog] = React.useState<{ mode: 'create' } | { mode: 'edit'; user: User } | null>(
    null,
  )
  const [reset, setReset] = React.useState<{ user: User; password: string } | null>(null)

  const handleSubmit = (draft: Draft) => {
    if (!dialog) return
    if (dialog.mode === 'create') {
      addUser(draft)
      toast.success('Utilisateur créé', { description: `${draft.name} · mot de passe initial généré` })
    } else {
      updateUser(dialog.user.id, draft)
      toast.success('Utilisateur mis à jour', { description: draft.name })
    }
    setDialog(null)
  }

  const handleReset = (u: User) => {
    const password = resetPassword(u.id)
    setReset({ user: u, password })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Gestion des Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            {isArefAdmin
              ? `Tous les comptes AREF et provinciaux — ${users.length} utilisateurs`
              : `Comptes de la ${ownEntity.name} — ${visibleUsers.length} utilisateurs`}
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: 'create' })}>
          <UserPlus data-icon="inline-start" />
          {isArefAdmin ? 'Ajouter un utilisateur' : 'Ajouter un gestionnaire DP'}
        </Button>
      </div>

      {isArefAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CountCard label="Comptes AREF" value={users.filter((u) => u.entityId === 'aref').length} />
          <CountCard
            label="Admins DP"
            value={users.filter((u) => u.roleId === 'admin_dp').length}
            hint={`sur ${DP_ENTITIES.length} provinces`}
          />
          <CountCard label="Gestionnaires DP" value={users.filter((u) => u.roleId === 'gest_dp').length} />
          <CountCard label="Comptes inactifs" value={users.filter((u) => !u.active).length} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{isArefAdmin ? 'Annuaire régional' : ownEntity.name}</CardTitle>
            <CardDescription>
              {isArefAdmin
                ? 'Rôles, affectations de programmes et réinitialisation des mots de passe de tous les comptes.'
                : 'Vous gérez les Gestionnaires Programme DP de votre province et pouvez réinitialiser les mots de passe de vos utilisateurs.'}
            </CardDescription>
          </div>
          <ExportExcelButton
            className="shrink-0"
            fileName={isArefAdmin ? 'utilisateurs-aref-rsk' : `utilisateurs-${ownEntity.shortName.toLowerCase().replace(/\s+/g, '-')}`}
            sheetName="Utilisateurs"
            getRows={() =>
              visibleUsers.map((u) => ({
                Nom: u.name,
                Email: u.email,
                Rôle: ROLE_LABEL[u.roleId],
                Entité: ENTITIES.find((e) => e.id === u.entityId)?.name ?? u.entityId,
                'Programmes affectés': u.programIds
                  .map((id) => programs.find((p) => p.id === id)?.name ?? id)
                  .join(', '),
                Statut: u.active ? 'Actif' : 'Inactif',
              }))
            }
          />
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-6">Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Programmes affectés</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((u) => {
                  const assigned = programs.filter((p) => u.programIds.includes(p.id))
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.roleId.startsWith('admin') ? 'default' : 'secondary'}>
                          {ROLE_LABEL[u.roleId]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {ENTITIES.find((e) => e.id === u.entityId)?.name}
                      </TableCell>
                      <TableCell>
                        {isProgramManager(u.roleId) ? (
                          assigned.length > 0 ? (
                            <div className="flex max-w-xs flex-wrap gap-1">
                              {assigned.map((p) => (
                                <Badge key={p.id} variant="outline" className="whitespace-nowrap">
                                  {p.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">À affecter</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">Tous (administrateur)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge className="bg-success/15 text-success">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canResetPassword(actor, u)}
                            onClick={() => handleReset(u)}
                          >
                            <KeyRound data-icon="inline-start" />
                            Réinitialiser
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canEditUser(actor, u)}
                            onClick={() => setDialog({ mode: 'edit', user: u })}
                          >
                            <Pencil data-icon="inline-start" />
                            Modifier
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserDialog
        key={dialog ? (dialog.mode === 'edit' ? dialog.user.id : 'create') : 'closed'}
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        initial={
          dialog?.mode === 'edit'
            ? dialog.user
            : {
                name: '',
                email: '',
                password: generatePassword(),
                roleId: allowedRoles[allowedRoles.length - 1],
                entityId: allowedEntities[allowedEntities.length - 1].id,
                active: true,
                programIds: [],
              }
        }
        mode={dialog?.mode ?? 'create'}
        allowedRoles={allowedRoles}
        allowedEntities={allowedEntities.map((e) => e.id)}
        programs={programs}
        onSubmit={handleSubmit}
      />

      <PasswordDialog reset={reset} onClose={() => setReset(null)} />
    </div>
  )
}

function CountCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      )}
    </Card>
  )
}

function PasswordDialog({
  reset,
  onClose,
}: {
  reset: { user: User; password: string } | null
  onClose: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    if (!reset) return
    try {
      await navigator.clipboard.writeText(reset.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copie impossible', { description: 'Sélectionnez le mot de passe manuellement.' })
    }
  }

  return (
    <Dialog open={reset !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mot de passe réinitialisé</DialogTitle>
          <DialogDescription>
            Nouveau mot de passe temporaire pour {reset?.user.name}. Transmettez-le par un canal
            sécurisé ; il ne sera plus affiché après fermeture.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <InputGroup>
            <InputGroupInput
              readOnly
              aria-label="Nouveau mot de passe"
              value={reset?.password ?? ''}
              className="font-mono text-base tracking-wide"
              onFocus={(e) => e.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Copier le mot de passe" onClick={copy}>
                {copied ? <Check /> : <Copy />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Alert>
            <KeyRound />
            <AlertTitle>{reset?.user.email}</AlertTitle>
            <AlertDescription>
              L&apos;ancien mot de passe est immédiatement invalidé. L&apos;utilisateur pourra se
              connecter avec ce nouveau mot de passe dès maintenant.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserDialog({
  open,
  onOpenChange,
  initial,
  mode,
  allowedRoles,
  allowedEntities,
  programs,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Draft
  mode: 'create' | 'edit'
  allowedRoles: RoleId[]
  allowedEntities: EntityId[]
  programs: Program[]
  onSubmit: (draft: Draft) => void
}) {
  const [draft, setDraft] = React.useState<Draft>(initial)

  const roleRequiresAref = draft.roleId === 'admin_aref' || draft.roleId === 'gest_aref'
  const entityOptions: EntityId[] = allowedEntities.filter((id) =>
    roleRequiresAref ? id === 'aref' : id !== 'aref',
  )
  // Programs are assigned after creation, from "Gestion des Programmes" or by editing the account.
  const showPrograms = mode === 'edit' && isProgramManager(draft.roleId)

  const toggleProgram = (id: string, checked: boolean) =>
    setDraft((d) => ({
      ...d,
      programIds: checked ? [...new Set([...d.programIds, id])] : d.programIds.filter((p) => p !== id),
    }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim() || !draft.email.trim()) return
    const entityId = entityOptions.includes(draft.entityId) ? draft.entityId : entityOptions[0]
    onSubmit({
      ...draft,
      entityId,
      programIds: isProgramManager(draft.roleId) ? draft.programIds : [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l’utilisateur'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Identité, rôle et entité de rattachement. L’affectation aux programmes se fait ensuite depuis « Gestion des Programmes ».'
              : 'Identité, rôle, entité de rattachement et programmes affectés.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-name">Nom complet</FieldLabel>
                <Input
                  id="user-name"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="user-email">Adresse e-mail</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  required
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-role">Rôle</FieldLabel>
                <Select
                  value={draft.roleId}
                  onValueChange={(v) => v !== null && setDraft({ ...draft, roleId: v as RoleId })}
                  disabled={allowedRoles.length === 1}
                  items={ROLE_LABEL}
                >
                  <SelectTrigger id="user-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {allowedRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="user-entity">Entité</FieldLabel>
                <Select
                  value={entityOptions.includes(draft.entityId) ? draft.entityId : entityOptions[0]}
                  onValueChange={(v) => v !== null && setDraft({ ...draft, entityId: v as EntityId })}
                  disabled={entityOptions.length <= 1}
                  items={ENTITIES.map((e) => ({ value: e.id, label: e.name }))}
                >
                  <SelectTrigger id="user-entity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {entityOptions.map((id) => (
                        <SelectItem key={id} value={id}>
                          {ENTITIES.find((e) => e.id === id)?.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {showPrograms && (
              <FieldSet>
                <FieldLegend variant="label">Programmes affectés</FieldLegend>
                <FieldDescription>
                  {draft.roleId === 'gest_dp'
                    ? 'Le gestionnaire ne saisira que les indicateurs de ces programmes.'
                    : 'Le gestionnaire pourra gérer les indicateurs de ces programmes.'}
                </FieldDescription>
                <FieldGroup className="grid gap-2 sm:grid-cols-2">
                  {programs.map((p) => {
                    const id = `user-prog-${p.id}`
                    return (
                      <Field key={p.id} orientation="horizontal" className="items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={draft.programIds.includes(p.id)}
                          onCheckedChange={(checked) => toggleProgram(p.id, checked === true)}
                        />
                        <FieldLabel htmlFor={id} className="text-sm font-normal">
                          {p.name}
                        </FieldLabel>
                      </Field>
                    )
                  })}
                </FieldGroup>
              </FieldSet>
            )}

            {mode === 'create' && (
              <Field>
                <FieldLabel htmlFor="user-password">Mot de passe initial</FieldLabel>
                <Input
                  id="user-password"
                  readOnly
                  value={draft.password}
                  className="font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <FieldDescription>
                  Généré automatiquement — à transmettre à l&apos;utilisateur. Réinitialisable ensuite.
                </FieldDescription>
              </Field>
            )}

            <Field orientation="horizontal">
              <FieldLabel htmlFor="user-active">Compte actif</FieldLabel>
              <Switch
                id="user-active"
                checked={draft.active}
                onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{mode === 'create' ? 'Créer' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
