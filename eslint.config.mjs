import unjs from "eslint-config-unjs";

export default unjs({
  ignores: [
    // ignore paths
  ],
  rules: {
    // rule overrides
    "unicorn/filename-case": "off",
  },
  markdown: {
    rules: {
      // markdown rule overrides
    },
  },
});
