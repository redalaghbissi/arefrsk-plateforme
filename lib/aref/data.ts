import type { Entity, EntityId, EntryMap, Indicator, Program, Role, User } from './types'

export const CURRENT_YEAR = 2026
/** Zero-based index of the current month (September). */
export const CURRENT_MONTH = 8

export const APP_TITLE = 'Plateforme de Pilotage Régional - AREF RSK'

export const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export const MONTHS_SHORT = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
]

export const ENTITIES: Entity[] = [
  { id: 'aref', name: 'AREF Rabat-Salé-Kénitra', shortName: 'AREF', kind: 'AREF' },
  { id: 'rabat', name: 'DP Rabat', shortName: 'Rabat', kind: 'DP' },
  { id: 'sale', name: 'DP Salé', shortName: 'Salé', kind: 'DP' },
  { id: 'skhirat-temara', name: 'DP Skhirat-Témara', shortName: 'Skhirat-Témara', kind: 'DP' },
  { id: 'kenitra', name: 'DP Kénitra', shortName: 'Kénitra', kind: 'DP' },
  { id: 'khemisset', name: 'DP Khémisset', shortName: 'Khémisset', kind: 'DP' },
  { id: 'sidi-kacem', name: 'DP Sidi Kacem', shortName: 'Sidi Kacem', kind: 'DP' },
  { id: 'sidi-slimane', name: 'DP Sidi Slimane', shortName: 'Sidi Slimane', kind: 'DP' },
]

export const DP_ENTITIES = ENTITIES.filter((e) => e.kind === 'DP')

export const ROLES: Role[] = [
  { id: 'admin_aref', label: 'Admin AREF' },
  { id: 'gest_aref', label: 'Gestionnaire Programme AREF' },
  { id: 'admin_dp', label: 'Admin DP' },
  { id: 'gest_dp', label: 'Gestionnaire Programme DP' },
  { id: 'consultant', label: 'Consultant' },
]

export const PROGRAMS: Program[] = [
  {
    id: 'tarl',
    name: 'Certification TARL',
    description:
      "Remédiation par niveau (Teaching at the Right Level) : certification des enseignants et suivi des acquis des élèves au primaire.",
    managerId: 'u2',
  },
  {
    id: 'pionnieres',
    name: 'Établissements Pionniers',
    description:
      "Déploiement du label « École Pionnière » : formation des équipes, équipement et suivi de la performance des établissements.",
    managerId: 'u2',
  },
  {
    id: 'abandon',
    name: "Lutte contre l'abandon scolaire",
    description:
      "Cellules de veille, réintégration des élèves décrocheurs et accompagnement social.",
    managerId: 'u3',
  },
  {
    id: 'numerique',
    name: 'Numérique éducatif',
    description:
      "Équipement des salles multimédias et déploiement des ressources numériques d'apprentissage.",
    managerId: null,
  },
]

export const INDICATORS: Indicator[] = [
  { id: 'tarl-n1', programId: 'tarl', name: 'Niveau 1 : Connaissance', valueType: 'percent', annualTarget: 85 },
  { id: 'tarl-n2', programId: 'tarl', name: 'Niveau 2 : Application', valueType: 'percent', annualTarget: 70 },
  { id: 'tarl-n3', programId: 'tarl', name: 'Niveau 3 : Maîtrise', valueType: 'percent', annualTarget: 55 },
  { id: 'tarl-ens', programId: 'tarl', name: 'Enseignants certifiés', valueType: 'number', annualTarget: 1_440 },
  { id: 'tarl-budget', programId: 'tarl', name: 'Budget formation engagé', valueType: 'budget', annualTarget: 4_800_000 },
  { id: 'pio-etab', programId: 'pionnieres', name: 'Établissements labellisés', valueType: 'number', annualTarget: 144 },
  { id: 'pio-couv', programId: 'pionnieres', name: 'Taux de couverture des écoles', valueType: 'percent', annualTarget: 40 },
  { id: 'aba-reint', programId: 'abandon', name: 'Élèves réintégrés', valueType: 'number', annualTarget: 1_080 },
  { id: 'aba-cellules', programId: 'abandon', name: 'Cellules de veille actives', valueType: 'percent', annualTarget: 95 },
  { id: 'num-salles', programId: 'numerique', name: 'Salles multimédias équipées', valueType: 'number', annualTarget: 96 },
  { id: 'num-budget', programId: 'numerique', name: "Budget d'équipement engagé", valueType: 'budget', annualTarget: 6_000_000 },
]

export const DEFAULT_ADMIN_EMAIL = 'redalaghbissi@gmail.com'
export const DEFAULT_ADMIN_PASSWORD = '@Admin2025'
/** Shared password of the generic demo accounts (user1@gmail.com, user2@gmail.com, …). */
export const DEMO_USER_PASSWORD = 'User2025!'

export const USERS: User[] = [
  // Main AREF administrators
  { id: 'u1', name: 'Reda Laghbissi', email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD, roleId: 'admin_aref', entityId: 'aref', active: true, programIds: [] },
  { id: 'u20', name: 'Tarik Berhal', email: 'tarikberhal@gmail.com', password: DEFAULT_ADMIN_PASSWORD, roleId: 'admin_aref', entityId: 'aref', active: true, programIds: [] },
  // Generic demo accounts (password: DEMO_USER_PASSWORD)
  { id: 'u2', name: 'Utilisateur 1', email: 'user1@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_aref', entityId: 'aref', active: true, programIds: ['tarl', 'pionnieres'] },
  { id: 'u3', name: 'Utilisateur 2', email: 'user2@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_aref', entityId: 'aref', active: true, programIds: ['abandon'] },
  { id: 'u4', name: 'Utilisateur 3', email: 'user3@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'rabat', active: true, programIds: [] },
  { id: 'u5', name: 'Utilisateur 4', email: 'user4@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'rabat', active: true, programIds: ['tarl', 'abandon'] },
  { id: 'u6', name: 'Utilisateur 5', email: 'user5@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'sale', active: true, programIds: [] },
  { id: 'u7', name: 'Utilisateur 6', email: 'user6@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'sale', active: true, programIds: ['tarl', 'pionnieres', 'numerique'] },
  { id: 'u8', name: 'Utilisateur 7', email: 'user7@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'skhirat-temara', active: true, programIds: [] },
  { id: 'u9', name: 'Utilisateur 8', email: 'user8@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'skhirat-temara', active: false, programIds: ['abandon'] },
  { id: 'u10', name: 'Utilisateur 9', email: 'user9@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'kenitra', active: true, programIds: [] },
  { id: 'u11', name: 'Utilisateur 10', email: 'user10@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'kenitra', active: true, programIds: ['tarl', 'pionnieres'] },
  { id: 'u12', name: 'Utilisateur 11', email: 'user11@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'kenitra', active: true, programIds: ['abandon', 'numerique'] },
  { id: 'u13', name: 'Utilisateur 12', email: 'user12@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'khemisset', active: true, programIds: [] },
  { id: 'u14', name: 'Utilisateur 13', email: 'user13@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'khemisset', active: true, programIds: ['tarl', 'abandon', 'numerique'] },
  { id: 'u15', name: 'Utilisateur 14', email: 'user14@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'sidi-kacem', active: true, programIds: [] },
  { id: 'u16', name: 'Utilisateur 15', email: 'user15@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'sidi-kacem', active: true, programIds: ['tarl', 'pionnieres', 'abandon', 'numerique'] },
  { id: 'u17', name: 'Utilisateur 16', email: 'user16@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'admin_dp', entityId: 'sidi-slimane', active: true, programIds: [] },
  { id: 'u18', name: 'Utilisateur 17', email: 'user17@gmail.com', password: DEMO_USER_PASSWORD, roleId: 'gest_dp', entityId: 'sidi-slimane', active: true, programIds: ['tarl', 'abandon'] },
]

export const entryKey = (indicatorId: string, entityId: EntityId, month: number) =>
  `${indicatorId}|${entityId}|${month}`

/** Deterministic pseudo-random in [0, 1) so the demo data is stable between renders. */
function seeded(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

/** Each entity has a stable performance profile so trends are believable. */
const ENTITY_PROFILE: Record<EntityId, number> = {
  aref: 1.0,
  rabat: 1.08,
  sale: 0.96,
  'skhirat-temara': 1.02,
  kenitra: 0.9,
  khemisset: 0.78,
  'sidi-kacem': 0.7,
  'sidi-slimane': 0.84,
}

const REMARKS = [
  'Saisie validée par le coordinateur provincial.',
  'Sessions de formation reportées pour cause de calendrier scolaire.',
  'Progression conforme au plan d’action régional.',
  'Retard lié à la livraison des équipements.',
  'Effort de rattrapage engagé sur les établissements ruraux.',
  'Données consolidées à partir du système MASSAR.',
  'Chiffres provisoires en attente de confirmation des directeurs.',
  'Objectif dépassé grâce à la mobilisation des inspecteurs.',
]

export function buildSeedEntries(): EntryMap {
  const entries: EntryMap = {}
  for (const ind of INDICATORS) {
    const monthly = ind.valueType === 'percent' ? ind.annualTarget : ind.annualTarget / 12
    for (const ent of ENTITIES) {
      for (let m = 0; m <= CURRENT_MONTH; m++) {
        const r = seeded(`${ind.id}-${ent.id}-${m}`)
        const isCurrent = m === CURRENT_MONTH

        // Current month: leave a portion of the entries empty to show pending work.
        if (isCurrent && r > 0.6) {
          entries[entryKey(ind.id, ent.id, m)] = { value: null, remark: '', status: 'not_entered' }
          continue
        }

        const progress = 0.62 + (m / 11) * 0.45
        const noise = 0.85 + r * 0.3
        let value = monthly * ENTITY_PROFILE[ent.id] * progress * noise

        if (ind.valueType === 'percent') {
          value = Math.min(100, Math.round(value * 10) / 10)
        } else if (ind.valueType === 'budget') {
          value = Math.round(value / 1000) * 1000
        } else {
          value = Math.round(value)
        }

        const remark = REMARKS[Math.floor(seeded(`${ind.id}-${ent.id}-${m}-r`) * REMARKS.length)]
        // A slice of the current month is still being worked on; past months are all validated
        // (including anything that was "en cours" when the month closed).
        const status = isCurrent && r > 0.3 ? 'in_progress' : 'entered'
        entries[entryKey(ind.id, ent.id, m)] = { value, remark, status }
      }
    }
  }
  return entries
}
