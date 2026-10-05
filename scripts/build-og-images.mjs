/**
 * 生成各站的分享卡片图（1200×630 PNG），全部自绘——不使用任何官方素材（ADR-0007）。
 *
 * 用法（需要 playwright，浏览器可用 `npx playwright install chromium` 安装）：
 *   node scripts/build-og-images.mjs
 * 若浏览器不在默认位置，先设 PLAYWRIGHT_BROWSERS_PATH。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const sites = [
  {
    slug: 'genshin',
    title: '派蒙的应急手册 · 提瓦特篇',
    paper: '#f7f2e7',
    surface: '#fffdf8',
    ink: '#3b3a36',
    muted: '#8a8578',
    accent: '#c8a86b',
    edge: '#e2d9c6',
    ornament: `<path d="M60 0l14 34 34 14-34 14-14 34-14-34-34-14 34-14z" fill="ACCENT"/>`,
    motif: 'diamond',
  },
  {
    slug: 'honkaistarrail',
    title: '派蒙的应急手册 · 星穹列车篇',
    paper: '#0b1020',
    surface: '#141b2e',
    ink: '#e9edf8',
    muted: '#8f9ab8',
    accent: '#8fb6ff',
    edge: '#26314b',
    ornament: `<circle cx="60" cy="42" r="22" fill="none" stroke="ACCENT" stroke-width="6"/><path d="M4 84h112" stroke="ACCENT" stroke-width="5"/>`,
    motif: 'rail',
  },
  {
    slug: 'zenlesszonezero',
    title: '派蒙的应急手册 · 新艾利都篇',
    paper: '#0d0d0d',
    surface: '#151515',
    ink: '#f4f4f4',
    muted: '#949494',
    accent: '#eaff3d',
    edge: '#2b2b2b',
    ornament: `<path d="M4 74L28 30l22 44 24-70 20 70h22" stroke="ACCENT" stroke-width="9" fill="none"/>`,
    motif: 'signal',
  },
  {
    slug: 'portal',
    title: 'PaiBook · 派书',
    paper: '#f4f1ea',
    surface: '#fffefb',
    ink: '#2f2c28',
    muted: '#857f74',
    accent: '#c8a86b',
    edge: '#e4ddd0',
    ornament: `<path d="M8 18c20-6 40-4 52 6 12-10 32-12 52-6v70c-20-6-40-4-52 6-12-10-32-12-52-6z" fill="none" stroke="ACCENT" stroke-width="6"/>`,
    motif: 'book',
  },
]

function html(site) {
  const accent = site.accent
  const ornament = site.ornament.replaceAll('ACCENT', accent)
  const stripe =
    site.motif === 'signal'
      ? `repeating-linear-gradient(-45deg, ${accent} 0 10px, transparent 10px 24px)`
      : `linear-gradient(90deg, transparent, ${accent}, transparent)`

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; width: 1200px; height: 630px; overflow: hidden;
    background: ${site.paper}; color: ${site.ink};
    font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, sans-serif;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 64px 72px;
  }
  .top { display: flex; align-items: center; gap: 28px; }
  .mark { width: 120px; height: 120px; flex: none; }
  h1 { font-size: 58px; line-height: 1.25; margin: 0; letter-spacing: -0.01em; }
  .tagline { margin: 18px 0 0; font-size: 26px; color: ${site.muted}; letter-spacing: 0.08em; }
  .rule { height: 4px; background: ${stripe}; margin: 36px 0; }
  .bottom { display: flex; align-items: flex-end; justify-content: space-between; }
  .url { font-size: 24px; color: ${site.muted}; }
  .note { font-size: 17px; color: ${site.muted}; max-width: 640px; line-height: 1.6; }
  .frame { position: absolute; inset: 22px; border: 2px solid ${site.edge}; }
</style></head>
<body>
  <div class="frame"></div>
  <div class="top">
    <svg class="mark" viewBox="0 0 120 96">${ornament}</svg>
    <div>
      <h1>${site.title}</h1>
      <p class="tagline">不是应急食品，是应急手册！</p>
    </div>
  </div>
  <div class="rule"></div>
  <div class="bottom">
    <p class="note">三款游戏的攻略站。非官方粉丝站点，与米哈游及关联公司无任何关联；所有图标与装饰均自行绘制。</p>
    <p class="url">paibook.lssa.fun${site.slug === 'portal' ? '/' : `/${site.slug}/`}</p>
  </div>
</body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })

for (const site of sites) {
  const target = join(root, 'apps', site.slug, 'public', 'og.png')
  mkdirSync(dirname(target), { recursive: true })
  await page.setContent(html(site), { waitUntil: 'load' })
  await page.screenshot({ path: target })
  writeFileSync(join(root, 'apps', site.slug, 'public', '.gitkeep'), '')
  console.log(`og.png -> apps/${site.slug}/public/og.png`)
}

await browser.close()
