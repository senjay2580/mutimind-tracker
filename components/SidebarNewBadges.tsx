import { useEffect } from 'react'
import repos from '../lib/repos.json'

type Repo = {
  slug: string
  addedAt?: string
}

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000
const BADGE_CLASS = 'mm-sidebar-new-badge'

function getNewCounts() {
  const cutoff = Date.now() - NEW_WINDOW_MS
  const counts = new Map<string, number>()

  for (const repo of repos as Repo[]) {
    if (!repo.addedAt) continue
    const addedAt = new Date(repo.addedAt).getTime()
    if (Number.isNaN(addedAt) || addedAt <= cutoff) continue
    counts.set(repo.slug, (counts.get(repo.slug) ?? 0) + 1)
  }

  return counts
}

function getTrackerSlug(href: string) {
  try {
    const url = new URL(href, window.location.origin)
    const match = url.pathname.match(/^\/tracker\/([^/?#]+)/)
    return match?.[1]
  } catch {
    return undefined
  }
}

function applyBadges(counts: Map<string, number>) {
  document.querySelectorAll<HTMLAnchorElement>('aside a[href*="/tracker/"]').forEach((link) => {
    const slug = getTrackerSlug(link.href)
    if (!slug) return

    const count = counts.get(slug) ?? 0
    const existing = link.querySelector<HTMLElement>(`:scope > .${BADGE_CLASS}`)

    if (count <= 0) {
      existing?.remove()
      link.classList.remove('mm-sidebar-link-with-new')
      return
    }

    link.classList.add('mm-sidebar-link-with-new')
    const badge = existing ?? document.createElement('span')
    const label = `24h 内新增 ${count} 个项目`

    if (!existing) {
      badge.className = BADGE_CLASS
      link.appendChild(badge)
    }

    if (badge.textContent !== String(count)) badge.textContent = String(count)
    if (badge.title !== label) badge.title = label
    if (badge.getAttribute('aria-label') !== label) badge.setAttribute('aria-label', label)
  })
}

export default function SidebarNewBadges() {
  useEffect(() => {
    const counts = getNewCounts()
    if (!counts.size) return

    let frame = 0
    const scheduleApply = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => applyBadges(counts))
    }

    scheduleApply()
    const observer = new MutationObserver(scheduleApply)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return null
}
