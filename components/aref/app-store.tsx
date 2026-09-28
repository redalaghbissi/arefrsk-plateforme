'use client'

import * as React from 'react'
import {
  CURRENT_MONTH,
  INDICATORS,
  PROGRAMS,
  USERS,
  buildSeedEntries,
  entryKey,
} from '@/lib/aref/data'
import type {
  Entry,
  EntryMap,
  EntityId,
  Indicator,
  Program,
  User,
  View,
} from '@/lib/aref/types'
import { canAccessView, generatePassword } from '@/lib/aref/utils'

type LoginResult = { ok: true } | { ok: false; error: string }

type AppState = {
  currentUser: User | null
  login: (email: string, password: string) => LoginResult
  logout: () => void
  view: View
  setView: (view: View) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  /** Lets the signed-in user change their own password after confirming the current one. */
  changeOwnPassword: (current: string, next: string) => { ok: true } | { ok: false; error: string }
  month: number
  setMonth: (month: number) => void
  currentMonth: number
  isPastMonth: boolean
  programs: Program[]
  addProgram: (program: Omit<Program, 'id'>) => void
  updateProgram: (id: string, patch: Partial<Program>) => void
  /** Assigns (or clears) the single "Gestionnaire Programme DP" of a program within one DP. */
  assignDpManager: (programId: string, entityId: EntityId, userId: string | null) => void
  indicators: Indicator[]
  addIndicator: (indicator: Omit<Indicator, 'id'>) => void
  updateIndicator: (id: string, patch: Partial<Indicator>) => void
  deleteIndicator: (id: string) => void
  entries: EntryMap
  getEntry: (indicatorId: string, entityId: EntityId, month?: number) => Entry
  updateEntry: (indicatorId: string, entityId: EntityId, patch: Partial<Entry>) => void
  markEntered: (indicatorIds: string[], entityId: EntityId) => number
  users: User[]
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, patch: Partial<User>) => void
  resetPassword: (id: string) => string
}

const AppContext = React.createContext<AppState | null>(null)

const EMPTY_ENTRY: Entry = { value: null, remark: '', status: 'not_entered' }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [view, setViewState] = React.useState<View>('dashboard')
  const [month, setMonth] = React.useState(CURRENT_MONTH)
  const [programs, setPrograms] = React.useState<Program[]>(PROGRAMS)
  const [indicators, setIndicators] = React.useState<Indicator[]>(INDICATORS)
  const [entries, setEntries] = React.useState<EntryMap>(() => buildSeedEntries())
  const [users, setUsers] = React.useState<User[]>(USERS)

  const currentUser = users.find((u) => u.id === currentUserId) ?? null

  const login = React.useCallback(
    (email: string, password: string): LoginResult => {
      const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!user || user.password !== password) {
        return { ok: false, error: 'Adresse e-mail ou mot de passe incorrect.' }
      }
      if (!user.active) {
        return { ok: false, error: 'Ce compte est désactivé. Contactez votre administrateur.' }
      }
      setCurrentUserId(user.id)
      setViewState('dashboard')
      return { ok: true }
    },
    [users],
  )

  const logout = React.useCallback(() => {
    setCurrentUserId(null)
    setViewState('dashboard')
    setMonth(CURRENT_MONTH)
  }, [])

  const setView = React.useCallback(
    (next: View) => {
      if (currentUser && canAccessView(currentUser, next)) setViewState(next)
    },
    [currentUser],
  )

  const getEntry = React.useCallback(
    (indicatorId: string, entityId: EntityId, m: number = month) =>
      entries[entryKey(indicatorId, entityId, m)] ?? EMPTY_ENTRY,
    [entries, month],
  )

  const updateEntry = React.useCallback(
    (indicatorId: string, entityId: EntityId, patch: Partial<Entry>) => {
      const key = entryKey(indicatorId, entityId, month)
      setEntries((prev) => {
        const merged: Entry = { ...(prev[key] ?? EMPTY_ENTRY), ...patch }
        // Any edit moves the entry back to "en cours"; clearing the value resets it.
        merged.status = merged.value === null ? 'not_entered' : 'in_progress'
        return { ...prev, [key]: merged }
      })
    },
    [month],
  )

  const markEntered = React.useCallback(
    (indicatorIds: string[], entityId: EntityId) => {
      let count = 0
      setEntries((prev) => {
        const next = { ...prev }
        for (const id of indicatorIds) {
          const key = entryKey(id, entityId, month)
          const entry = next[key]
          if (entry && entry.value !== null && entry.status !== 'entered') {
            next[key] = { ...entry, status: 'entered' }
            count += 1
          }
        }
        return next
      })
      return count
    },
    [month],
  )

  const addProgram = React.useCallback((program: Omit<Program, 'id'>) => {
    const id = `prog-${Date.now()}`
    setPrograms((prev) => [...prev, { ...program, id }])
    if (program.managerId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === program.managerId ? { ...u, programIds: [...new Set([...u.programIds, id])] } : u,
        ),
      )
    }
  }, [])

  const updateProgram = React.useCallback((id: string, patch: Partial<Program>) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    if (patch.managerId !== undefined) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.roleId !== 'gest_aref') return u
          const has = u.programIds.includes(id)
          if (u.id === patch.managerId && !has) return { ...u, programIds: [...u.programIds, id] }
          if (u.id !== patch.managerId && has)
            return { ...u, programIds: u.programIds.filter((p) => p !== id) }
          return u
        }),
      )
    }
  }, [])

  const assignDpManager = React.useCallback(
    (programId: string, entityId: EntityId, userId: string | null) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.roleId !== 'gest_dp' || u.entityId !== entityId) return u
          const has = u.programIds.includes(programId)
          if (u.id === userId && !has) return { ...u, programIds: [...u.programIds, programId] }
          if (u.id !== userId && has)
            return { ...u, programIds: u.programIds.filter((p) => p !== programId) }
          return u
        }),
      )
    },
    [],
  )

  const addIndicator = React.useCallback((indicator: Omit<Indicator, 'id'>) => {
    setIndicators((prev) => [...prev, { ...indicator, id: `ind-${Date.now()}` }])
  }, [])

  const updateIndicator = React.useCallback((id: string, patch: Partial<Indicator>) => {
    setIndicators((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const deleteIndicator = React.useCallback((id: string) => {
    setIndicators((prev) => prev.filter((i) => i.id !== id))
    setEntries((prev) => {
      const next: EntryMap = {}
      for (const [key, entry] of Object.entries(prev)) {
        if (!key.startsWith(`${id}|`)) next[key] = entry
      }
      return next
    })
  }, [])

  const addUser = React.useCallback((user: Omit<User, 'id'>) => {
    setUsers((prev) => [...prev, { ...user, id: `u-${Date.now()}` }])
  }, [])

  const updateUser = React.useCallback((id: string, patch: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)))
  }, [])

  const resetPassword = React.useCallback((id: string) => {
    const password = generatePassword()
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password } : u)))
    return password
  }, [])

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const toggleSidebar = React.useCallback(() => setSidebarCollapsed((c) => !c), [])

  const changeOwnPassword = React.useCallback(
    (current: string, next: string): { ok: true } | { ok: false; error: string } => {
      if (!currentUser) return { ok: false, error: 'Aucune session active.' }
      if (currentUser.password !== current) return { ok: false, error: 'Mot de passe actuel incorrect.' }
      if (next.length < 8)
        return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }
      if (next === current)
        return { ok: false, error: 'Le nouveau mot de passe doit être différent de l’actuel.' }
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, password: next } : u)))
      return { ok: true }
    },
    [currentUser],
  )

  const value: AppState = {
    currentUser,
    login,
    logout,
    view,
    setView,
    sidebarCollapsed,
    toggleSidebar,
    changeOwnPassword,
    month,
    setMonth,
    currentMonth: CURRENT_MONTH,
    isPastMonth: month < CURRENT_MONTH,
    programs,
    addProgram,
    updateProgram,
    assignDpManager,
    indicators,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    entries,
    getEntry,
    updateEntry,
    markEntered,
    users,
    addUser,
    updateUser,
    resetPassword,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = React.useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/** For views rendered only behind the login screen. */
export function useCurrentUser(): User {
  const { currentUser } = useApp()
  if (!currentUser) throw new Error('useCurrentUser requires an authenticated session')
  return currentUser
}
