<script setup lang="ts">
import { codeToHtml } from "shiki";
import {
  attachFoldToggleListener,
  transformerRenderHtmlFold,
  type TransformerHtmlFoldOptions,
} from "../../../src/index";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
    /**
     * The code string to be transformed and displayded.
     */
    code: string;
    /**
     * Options for the HTML fold transformer.
     * @type TransformerHtmlFoldOptions
     */
    transformerOptions?: TransformerHtmlFoldOptions
}>()

const html = ref("")

watch(props, async (newProps) => {
  html.value = await codeToHtml(newProps.code, {
    lang: "vue",
    theme: "nord",
    transformers: [transformerRenderHtmlFold(newProps.transformerOptions)],
  });
}, { immediate: true })

onMounted(() => {
  attachFoldToggleListener();
});
</script>

<template>
  <div>
    <div v-html="html" />
  </div>
</template>
