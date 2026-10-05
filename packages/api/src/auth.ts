const encoder = new TextEncoder()
const SESSION_COOKIE = 'pb_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export { SESSION_COOKIE, SESSION_TTL_SECONDS }

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of view) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function hmacKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage)
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  if (!secret) throw new Error('SESSION_SECRET 未配置')
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret, ['sign']), encoder.encode(String(expiresAt)))
  return `${expiresAt}.${base64url(signature)}`
}

export async function verifySessionToken(secret: string, token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!secret || !token) return false
  const [expiresPart, signaturePart] = token.split('.')
  if (!expiresPart || !signaturePart) return false

  const expiresAt = Number(expiresPart)
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < now) return false

  try {
    return await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret, ['verify']),
      fromBase64url(signaturePart),
      encoder.encode(String(expiresAt)),
    )
  } catch {
    return false
  }
}

export async function passwordMatches(expected: string, provided: string): Promise<boolean> {
  if (!expected) return false
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const left = new Uint8Array(a)
  const right = new Uint8Array(b)
  let diff = 0
  for (let index = 0; index < left.length; index += 1) diff |= (left[index] ?? 0) ^ (right[index] ?? 0)
  return diff === 0
}
