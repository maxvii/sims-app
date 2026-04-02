'use client'
import { useEffect } from 'react'

export default function ThemeLoader() {
  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.json())
      .then(theme => {
        const root = document.documentElement
        if (theme['violet-deep']) root.style.setProperty('--color-violet-deep', theme['violet-deep'])
        if (theme['violet-dark']) root.style.setProperty('--color-violet-dark', theme['violet-dark'])
        if (theme['mauve-rose']) root.style.setProperty('--color-mauve-rose', theme['mauve-rose'])
        if (theme['peach']) root.style.setProperty('--color-peach', theme['peach'])
        if (theme['cream']) root.style.setProperty('--color-cream', theme['cream'])
        if (theme['cream-dark']) root.style.setProperty('--color-cream-dark', theme['cream-dark'])
        if (theme['body-text']) root.style.setProperty('color', theme['body-text'])
        if (theme['body-bg-start'] && theme['body-bg-mid'] && theme['body-bg-end']) {
          document.body.style.background = `linear-gradient(165deg, ${theme['body-bg-start']} 0%, ${theme['body-bg-mid']} 50%, ${theme['body-bg-end']} 100%)`
        }
      })
      .catch(() => {})
  }, [])

  return null
}
