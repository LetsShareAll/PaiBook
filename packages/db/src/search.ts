/**
 * FTS5 的 unicode61 分词器不切分中文，trigram 又只对 3 字以上有效。
 * 所以索引与查询两侧都做同一种变换：中文按 bigram 切分，拉丁/数字按词。
 */
const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/

export function toSearchText(input: string): string {
  const tokens: string[] = []
  let cjk = ''
  let latin = ''

  const flushCjk = () => {
    if (!cjk) return
    const chars = [...cjk]
    if (chars.length === 1) tokens.push(chars[0] as string)
    for (let index = 0; index + 1 < chars.length; index += 1) {
      tokens.push(`${chars[index]}${chars[index + 1]}`)
    }
    cjk = ''
  }

  const flushLatin = () => {
    if (!latin) return
    tokens.push(latin)
    latin = ''
  }

  for (const char of input.toLowerCase()) {
    if (CJK.test(char)) {
      flushLatin()
      cjk += char
      continue
    }
    if (/[a-z0-9]/.test(char)) {
      flushCjk()
      latin += char
      continue
    }
    flushCjk()
    flushLatin()
  }

  flushCjk()
  flushLatin()
  return tokens.join(' ')
}

/** 把用户输入变成 FTS5 MATCH 表达式：每个 token 加引号，默认 AND 语义。 */
export function toMatchExpression(query: string): string {
  const text = toSearchText(query).trim()
  if (!text) return ''
  return text
    .split(/\s+/)
    .map((token) => `"${token.replaceAll('"', '')}"`)
    .join(' ')
}
