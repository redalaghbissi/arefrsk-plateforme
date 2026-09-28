'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { FileText, Filter, FolderKanban, Gauge, ListChecks, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
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
import { type ExportRow, printElement } from '@/lib/aref/export'
import {
  ENTRY_STATUS_LABEL,
  achievementRatio,
  computeStatus,
  consolidate,
  formatCompact,
  formatValue,
  isArefRole,
  visibleEntities,
  visiblePrograms,
  yearToDate,
} from '@/lib/aref/utils'
import { useApp, useCurrentUser } from '../app-store'
import { EntryStatusBadge, StatusBadge, TypeBadge } from '../badges'
import { ExportExcelButton } from '../export-button'

const ALL = 'all'

export function DashboardView() {
  const { month, indicators, programs, entries, getEntry } = useApp()
  const user = useCurrentUser()
  const regionalScope = isArefRole(user.roleId)

  const scopedPrograms = React.useMemo(() => visiblePrograms(user, programs), [user, programs])
  const scopedIndicators = React.useMemo(
    () => indicators.filter((i) => scopedPrograms.some((p) => p.id === i.programId)),
    [indicators, scopedPrograms],
  )
  const scopedEntities = React.useMemo(() => visibleEntities(user, ENTITIES), [user])

  const [programFilter, setProgramFilter] = React.useState(ALL)
  const [indicatorFilter, setIndicatorFilter] = React.useState(ALL)
  const [entityFilter, setEntityFilter] = React.useState<string>(ALL)

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
    (i) => effectiveIndicatorFilter === ALL || i.id === effectiveIndicatorFilter,
  )
  const effectiveEntityFilter: string = scopedEntities.some((e) => e.id === entityFilter)
    ? entityFilter
    : ALL
  const tableEntities: Entity[] = scopedEntities.filter(
    (e) => effectiveEntityFilter === ALL || e.id === effectiveEntityFilter,
  )
  // The consolidated column only makes sense when the whole region is displayed.
  const showConsolidated = regionalScope && effectiveEntityFilter === ALL

  const visibleProgramsForTable = scopedPrograms.filter(
    (p) => effectiveProgramFilter === ALL || p.id === effectiveProgramFilter,
  )

  // Charts always plot one indicator: the filtered one, else the first of the current scope.
  const chartIndicator =
    programIndicators.find((i) => i.id === effectiveIndicatorFilter) ?? programIndicators[0] ?? null

  const kpis = React.useMemo(() => {
    let filled = 0
    let total = 0
    let ratioSum = 0
    let ratioCount = 0
    for (const ind of tableIndicators) {
      for (const ent of tableEntities) {
        total += 1
        if (getEntry(ind.id, ent.id, month).value !== null) filled += 1
      }
      // Realisation is measured on the consolidated year-to-date figure vs. the annual target.
      const ytd = consolidate(
        tableEntities.map((ent) => yearToDate(ind, ent.id, month, getEntry)),
        ind.valueType,
      )
      const ratio = achievementRatio(ytd, ind.annualTarget)
      if (ratio !== null) {
        ratioSum += Math.min(ratio, 1.5)
        ratioCount += 1
      }
    }
    return {
      programs: visibleProgramsForTable.length,
      indicators: tableIndicators.length,
      entryRate: total ? Math.round((filled / total) * 100) : 0,
      filled,
      total,
      achievement: ratioCount ? Math.round((ratioSum / ratioCount) * 100) : 0,
    }
  }, [tableIndicators, tableEntities, visibleProgramsForTable, month, getEntry, entries])

  const lineData = React.useMemo(() => {
    if (!chartIndicator) return []
    return MONTHS_SHORT.map((label, m) => {
      const consolidated = consolidate(
        tableEntities.map((ent) => getEntry(chartIndicator.id, ent.id, m).value),
        chartIndicator.valueType,
      )
      return { month: label, valeur: consolidated }
    })
  }, [chartIndicator, tableEntities, getEntry, entries])

  const barData = React.useMemo(() => {
    if (!chartIndicator) return []
    return DP_ENTITIES.map((dp) => ({
      dp: dp.shortName,
      valeur: getEntry(chartIndicator.id, dp.id, month).value ?? 0,
    }))
  }, [chartIndicator, getEntry, month, entries])

  const scopeLabel =
    effectiveEntityFilter === ALL
      ? regionalScope
        ? 'AREF consolidé'
        : scopedEntities[0]?.name
      : ENTITIES.find((e) => e.id === effectiveEntityFilter)?.name

  const exportFileName = `synthese-${MONTHS[month].toLowerCase()}-${CURRENT_YEAR}`

  // Flat rows mirroring the synthesis table under the active filters.
  const buildSynthesisRows = (): ExportRow[] => {
    const rows: ExportRow[] = []
    for (const program of visibleProgramsForTable) {
      for (const ind of tableIndicators.filter((i) => i.programId === program.id)) {
        const row: ExportRow = {
          Programme: program.name,
          Indicateur: ind.name,
          Type: ind.valueType,
          'Cible annuelle': ind.annualTarget,
        }
        if (showConsolidated) {
          row['AREF Consolidé (mois)'] = consolidate(
            ENTITIES.map((e) => getEntry(ind.id, e.id, month).value),
            ind.valueType,
          )
          row['AREF Consolidé (cumul)'] = consolidate(
            ENTITIES.map((e) => yearToDate(ind, e.id, month, getEntry)),
            ind.valueType,
          )
        }
        for (const ent of tableEntities) {
          const entry = getEntry(ind.id, ent.id, month)
          const label = ent.kind === 'AREF' ? 'AREF Entité' : ent.shortName
          row[`${label} (valeur)`] = entry.value
          row[`${label} (cumul)`] = yearToDate(ind, ent.id as EntityId, month, getEntry)
          row[`${label} (statut)`] = ENTRY_STATUS_LABEL[entry.status]
        }
        rows.push(row)
      }
    }
    return rows
  }

  const lineCardRef = React.useRef<HTMLDivElement>(null)
  const barCardRef = React.useRef<HTMLDivElement>(null)

  const lineConfig: ChartConfig = {
    valeur: { label: scopeLabel ?? 'Valeur', color: 'var(--chart-1)' },
  }
  const barConfig: ChartConfig = {
    valeur: { label: 'Valeur réalisée', color: 'var(--chart-1)' },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Nombre de programmes"
          value={String(kpis.programs)}
          hint={regionalScope ? 'Programmes régionaux suivis' : `Programmes suivis par la ${scopedEntities[0]?.shortName}`}
        />
        <StatCard
          icon={ListChecks}
          label="Nombre d'indicateurs"
          value={String(kpis.indicators)}
          hint="Indicateurs dans le périmètre affiché"
        />
        <StatCard
          icon={Gauge}
          label="Taux de saisie"
          value={`${kpis.entryRate} %`}
          hint={`${kpis.filled} valeurs saisies sur ${kpis.total} — ${MONTHS[month]}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de réalisation"
          value={`${kpis.achievement} %`}
          hint="Cumul annuel réalisé / cible annuelle (plafonné à 150 %)"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard Régional</h1>
          <p className="text-sm text-muted-foreground">
            {regionalScope
              ? `Vue consolidée AREF et ${DP_ENTITIES.length} directions provinciales`
              : `Données de la ${scopedEntities[0]?.name}`}{' '}
            — {MONTHS[month]} {CURRENT_YEAR}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden" role="group" aria-label="Filtres rapides">
          <Filter className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
          {regionalScope && (
            <Select
              value={effectiveEntityFilter}
              onValueChange={(v) => v !== null && setEntityFilter(v)}
              items={[
                { value: ALL, label: 'Toutes les entités' },
                ...scopedEntities.map((e) => ({ value: e.id, label: e.name })),
              ]}
            >
              <SelectTrigger aria-label="Filtrer par entité" className="w-full bg-card sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>Toutes les entités</SelectItem>
                  {scopedEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <Select
            value={effectiveProgramFilter}
            onValueChange={(v) => {
              if (v === null) return
              setProgramFilter(v)
              setIndicatorFilter(ALL)
            }}
            items={[
              { value: ALL, label: 'Tous les programmes' },
              ...scopedPrograms.map((p) => ({ value: p.id, label: p.name })),
            ]}
          >
            <SelectTrigger aria-label="Filtrer par programme" className="w-full bg-card sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Tous les programmes</SelectItem>
                {scopedPrograms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={effectiveIndicatorFilter}
            onValueChange={(v) => v !== null && setIndicatorFilter(v)}
            items={[
              { value: ALL, label: 'Tous les indicateurs' },
              ...scopedIndicators.map((i) => ({ value: i.id, label: i.name })),
            ]}
          >
            <SelectTrigger aria-label="Filtrer par indicateur" className="w-full bg-card sm:w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL}>Tous les indicateurs</SelectItem>
              </SelectGroup>
              {visibleProgramsForTable.map((program) => {
                const rows = scopedIndicators.filter((i) => i.programId === program.id)
                if (rows.length === 0) return null
                return (
                  <SelectGroup key={program.id}>
                    <SelectLabel>{program.name}</SelectLabel>
                    {rows.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartIndicator ? (
        <div className={regionalScope ? 'grid gap-6 xl:grid-cols-5' : 'grid gap-6'}>
          <Card ref={lineCardRef} className={regionalScope ? 'xl:col-span-3' : undefined}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>Évolution sur 12 mois</CardTitle>
                <CardDescription>
                  {chartIndicator.name} · {scopeLabel} · cible annuelle{' '}
                  {formatCompact(chartIndicator.annualTarget, chartIndicator.valueType)}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => lineCardRef.current && printElement(lineCardRef.current)}
              >
                <FileText data-icon="inline-start" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineConfig} className="h-72 w-full">
                <LineChart data={lineData} margin={{ left: 8, right: 16, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v) => formatCompact(Number(v), chartIndicator.valueType)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {lineConfig[name as keyof typeof lineConfig]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatValue(Number(value), chartIndicator.valueType)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="valeur"
                    type="monotone"
                    stroke="var(--color-valeur)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {regionalScope && (
            <Card ref={barCardRef} className="xl:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <CardTitle>Comparaison des {DP_ENTITIES.length} DP</CardTitle>
                  <CardDescription>
                    {chartIndicator.name} — {MONTHS[month]} {CURRENT_YEAR}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 print:hidden"
                  onClick={() => barCardRef.current && printElement(barCardRef.current)}
                >
                  <FileText data-icon="inline-start" />
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barConfig} className="h-72 w-full">
                  <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCompact(Number(v), chartIndicator.valueType)}
                    />
                    <YAxis dataKey="dp" type="category" tickLine={false} axisLine={false} width={96} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value) => (
                            <div className="flex flex-1 items-center justify-between gap-4">
                              <span className="text-muted-foreground">Valeur réalisée</span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatValue(Number(value), chartIndicator.valueType)}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    {chartIndicator.valueType === 'percent' && (
                      <ReferenceLine
                        x={chartIndicator.annualTarget}
                        stroke="var(--chart-3)"
                        strokeDasharray="6 4"
                        strokeWidth={2}
                        label={{
                          value: 'Cible annuelle',
                          position: 'top',
                          fill: 'var(--chart-3)',
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Bar dataKey="valeur" fill="var(--color-valeur)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Aucun indicateur dans votre périmètre</EmptyTitle>
            <EmptyDescription>
              Aucun programme ne vous est affecté. Contactez votre administrateur.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Tableau de synthèse — {MONTHS[month]}</CardTitle>
            <CardDescription>
              Valeurs du mois par entité.{' '}
              {showConsolidated &&
                'La colonne AREF Consolidé regroupe l’AREF et les 7 DP : somme pour les volumes et budgets, moyenne pour les pourcentages. '}
              Couleur selon le cumul annuel rapporté à la cible annuelle : vert atteint, orange au-delà
              de 50 %, rouge en dessous.
            </CardDescription>
          </div>
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
                                    <EntryStatusBadge
                                      status={entry.status}
                                      className="h-4 px-1.5 text-[10px]"
                                    />
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

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
