<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Taxonomy } from '@paibook/contracts'

const emit = defineEmits<{ changed: [] }>()

const kinds = [
  { value: 'character', label: '角色' },
  { value: 'agent', label: '代理人' },
  { value: 'enemy', label: '敌人' },
  { value: 'weapon', label: '武器' },
  { value: 'artifact', label: '圣遗物' },
  { value: 'disc', label: '驱动盘' },
  { value: 'bangboo', label: '邦布' },
  { value: 'other', label: '其他' },
]

const kindLabel = (kind: string) => kinds.find((item) => item.value === kind)?.label ?? kind

const taxonomy = ref<Taxonomy>({ versions: [], entities: [] })
const entityForm = ref({ kind: 'character', nameZh: '', nameEn: '' })
const versionForm = ref({ label: '' })
const message = ref('')
const busy = ref(false)

async function load() {
  taxonomy.value = await $fetch<Taxonomy>(apiUrl('/api/admin/taxonomy'))
}

onMounted(load)

async function addEntity() {
  if (!entityForm.value.nameZh.trim()) return
  busy.value = true
  message.value = ''
  try {
    await $fetch(apiUrl('/api/admin/entities'), {
      method: 'POST',
      body: {
        kind: entityForm.value.kind,
        nameZh: entityForm.value.nameZh.trim(),
        nameEn: entityForm.value.nameEn.trim() || null,
      },
    })
    entityForm.value = { kind: entityForm.value.kind, nameZh: '', nameEn: '' }
    await load()
    emit('changed')
  } catch {
    message.value = '实体添加失败：名称必填，且不能重复。'
  } finally {
    busy.value = false
  }
}

async function removeEntity(id: string) {
  busy.value = true
  try {
    const result = await $fetch<{ guides: number; links: number }>(apiUrl(`/api/admin/entities/${id}`), { method: 'DELETE' })
    message.value = `已删除实体；受影响的攻略 ${result.guides} 篇、外链 ${result.links} 条。`
    await load()
    emit('changed')
  } finally {
    busy.value = false
  }
}

async function addVersion() {
  if (!versionForm.value.label.trim()) return
  busy.value = true
  message.value = ''
  try {
    await $fetch(apiUrl('/api/admin/versions'), {
      method: 'POST',
      body: { label: versionForm.value.label.trim(), sortKey: 0 },
    })
    versionForm.value = { label: '' }
    await load()
    emit('changed')
  } catch {
    message.value = '版本添加失败：标签必填，且不能重复。'
  } finally {
    busy.value = false
  }
}

async function removeVersion(id: string) {
  busy.value = true
  try {
    const result = await $fetch<{ guides: number }>(apiUrl(`/api/admin/versions/${id}`), { method: 'DELETE' })
    message.value = `已删除版本；${result.guides} 篇攻略变为「未指定」。`
    await load()
    emit('changed')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="tax">
    <h2 class="tax__title">分类维护</h2>
    <p class="pb-muted tax__hint">实体（角色/代理人等）与版本是攻略的挂载点；加错名字会连带影响过滤与搜索。</p>

    <p v-if="message" class="pb-muted tax__message">{{ message }}</p>

    <div class="tax__grid">
      <div class="pb-panel tax__block">
        <h3 class="tax__sub">实体（{{ taxonomy.entities.length }}）</h3>
        <ul class="tax__list">
          <li v-for="item in taxonomy.entities" :key="item.id" class="tax__row">
            <span class="tax__name">{{ item.nameZh }}</span>
            <span class="pb-muted tax__kind">{{ kindLabel(item.kind) }}</span>
            <button class="pb-btn pb-btn--ghost" type="button" :disabled="busy" @click="removeEntity(item.id)">
              删除
            </button>
          </li>
        </ul>

        <form class="tax__form" @submit.prevent="addEntity">
          <select v-model="entityForm.kind" class="tax__input">
            <option v-for="item in kinds" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <input v-model="entityForm.nameZh" class="tax__input" placeholder="中文名（必填）" />
          <input v-model="entityForm.nameEn" class="tax__input" placeholder="英文名（可空）" />
          <button class="pb-btn pb-btn--primary" type="submit" :disabled="busy || !entityForm.nameZh.trim()">
            添加实体
          </button>
        </form>
      </div>

      <div class="pb-panel tax__block">
        <h3 class="tax__sub">版本（{{ taxonomy.versions.length }}）</h3>
        <ul class="tax__list">
          <li v-for="item in taxonomy.versions" :key="item.id" class="tax__row">
            <span class="tax__name">{{ item.label }}</span>
            <button class="pb-btn pb-btn--ghost" type="button" :disabled="busy" @click="removeVersion(item.id)">
              删除
            </button>
          </li>
        </ul>
        <p v-if="!taxonomy.versions.length" class="pb-muted tax__empty">还没有版本。</p>

        <form class="tax__form" @submit.prevent="addVersion">
          <input v-model="versionForm.label" class="tax__input" placeholder="版本号，例如 6.1" />
          <button class="pb-btn pb-btn--primary" type="submit" :disabled="busy || !versionForm.label.trim()">
            添加版本
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tax {
  margin-top: var(--pb-space-5);
}
.tax__title {
  font-family: var(--pb-font-display);
  font-size: 16px;
  margin: 0 0 var(--pb-space-1);
}
.tax__hint {
  margin: 0 0 var(--pb-space-3);
  font-size: 12px;
}
.tax__message {
  margin: 0 0 var(--pb-space-2);
  font-size: 12px;
}
.tax__grid {
  display: grid;
  gap: var(--pb-space-3);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.tax__block {
  padding: var(--pb-space-3);
}
.tax__sub {
  font-size: 14px;
  margin: 0 0 var(--pb-space-2);
}
.tax__list {
  list-style: none;
  margin: 0 0 var(--pb-space-3);
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
}
.tax__row {
  display: flex;
  align-items: center;
  gap: var(--pb-space-2);
  padding: var(--pb-space-1) 0;
  border-bottom: 1px solid var(--pb-edge);
  font-size: 13px;
}
.tax__name {
  flex: 1;
}
.tax__kind {
  font-size: 12px;
}
.tax__empty {
  margin: 0 0 var(--pb-space-3);
  font-size: 13px;
}
.tax__form {
  display: grid;
  gap: var(--pb-space-2);
}
.tax__input {
  padding: 5px 8px;
  border: var(--pb-border-width) solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 13px;
}
</style>
