<script setup lang="ts">
import { codeToHtml } from "shiki";
import { vueCode } from "./fixtures/codeStrings";
import {
  attachFoldToggleListener,
  transformerRenderHtmlFold,
} from "../../src/index";
import { onMounted } from "vue";
const html = await codeToHtml(vueCode, {
  lang: "vue",
  theme: "nord",
  transformers: [
    transformerRenderHtmlFold({
      foldLevel: 0,
    }),
  ],
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
