<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AdminGuideDetail, Taxonomy } from '@paibook/contracts'

const props = defineProps<{
  initial: AdminGuideDetail | null
  taxonomy: Taxonomy
  busy?: boolean
}>()

const emit = defineEmits<{
  save: [payload: { title: string; slug: string; summary: string; body: string; versionId: string | null; entityIds: string[] }]
  status: [
    status: 'draft' | 'published',
    payload: { title: string; slug: string; summary: string; body: string; versionId: string | null; entityIds: string[] },
  ]
  cancel: []
  delete: []
}>()

const title = ref('')
const slug = ref('')
const summary = ref('')
const body = ref('')
const versionId = ref<string | null>(null)
const entityIds = ref<string[]>([])
const preview = ref(false)

watch(
  () => props.initial,
  (value) => {
    title.value = value?.title ?? ''
    slug.value = value?.slug ?? ''
    summary.value = value?.summary ?? ''
    body.value = value?.body ?? ''
    versionId.value = value?.versionId ?? null
    entityIds.value = value ? [...value.entityIds] : []
    preview.value = false
  },
  { immediate: true },
)

const slugValid = computed(() => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value))
const canSave = computed(() => title.value.trim().length > 0 && slugValid.value && !props.busy)

function payload() {
  return {
    title: title.value.trim(),
    slug: slug.value.trim(),
    summary: summary.value.trim(),
    body: body.value,
    versionId: versionId.value,
    entityIds: [...entityIds.value],
  }
}

function toggleEntity(id: string) {
  entityIds.value = entityIds.value.includes(id)
    ? entityIds.value.filter((item) => item !== id)
    : [...entityIds.value, id]
}
</script>

<template>
  <section class="editor pb-panel">
    <header class="editor__head">
      <h2 class="editor__title">{{ initial ? '编辑攻略' : '新建攻略' }}</h2>
      <div class="editor__actions">
        <button class="pb-btn" type="button" :disabled="!canSave" @click="emit('save', payload())">
          {{ busy ? '保存中…' : '保存草稿' }}
        </button>
        <button
          v-if="initial?.status !== 'published'"
          class="pb-btn pb-btn--primary"
          type="button"
          :disabled="!canSave"
          @click="emit('status', 'published', payload())"
        >
          发布
        </button>
        <button v-else class="pb-btn" type="button" :disabled="busy" @click="emit('status', 'draft', payload())">
          取消发布
        </button>
        <a
          v-if="initial"
          class="pb-btn"
          :href="apiUrl(`/admin/preview/${initial.id}`)"
          target="_blank"
          rel="noopener"
        >
          预览真实页面
        </a>
        <button
          v-if="initial"
          class="pb-btn pb-btn--ghost"
          type="button"
          :disabled="busy"
          @click="emit('delete')"
        >
          删除这篇
        </button>
        <button class="pb-btn pb-btn--ghost" type="button" @click="emit('cancel')">返回列表</button>
      </div>
    </header>

    <div class="field">
      <label class="label" for="pb-title">标题</label>
      <input id="pb-title" v-model="title" class="input" type="text" maxlength="120" />
    </div>

    <div class="field">
      <label class="label" for="pb-slug">slug（小写字母、数字、连字符）</label>
      <input id="pb-slug" v-model="slug" class="input" type="text" />
      <p v-if="!slugValid" class="hint hint--bad">slug 格式不合法</p>
    </div>

    <div class="field">
      <label class="label" for="pb-summary">摘要</label>
      <textarea id="pb-summary" v-model="summary" class="input" rows="2" maxlength="300" />
    </div>

    <div class="field field--row">
      <div>
        <label class="label" for="pb-version">适用版本</label>
        <select id="pb-version" v-model="versionId" class="input">
          <option :value="null">未指定</option>
          <option v-for="item in taxonomy.versions" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </div>
    </div>

    <div class="field">
      <span class="label">关联实体</span>
      <div class="chips">
        <button
          v-for="item in taxonomy.entities"
          :key="item.id"
          class="chip"
          :class="{ 'chip--on': entityIds.includes(item.id) }"
          type="button"
          @click="toggleEntity(item.id)"
        >
          {{ item.nameZh }}
        </button>
        <span v-if="!taxonomy.entities.length" class="hint">这个游戏还没有实体，先在数据库里建。</span>
      </div>
    </div>

    <div class="field">
      <div class="field__bar">
        <span class="label">正文（Markdown）</span>
        <button class="pb-btn pb-btn--ghost" type="button" @click="preview = !preview">
          {{ preview ? '继续编辑' : '预览' }}
        </button>
      </div>
      <textarea v-if="!preview" v-model="body" class="input input--mono" rows="14" />
      <div v-else class="preview pb-panel">
        <PbProse :markdown="body" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.editor {
  padding: var(--pb-space-4);
}
.editor__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pb-space-2);
  margin-bottom: var(--pb-space-4);
}
.editor__title {
  font-family: var(--pb-font-display);
  font-size: 18px;
  margin: 0;
}
.editor__actions {
  display: flex;
  gap: var(--pb-space-2);
}
.field {
  margin-bottom: var(--pb-space-3);
}
.field--row {
  display: flex;
  gap: var(--pb-space-3);
}
.field__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.label {
  display: block;
  margin-bottom: var(--pb-space-1);
  color: var(--pb-muted);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.input {
  width: 100%;
  padding: var(--pb-space-2);
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.7;
}
.input--mono {
  font-family: var(--pb-font-mono);
  font-size: 13px;
}
.input:focus {
  outline: 2px solid var(--pb-accent);
  outline-offset: -1px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pb-space-2);
}
.chip {
  padding: 2px 10px;
  border: 1px solid var(--pb-edge);
  border-radius: 999px;
  background: var(--pb-surface);
  color: var(--pb-muted);
  font-size: 13px;
  cursor: pointer;
}
.chip--on {
  border-color: var(--pb-accent);
  background: var(--pb-accent-soft);
  color: var(--pb-accent-ink);
}
.hint {
  margin: var(--pb-space-1) 0 0;
  color: var(--pb-muted);
  font-size: 12px;
}
.hint--bad {
  color: #b4544a;
}
.preview {
  padding: var(--pb-space-3);
}
</style>
