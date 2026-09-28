'use client'

import * as React from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  VALUE_TYPE_UNIT,
  canEditEntity,
  formatCompact,
  isArefRole,
  visiblePrograms,
} from '@/lib/aref/utils'
import type { ExportRow } from '@/lib/aref/export'
import { cn } from '@/lib/utils'
import { useApp, useCurrentUser } from '../app-store'
import { TypeBadge } from '../badges'
import { ExportExcelButton } from '../export-button'

export function SaisieView() {
  const { month, isPastMonth, programs, indicators, getEntry, updateEntry, entityFilter, programFilter, indicatorFilter } = useApp()
  const user = useCurrentUser()

  const editableEntities = ENTITIES.filter((e) => canEditEntity(user, e.id))
  
  // Bind directly to global state but enforce editable entities limitation
  const effectiveEntityId = (editableEntities.some((e) => e.id === entityFilter)
    ? entityFilter
    : editableEntities[0].id) as EntityId
  const entity = ENTITIES.find((e) => e.id === effectiveEntityId)!

  const scopedPrograms = visiblePrograms(user, programs)
  
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
        'Valeur réalisée': entry.value,
      }
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Saisie Mensuelle</h1>
          <p className="text-sm text-muted-foreground">
            Réalisations des indicateurs pour {MONTHS[month]} {CURRENT_YEAR}
          </p>
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
            <ExportExcelButton
              getRows={buildExportRows}
              fileName={`saisie-${entity.shortName.toLowerCase().replace(/\s+/g, '-')}-${MONTHS[month].toLowerCase()}-${CURRENT_YEAR}`}
              sheetName="Saisie"
            />
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-64 pl-6">Indicateur</TableHead>
                    <TableHead className="w-36 text-right whitespace-nowrap">Cible annuelle</TableHead>
                    <TableHead className="w-56">Valeur réalisée</TableHead>
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
                            colSpan={4}
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
