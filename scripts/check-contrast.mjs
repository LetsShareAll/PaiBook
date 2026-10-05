/**
 * 对比度体检：直接解析 tokens.css，按 WCAG 2.x 公式算关键配对的对比度。
 * 不靠肉眼，也不用另外维护一份颜色表——token 改了这里自动跟着变。
 *
 *   node scripts/check-contrast.mjs
 *
 * 阈值：正文/次级文字 4.5:1（AA 正常字号），边框等 UI 构件 3:1。
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'packages/layer/app/assets/css/tokens.css'), 'utf8')

function tokensFor(selector) {
  const pattern = new RegExp(`${selector.replace(/[[\]'=]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
  const match = css.match(pattern)
  if (!match) return {}
  const tokens = {}
  for (const line of match[1].split('\n')) {
    const declaration = line.match(/(--[\w-]+)\s*:\s*([^;]+);/)
    if (declaration) tokens[declaration[1]] = declaration[2].trim()
  }
  return tokens
}

function parseColor(value) {
  if (!value) return null
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const raw = hex[1]
    const full = raw.length === 3 ? [...raw].map((c) => c + c).join('') : raw
    return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16))
  }
  const rgb = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)$/)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return null
}

const channel = (value) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(color) {
  const [r, g, b] = color.map(channel)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const base = tokensFor(':root')
const sites = ['genshin', 'honkaistarrail', 'zenlesszonezero', 'portal']

// enforce=false 的项只报告不判定：卡片描边是装饰性的，按 WCAG 1.4.11 属豁免范围
// （卡片的边界还有背景色差与阴影共同表达），但它也不该接近不可见，所以仍列出来。
const pairs = [
  ['正文：ink / paper', '--pb-ink', '--pb-paper', 4.5, true],
  ['卡片文字：ink / surface', '--pb-ink', '--pb-surface', 4.5, true],
  ['次级文字：muted / surface', '--pb-muted', '--pb-surface', 4.5, true],
  ['页脚文字：muted / surface-alt', '--pb-muted', '--pb-surface-alt', 4.5, true],
  ['徽章文字：accent-foreground / accent-soft', '--pb-accent-foreground', '--pb-accent-soft', 4.5, true],
  ['悬停与链接：accent-foreground / surface', '--pb-accent-foreground', '--pb-surface', 4.5, true],
  ['强调构件：accent / surface', '--pb-accent', '--pb-surface', 3, true],
  ['面板描边（装饰性）', '--pb-edge', '--pb-surface', 3, false],
]

let failures = 0

for (const site of sites) {
  const own = tokensFor(`[data-site='${site}']`)
  const tokens = { ...base, ...own }
  console.log(`\n--- ${site} ---`)
  for (const [label, fgToken, bgToken, min, enforce] of pairs) {
    const fg = parseColor(tokens[fgToken])
    const bg = parseColor(tokens[bgToken])
    if (!fg || !bg) {
      console.log(`跳过  ${label}（token 缺失）`)
      continue
    }
    const ratio = contrast(fg, bg)
    const ok = ratio >= min
    if (!ok && enforce) failures += 1
    const mark = ok ? 'ok  ' : enforce ? 'FAIL' : '提示'
    console.log(`${mark}  ${label.padEnd(38)} ${ratio.toFixed(2)}:1  (需要 ${min}:1)`)
  }
}

console.log(`\n${failures === 0 ? '全部达标' : `${failures} 项未达标`}`)
process.exit(failures === 0 ? 0 : 1)
