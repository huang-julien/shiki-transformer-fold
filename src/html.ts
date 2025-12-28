import type { ShikiTransformer } from "shiki";

export interface TransformerHtmlFoldOptions {
  /**
   * Custom class prefix for fold elements
   * @default 'shiki-fold'
   */
  classPrefix?: string;
  /**
   * Fold regions at this specific nesting level by default when rendering?
   * Set to 1 to fold root-level tags, 2 to fold second-level tags
   * @default undefined
   */
  foldLevel?: number;
}

interface FoldRegion {
  startLine: number;
  endLine: number;
  level: number;
}

declare module "shiki" {
  interface ShikiTransformerContextMeta {
    /**
     * Metadata added by transformerHtmlFold fromshiki-transformer-fold
     */
    transformerHtmlFold: {
      /** Map of foldable regions detected in the code */
      foldRegions: FoldRegion[];
      /** Map of foldable regions detected in the code */
      foldStartLines: Map<number, FoldRegion>;
      /** Map of lines that are part of folded regions */
      foldedRanges: Map<number, { hiddenCount: number }>;
      /** Fold level setting */
      foldLevel: number;
      __lineIdCounter: number;
    };
  }
}

/** Self-closing/void HTML tags that don't need closing tags */
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
]);

const OPEN_TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*(?<!\/)>/g;
const CLOSE_TAG_REGEX = /<\/([a-zA-Z][a-zA-Z0-9\-_:.]*)\s*>/g;
const SELF_CLOSING_REGEX = /<([a-zA-Z][a-zA-Z0-9\-_:.]*)[^>]*\/>/g;

/**
 * Shiki transformer that adds code folding functionality for HTML-like tags.
 */
export function transformerRenderHtmlFold(
  options: TransformerHtmlFoldOptions = {},
): ShikiTransformer {
  const { classPrefix = "shiki-fold", foldLevel = 0 } = options;

  return {
    name: "shiki-transformer-html-fold",

    tokens(lines) {
      const foldRegions: FoldRegion[] = detectFoldRegions(lines);
      const foldStartLines: Map<number, FoldRegion> = new Map(
        foldRegions.map((r) => [r.startLine, r]),
      );

      const foldedRanges: Map<number, { hiddenCount: number }> = new Map();
      if (foldLevel > 0) {
        for (const region of foldRegions) {
          if (region.level === foldLevel) {
            // Mark startLine with the count of hidden lines
            foldedRanges.set(region.startLine, {
              hiddenCount: region.endLine - region.startLine,
            });
            // Mark lines between start+1 and end as hidden
            for (let i = region.startLine + 1; i <= region.endLine; i++) {
              foldedRanges.set(i, { hiddenCount: -1 }); // -1 means this line should be hidden
            }
          }
        }
      }

      this.meta.transformerHtmlFold = {
        foldRegions,
        foldStartLines,
        foldedRanges,
        __lineIdCounter: 0,
        foldLevel,
      };
      return lines;
    },

    pre(element) {
      element.children.unshift({
        type: "element",
        tagName: "style",
        properties: {},
        children: [{ type: "text", value: getStyles(classPrefix) }],
      });
    },

    line(element, lineNumber) {
      const { transformerHtmlFold } = this.meta;
      // Assign unique ID to every line for resilience against other transformers
      const lineId = `${classPrefix}-${transformerHtmlFold.__lineIdCounter++}`;
      element.properties["data-fold-line"] = lineId;

      // Check if this line should be hidden (inside a folded region)
      const foldedInfo = transformerHtmlFold.foldedRanges.get(lineNumber);
      if (foldedInfo && foldedInfo.hiddenCount === -1) {
        element.properties.class =
          `${element.properties.class || ""} ${classPrefix}-hidden`.trim();
      }

      const region = transformerHtmlFold.foldStartLines.get(lineNumber);
      if (region) {
        // Store the end line ID - we'll hide everything between this line and the end ID
        const endLineId = `${classPrefix}-${region.endLine - 1}`;
        const shouldFold =
          transformerHtmlFold.foldLevel > 0 &&
          region.level === transformerHtmlFold.foldLevel;
        element.properties["data-fold-end-id"] = endLineId;
        element.properties["data-fold-level"] = String(region.level);
        element.properties["data-folded"] = shouldFold ? "true" : "false";
        element.properties.class =
          `${element.properties.class || ""} ${classPrefix}-foldable`.trim();

        // Add summary span if this region starts folded
        if (shouldFold && foldedInfo && foldedInfo.hiddenCount > 0) {
          const count = foldedInfo.hiddenCount;
          element.children.push({
            type: "element",
            tagName: "span",
            properties: { class: `${classPrefix}-summary` },
            children: [
              {
                type: "text",
                value: `... ${count} line${count > 1 ? "s" : ""} hidden`,
              },
            ],
          });
        }
      }

      return element;
    },
  };
}

/** Detect foldable regions from raw token arrays */
export function detectFoldRegions(
  lines: { content: string }[][],
): FoldRegion[] {
  const regions: FoldRegion[] = [];
  const stack: { tagName: string; line: number; level: number }[] = [];

  for (const [lineIndex, lineTokens] of lines.entries()) {
    const text = lineTokens.map((t) => t.content).join("");
    const lineNum = lineIndex + 1;

    // Collect self-closing tag positions to exclude
    const selfClosingPositions = new Set<number>();
    for (const match of text.matchAll(SELF_CLOSING_REGEX)) {
      selfClosingPositions.add(match.index!);
    }

    // Process opening tags
    for (const match of text.matchAll(OPEN_TAG_REGEX)) {
      const [_, tagName] = match;
      if (!tagName) continue;
      if (selfClosingPositions.has(match.index!)) continue;
      const tagNameLower = tagName.toLowerCase();
      if (!VOID_TAGS.has(tagNameLower)) {
        const level = stack.length + 1; // 1-based level
        stack.push({ tagName: tagNameLower, line: lineNum, level });
      }
    }

    // Process closing tags
    for (const match of text.matchAll(CLOSE_TAG_REGEX)) {
      const [_, tagName] = match;
      if (!tagName) continue;
      const tagNameLower = tagName.toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]?.tagName === tagNameLower) {
          const startLine = stack[i]!.line;
          const level = stack[i]!.level;
          if (lineNum > startLine) {
            regions.push({ startLine, endLine: lineNum, level });
          }
          stack.splice(i, 1);
          break;
        }
      }
    }
  }

  return regions;
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
}`.trim();
}
