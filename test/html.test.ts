import { describe, it, expect } from "vitest";
import { createHighlighter } from "shiki";
import { detectFoldRegions, transformerRenderHtmlFold } from "../src/html.ts";

describe("detectFoldRegions", () => {
  it("should detect simple div fold region", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  content" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should detect nested fold regions", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  <span>" }],
      [{ content: "    text" }],
      [{ content: "  </span>" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toHaveLength(2);
    expect(regions).toContainEqual({ startLine: 2, endLine: 4 });
    expect(regions).toContainEqual({ startLine: 1, endLine: 5 });
  });

  it("should ignore self-closing tags", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: '  <img src="test.jpg" />' }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should ignore void tags", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  <br>" }],
      [{ content: "  <hr>" }],
      [{ content: '  <input type="text">' }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 5 }]);
  });

  it("should handle multiple sibling elements", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  content1" }],
      [{ content: "</div>" }],
      [{ content: "<div>" }],
      [{ content: "  content2" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toHaveLength(2);
    expect(regions).toContainEqual({ startLine: 1, endLine: 3 });
    expect(regions).toContainEqual({ startLine: 4, endLine: 6 });
  });

  it("should not create region for single-line elements", () => {
    const lines = [[{ content: "<div>content</div>" }]];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([]);
  });

  it("should handle SVG elements", () => {
    const lines = [
      [{ content: "<svg>" }],
      [{ content: '  <circle cx="50" cy="50" r="40" />' }],
      [{ content: '  <rect x="10" y="10" />' }],
      [{ content: "</svg>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 4 }]);
  });

  it("should handle custom element names with hyphens", () => {
    const lines = [
      [{ content: "<my-component>" }],
      [{ content: "  content" }],
      [{ content: "</my-component>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle tags with namespaces", () => {
    const lines = [
      [{ content: "<ns:element>" }],
      [{ content: "  content" }],
      [{ content: "</ns:element>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle empty lines", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "" }],
      [{ content: "  content" }],
      [{ content: "" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 5 }]);
  });

  it("should handle multiple tokens per line", () => {
    const lines = [
      [{ content: "<" }, { content: "div" }, { content: ">" }],
      [{ content: "  content" }],
      [{ content: "</" }, { content: "div" }, { content: ">" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle tags with attributes", () => {
    const lines = [
      [{ content: '<div class="test" id="main" data-value="123">' }],
      [{ content: "  content" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle deeply nested elements", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  <section>" }],
      [{ content: "    <article>" }],
      [{ content: "      <p>" }],
      [{ content: "        text" }],
      [{ content: "      </p>" }],
      [{ content: "    </article>" }],
      [{ content: "  </section>" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toHaveLength(4);
    expect(regions).toContainEqual({ startLine: 4, endLine: 6 });
    expect(regions).toContainEqual({ startLine: 3, endLine: 7 });
    expect(regions).toContainEqual({ startLine: 2, endLine: 8 });
    expect(regions).toContainEqual({ startLine: 1, endLine: 9 });
  });

  it("should handle case-insensitive tag matching", () => {
    const lines = [
      [{ content: "<DIV>" }],
      [{ content: "  content" }],
      [{ content: "</div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should return empty array for no foldable regions", () => {
    const lines = [[{ content: "plain text" }], [{ content: "more text" }]];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([]);
  });

  it("should handle mixed content with text and tags", () => {
    const lines = [
      [{ content: "text before <div>" }],
      [{ content: "  inner content" }],
      [{ content: "</div> text after" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });
});

describe("transformerHtmlFold", () => {
  it("should return a transformer with correct name", () => {
    const transformer = transformerRenderHtmlFold();
    expect(transformer.name).toBe("shiki-transformer-html-fold");
  });

  it("should use default classPrefix", async () => {
    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html"],
    });

    const result = highlighter.codeToHtml("<div>\n  content\n</div>", {
      lang: "html",
      theme: "github-dark",
      transformers: [transformerRenderHtmlFold()],
    });

    expect(result).toContain("shiki-fold");
    expect(result).toContain("data-fold-line");
    highlighter.dispose();
  });

  it("should use custom classPrefix", async () => {
    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html"],
    });

    const result = highlighter.codeToHtml("<div>\n  content\n</div>", {
      lang: "html",
      theme: "github-dark",
      transformers: [transformerRenderHtmlFold({ classPrefix: "custom-fold" })],
    });

    expect(result).toContain("custom-fold");
    expect(result).toContain("custom-fold-foldable");
    highlighter.dispose();
  });

  it("should add data-fold-line to all lines", async () => {
    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html"],
    });

    const result = highlighter.codeToHtml("<div>\n  content\n</div>", {
      lang: "html",
      theme: "github-dark",
      transformers: [transformerRenderHtmlFold()],
    });

    expect(result).toContain('data-fold-line="shiki-fold-0"');
    expect(result).toContain('data-fold-line="shiki-fold-1"');
    expect(result).toContain('data-fold-line="shiki-fold-2"');
    highlighter.dispose();
  });

  it("should add foldable class to fold start lines", async () => {
    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html"],
    });

    const result = highlighter.codeToHtml("<div>\n  content\n</div>", {
      lang: "html",
      theme: "github-dark",
      transformers: [transformerRenderHtmlFold()],
    });

    expect(result).toContain("shiki-fold-foldable");
    expect(result).toContain('data-folded="false"');
    expect(result).toContain("data-fold-end-id");
    highlighter.dispose();
  });

  it("should inject styles in pre element", async () => {
    const highlighter = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html"],
    });

    const result = highlighter.codeToHtml("<div>\n  content\n</div>", {
      lang: "html",
      theme: "github-dark",
      transformers: [transformerRenderHtmlFold()],
    });

    expect(result).toContain("<style>");
    expect(result).toContain(".shiki code { display: grid; }");
    expect(result).toContain(".shiki-fold-foldable");
    expect(result).toContain(".shiki-fold-hidden");
    expect(result).toContain(".shiki-fold-summary");
    highlighter.dispose();
  });
});

describe("edge cases", () => {
  it("should handle empty input", () => {
    const regions = detectFoldRegions([]);
    expect(regions).toEqual([]);
  });

  it("should handle unclosed tags gracefully", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  content" }],
      // Missing closing tag
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([]);
  });

  it("should handle mismatched tags", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  content" }],
      [{ content: "</span>" }], // Wrong closing tag
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([]);
  });

  it("should handle script and style tags", () => {
    const lines = [
      [{ content: "<script>" }],
      [{ content: '  console.log("test");' }],
      [{ content: "</script>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle tags with whitespace in closing", () => {
    const lines = [
      [{ content: "<div>" }],
      [{ content: "  content" }],
      [{ content: "</div   >" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle multiple tags on same line", () => {
    const lines = [
      [{ content: "<div><span>" }],
      [{ content: "  content" }],
      [{ content: "</span></div>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toHaveLength(2);
  });

  it("should handle tags with numbers in name", () => {
    const lines = [
      [{ content: "<h1>" }],
      [{ content: "  heading" }],
      [{ content: "</h1>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });

  it("should handle underscore in tag names", () => {
    const lines = [
      [{ content: "<my_element>" }],
      [{ content: "  content" }],
      [{ content: "</my_element>" }],
    ];
    const regions = detectFoldRegions(lines);
    expect(regions).toEqual([{ startLine: 1, endLine: 3 }]);
  });
});
