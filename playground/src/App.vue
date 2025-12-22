<script setup lang="ts">
import { codeToHtml } from "shiki";
import { vueCode } from "./fixtures/codeStrings";
import { attachFoldToggleListener, transformerHtmlFold } from "../../src/index";
import { onMounted } from "vue";
const html = await codeToHtml(vueCode, {
  lang: "vue",
  theme: "nord",
  transformers: [transformerHtmlFold()],
});

onMounted(() => {
  attachFoldToggleListener();
});
</script>

<template>
  <div>
    <div v-html="html" />
  </div>
</template>
