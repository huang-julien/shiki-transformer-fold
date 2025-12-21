import type { ShikiTransformer } from 'shiki'

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

declare module 'shiki' {
  interface ShikiTransformerContextMeta {
    /**
     * Metadata added by transformerHtmlFold fromshiki-transformer-fold
     */
    transformerHtmlFold: {
      /** Map of foldable regions detected in the code */
      foldRegions: FoldRegion[]
      /** Map of foldable regions detected in the code */
      foldStartLines: Map<number, FoldRegion>
      __lineIdCounter: number
    }
  }
}
 
/** Self-closing/void HTML tags that don't need closing tags */
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
])

const OPEN_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*(?<!\/)>/g
const CLOSE_TAG_REGEX = /<\/([a-zA-Z][a-zA-Z0-9\-_:.]*)\s*>/g
const SELF_CLOSING_REGEX = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*\/>/g

/**
 * Shiki transformer that adds code folding functionality
 * Similar to VS Code's code folding
 */
export function transformerHtmlFold(options: TransformerHtmlFoldOptions = {}): ShikiTransformer {
  const { classPrefix = 'shiki-fold' } = options  

  return {
    name: 'shiki-transformer-html-fold',

    tokens(lines) {
      const foldRegions: FoldRegion[] =   detectFoldRegions(lines)
      const foldStartLines: Map<number, FoldRegion> = new Map(foldRegions.map(r => [r.startLine, r]))
 
      this.meta.transformerHtmlFold = {
        foldRegions,
        foldStartLines,
        __lineIdCounter: 0,
      } 
      return lines
    },

    pre(element) {
      element.children.unshift({
        type: 'element',
        tagName: 'style',
        properties: {},
        children: [{ type: 'text', value: getStyles(classPrefix) }],
      })
    },

    line(element, lineNumber) {
      const { transformerHtmlFold } = this.meta
      // Assign unique ID to every line for resilience against other transformers
      const lineId = `${classPrefix}-${transformerHtmlFold.__lineIdCounter++}`
      element.properties['data-fold-line'] = lineId

      const region = transformerHtmlFold.foldStartLines.get(lineNumber)
      if (region) {
        // Store the end line ID - we'll hide everything between this line and the end ID
        const endLineId = `${classPrefix}-${region.endLine - 1}`
        element.properties['data-fold-end-id'] = endLineId
        element.properties['data-folded'] = 'false'
        element.properties.class = `${element.properties.class || ''} ${classPrefix}-foldable`.trim()
      }

      return element
    },
  }
}

/** Detect foldable regions from raw token arrays */
export function detectFoldRegions(lines: { content: string }[][]): FoldRegion[] {
  const regions: FoldRegion[] = []
  const stack: { tagName: string; line: number }[] = []

  for (const [lineIndex, lineTokens] of lines.entries()) {
    const text = lineTokens.map(t => t.content).join('')
    const lineNum = lineIndex + 1

    // Collect self-closing tag positions to exclude
    const selfClosingPositions = new Set<number>()
    for (const match of text.matchAll(SELF_CLOSING_REGEX)) {
      selfClosingPositions.add(match.index!)
    }

    // Process opening tags
    for (const match of text.matchAll(OPEN_TAG_REGEX)) {
      const [_, tagName] = match
      if(!tagName) continue
      if (selfClosingPositions.has(match.index!)) continue
      const tagNameLower = tagName.toLowerCase()
      if (!VOID_TAGS.has(tagNameLower)) {
        stack.push({ tagName: tagNameLower, line: lineNum })
      }
    }

    // Process closing tags
    for (const match of text.matchAll(CLOSE_TAG_REGEX)) {
      const [_, tagName] = match
      if(!tagName) continue
      const tagNameLower = tagName.toLowerCase()
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]?.tagName === tagNameLower) {
          const startLine = stack[i]!.line
          if (lineNum > startLine) {
            regions.push({ startLine, endLine: lineNum })
          }
          stack.splice(i, 1)
          break
        }
      }
    }
  }

  return regions
}

/** CSS styles for fold functionality */
function getStyles(classPrefix: string): string {
  return `
.shiki code { display: grid; }
.${classPrefix}-foldable { cursor: pointer; }
.${classPrefix}-foldable:hover { background: rgba(255, 255, 255, 0.05); }
.${classPrefix}-hidden { display: none !important; }
.${classPrefix}-summary {
  display: inline;
  opacity: 0.5;
  font-style: italic;
  margin-left: 0.5em;
  user-select: none;
  pointer-events: none;
}`.trim()
}

