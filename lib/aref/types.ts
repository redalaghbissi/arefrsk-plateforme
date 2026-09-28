export type EntityId =
  | 'aref'
  | 'rabat'
  | 'sale'
  | 'skhirat-temara'
  | 'kenitra'
  | 'khemisset'
  | 'sidi-kacem'
  | 'sidi-slimane'

export type Entity = {
  id: EntityId
  name: string
  shortName: string
  kind: 'AREF' | 'DP'
}

export type ValueType = 'number' | 'percent' | 'budget'

export type Program = {
  id: string
  name: string
  description: string
  /** User id of the "Gestionnaire Programme AREF" in charge of this program. */
  managerId: string | null
}

export type Indicator = {
  id: string
  programId: string
  name: string
  valueType: ValueType
  /** Targets are strictly annual. Percent targets apply as-is to each month. */
  annualTarget: number
}

export type EntryStatus = 'not_entered' | 'in_progress' | 'entered'

export type Entry = {
  value: number | null
  remark: string
  status: EntryStatus
}

/** Key format: `${indicatorId}|${entityId}|${monthIndex}` */
export type EntryMap = Record<string, Entry>

export type RoleId = 'admin_aref' | 'gest_aref' | 'admin_dp' | 'gest_dp'

export type Role = {
  id: RoleId
  label: string
}

export type User = {
  id: string
  name: string
  email: string
  password: string
  roleId: RoleId
  entityId: EntityId
  active: boolean
  /** Programs assigned to program managers (gest_aref / gest_dp). Empty for admins. */
  programIds: string[]
}

export type View = 'dashboard' | 'saisie' | 'programmes' | 'utilisateurs'

export type Status = 'reached' | 'partial' | 'low' | 'empty'
