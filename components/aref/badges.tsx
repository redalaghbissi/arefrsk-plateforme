import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EntryStatus, Status, ValueType } from '@/lib/aref/types'
import { ENTRY_STATUS_LABEL, VALUE_TYPE_LABEL } from '@/lib/aref/utils'

const ENTRY_STATUS_CLASS: Record<EntryStatus, string> = {
  not_entered: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-warning/20 text-warning-foreground',
  entered: 'bg-success/15 text-success',
}

export function EntryStatusBadge({ status, className }: { status: EntryStatus; className?: string }) {
  return (
    <Badge className={cn('whitespace-nowrap', ENTRY_STATUS_CLASS[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {ENTRY_STATUS_LABEL[status]}
    </Badge>
  )
}

const STATUS_CLASS: Record<Status, string> = {
  reached: 'bg-success/15 text-success',
  partial: 'bg-warning/20 text-warning-foreground',
  low: 'bg-destructive/10 text-destructive',
  empty: 'bg-muted text-muted-foreground',
}

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: Status
  children: React.ReactNode
  className?: string
}) {
  return (
    <Badge className={cn('tabular-nums', STATUS_CLASS[status], className)}>{children}</Badge>
  )
}

const TYPE_CLASS: Record<ValueType, string> = {
  number: 'bg-accent text-accent-foreground',
  percent: 'bg-chart-2/15 text-chart-2',
  budget: 'bg-primary/10 text-primary',
}

export function TypeBadge({ type, className }: { type: ValueType; className?: string }) {
  return <Badge className={cn(TYPE_CLASS[type], className)}>{VALUE_TYPE_LABEL[type]}</Badge>
}
