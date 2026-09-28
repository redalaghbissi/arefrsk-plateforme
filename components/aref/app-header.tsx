'use client'

import * as React from 'react'
import { CalendarDays, ChevronDown, Filter, KeyRound, Lock, LogOut, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENT_YEAR, ENTITIES, MONTHS } from '@/lib/aref/data'
import type { EntityId } from '@/lib/aref/types'
import { ROLE_LABEL, canEditEntity, initials, isArefRole, visibleEntities, visiblePrograms } from '@/lib/aref/utils'
import { useApp, useCurrentUser } from './app-store'
import { ChangePasswordDialog } from './change-password-dialog'

const ALL = 'all'

function GlobalFilters() {
  const {
    view,
    programs,
    indicators,
    entityFilter,
    setEntityFilter,
    programFilter,
    setProgramFilter,
    indicatorFilter,
    setIndicatorFilter,
  } = useApp()
  const user = useCurrentUser()
  const regionalScope = isArefRole(user.roleId)

  if (!['dashboard', 'saisie', 'synthese'].includes(view)) return null

  const isSaisie = view === 'saisie'
  
  const scopedPrograms = React.useMemo(() => visiblePrograms(user, programs), [user, programs])
  const scopedIndicators = React.useMemo(
    () => indicators.filter((i) => scopedPrograms.some((p) => p.id === i.programId)),
    [indicators, scopedPrograms],
  )
  
  const entityOptions = React.useMemo(() => {
    if (isSaisie) return ENTITIES.filter((e) => canEditEntity(user, e.id))
    return visibleEntities(user, ENTITIES)
  }, [isSaisie, user])

  const effectiveEntityFilter = entityOptions.some((e) => e.id === entityFilter) ? entityFilter : (isSaisie ? entityOptions[0].id : ALL)
  const effectiveProgramFilter = scopedPrograms.some((p) => p.id === programFilter) ? programFilter : ALL
  
  const visibleProgramsForFilter = scopedPrograms.filter((p) => effectiveProgramFilter === ALL || p.id === effectiveProgramFilter)

  return (
    <div className="hidden lg:flex items-center gap-2 border-l pl-3 ml-1">
      <Filter className="size-4 text-muted-foreground mr-1" aria-hidden="true" />
      
      {(!isSaisie ? regionalScope : entityOptions.length > 1) && (
        <Select
          value={effectiveEntityFilter}
          onValueChange={(v) => v !== null && setEntityFilter(v)}
          items={isSaisie ? entityOptions.map((e) => ({ value: e.id, label: e.name })) : [
            { value: ALL, label: 'Toutes les entités' },
            ...entityOptions.map((e) => ({ value: e.id, label: e.name })),
          ]}
        >
          <SelectTrigger aria-label="Filtrer par entité" className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {!isSaisie && <SelectItem value={ALL}>Toutes les entités</SelectItem>}
              {entityOptions.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
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
        <SelectTrigger aria-label="Filtrer par programme" className="w-44 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>Tous les programmes</SelectItem>
            {scopedPrograms.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {!isSaisie && (
        <Select
          value={scopedIndicators.some(i => i.id === indicatorFilter) ? indicatorFilter : ALL}
          onValueChange={(v) => v !== null && setIndicatorFilter(v)}
          items={[
            { value: ALL, label: 'Tous les indicateurs' },
            ...scopedIndicators.map((i) => ({ value: i.id, label: i.name })),
          ]}
        >
          <SelectTrigger aria-label="Filtrer par indicateur" className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL}>Tous les indicateurs</SelectItem>
            </SelectGroup>
            {visibleProgramsForFilter.map((program) => {
              const rows = scopedIndicators.filter((i) => i.programId === program.id)
              if (rows.length === 0) return null
              return (
                <SelectGroup key={program.id}>
                  <SelectLabel>{program.name}</SelectLabel>
                  {rows.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                  ))}
                </SelectGroup>
              )
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

export function AppHeader() {
  const { month, setMonth, currentMonth, isPastMonth, logout, toggleSidebar, sidebarCollapsed } = useApp()
  const user = useCurrentUser()
  const entity = ENTITIES.find((e) => e.id === user.entityId)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card px-4 print:hidden md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-pressed={sidebarCollapsed}
        aria-label={sidebarCollapsed ? 'Déployer le menu latéral' : 'Replier le menu latéral'}
        className="hidden md:inline-flex"
      >
        <PanelLeft />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <Select
            value={String(month)}
            onValueChange={(v) => v !== null && setMonth(Number(v))}
            items={MONTHS.map((label, idx) => ({ value: String(idx), label: `${label} ${CURRENT_YEAR}` }))}
          >
            <SelectTrigger aria-label="Mois de référence" className="w-40 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {MONTHS.map((label, idx) => (
                  <SelectItem key={label} value={String(idx)} disabled={idx > currentMonth}>
                    {label} {CURRENT_YEAR}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {isPastMonth ? (
          <Badge variant="secondary" className="hidden sm:inline-flex shrink-0">
            <Lock data-icon="inline-start" aria-hidden="true" />
            Historique · lecture seule
          </Badge>
        ) : (
          <Badge className="hidden bg-success text-success-foreground sm:inline-flex shrink-0">
            Mois en cours · saisie ouverte
          </Badge>
        )}
        <GlobalFilters />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-11 gap-3 px-2"
              aria-label={`Menu du compte de ${user.name}`}
            />
          }
        >
          <div className="hidden flex-col items-end leading-tight md:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {ROLE_LABEL[user.roleId]} · {entity?.shortName}
            </span>
          </div>
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="text-muted-foreground" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {ROLE_LABEL[user.roleId]} · {entity?.name}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
              <KeyRound />
              Changer le mot de passe
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                logout()
                toast.success('Vous êtes déconnecté')
              }}
            >
              <LogOut />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </header>
  )
}
