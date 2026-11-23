type OpinaApi = {
  show: (surveyId?: string) => void
  prompt: (surveyId?: string) => void
  hide: () => void
}

const SITE = 'comparatasas'
const MIN_DISTINCT_PATHS = 3
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

function pathsKey(publicKey: string) {
  return `opina:paths:${SITE}:${publicKey}`
}

function lastPromptKey(publicKey: string) {
  return `opina:last-prompt:${SITE}:${publicKey}`
}

function readPaths(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  }
  catch {
    return []
  }
}

function writePaths(key: string, paths: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(paths.slice(-50)))
  }
  catch {
    /* ignore quota */
  }
}

function waitForOpina(timeoutMs = 8000): Promise<OpinaApi | null> {
  return new Promise((resolve) => {
    const w = window as Window & { Opina?: OpinaApi }
    if (w.Opina?.prompt) {
      resolve(w.Opina)
      return
    }
    const started = Date.now()
    const timer = window.setInterval(() => {
      if (w.Opina?.prompt) {
        window.clearInterval(timer)
        resolve(w.Opina)
      }
      else if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer)
        resolve(w.Opina || null)
      }
    }, 100)
  })
}

/**
 * Loads Opina widget and prompts CSAT after 3+ distinct paths, at most once
 * every 30 days (also enforced by survey cooldown). Page-feedback slots stay
 * independent; CSAT id is required because the project has multiple surveys.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const base = String(config.public.opinaUrl || '').replace(/\/$/, '')
  const key = String(config.public.opinaKey || '').trim()
  const csatId = String(config.public.opinaCsatSurveyId || '').trim()
  if (!base || !key) return

  useHead({
    link: [
      { rel: 'dns-prefetch', href: base },
      { rel: 'preconnect', href: base, crossorigin: '' },
    ],
    script: [
      {
        key: 'opina-widget',
        // Query busts Cloudflare edge cache of /widget.js.
        src: `${base}/widget.js?v=prompt1`,
        defer: true,
        tagPosition: 'bodyClose',
        'data-key': key,
      },
    ],
  })

  if (!csatId) return

  const router = useRouter()
  let promptedThisSession = false

  async function maybePrompt(path: string) {
    if (promptedThisSession || import.meta.server) return
    const storeKey = pathsKey(key)
    const paths = new Set(readPaths(storeKey))
    paths.add(path.split('?')[0] || '/')
    writePaths(storeKey, [...paths])

    if (paths.size < MIN_DISTINCT_PATHS) return

    const lastKey = lastPromptKey(key)
    const last = Number(localStorage.getItem(lastKey) || 0)
    if (last && Date.now() - last < COOLDOWN_MS) return

    const opina = await waitForOpina()
    if (!opina?.prompt) return

    promptedThisSession = true
    try {
      localStorage.setItem(lastKey, String(Date.now()))
    }
    catch {
      /* ignore */
    }
    opina.prompt(csatId)
  }

  router.afterEach((to) => {
    void maybePrompt(to.path)
  })

  void maybePrompt(router.currentRoute.value.path)
})
