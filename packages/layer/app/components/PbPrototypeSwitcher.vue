<script setup lang="ts">
/**
 * 原型浮条（一次性代码）：在变体之间翻页。
 * 只在 dev 下渲染——别让它有机会跟着发上线。
 */
const props = defineProps<{
  variants: { key: string; name: string }[]
  current: string
}>()

const emit = defineEmits<{ change: [key: string] }>()

const visible = import.meta.dev

const currentName = computed(
  () => props.variants.find((v) => v.key === props.current)?.name ?? '',
)

function move(step: number) {
  const i = props.variants.findIndex((v) => v.key === props.current)
  const next = props.variants[(i + step + props.variants.length) % props.variants.length]
  if (next) emit('change', next.key)
}

function onKey(event: KeyboardEvent) {
  const el = event.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  if (event.key === 'ArrowLeft') move(-1)
  if (event.key === 'ArrowRight') move(1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="visible" class="pb-proto-bar">
    <button type="button" class="pb-proto-bar__nav" aria-label="上一个变体" @click="move(-1)">
      ←
    </button>
    <span class="pb-proto-bar__label">
      {{ current }}<template v-if="currentName"> · {{ currentName }}</template>
    </span>
    <button type="button" class="pb-proto-bar__nav" aria-label="下一个变体" @click="move(1)">
      →
    </button>
  </div>
</template>

<style scoped>
/* 故意不用站点 token：这条浮条不是被评估的设计的一部分。 */
.pb-proto-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  z-index: 9999;
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px;
  color: #fff;
  background: #111;
  border: 1px solid #555;
  border-radius: 999px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 45%);
  transform: translateX(-50%);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}
.pb-proto-bar__nav {
  width: 28px;
  height: 28px;
  color: #fff;
  cursor: pointer;
  background: #2a2a2a;
  border: 0;
  border-radius: 999px;
  font-size: 14px;
  line-height: 1;
}
.pb-proto-bar__nav:hover {
  background: #444;
}
.pb-proto-bar__label {
  padding: 0 12px;
  white-space: nowrap;
}
</style>
