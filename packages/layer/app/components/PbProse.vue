<script setup lang="ts">
import { marked } from 'marked'
import { computed } from 'vue'

const props = defineProps<{
  markdown: string
}>()

marked.use({ gfm: true, breaks: false })

const html = computed(() => marked.parse(props.markdown) as string)
</script>

<template>
  <div class="pb-prose" v-html="html" />
</template>

<style scoped>
.pb-prose {
  font-size: 16px;
  line-height: 1.85;
}

.pb-prose :deep(h2) {
  font-family: var(--pb-font-display);
  font-size: 20px;
  font-weight: 700;
  margin: var(--pb-space-5) 0 var(--pb-space-2);
  padding-left: var(--pb-space-3);
  border-left: 3px solid var(--pb-accent);
}

.pb-prose :deep(h3) {
  font-family: var(--pb-font-display);
  font-size: 17px;
  font-weight: 700;
  margin: var(--pb-space-4) 0 var(--pb-space-2);
}

.pb-prose :deep(h2:first-child),
.pb-prose :deep(h3:first-child) {
  margin-top: 0;
}

.pb-prose :deep(p) {
  margin: 0 0 var(--pb-space-3);
}

.pb-prose :deep(ul),
.pb-prose :deep(ol) {
  margin: 0 0 var(--pb-space-3);
  padding-left: 1.4em;
}

.pb-prose :deep(li) {
  margin-bottom: var(--pb-space-1);
}

.pb-prose :deep(li::marker) {
  color: var(--pb-accent);
}

.pb-prose :deep(a) {
  color: var(--pb-accent-ink);
  text-decoration-color: var(--pb-accent);
  text-underline-offset: 3px;
}

.pb-prose :deep(blockquote) {
  margin: 0 0 var(--pb-space-3);
  padding: var(--pb-space-2) var(--pb-space-3);
  background: var(--pb-surface-alt);
  border-left: 3px solid var(--pb-accent-soft);
  color: var(--pb-muted);
}

.pb-prose :deep(code) {
  font-family: var(--pb-font-mono);
  font-size: 0.9em;
  padding: 1px 5px;
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface-alt);
}

.pb-prose :deep(pre) {
  margin: 0 0 var(--pb-space-3);
  padding: var(--pb-space-3);
  overflow-x: auto;
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface-alt);
}

.pb-prose :deep(pre code) {
  border: 0;
  padding: 0;
  background: none;
}

.pb-prose :deep(table) {
  width: 100%;
  margin: 0 0 var(--pb-space-3);
  border-collapse: collapse;
  font-size: 14px;
}

.pb-prose :deep(th),
.pb-prose :deep(td) {
  padding: var(--pb-space-2);
  border: 1px solid var(--pb-edge);
  text-align: left;
}

.pb-prose :deep(th) {
  background: var(--pb-surface-alt);
}

.pb-prose :deep(hr) {
  height: 1px;
  margin: var(--pb-space-4) 0;
  border: 0;
  background: linear-gradient(90deg, transparent, var(--pb-accent), transparent);
}
</style>
