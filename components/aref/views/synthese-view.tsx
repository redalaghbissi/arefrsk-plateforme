'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { CURRENT_YEAR, DP_ENTITIES, ENTITIES, MONTHS, MONTHS_SHORT } from '@/lib/aref/data'
import type { Entity, EntityId } from '@/lib/aref/types'
import { type ExportRow } from '@/lib/aref/export'
import {
  computeStatus,
  consolidate,
  formatCompact,
  isArefRole,
  visibleEntities,
  visiblePrograms,
  yearToDate,
} from '@/lib/aref/utils'
import { useApp, useCurrentUser } from '../app-store'
import { StatusBadge, TypeBadge } from '../badges'
import { ExportExcelButton } from '../export-button'

const ALL = 'all'

export function SyntheseView() {
  const { month, indicators, programs, getEntry, entries, entityFilter, programFilter, indicatorFilter, setEntityFilter, setProgramFilter, setIndicatorFilter } = useApp()
  const user = useCurrentUser()
  const regionalScope = isArefRole(user.roleId)

  const scopedPrograms = React.useMemo(() => visiblePrograms(user, programs), [user, programs])
  const scopedIndicators = React.useMemo(
    () => indicators.filter((i) => scopedPrograms.some((p) => p.id === i.programId)),
    [indicators, scopedPrograms],
  )
  const scopedEntities = React.useMemo(() => visibleEntities(user, ENTITIES), [user])

  const effectiveProgramFilter = scopedPrograms.some((p) => p.id === programFilter)
    ? programFilter
    : ALL
  const programIndicators = scopedIndicators.filter(
    (i) => effectiveProgramFilter === ALL || i.programId === effectiveProgramFilter,
  )
  const effectiveIndicatorFilter = programIndicators.some((i) => i.id === indicatorFilter)
    ? indicatorFilter
    : ALL
  const tableIndicators = programIndicators.filter(
    (i) => effectiveIndicatorFilter === ALL || i.id === indicatorFilter,
  )
  const effectiveEntityFilter: string = scopedEntities.some((e) => e.id === entityFilter)
    ? entityFilter
    : ALL
  const tableEntities: Entity[] = scopedEntities.filter(
    (e) => effectiveEntityFilter === ALL || e.id === effectiveEntityFilter,
  )
  const showConsolidated = regionalScope && effectiveEntityFilter === ALL

  const visibleProgramsForTable = scopedPrograms.filter(
    (p) => effectiveProgramFilter === ALL || p.id === effectiveProgramFilter,
  )

  const exportFileName = `synthese-${MONTHS[month].toLowerCase()}-${CURRENT_YEAR}`

  const buildSynthesisRows = (): ExportRow[] => {
    const rows: ExportRow[] = []
    for (const program of visibleProgramsForTable) {
      for (const ind of tableIndicators.filter((i) => i.programId === program.id)) {
        const row: ExportRow = {
          Programme: program.name,
          Indicateur: ind.name,
          Type: ind.valueType,
        }
        if (showConsolidated) {
          row['AREF Consolidé (cumul)'] = consolidate(
            ENTITIES.map((e) => yearToDate(ind, e.id, month, getEntry)),
            ind.valueType,
          )
        }
        for (const ent of tableEntities) {
          const label = ent.kind === 'AREF' ? 'AREF Entité' : ent.shortName
          row[`${label} (cumul)`] = yearToDate(ind, ent.id as EntityId, month, getEntry)
        }
        rows.push(row)
      }
    }
    return rows
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── En-tête + filtres ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Tableau de Synthèse
          </h1>
          <p className="text-sm text-muted-foreground">
            Valeurs mensuelles par entité — {MONTHS[month]} {CURRENT_YEAR}
          </p>
        </div>
      </div>

      {/* ── Tableau de synthèse ───────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle>
            {MONTHS[month]} {CURRENT_YEAR}
            {effectiveProgramFilter !== ALL && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                · {scopedPrograms.find((p) => p.id === effectiveProgramFilter)?.name}
              </span>
            )}
          </CardTitle>
          <ExportExcelButton
            getRows={buildSynthesisRows}
            fileName={exportFileName}
            sheetName="Synthèse"
            className="shrink-0 print:hidden"
          />
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="sticky left-0 z-[1] min-w-56 bg-muted/50 pl-6">
                    Indicateur
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">Cible annuelle</TableHead>
                  {showConsolidated && (
                    <TableHead className="bg-accent/40 text-right font-semibold whitespace-nowrap text-foreground">
                      AREF Consolidé
                    </TableHead>
                  )}
                  {tableEntities.map((ent) => (
                    <TableHead
                      key={ent.id}
                      className={
                        ent.kind === 'AREF'
                          ? 'text-right font-semibold whitespace-nowrap text-foreground'
                          : 'text-right whitespace-nowrap'
                      }
                    >
                      {ent.kind === 'AREF' ? 'AREF Entité' : ent.shortName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProgramsForTable.map((program) => {
                  const rows = tableIndicators.filter((i) => i.programId === program.id)
                  if (rows.length === 0) return null
                  const colCount = 2 + (showConsolidated ? 1 : 0) + tableEntities.length
                  return (
                    <React.Fragment key={program.id}>
                      <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                        <TableCell
                          colSpan={colCount}
                          className="sticky left-0 pl-6 text-xs font-semibold tracking-wide text-secondary-foreground uppercase"
                        >
                          {program.name}
                        </TableCell>
                      </TableRow>
                      {rows.map((ind) => {
                        const consolidatedMonth = consolidate(
                          ENTITIES.map((e) => getEntry(ind.id, e.id, month).value),
                          ind.valueType,
                        )
                        const consolidatedYtd = consolidate(
                          ENTITIES.map((e) => yearToDate(ind, e.id, month, getEntry)),
                          ind.valueType,
                        )
                        return (
                          <TableRow key={ind.id}>
                            <TableCell className="sticky left-0 z-[1] bg-card pl-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{ind.name}</span>
                                <TypeBadge type={ind.valueType} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCompact(ind.annualTarget, ind.valueType)}
                            </TableCell>
                            {showConsolidated && (
                              <TableCell className="bg-accent/40 text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <StatusBadge
                                    status={computeStatus(consolidatedYtd, ind.annualTarget)}
                                    className="font-semibold"
                                  >
                                    {consolidatedMonth === null
                                      ? '—'
                                      : formatCompact(consolidatedMonth, ind.valueType)}
                                  </StatusBadge>
                                  <span className="text-[10px] text-muted-foreground tabular-nums">
                                    cumul{' '}
                                    {consolidatedYtd === null
                                      ? '—'
                                      : formatCompact(consolidatedYtd, ind.valueType)}
                                  </span>
                                </div>
                              </TableCell>
                            )}
                            {tableEntities.map((ent) => {
                              const entry = getEntry(ind.id, ent.id, month)
                              const ytd = yearToDate(ind, ent.id as EntityId, month, getEntry)
                              const status = computeStatus(ytd, ind.annualTarget)
                              return (
                                <TableCell key={ent.id} className="text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <StatusBadge status={status}>
                                      {entry.value === null
                                        ? '—'
                                        : formatCompact(entry.value, ind.valueType)}
                                    </StatusBadge>
                                    <span className="text-[10px] text-muted-foreground tabular-nums">
                                      cumul{' '}
                                      {yearToDate(ind, ent.id as EntityId, month, getEntry) === null
                                        ? '—'
                                        : formatCompact(
                                            yearToDate(ind, ent.id as EntityId, month, getEntry)!,
                                            ind.valueType,
                                          )}
                                    </span>
                                  </div>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
