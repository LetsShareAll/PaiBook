<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

useHead({
  title: '我的档案 · PaiBook',
  meta: [{ name: 'robots', content: 'noindex' }],
})

interface EntityOption {
  id: string
  kind: string
  nameZh: string
}

const { gameId, entityIds, ready, load, toggleEntity, clear, exportJson, importJson } = useProfile()
const noGame = computed(() => !gameId.value)

const entities = ref<EntityOption[]>([])
const message = ref('')

onMounted(async () => {
  await load()
  try {
    const data = await $fetch<{ items: EntityOption[] }>(apiUrl('/api/entities'))
    entities.value = data.items
  } catch {
    message.value = '实体清单加载失败，稍后再试。'
  }
})

async function download() {
  const blob = new Blob([exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `paibook-profile-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  message.value = '已导出 JSON 文件。'
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const count = await importJson(await file.text())
    message.value = `已导入 ${count} 个实体。`
  } catch {
    message.value = '导入失败：这个文件不是有效的档案 JSON。'
  } finally {
    input.value = ''
  }
}

async function reset() {
  await clear()
  message.value = '本机档案已清空。'
}
</script>

<template>
  <main class="pb-shell">
    <h1 class="pb-title">我的档案</h1>

    <p v-if="noGame" class="pb-muted">
      档案是按游戏分别保存的，请从某个游戏站（例如「原神」）里打开这一页。
    </p>

    <p v-if="!noGame" class="notice pb-panel">
      这份档案==只存在你这台设备的浏览器里==（IndexedDB），服务端不保存任何用户数据，也不使用用户标识 cookie。
      换设备或清理浏览器数据会丢失——请用下面的导入/导出迁移。档案目前只用来过滤与排序攻略。
    </p>

    <section v-if="!noGame" class="pick">
      <h2 class="section">我拥有的实体</h2>
      <p class="pb-muted hint">勾选后，攻略列表可以只看与你相关的条目。已选 {{ entityIds.length }} 个。</p>

      <p v-if="!ready" class="pb-muted">正在读取本机档案…</p>

      <div v-else class="chips">
        <button
          v-for="item in entities"
          :key="item.id"
          class="chip"
          :class="{ 'chip--on': entityIds.includes(item.id) }"
          type="button"
          @click="toggleEntity(item.id)"
        >
          {{ item.nameZh }}
        </button>
      </div>
      <p v-if="ready && !entities.length" class="pb-muted">这个游戏还没有可选的实体。</p>
    </section>

    <section v-if="!noGame" class="io">
      <h2 class="section">迁移</h2>
      <div class="io__actions">
        <button class="pb-btn" type="button" @click="download">导出 JSON</button>
        <label class="pb-btn upload">
          导入 JSON
          <input type="file" accept="application/json" @change="onFile" />
        </label>
        <button class="pb-btn pb-btn--ghost" type="button" @click="reset">清空本机档案</button>
      </div>
      <p v-if="message" class="pb-muted message">{{ message }}</p>
    </section>
  </main>
</template>

<style scoped>
.notice {
  padding: var(--pb-space-3);
  margin: 0 0 var(--pb-space-4);
  color: var(--pb-muted);
  font-size: 13px;
  line-height: 1.8;
}
.section {
  font-family: var(--pb-font-display);
  font-size: 17px;
  margin: 0 0 var(--pb-space-2);
}
.hint {
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pb-space-2);
}
.chip {
  padding: 3px 12px;
  border: 1px solid var(--pb-edge);
  border-radius: 999px;
  background: var(--pb-surface);
  color: var(--pb-muted);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}
.chip--on {
  border-color: var(--pb-accent);
  background: var(--pb-accent-soft);
  color: var(--pb-accent-ink);
}
.io {
  margin-top: var(--pb-space-5);
}
.io__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pb-space-2);
}
.upload {
  display: inline-flex;
  align-items: center;
}
.upload input {
  display: none;
}
.message {
  margin: var(--pb-space-2) 0 0;
  font-size: 13px;
}
</style>
