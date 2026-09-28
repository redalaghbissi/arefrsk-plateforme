'use client'

import * as React from 'react'
import { CheckCheck, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
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
import { CURRENT_YEAR, ENTITIES, MONTHS } from '@/lib/aref/data'
import type { Indicator, EntityId, Entry } from '@/lib/aref/types'
import {
  ENTRY_STATUS_LABEL,
  VALUE_TYPE_UNIT,
  canEditEntity,
  formatCompact,
  isArefRole,
  visiblePrograms,
} from '@/lib/aref/utils'
import type { ExportRow } from '@/lib/aref/export'
import { cn } from '@/lib/utils'
import { useApp, useCurrentUser } from '../app-store'
import { EntryStatusBadge, TypeBadge } from '../badges'
import { ExportExcelButton } from '../export-button'

export function SaisieView() {
  const { month, isPastMonth, programs, indicators, getEntry, updateEntry, markEntered } = useApp()
  const user = useCurrentUser()

  const editableEntities = ENTITIES.filter((e) => canEditEntity(user, e.id))
  const [entityId, setEntityId] = React.useState<EntityId>(editableEntities[0].id)
  const effectiveEntityId = editableEntities.some((e) => e.id === entityId)
    ? entityId
    : editableEntities[0].id
  const entity = ENTITIES.find((e) => e.id === effectiveEntityId)!

  const scopedPrograms = visiblePrograms(user, programs)
  const [programFilter, setProgramFilter] = React.useState<string>('all')
  const effectiveProgramFilter = scopedPrograms.some((p) => p.id === programFilter)
    ? programFilter
    : 'all'
  const visibleIndicators = indicators.filter(
    (i) =>
      scopedPrograms.some((p) => p.id === i.programId) &&
      (effectiveProgramFilter === 'all' || i.programId === effectiveProgramFilter),
  )

  const readOnly = isPastMonth

  const buildExportRows = (): ExportRow[] =>
    visibleIndicators.map((ind) => {
      const entry = getEntry(ind.id, effectiveEntityId, month)
      return {
        Entité: entity.name,
        Mois: `${MONTHS[month]} ${CURRENT_YEAR}`,
        Programme: programs.find((p) => p.id === ind.programId)?.name ?? '',
        Indicateur: ind.name,
        Type: ind.valueType,
        'Cible annuelle': ind.annualTarget,
        'Valeur réalisée': entry.value,
        'Statut saisie': ENTRY_STATUS_LABEL[entry.status],
        Remarques: entry.remark,
      }
    })

  const counts = visibleIndicators.reduce(
    (acc, ind) => {
      acc[getEntry(ind.id, effectiveEntityId, month).status] += 1
      return acc
    },
    { not_entered: 0, in_progress: 0, entered: 0 },
  )

  const handleValidate = () => {
    const done = markEntered(
      visibleIndicators.map((i) => i.id),
      effectiveEntityId,
    )
    if (done === 0) {
      toast.info('Aucune valeur en cours à valider')
      return
    }
    toast.success(`${done} indicateur(s) validé(s)`, {
      description: `${entity.name} — ${MONTHS[month]} ${CURRENT_YEAR}`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Saisie Mensuelle</h1>
          <p className="text-sm text-muted-foreground">
            Réalisations des indicateurs pour {MONTHS[month]} {CURRENT_YEAR}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={effectiveProgramFilter}
            onValueChange={(v) => v !== null && setProgramFilter(v)}
            items={[
              { value: 'all', label: 'Tous mes programmes' },
              ...scopedPrograms.map((p) => ({ value: p.id, label: p.name })),
            ]}
          >
            <SelectTrigger aria-label="Filtrer par programme" className="w-56 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tous mes programmes</SelectItem>
                {scopedPrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={effectiveEntityId}
            onValueChange={(v) => v !== null && setEntityId(v as EntityId)}
            disabled={editableEntities.length === 1}
            items={editableEntities.map((e) => ({ value: e.id, label: e.name }))}
          >
            <SelectTrigger aria-label="Entité saisie" className="w-52 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {editableEntities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button onClick={handleValidate} disabled={readOnly || visibleIndicators.length === 0}>
            <CheckCheck data-icon="inline-start" />
            Valider la saisie
          </Button>
        </div>
      </div>

      {readOnly ? (
        <Alert>
          <Lock />
          <AlertTitle>Mois clôturé — historique verrouillé</AlertTitle>
          <AlertDescription>
            Les valeurs de {MONTHS[month]} {CURRENT_YEAR} sont figées, y compris celles restées « En
            cours » à la clôture. Sélectionnez le mois en cours dans l&apos;en-tête pour ouvrir la saisie.
          </AlertDescription>
        </Alert>
      ) : !isArefRole(user.roleId) ? (
        <Alert>
          <ShieldCheck />
          <AlertTitle>Périmètre restreint à la saisie</AlertTitle>
          <AlertDescription>
            Vous renseignez uniquement la colonne de la {entity.name}
            {user.roleId === 'gest_dp' ? ' pour les programmes qui vous sont affectés' : ''}. La
            structure des indicateurs et les cibles ne sont pas modifiables depuis cet écran.
          </AlertDescription>
        </Alert>
      ) : null}

      {visibleIndicators.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Aucun indicateur à saisir</EmptyTitle>
            <EmptyDescription>
              Aucun programme ne vous est affecté. Demandez à votre Admin DP de vous rattacher à un
              programme.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{entity.name}</CardTitle>
              <CardDescription>
                {visibleIndicators.length} indicateur(s) · cible annuelle en référence · remarques
                facultatives.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2" aria-label="Récapitulatif des statuts">
                <EntryStatusBadge status="not_entered" />
                <span className="-ml-1 text-sm font-medium tabular-nums">{counts.not_entered}</span>
                <EntryStatusBadge status="in_progress" />
                <span className="-ml-1 text-sm font-medium tabular-nums">{counts.in_progress}</span>
                <EntryStatusBadge status="entered" />
                <span className="-ml-1 text-sm font-medium tabular-nums">{counts.entered}</span>
              </div>
              <ExportExcelButton
                getRows={buildExportRows}
                fileName={`saisie-${entity.shortName.toLowerCase().replace(/\s+/g, '-')}-${MONTHS[month].toLowerCase()}-${CURRENT_YEAR}`}
                sheetName="Saisie"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-64 pl-6">Indicateur</TableHead>
                    <TableHead className="w-36 text-right whitespace-nowrap">Cible annuelle</TableHead>
                    <TableHead className="w-56">Valeur réalisée</TableHead>
                    <TableHead className="w-32">Statut saisie</TableHead>
                    <TableHead className="min-w-72 pr-6">
                      Remarques <span className="font-normal text-muted-foreground">(optionnel)</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedPrograms.map((program) => {
                    const rows = visibleIndicators.filter((i) => i.programId === program.id)
                    if (rows.length === 0) return null
                    return (
                      <React.Fragment key={program.id}>
                        <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                          <TableCell
                            colSpan={5}
                            className="pl-6 text-xs font-semibold tracking-wide text-secondary-foreground uppercase"
                          >
                            {program.name}
                          </TableCell>
                        </TableRow>
                        {rows.map((ind) => (
                          <EntryRow
                            key={ind.id}
                            indicator={ind}
                            entry={getEntry(ind.id, effectiveEntityId, month)}
                            readOnly={readOnly}
                            onChange={(patch) => updateEntry(ind.id, effectiveEntityId, patch)}
                          />
                        ))}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EntryRow({
  indicator,
  entry,
  readOnly,
  onChange,
}: {
  indicator: Indicator
  entry: Entry
  readOnly: boolean
  onChange: (patch: Partial<Entry>) => void
}) {
  const unit = VALUE_TYPE_UNIT[indicator.valueType]

  return (
    <TableRow className={cn(readOnly && 'bg-muted/30 text-muted-foreground')}>
      <TableCell className="pl-6">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{indicator.name}</span>
          <TypeBadge type={indicator.valueType} />
        </div>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCompact(indicator.annualTarget, indicator.valueType)}
      </TableCell>
      <TableCell>
        <InputGroup className={cn(readOnly && 'bg-muted')}>
          <InputGroupInput
            type="number"
            inputMode="decimal"
            min={0}
            max={indicator.valueType === 'percent' ? 100 : undefined}
            step={indicator.valueType === 'percent' ? 0.1 : 1}
            aria-label={`Valeur réalisée — ${indicator.name}`}
            placeholder={readOnly ? '—' : '0'}
            disabled={readOnly}
            value={entry.value ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              onChange({ value: raw === '' ? null : Number(raw) })
            }}
            className="tabular-nums"
          />
          {unit && (
            <InputGroupAddon align="inline-end">
              <InputGroupText>{unit}</InputGroupText>
            </InputGroupAddon>
          )}
        </InputGroup>
      </TableCell>
      <TableCell>
        <EntryStatusBadge status={entry.status} />
      </TableCell>
      <TableCell className="pr-6">
        <Textarea
          aria-label={`Remarques — ${indicator.name}`}
          placeholder={readOnly ? '' : 'Commentaire facultatif…'}
          disabled={readOnly}
          value={entry.remark}
          onChange={(e) => onChange({ remark: e.target.value })}
          rows={2}
          className={cn('min-h-0 resize-none text-sm', readOnly && 'bg-muted')}
        />
      </TableCell>
    </TableRow>
  )
}
