<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { codeToHtml } from 'shiki'
import { vueCode } from './fixtures/codeStrings'; 
import { transformerHtmlFold } from '../../src/index'
const html = await codeToHtml(vueCode, {
  lang: 'vue',
  theme: 'nord',
  transformers: [ 
    transformerHtmlFold()
  ]
})
 
</script>

<template>
  <div>
    <component :is="'style'" v-text="foldStyles" />
    <div v-html="html" />
    <component :is="'script'" v-text="foldScript" />
  </div> 
</template>
 