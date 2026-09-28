'use client'

import * as React from 'react'
import { CalendarDays, ChevronDown, KeyRound, Lock, LogOut, PanelLeft } from 'lucide-react'
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
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CURRENT_YEAR, ENTITIES, MONTHS } from '@/lib/aref/data'
import { ROLE_LABEL, initials } from '@/lib/aref/utils'
import { useApp, useCurrentUser } from './app-store'
import { ChangePasswordDialog } from './change-password-dialog'

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
          <Badge variant="secondary" className="hidden sm:inline-flex">
            <Lock data-icon="inline-start" aria-hidden="true" />
            Historique · lecture seule
          </Badge>
        ) : (
          <Badge className="hidden bg-success text-success-foreground sm:inline-flex">
            Mois en cours · saisie ouverte
          </Badge>
        )}
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
