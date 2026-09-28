'use client'

import { FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { type ExportRow, exportToExcel } from '@/lib/aref/export'

type Props = {
  /** Called lazily so the rows reflect the current filters at click time. */
  getRows: () => ExportRow[]
  fileName: string
  sheetName?: string
  label?: string
  className?: string
}

export function ExportExcelButton({
  getRows,
  fileName,
  sheetName,
  label = 'Exporter en Excel',
  className,
}: Props) {
  const handleClick = () => {
    const rows = getRows()
    if (rows.length === 0) {
      toast.info('Aucune donnée à exporter', { description: 'Le tableau est vide avec les filtres actuels.' })
      return
    }
    exportToExcel(rows, fileName, sheetName)
    toast.success('Export Excel généré', { description: `${rows.length} ligne(s) — ${fileName}.xlsx` })
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleClick}>
      <FileSpreadsheet data-icon="inline-start" />
      {label}
    </Button>
  )
}
