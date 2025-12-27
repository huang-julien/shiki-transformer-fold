import type { Meta, StoryObj } from "@storybook/vue3";
import TransformerHtmlFold from "./TransformerHtmlFold.vue";
import { vueCode } from "../fixtures/codeStrings";

const meta: Meta<typeof TransformerHtmlFold> = {
  title: "Transformers/HtmlFold",
  component: TransformerHtmlFold,
  tags: ["autodocs"], 
};

export default meta;

type Story = StoryObj<typeof TransformerHtmlFold>;

export const Default: Story = {
  args: {
    code: vueCode,
  },
};

export const WithCustomClassPrefix: Story = {
  args: {
    code: vueCode,
    transformerOptions: {
      classPrefix: "custom-fold",
    },
  },
};

export const SimpleHtml: Story = {
  args: {
    code: `<template>
  <div class="container">
    <header>
      <h1>Hello World</h1>
    </header>
    <main>
      <p>Content here</p>
    </main>
  </div>
</template>`,
  },
};

export const NestedElements: Story = {
  args: {
    code: `<template>
  <div>
    <ul>
      <li>
        <span>Item 1</span>
      </li>
      <li>
        <span>Item 2</span>
      </li>
    </ul>
  </div>
</template>`,
  },
};
