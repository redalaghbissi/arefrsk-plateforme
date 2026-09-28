'use client'

import * as React from 'react'
import { FolderPlus, Lock, Pencil, Plus, ShieldCheck, Target, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ENTITIES } from '@/lib/aref/data'
import type { Indicator, Program, ValueType } from '@/lib/aref/types'
import {
  VALUE_TYPE_LABEL,
  VALUE_TYPE_UNIT,
  canManageProgram,
  formatValue,
} from '@/lib/aref/utils'
import { cn } from '@/lib/utils'
import { useApp, useCurrentUser } from '../app-store'
import { TypeBadge } from '../badges'

const NONE = '__none__'

type IndicatorDialog =
  | { mode: 'create'; programId: string }
  | { mode: 'edit'; indicator: Indicator }
  | { mode: 'target'; indicator: Indicator }

export function ProgrammesView() {
  const { programs, indicators, users, updateProgram, assignDpManager, deleteIndicator } = useApp()
  const user = useCurrentUser()
  const isAdmin = user.roleId === 'admin_aref'
  const isDpAdmin = user.roleId === 'admin_dp'
  const ownEntity = ENTITIES.find((e) => e.id === user.entityId)

  const managers = users.filter((u) => u.roleId === 'gest_aref' && u.active)
  const dpManagers = users.filter(
    (u) => u.roleId === 'gest_dp' && u.entityId === user.entityId && u.active,
  )
  const managerName = (id: string | null) => users.find((u) => u.id === id)?.name ?? null
  const dpManagerFor = (programId: string) =>
    dpManagers.find((m) => m.programIds.includes(programId)) ?? null

  const [dialog, setDialog] = React.useState<IndicatorDialog | null>(null)
  const [toDelete, setToDelete] = React.useState<Indicator | null>(null)

  // Managers see their own programs first; the rest stay visible but greyed out.
  const ordered = React.useMemo(() => {
    if (isAdmin || isDpAdmin) return programs
    return [...programs].sort(
      (a, b) => Number(canManageProgram(user, b.id)) - Number(canManageProgram(user, a.id)),
    )
  }, [programs, user, isAdmin, isDpAdmin])

  const managedCount = programs.filter((p) => canManageProgram(user, p.id)).length
  const assignedCount = programs.filter((p) => dpManagerFor(p.id) !== null).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Gestion des Programmes et Indicateurs
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? `Référentiel régional : ${programs.length} programmes · ${indicators.length} indicateurs · cibles strictement annuelles`
            : isDpAdmin
              ? `${ownEntity?.name} : ${assignedCount} programme(s) sur ${programs.length} affecté(s) à un Gestionnaire Programme DP`
              : `${managedCount} programme(s) sous votre responsabilité · les autres programmes sont en lecture seule`}
        </p>
      </div>

      {isAdmin && <ProgramForm managers={managers} />}

      {isDpAdmin && (
        <Alert>
          <ShieldCheck />
          <AlertTitle>Affectation des gestionnaires de votre DP</AlertTitle>
          <AlertDescription>
            Le référentiel des programmes et indicateurs est défini par l&apos;AREF. Vous choisissez
            ici, pour chaque programme, le Gestionnaire Programme DP de la {ownEntity?.name} qui en
            saisira les indicateurs.
            {dpManagers.length === 0 &&
              ' Aucun gestionnaire actif : créez-en un depuis « Gestion des Utilisateurs ».'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {ordered.map((program) => {
          const rows = indicators.filter((i) => i.programId === program.id)
          const editable = canManageProgram(user, program.id)
          const dpManager = dpManagerFor(program.id)
          return (
            <Card
              key={program.id}
              aria-disabled={(!editable && !isDpAdmin) || undefined}
              className={cn(!editable && !isDpAdmin && 'opacity-60 saturate-50')}
            >
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{program.name}</CardTitle>
                    {!editable && !isDpAdmin && (
                      <Badge variant="outline">
                        <Lock data-icon="inline-start" aria-hidden="true" />
                        Lecture seule
                      </Badge>
                    )}
                    {isDpAdmin &&
                      (dpManager ? (
                        <Badge className="bg-success/15 text-success">Affecté</Badge>
                      ) : (
                        <Badge className="bg-warning/20 text-warning-foreground">Non affecté</Badge>
                      ))}
                    <Badge variant="secondary">{rows.length} indicateur(s)</Badge>
                  </div>
                  <CardDescription className="max-w-2xl text-pretty">{program.description}</CardDescription>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCheck className="size-3.5" aria-hidden="true" />
                    {isDpAdmin ? (
                      <Select
                        value={dpManager?.id ?? NONE}
                        onValueChange={(v) => {
                          if (v === null) return
                          assignDpManager(program.id, user.entityId, v === NONE ? null : v)
                          toast.success(
                            v === NONE ? 'Affectation retirée' : 'Gestionnaire Programme DP affecté',
                            { description: program.name },
                          )
                        }}
                        disabled={dpManagers.length === 0}
                        items={[
                          { value: NONE, label: 'Aucun gestionnaire DP affecté' },
                          ...dpManagers.map((m) => ({ value: m.id, label: m.name })),
                        ]}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Gestionnaire Programme DP — ${program.name}`}
                          className="h-7 w-64 bg-card text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value={NONE}>Aucun gestionnaire DP affecté</SelectItem>
                            {dpManagers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : isAdmin ? (
                      <Select
                        value={program.managerId ?? NONE}
                        onValueChange={(v) => {
                          if (v === null) return
                          updateProgram(program.id, { managerId: v === NONE ? null : v })
                          toast.success('Responsable mis à jour', { description: program.name })
                        }}
                        items={[
                          { value: NONE, label: 'Aucun responsable affecté' },
                          ...managers.map((m) => ({ value: m.id, label: m.name })),
                        ]}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Gestionnaire Programme AREF — ${program.name}`}
                          className="h-7 w-64 bg-card text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value={NONE}>Aucun responsable affecté</SelectItem>
                            {managers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span>
                        Responsable : {managerName(program.managerId) ?? 'non affecté'}
                      </span>
                    )}
                  </div>
                </div>
                {!isDpAdmin && (
                  <Button
                    size="sm"
                    disabled={!editable}
                    onClick={() => setDialog({ mode: 'create', programId: program.id })}
                  >
                    <Plus data-icon="inline-start" />
                    Ajouter un indicateur
                  </Button>
                )}
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="pl-6">Indicateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Cible annuelle</TableHead>
                      {!isDpAdmin && <TableHead className="pr-6 text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isDpAdmin ? 3 : 4} className="pl-6 text-sm text-muted-foreground">
                          Aucun indicateur configuré pour ce programme.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map((ind) => (
                      <TableRow key={ind.id}>
                        <TableCell className="pl-6 font-medium">{ind.name}</TableCell>
                        <TableCell>
                          <TypeBadge type={ind.valueType} />
                        </TableCell>
                        <TableCell className={cn('text-right font-medium tabular-nums', isDpAdmin && 'pr-6')}>
                          {formatValue(ind.annualTarget, ind.valueType)}
                        </TableCell>
                        {!isDpAdmin && (
                        <TableCell className="pr-6">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!editable}
                              onClick={() => setDialog({ mode: 'target', indicator: ind })}
                            >
                              <Target data-icon="inline-start" />
                              Ajuster la cible
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Modifier ${ind.name}`}
                              disabled={!editable}
                              onClick={() => setDialog({ mode: 'edit', indicator: ind })}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Supprimer ${ind.name}`}
                              disabled={!editable}
                              className="text-destructive hover:text-destructive"
                              onClick={() => setToDelete(ind)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <IndicatorDialogForm
        key={dialog ? `${dialog.mode}-${'indicator' in dialog ? dialog.indicator.id : dialog.programId}` : 'closed'}
        dialog={dialog}
        onClose={() => setDialog(null)}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;indicateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » et l&apos;ensemble de ses saisies mensuelles seront définitivement
              retirés du référentiel. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) {
                  deleteIndicator(toDelete.id)
                  toast.success('Indicateur supprimé', { description: toDelete.name })
                }
                setToDelete(null)
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProgramForm({ managers }: { managers: { id: string; name: string }[] }) {
  const { addProgram } = useApp()
  const [name, setName] = React.useState('')
  const [managerId, setManagerId] = React.useState<string>(NONE)
  const [description, setDescription] = React.useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addProgram({
      name: name.trim(),
      description: description.trim(),
      managerId: managerId === NONE ? null : managerId,
    })
    toast.success('Programme créé', { description: name.trim() })
    setName('')
    setDescription('')
    setManagerId(NONE)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau programme</CardTitle>
        <CardDescription>
          Créer un programme régional et l&apos;affecter à un Gestionnaire Programme AREF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup className="grid gap-4 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="prog-name">Nom du programme</FieldLabel>
              <Input
                id="prog-name"
                required
                placeholder="Ex. Certification TARL"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="prog-manager">Gestionnaire Programme AREF</FieldLabel>
              <Select
                value={managerId}
                onValueChange={(v) => v !== null && setManagerId(v)}
                items={[
                  { value: NONE, label: 'Affecter plus tard' },
                  ...managers.map((m) => ({ value: m.id, label: m.name })),
                ]}
              >
                <SelectTrigger id="prog-manager" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE}>Affecter plus tard</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Le responsable pourra créer, modifier et supprimer les indicateurs de ce programme.
              </FieldDescription>
            </Field>
            <Field className="lg:col-span-2">
              <FieldLabel htmlFor="prog-desc">Description</FieldLabel>
              <Textarea
                id="prog-desc"
                rows={2}
                placeholder="Objectifs et périmètre du programme"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <Button type="submit" className="self-start">
            <FolderPlus data-icon="inline-start" />
            Créer le programme
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function IndicatorDialogForm({
  dialog,
  onClose,
}: {
  dialog: IndicatorDialog | null
  onClose: () => void
}) {
  const { programs, addIndicator, updateIndicator } = useApp()
  const initial = dialog && 'indicator' in dialog ? dialog.indicator : null

  const [name, setName] = React.useState(initial?.name ?? '')
  const [valueType, setValueType] = React.useState<ValueType>(initial?.valueType ?? 'number')
  const [target, setTarget] = React.useState(initial ? String(initial.annualTarget) : '')

  if (!dialog) return null

  const program: Program | undefined = programs.find(
    (p) => p.id === (initial ? initial.programId : dialog.mode === 'create' ? dialog.programId : ''),
  )
  const unit = VALUE_TYPE_UNIT[valueType]
  const targetOnly = dialog.mode === 'target'
  const parsedTarget = Number(target)
  const targetValid = target !== '' && !Number.isNaN(parsedTarget) && parsedTarget > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetValid) return
    if (dialog.mode === 'create') {
      if (!name.trim()) return
      addIndicator({ programId: dialog.programId, name: name.trim(), valueType, annualTarget: parsedTarget })
      toast.success('Indicateur ajouté', { description: name.trim() })
    } else if (dialog.mode === 'edit') {
      if (!name.trim()) return
      updateIndicator(dialog.indicator.id, { name: name.trim(), valueType, annualTarget: parsedTarget })
      toast.success('Indicateur modifié', { description: name.trim() })
    } else {
      updateIndicator(dialog.indicator.id, { annualTarget: parsedTarget })
      toast.success('Cible annuelle ajustée', {
        description: `${dialog.indicator.name} → ${formatValue(parsedTarget, dialog.indicator.valueType)}`,
      })
    }
    onClose()
  }

  const title =
    dialog.mode === 'create'
      ? 'Nouvel indicateur'
      : dialog.mode === 'edit'
        ? "Modifier l'indicateur"
        : 'Ajuster la cible annuelle'

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {program?.name} · les cibles sont strictement annuelles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-6">
          <FieldGroup>
            {!targetOnly && (
              <>
                <Field>
                  <FieldLabel htmlFor="ind-name">Nom de l&apos;indicateur</FieldLabel>
                  <Input
                    id="ind-name"
                    required
                    autoFocus
                    placeholder="Ex. Niveau 1 : Connaissance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ind-type">Type de valeur</FieldLabel>
                  <Select
                    value={valueType}
                    onValueChange={(v) => v !== null && setValueType(v as ValueType)}
                    items={VALUE_TYPE_LABEL}
                  >
                    <SelectTrigger id="ind-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(Object.keys(VALUE_TYPE_LABEL) as ValueType[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {VALUE_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Détermine le format de saisie (symbole %, MAD ou nombre brut).
                  </FieldDescription>
                </Field>
              </>
            )}
            <Field>
              <FieldLabel htmlFor="ind-target">Cible annuelle</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="ind-target"
                  type="number"
                  required
                  autoFocus={targetOnly}
                  min={0}
                  max={valueType === 'percent' ? 100 : undefined}
                  step={valueType === 'percent' ? 0.1 : 1}
                  placeholder="0"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                {unit && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{unit}</InputGroupText>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <FieldDescription>
                {valueType === 'percent'
                  ? 'Taux à atteindre sur l’année.'
                  : 'Volume total attendu sur l’année ; le cumul des saisies mensuelles y est comparé.'}
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!targetValid}>
              {dialog.mode === 'create' ? 'Ajouter' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
