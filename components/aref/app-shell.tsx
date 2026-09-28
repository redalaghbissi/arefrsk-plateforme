'use client'

import { ClipboardPen, FolderKanban, LayoutDashboard, Users } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import type { View } from '@/lib/aref/types'
import { canAccessView } from '@/lib/aref/utils'
import { cn } from '@/lib/utils'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { AppProvider, useApp, useCurrentUser } from './app-store'
import { DashboardView } from './views/dashboard-view'
import { LoginView } from './views/login-view'
import { ProgrammesView } from './views/programmes-view'
import { SaisieView } from './views/saisie-view'
import { UtilisateursView } from './views/utilisateurs-view'

export function AppShell() {
  return (
    <AppProvider>
      <Gate />
      <Toaster position="top-right" richColors />
    </AppProvider>
  )
}

function Gate() {
  const { currentUser, sidebarCollapsed } = useApp()
  if (!currentUser) return <LoginView />
  return (
    <div className="min-h-svh">
      <AppSidebar />
      <div
        className={cn(
          'flex min-h-svh flex-col transition-[padding] duration-200 print:pl-0',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-64',
        )}
      >
        <AppHeader />
        <main className="flex-1 p-4 pb-24 print:p-0 md:p-6 md:pb-6 lg:p-8">
          <ActiveView />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

function ActiveView() {
  const { view } = useApp()
  switch (view) {
    case 'dashboard':
      return <DashboardView />
    case 'saisie':
      return <SaisieView />
    case 'programmes':
      return <ProgrammesView />
    case 'utilisateurs':
      return <UtilisateursView />
  }
}

const MOBILE_NAV: { view: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'saisie', label: 'Saisie', icon: ClipboardPen },
  { view: 'programmes', label: 'Programmes', icon: FolderKanban },
  { view: 'utilisateurs', label: 'Utilisateurs', icon: Users },
]

function MobileNav() {
  const { view, setView } = useApp()
  const user = useCurrentUser()
  const items = MOBILE_NAV.filter((item) => canAccessView(user, item.view))
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-sidebar text-sidebar-foreground print:hidden md:hidden"
    >
      {items.map((item) => {
        const active = view === item.view
        const Icon = item.icon
        return (
          <button
            key={item.view}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => setView(item.view)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium',
              active && 'text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
