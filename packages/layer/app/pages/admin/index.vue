<script setup lang="ts">
import { ref } from 'vue'
import type { AdminGuideDetail, AdminGuideItem, AdminGuideList, Taxonomy } from '@paibook/contracts'

definePageMeta({ ssr: false })

useHead({
  title: '写作台 · PaiBook',
  meta: [{ name: 'robots', content: 'noindex' }],
})

const ready = ref(false)
const authed = ref(false)
const password = ref('')
const error = ref('')
const busy = ref(false)
const list = ref<AdminGuideItem[]>([])
const taxonomy = ref<Taxonomy>({ versions: [], entities: [] })
const editing = ref<AdminGuideDetail | null>(null)
const creating = ref(false)

async function refresh() {
  const [guides, tax] = await Promise.all([
    $fetch<AdminGuideList>('/api/admin/guides'),
    $fetch<Taxonomy>('/api/admin/taxonomy'),
  ])
  list.value = guides.items
  taxonomy.value = tax
}

async function boot() {
  try {
    await $fetch('/api/admin/session')
    authed.value = true
    await refresh()
  } catch {
    authed.value = false
  } finally {
    ready.value = true
  }
}

async function login() {
  error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    authed.value = true
    await refresh()
  } catch {
    error.value = '密码不对，或者服务端没配置 ADMIN_PASSWORD。'
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  authed.value = false
  list.value = []
  editing.value = null
}

function startCreate() {
  creating.value = true
  editing.value = null
}

async function open(id: string) {
  creating.value = false
  editing.value = await $fetch<AdminGuideDetail>(`/api/admin/guides/${id}`)
}

async function save(payload: Record<string, unknown>) {
  busy.value = true
  error.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/admin/guides/${editing.value.id}`, { method: 'PUT', body: payload })
    } else {
      const created = await $fetch<{ id: string }>('/api/admin/guides', { method: 'POST', body: payload })
      creating.value = false
      editing.value = await $fetch<AdminGuideDetail>(`/api/admin/guides/${created.id}`)
    }
    await refresh()
    if (editing.value) editing.value = await $fetch<AdminGuideDetail>(`/api/admin/guides/${editing.value.id}`)
  } catch (cause) {
    error.value = '保存失败：slug 可能已存在，或字段不合法。'
    console.error(cause)
  } finally {
    busy.value = false
  }
}

async function changeStatus(status: 'draft' | 'published', payload: Record<string, unknown>) {
  busy.value = true
  error.value = ''
  try {
    let id = editing.value?.id
    if (id) {
      await $fetch(`/api/admin/guides/${id}`, { method: 'PUT', body: payload })
    } else {
      const created = await $fetch<{ id: string }>('/api/admin/guides', { method: 'POST', body: payload })
      id = created.id
      creating.value = false
    }
    await $fetch(`/api/admin/guides/${id}/status`, { method: 'POST', body: { status } })
    editing.value = await $fetch<AdminGuideDetail>(`/api/admin/guides/${id}`)
    await refresh()
  } catch (cause) {
    error.value = '发布失败：slug 可能已存在，或字段不合法。'
    console.error(cause)
  } finally {
    busy.value = false
  }
}

onMounted(boot)
</script>

<template>
  <main class="pb-shell">
    <header class="top">
      <h1 class="pb-title">写作台</h1>
      <button v-if="authed" class="pb-btn pb-btn--ghost" type="button" @click="logout">退出</button>
    </header>

    <p v-if="!ready" class="pb-muted">正在检查登录状态…</p>

    <form v-else-if="!authed" class="login pb-panel" @submit.prevent="login">
      <label class="login__label" for="pb-pw">管理员密码</label>
      <input id="pb-pw" v-model="password" class="login__input" type="password" autocomplete="current-password" />
      <button class="pb-btn pb-btn--primary" type="submit">进入</button>
      <p v-if="error" class="err">{{ error }}</p>
    </form>

    <template v-else>
      <p v-if="error" class="err">{{ error }}</p>

      <PbAdminEditor
        v-if="creating || editing"
        :initial="editing"
        :taxonomy="taxonomy"
        :busy="busy"
        @save="save"
        @status="changeStatus"
        @cancel="((creating = false), (editing = null))"
      />

      <template v-else>
        <div class="bar">
          <span class="pb-muted">共 {{ list.length }} 篇（含草稿）</span>
          <button class="pb-btn pb-btn--primary" type="button" @click="startCreate">新建攻略</button>
        </div>

        <ul class="rows">
          <li v-for="item in list" :key="item.id" class="row pb-panel">
            <button class="row__main" type="button" @click="open(item.id)">
              <span class="row__title">{{ item.title }}</span>
              <span class="row__meta pb-muted">
                <span class="pb-badge">{{ item.status === 'published' ? '已发布' : '草稿' }}</span>
                <span>{{ item.slug }}</span>
                <span>{{ item.updatedAt.slice(0, 16).replace('T', ' ') }}</span>
              </span>
            </button>
          </li>
        </ul>
      </template>
    </template>
  </main>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.login {
  display: grid;
  gap: var(--pb-space-2);
  padding: var(--pb-space-4);
  max-width: 420px;
}
.login__label {
  color: var(--pb-muted);
  font-size: 12px;
}
.login__input {
  padding: var(--pb-space-2);
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--pb-space-3);
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--pb-space-2);
}
.row {
  padding: 0;
}
.row__main {
  display: block;
  width: 100%;
  padding: var(--pb-space-3);
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.row__title {
  display: block;
  font-weight: 600;
}
.row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pb-space-2);
  margin-top: var(--pb-space-1);
  font-size: 12px;
}
.err {
  color: #b4544a;
  font-size: 13px;
}
</style>
