/**
 * Attach a delegated click listener for fold toggles.
 * Uses event delegation so it works with dynamically rendered content.
 * Only needs to be called once.
 */
export function attachFoldToggleListener(classPrefix: string = 'shiki-fold'): void {
  if (typeof document === 'undefined') return

  const hiddenClass = `${classPrefix}-hidden`
  const summaryClass = `${classPrefix}-summary`

  document.addEventListener('click', (event) => {
    const line = (event.target as Element).closest<HTMLElement>(`.${classPrefix}-foldable`)
    if (!line) return

    const endId = line.dataset.foldEndId
    if (!endId) return

    const isFolded = line.dataset.folded === 'true'
    line.dataset.folded = String(!isFolded)

    // Collect lines to toggle by walking siblings until we hit the end ID
    const linesToToggle: HTMLElement[] = []
    let sibling = line.nextElementSibling as HTMLElement | null

    while (sibling) {
      const siblingId = sibling.dataset.foldLine
      linesToToggle.push(sibling)

      // Stop when we reach the end line (include it in the toggle)
      if (siblingId === endId) break
      sibling = sibling.nextElementSibling as HTMLElement | null
    }

    // Toggle summary indicator
    const existingSummary = line.querySelector(`.${summaryClass}`)
    if (isFolded) {
      existingSummary?.remove()
    } else {
      const count = linesToToggle.length
      const summary = document.createElement('span')
      summary.className = summaryClass
      summary.textContent = `... ${count} line${count > 1 ? 's' : ''} hidden`
      line.append(summary)
    }

    // Toggle line visibility
    for (const targetLine of linesToToggle) {
      targetLine.classList.toggle(hiddenClass, !isFolded)
    }
  })
}
