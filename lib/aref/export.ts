import * as XLSX from 'xlsx'

export type ExportRow = Record<string, string | number | null>

/** Writes one worksheet to an .xlsx file and triggers the browser download. */
export function exportToExcel(rows: ExportRow[], fileName: string, sheetName = 'Données') {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  worksheet['!cols'] = headers.map((key) => ({
    wch: Math.min(
      60,
      Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
    ),
  }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

const PRINT_HIDE = 'print-hide'
const PRINT_TARGET = 'print-target'
const PRINT_ANCESTOR = 'print-ancestor'

/**
 * Prints strictly one element as a PDF. Walks from the element up to <body> and flags every
 * sibling met on the way with `print-hide`, so the `@media print` rules in globals.css hide
 * the sidebar, header, other cards and tables while the target and its ancestors stay visible.
 */
export function printElement(element: HTMLElement) {
  const flagged: Element[] = []
  const ancestors: Element[] = []

  element.classList.add(PRINT_TARGET)
  let node: Element | null = element
  while (node && node !== document.body) {
    const parent: Element | null = node.parentElement
    if (!parent) break
    for (const sibling of Array.from(parent.children)) {
      if (sibling !== node) {
        sibling.classList.add(PRINT_HIDE)
        flagged.push(sibling)
      }
    }
    parent.classList.add(PRINT_ANCESTOR)
    ancestors.push(parent)
    node = parent
  }
  document.body.classList.add('printing-element')

  let cleaned = false
  const cleanup = () => {
    if (cleaned) return
    cleaned = true
    element.classList.remove(PRINT_TARGET)
    flagged.forEach((el) => el.classList.remove(PRINT_HIDE))
    ancestors.forEach((el) => el.classList.remove(PRINT_ANCESTOR))
    document.body.classList.remove('printing-element')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)

  // Let the class changes paint before the print dialog snapshots the page.
  window.requestAnimationFrame(() => {
    window.print()
    // Some browsers never fire `afterprint` when the dialog is cancelled.
    window.setTimeout(cleanup, 2000)
  })
}
