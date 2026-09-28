import type {
  EntityId,
  EntryStatus,
  Indicator,
  Program,
  RoleId,
  Status,
  User,
  ValueType,
  View,
} from './types'

export const VALUE_TYPE_LABEL: Record<ValueType, string> = {
  number: 'Numérique',
  percent: 'Pourcentage',
  budget: 'Budget MAD',
}

export const VALUE_TYPE_UNIT: Record<ValueType, string> = {
  number: '',
  percent: '%',
  budget: 'MAD',
}

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  not_entered: 'Non saisi',
  in_progress: 'En cours',
  entered: 'Saisi',
}

const madFormatter = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('fr-MA', {
  maximumFractionDigits: 1,
})

export function formatValue(value: number | null | undefined, type: ValueType): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  switch (type) {
    case 'percent':
      return `${numberFormatter.format(value)} %`
    case 'budget':
      return `${madFormatter.format(value)} MAD`
    default:
      return numberFormatter.format(value)
  }
}

export function formatCompact(value: number, type: ValueType): string {
  if (type === 'budget') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M MAD`
    if (value >= 1_000) return `${Math.round(value / 1_000)} k MAD`
    return `${value} MAD`
  }
  if (type === 'percent') return `${numberFormatter.format(value)} %`
  return numberFormatter.format(value)
}

/**
 * Consolidates several entity values into one figure: volumes (number, budget) are summed,
 * percentages are averaged. Returns null when no value is available.
 */
export function consolidate(values: (number | null | undefined)[], type: ValueType): number | null {
  const present = values.filter((v): v is number => v !== null && v !== undefined)
  if (present.length === 0) return null
  const sum = present.reduce((a, b) => a + b, 0)
  return type === 'percent' ? Math.round((sum / present.length) * 10) / 10 : sum
}

type EntryLookup = (indicatorId: string, entityId: EntityId, month: number) => { value: number | null }

/**
 * Year-to-date realisation for one entity: cumulative sum from January to `month` for volumes,
 * the value of `month` itself for percentages. Null when nothing has been entered yet.
 */
export function yearToDate(
  indicator: Indicator,
  entityId: EntityId,
  month: number,
  getEntry: EntryLookup,
): number | null {
  if (indicator.valueType === 'percent') return getEntry(indicator.id, entityId, month).value
  let sum = 0
  let any = false
  for (let m = 0; m <= month; m++) {
    const v = getEntry(indicator.id, entityId, m).value
    if (v !== null) {
      sum += v
      any = true
    }
  }
  return any ? sum : null
}

/** Annual target is the only reference: a cell is judged on its year-to-date progress against it. */
export function computeStatus(value: number | null | undefined, target: number): Status {
  if (value === null || value === undefined) return 'empty'
  if (target <= 0) return 'reached'
  const ratio = value / target
  if (ratio >= 1) return 'reached'
  if (ratio > 0.5) return 'partial'
  return 'low'
}

export function achievementRatio(value: number | null | undefined, target: number): number | null {
  if (value === null || value === undefined || target <= 0) return null
  return value / target
}

export const ROLE_LABEL: Record<RoleId, string> = {
  admin_aref: 'Admin AREF',
  gest_aref: 'Gestionnaire Programme AREF',
  admin_dp: 'Admin DP',
  gest_dp: 'Gestionnaire Programme DP',
}

export const isArefRole = (roleId: RoleId) => roleId === 'admin_aref' || roleId === 'gest_aref'
export const isAdminRole = (roleId: RoleId) => roleId === 'admin_aref' || roleId === 'admin_dp'
export const isProgramManager = (roleId: RoleId) => roleId === 'gest_aref' || roleId === 'gest_dp'

export function canAccessView(user: User, view: View): boolean {
  switch (view) {
    case 'dashboard':
    case 'saisie':
      return true
    case 'programmes':
      return isArefRole(user.roleId) || user.roleId === 'admin_dp'
    case 'utilisateurs':
      return isAdminRole(user.roleId)
  }
}

/** Programs the user may see in the entry grid and program management. */
export function visiblePrograms(user: User, programs: Program[]): Program[] {
  if (isAdminRole(user.roleId)) return programs
  return programs.filter((p) => user.programIds.includes(p.id))
}

/** Only AREF roles may alter indicator structure, and program managers only within their programs. */
export function canManageProgram(user: User, programId: string): boolean {
  if (user.roleId === 'admin_aref') return true
  if (user.roleId === 'gest_aref') return user.programIds.includes(programId)
  return false
}

/** Entities whose data the user may see: AREF roles see everything, DP roles only their own DP. */
export function visibleEntities<T extends { id: EntityId }>(user: User, entities: T[]): T[] {
  if (isArefRole(user.roleId)) return entities
  return entities.filter((e) => e.id === user.entityId)
}

/** Which entity columns the user may edit in the monthly entry grid. */
export function canEditEntity(user: User, entityId: EntityId): boolean {
  if (isArefRole(user.roleId)) return true
  return user.entityId === entityId
}

/** Who may reset another user's password. */
export function canResetPassword(actor: User, target: User): boolean {
  if (actor.roleId === 'admin_aref') return true
  if (actor.roleId === 'admin_dp') return target.entityId === actor.entityId
  return false
}

export function canEditUser(actor: User, target: User): boolean {
  if (actor.roleId === 'admin_aref') return true
  if (actor.roleId === 'admin_dp')
    return target.entityId === actor.entityId && target.roleId === 'gest_dp'
  return false
}

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
const PASSWORD_SYMBOLS = '@#!$%'

/** Generates a readable 12-character temporary password with one guaranteed symbol and digit. */
export function generatePassword(): string {
  const bytes = new Uint32Array(11)
  crypto.getRandomValues(bytes)
  const body = Array.from(bytes, (b, i) =>
    i === 5
      ? PASSWORD_SYMBOLS[b % PASSWORD_SYMBOLS.length]
      : PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length],
  ).join('')
  const digit = String(bytes[0] % 10)
  return body + digit
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
