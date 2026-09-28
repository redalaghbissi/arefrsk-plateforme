'use client'

import { ClipboardPen, FolderKanban, LayoutDashboard, Landmark, TableProperties, Users } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { View } from '@/lib/aref/types'
import { canAccessView, ROLE_LABEL } from '@/lib/aref/utils'
import { ENTITIES } from '@/lib/aref/data'
import { useApp, useCurrentUser } from './app-store'

export const NAV: { view: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'saisie', label: 'Saisie Mensuelle', icon: ClipboardPen },
  { view: 'synthese', label: 'Tableau de Synthèse', icon: TableProperties },
  { view: 'programmes', label: 'Gestion des Programmes', icon: FolderKanban },
  { view: 'utilisateurs', label: 'Gestion des Utilisateurs', icon: Users },
]

export function AppSidebar() {
  const { view, setView, sidebarCollapsed } = useApp()
  const user = useCurrentUser()
  const entity = ENTITIES.find((e) => e.id === user.entityId)
  // Strict masking: links the role cannot open are not rendered at all.
  const items = NAV.filter((item) => canAccessView(user, item.view))

  return (
    <aside
      data-collapsed={sidebarCollapsed || undefined}
      className={cn(
        'fixed inset-y-0 left-0 z-20 hidden flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 print:hidden md:flex',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center gap-3 border-b border-sidebar-border',
          sidebarCollapsed ? 'justify-center px-0' : 'px-5',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Landmark className="size-5" aria-hidden="true" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">AREF RSK</span>
            <span className="text-xs text-sidebar-foreground/70">Pilotage des indicateurs</span>
          </div>
        )}
      </div>

      <nav
        aria-label="Navigation principale"
        className={cn('flex flex-1 flex-col gap-1 py-4', sidebarCollapsed ? 'px-2' : 'px-3')}
      >
        {!sidebarCollapsed && (
          <p className="px-3 pb-2 text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
            Menu
          </p>
        )}
        {items.map((item) => {
          const active = view === item.view
          const Icon = item.icon
          const button = (
            <button
              key={item.view}
              type="button"
              aria-current={active ? 'page' : undefined}
              aria-label={sidebarCollapsed ? item.label : undefined}
              onClick={() => setView(item.view)}
              className={cn(
                'flex h-10 items-center gap-3 rounded-md text-sm font-medium transition-colors',
                sidebarCollapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
          if (!sidebarCollapsed) return button
          return (
            <Tooltip key={item.view}>
              <TooltipTrigger render={button} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
            Session active
          </p>
          <p className="mt-1 truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/70">{ROLE_LABEL[user.roleId]}</p>
          <p className="text-xs text-sidebar-foreground/70">{entity?.name}</p>
        </div>
      )}
    </aside>
  )
}
