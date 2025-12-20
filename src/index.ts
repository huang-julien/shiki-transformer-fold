import type { ShikiTransformer } from 'shiki'
import type { Element } from 'hast'

export interface TransformerHtmlFoldOptions {
  /**
   * Custom class prefix for fold elements
   * @default 'shiki-fold'
   */
  classPrefix?: string
}

interface FoldRegion {
  startLine: number
  endLine: number
}

/**
 * Self-closing/void HTML tags that don't need closing tags
 */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
  // Common self-closing in XML/JSX
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
])

 

/**
 * Shiki transformer that adds a fold column on the left side of code blocks
 * Similar to VS Code's code folding functionality
 */
export function transformerHtmlFold(options: TransformerHtmlFoldOptions = {}): ShikiTransformer {
  const { classPrefix = 'shiki-fold' } = options

  let __foldRegions: FoldRegion[] = []
  let __foldStartLines: Set<number> = new Set()

  return {
    name: 'shiki-transformer-html-fold',
    tokens(lines) {
      console.log(lines)
       // Detect fold regions from raw tokens (runs before tree construction)
      __foldRegions = detectFoldRegionsFromTokens(lines)
      __foldStartLines = new Set(__foldRegions.map(r => r.startLine))
      return lines
    },

    pre(element) {
      element.children.unshift({
        type: 'element',
        tagName: 'style',
        properties: {},
        children: [{
          type: 'text',
          value: transformerHtmlFoldStyle(classPrefix),
        }],
      })
    },
  
    line(element, lineNumber) {
      const lineIndex = lineNumber // lineNumber is 1-based
       // Only add fold data if this line starts a fold region
      if (__foldStartLines.has(lineIndex)) { 
        const region = __foldRegions.find(r => r.startLine === lineIndex) 
        if (region) {
          // Make the line clickable for folding
          element.properties['data-fold-start'] = String(region.startLine)
          element.properties['data-fold-end'] = String(region.endLine)
          element.properties['data-folded'] = 'false'
          element.properties.class = ((element.properties.class || '') + ` ${classPrefix}-foldable`).trim()
          // return {
          //   type: 'element',
          //   tagName: 'button',
          //   properties: {
          //     'aria-label': 'Toggle code fold',
          //     'data-fold-start': String(region.startLine),
          //     'data-fold-end': String(region.endLine),
          //     'data-folded': 'false',
          //     class: `${classPrefix}-foldable`,
          //   },
          //   children: [
          //     element
          //   ]
          // }
        }
      }

      return element
    },
  }
}

/**
 * Detect foldable regions from raw token arrays (for use in tokens hook)
 */
function detectFoldRegionsFromTokens(lines: { content: string }[][]): FoldRegion[] {
  const regions: FoldRegion[] = []
  const stack: { tagName: string; line: number }[] = []

  const openTagRegex = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*(?<!\/)>/g
  const closeTagRegex = /<\/([a-zA-Z][a-zA-Z0-9\-_:.]*)\s*>/g
  const selfClosingRegex = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*\/>/g

  for (const [lineIndex, lineTokens] of lines.entries()) {
    const text = lineTokens.map(t => t.content).join('')

    // Find all self-closing tags to exclude them
    const selfClosingMatches = new Set<number>()
    let selfMatch: RegExpExecArray | null
    while ((selfMatch = selfClosingRegex.exec(text)) !== null) {
      selfClosingMatches.add(selfMatch.index)
    }
    selfClosingRegex.lastIndex = 0

    // Find all opening tags
    let openMatch: RegExpExecArray | null
    while ((openMatch = openTagRegex.exec(text)) !== null) {
      if (selfClosingMatches.has(openMatch.index)) {
        continue
      }
      const tagName = openMatch[1].toLowerCase()
      if (VOID_TAGS.has(tagName)) {
        continue
      }
      stack.push({ tagName, line: lineIndex + 1 } )
    }
    openTagRegex.lastIndex = 0

    // Find all closing tags
    let closeMatch: RegExpExecArray | null
    while ((closeMatch = closeTagRegex.exec(text)) !== null) {
      const tagName = closeMatch[1].toLowerCase()

      for (let i = stack.length - 1; i >= 0; i--) {
        const stackItem = stack[i]
        if (stackItem && stackItem.tagName === tagName) {
          const startLine = stackItem.line
          const endLine = lineIndex + 1
          if (endLine > startLine) {
            regions.push({ startLine, endLine })
          }
          stack.splice(i, 1)
          break
        }
      }
    }
    closeTagRegex.lastIndex = 0
  }

  return regions
}

/**
 * Get default CSS styles for the fold functionality
 */
function transformerHtmlFoldStyle(classPrefix: string = 'shiki-fold'): string {
  return `
.shiki code {
  display: grid;
}

.${classPrefix}-foldable {
  cursor: pointer;
}

.${classPrefix}-foldable:hover {
  background: rgba(255, 255, 255, 0.05);
}

.${classPrefix}-hidden {
  display: none !important;
}

.${classPrefix}-summary {
  display: inline;
  opacity: 0.5;
  font-style: italic;
  margin-left: 0.5em;
  user-select: none;
  pointer-events: none;
}
`.trim()
}

/**
 * Attach a delegated click listener for fold toggles
 * Uses event delegation so it works with dynamically rendered content (frameworks, SSR, etc.)
 * Only needs to be called once - handles all current and future fold toggles
 * @param classPrefix - The class prefix used in the transformer (default: 'shiki-fold')
 */
export function attachFoldToggleListener(classPrefix: string = 'shiki-fold'): void {
  if (typeof document === 'undefined') return

  document.addEventListener('click', (event) => {
    const foldableLine = (event.target as Element).closest<HTMLElement>(`.${classPrefix}-foldable`)
    if (!foldableLine) return

    const foldStart = Number.parseInt(foldableLine.dataset.foldStart || '0', 10)
    const foldEnd = Number.parseInt(foldableLine.dataset.foldEnd || '0', 10)
    const isFolded = foldableLine.dataset.folded === 'true'

    // Toggle folded state
    foldableLine.dataset.folded = String(!isFolded)

    // Find the code block container
    const codeBlock = foldableLine.closest('pre')
    if (!codeBlock) return

    // Get all lines in the code block
    const lines = codeBlock.querySelectorAll('.line')

    // Handle fold summary indicator
    const summaryClass = `${classPrefix}-summary`
    const existingSummary = foldableLine.querySelector(`.${summaryClass}`)
    
    if (isFolded) {
      // Unfolding - remove summary
      if (existingSummary) {
        existingSummary.remove()
      }
    } else {
      // Folding - add summary
      const hiddenCount = foldEnd - foldStart
      const summary = document.createElement('span')
      summary.className = summaryClass
      summary.textContent = `... ${hiddenCount} line${hiddenCount > 1 ? 's' : ''} hidden`
      foldableLine.append(summary)
    }
    
    // Toggle visibility of lines in the fold region (excluding the start line)
    for (let i = foldStart; i < foldEnd; i++) {
      const line = lines[i] as HTMLElement | undefined
      if(line) {
        if (isFolded) {
          line.classList.remove(`${classPrefix}-hidden`)
        } else {
          line.classList.add(`${classPrefix}-hidden`)
        }
      }
    }
  })
}

export default transformerHtmlFold
