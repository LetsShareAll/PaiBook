<script setup lang="ts">
import { ref } from 'vue'
import type { AdminGuideDetail, AdminGuideItem, AdminGuideList, GuideLink, Taxonomy } from '@paibook/contracts'

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
const links = ref<GuideLink[]>([])
const linkForm = ref({ title: '', url: '', summary: '', sourceName: '', author: '' })

async function addLink() {
  busy.value = true
  error.value = ''
  try {
    await $fetch(apiUrl('/api/admin/links'), {
      method: 'POST',
      body: { ...linkForm.value, entityIds: [] },
    })
    linkForm.value = { title: '', url: '', summary: '', sourceName: '', author: '' }
    await refresh()
  } catch {
    error.value = '外链添加失败：标题必填，链接必须是 http(s)。'
  } finally {
    busy.value = false
  }
}

async function removeLink(id: string) {
  busy.value = true
  try {
    await $fetch(apiUrl(`/api/admin/links/${id}`), { method: 'DELETE' })
    await refresh()
  } finally {
    busy.value = false
  }
}

async function refresh() {
  const [guides, tax, linkData] = await Promise.all([
    $fetch<AdminGuideList>(apiUrl('/api/admin/guides')),
    $fetch<Taxonomy>(apiUrl('/api/admin/taxonomy')),
    $fetch<{ items: GuideLink[] }>(apiUrl('/api/admin/links')),
  ])
  list.value = guides.items
  taxonomy.value = tax
  links.value = linkData.items
}

async function boot() {
  try {
    await $fetch(apiUrl('/api/admin/session'))
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
    await $fetch(apiUrl('/api/admin/login'), { method: 'POST', body: { password: password.value } })
    password.value = ''
    authed.value = true
    await refresh()
  } catch {
    error.value = '密码不对，或者服务端没配置 ADMIN_PASSWORD。'
  }
}

async function logout() {
  await $fetch(apiUrl('/api/admin/logout'), { method: 'POST' })
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
  editing.value = await $fetch<AdminGuideDetail>(apiUrl(`/api/admin/guides/${id}`))
}

async function save(payload: Record<string, unknown>) {
  busy.value = true
  error.value = ''
  try {
    if (editing.value) {
      await $fetch(apiUrl(`/api/admin/guides/${editing.value.id}`), { method: 'PUT', body: payload })
    } else {
      const created = await $fetch<{ id: string }>(apiUrl('/api/admin/guides'), { method: 'POST', body: payload })
      creating.value = false
      editing.value = await $fetch<AdminGuideDetail>(apiUrl(`/api/admin/guides/${created.id}`))
    }
    await refresh()
    if (editing.value) editing.value = await $fetch<AdminGuideDetail>(apiUrl(`/api/admin/guides/${editing.value.id}`))
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
      await $fetch(apiUrl(`/api/admin/guides/${id}`), { method: 'PUT', body: payload })
    } else {
      const created = await $fetch<{ id: string }>(apiUrl('/api/admin/guides'), { method: 'POST', body: payload })
      id = created.id
      creating.value = false
    }
    await $fetch(apiUrl(`/api/admin/guides/${id}/status`), { method: 'POST', body: { status } })
    editing.value = await $fetch<AdminGuideDetail>(apiUrl(`/api/admin/guides/${id}`))
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

        <section class="admin-links">
          <h2 class="admin-links__title">站外推荐（Link）</h2>
          <p class="admin-links__hint pb-muted">只存标题与自写摘要，正文留在原站。</p>

          <ul v-if="links.length" class="rows">
            <li v-for="item in links" :key="item.id" class="row pb-panel">
              <div class="link-row">
                <a class="link-row__title" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
                <span class="pb-muted link-row__meta">
                  {{ [item.sourceName, item.author].filter(Boolean).join(' · ') }}
                </span>
                <button class="pb-btn pb-btn--ghost" type="button" :disabled="busy" @click="removeLink(item.id)">
                  删除
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="pb-muted admin-links__hint">还没有站外推荐。</p>

          <form class="link-form" @submit.prevent="addLink">
            <input v-model="linkForm.title" class="link-form__input" placeholder="标题（必填）" />
            <input v-model="linkForm.url" class="link-form__input" placeholder="https://…（必填）" />
            <input v-model="linkForm.summary" class="link-form__input" placeholder="自写摘要" />
            <input v-model="linkForm.sourceName" class="link-form__input" placeholder="来源站" />
            <input v-model="linkForm.author" class="link-form__input" placeholder="作者" />
            <button class="pb-btn pb-btn--primary" type="submit" :disabled="busy || !linkForm.title || !linkForm.url">
              添加外链
            </button>
          </form>
        </section>
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
.admin-links {
  margin-top: var(--pb-space-5);
}
.admin-links__title {
  font-family: var(--pb-font-display);
  font-size: 16px;
  margin: 0 0 var(--pb-space-1);
}
.admin-links__hint {
  margin: 0 0 var(--pb-space-2);
  font-size: 12px;
}
.link-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pb-space-2);
  padding: var(--pb-space-3);
}
.link-row__title {
  color: inherit;
  font-weight: 600;
}
.link-row__meta {
  flex: 1;
  font-size: 12px;
}
.link-form {
  display: grid;
  gap: var(--pb-space-2);
  margin-top: var(--pb-space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.link-form__input {
  padding: var(--pb-space-2);
  border: 1px solid var(--pb-edge);
  border-radius: var(--pb-radius-sm);
  background: var(--pb-surface);
  color: var(--pb-ink);
  font-family: inherit;
  font-size: 13px;
}
</style>
