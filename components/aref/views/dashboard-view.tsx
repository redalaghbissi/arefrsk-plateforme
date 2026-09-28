'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
import { StatusBadge, TypeBadge } from '../badges'
import { ExportExcelButton } from '../export-button'

const ALL = 'all'

export function DashboardView() {
  const { month, indicators, programs, entries, getEntry, entityFilter, programFilter, indicatorFilter, setEntityFilter, setProgramFilter, setIndicatorFilter } = useApp()
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
    (i) => effectiveIndicatorFilter === ALL || i.id === effectiveIndicatorFilter,
  )
  const effectiveEntityFilter: string = scopedEntities.some((e) => e.id === entityFilter)
    ? entityFilter
    : ALL
  const tableEntities: Entity[] = scopedEntities.filter(
    (e) => effectiveEntityFilter === ALL || e.id === effectiveEntityFilter,
  )

  const visibleProgramsForTable = scopedPrograms.filter(
    (p) => effectiveProgramFilter === ALL || p.id === effectiveProgramFilter,
  )



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

  const tauxSaisieParProgramme = React.useMemo(() => {
    return visibleProgramsForTable.map(program => {
      const inds = tableIndicators.filter(i => i.programId === program.id)
      let filled = 0
      let total = 0
      for (const ind of inds) {
        for (const ent of tableEntities) {
          total += 1
          if (getEntry(ind.id, ent.id, month).value !== null) filled += 1
        }
      }
      return {
        programme: program.name,
        taux: total ? Math.round((filled / total) * 100) : 0
      }
    }).sort((a, b) => b.taux - a.taux) // Descending
  }, [visibleProgramsForTable, tableIndicators, tableEntities, month, getEntry, entries])

  const tauxSaisieParEntite = React.useMemo(() => {
    return tableEntities.map(ent => {
      let filled = 0
      let total = 0
      for (const ind of tableIndicators) {
        total += 1
        if (getEntry(ind.id, ent.id, month).value !== null) filled += 1
      }
      return {
        entite: ent.kind === 'AREF' ? 'AREF Entité' : ent.shortName,
        taux: total ? Math.round((filled / total) * 100) : 0
      }
    }).sort((a, b) => b.taux - a.taux)
  }, [tableEntities, tableIndicators, month, getEntry, entries])

  const tauxRealisationParProgramme = React.useMemo(() => {
    return visibleProgramsForTable.map(program => {
      const inds = tableIndicators.filter(i => i.programId === program.id)
      let ratioSum = 0
      let ratioCount = 0
      for (const ind of inds) {
        const ytd = consolidate(tableEntities.map(e => yearToDate(ind, e.id as EntityId, month, getEntry)), ind.valueType)
        const ratio = achievementRatio(ytd, ind.annualTarget)
        if (ratio !== null) {
          ratioSum += Math.min(ratio, 1.5)
          ratioCount += 1
        }
      }
      return {
        programme: program.name,
        taux: ratioCount ? Math.round((ratioSum / ratioCount) * 100) : 0
      }
    }).sort((a, b) => b.taux - a.taux) // Descending
  }, [visibleProgramsForTable, tableIndicators, tableEntities, month, getEntry, entries])

  const tauxRealisationParEntite = React.useMemo(() => {
    return tableEntities.map(ent => {
      let ratioSum = 0
      let ratioCount = 0
      for (const ind of tableIndicators) {
        const ytd = yearToDate(ind, ent.id as EntityId, month, getEntry)
        const ratio = achievementRatio(ytd, ind.annualTarget)
        if (ratio !== null) {
          ratioSum += Math.min(ratio, 1.5) // capped at 150%
          ratioCount += 1
        }
      }
      return {
        entite: ent.kind === 'AREF' ? 'AREF Entité' : ent.shortName,
        taux: ratioCount ? Math.round((ratioSum / ratioCount) * 100) : 0
      }
    }).sort((a, b) => b.taux - a.taux)
  }, [tableEntities, tableIndicators, month, getEntry, entries])


  const activeFilters = []
  if (effectiveEntityFilter !== ALL) {
    activeFilters.push(scopedEntities.find((e) => e.id === effectiveEntityFilter)?.name)
  }
  if (effectiveProgramFilter !== ALL) {
    activeFilters.push(scopedPrograms.find((p) => p.id === effectiveProgramFilter)?.name)
  }
  if (effectiveIndicatorFilter !== ALL) {
    activeFilters.push(scopedIndicators.find((i) => i.id === effectiveIndicatorFilter)?.name)
  }
  
  const chartDescription = activeFilters.length > 0
    ? `Filtre actif : ${activeFilters.filter(Boolean).join(' • ')}`
    : null

  const saisieProgRef = React.useRef<HTMLDivElement>(null)
  const saisieEntRef = React.useRef<HTMLDivElement>(null)
  const realProgRef = React.useRef<HTMLDivElement>(null)
  const realEntRef = React.useRef<HTMLDivElement>(null)

  const saisieConfig: ChartConfig = {
    taux: { label: 'Taux de saisie', color: 'var(--chart-1)' },
  }
  const realisationConfig: ChartConfig = {
    taux: { label: 'Taux de réalisation', color: 'var(--chart-2)' },
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
      </div>

      {visibleProgramsForTable.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Chart 1: Taux de saisie par programme */}
          <Card ref={saisieProgRef}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>Taux de saisie par programme</CardTitle>
                {chartDescription && (
                  <CardDescription>{chartDescription}</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => saisieProgRef.current && printElement(saisieProgRef.current)}
              >
                <FileText data-icon="inline-start" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={saisieConfig} className="h-96 w-full">
                <BarChart data={tauxSaisieParProgramme} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis dataKey="programme" type="category" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">Taux de saisie</span>
                            <span className="font-mono font-medium tabular-nums">{value}%</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="taux" fill="var(--color-taux)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Taux de saisie par entité */}
          <Card ref={saisieEntRef}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>Taux de saisie par entité</CardTitle>
                {chartDescription && (
                  <CardDescription>{chartDescription}</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => saisieEntRef.current && printElement(saisieEntRef.current)}
              >
                <FileText data-icon="inline-start" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={saisieConfig} className="h-96 w-full">
                <BarChart data={tauxSaisieParEntite} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis dataKey="entite" type="category" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">Taux de saisie</span>
                            <span className="font-mono font-medium tabular-nums">{value}%</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="taux" fill="var(--color-taux)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Taux de réalisation par programme */}
          <Card ref={realProgRef}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>Taux de réalisation par programme</CardTitle>
                {chartDescription && (
                  <CardDescription>{chartDescription}</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => realProgRef.current && printElement(realProgRef.current)}
              >
                <FileText data-icon="inline-start" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={realisationConfig} className="h-96 w-full">
                <BarChart data={tauxRealisationParProgramme} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 150]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis dataKey="programme" type="category" tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">Taux de réalisation</span>
                            <span className="font-mono font-medium tabular-nums">{value}%</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="taux" fill="var(--color-taux)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Taux de réalisation par entité (Avancement) */}
          <Card ref={realEntRef}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>Taux de réalisation par entité</CardTitle>
                {chartDescription && (
                  <CardDescription>{chartDescription}</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 print:hidden"
                onClick={() => realEntRef.current && printElement(realEntRef.current)}
              >
                <FileText data-icon="inline-start" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ChartContainer config={realisationConfig} className="h-96 w-full">
                <BarChart data={tauxRealisationParEntite} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 150]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis dataKey="entite" type="category" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value) => (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <span className="text-muted-foreground">Taux de réalisation</span>
                            <span className="font-mono font-medium tabular-nums">{value}%</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="taux" fill="var(--color-taux)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Aucun programme dans votre périmètre</EmptyTitle>
            <EmptyDescription>
              Veuillez modifier vos filtres ou contacter votre administrateur.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
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
