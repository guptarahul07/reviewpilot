// src/components/ui/SEOMeta.jsx
//
// Lightweight SEO component — no react-helmet needed.
// Uses useEffect to update document.title and <meta> tags directly.
// Call once per page, near the top of the component.
//
// Usage:
//   <SEOMeta
//     title="ReviewPilot - AI Review Management"
//     description="Manage Google Business reviews with AI..."
//     keywords="review management, google business..."
//     ogUrl="https://reviewpilot.live/pricing"
//   />

import { useEffect } from 'react'

const SITE_NAME    = 'ReviewPilot'
const DEFAULT_IMG  = 'https://reviewpilot.live/og-image.png'
const TWITTER_IMG  = 'https://reviewpilot.live/twitter-card.png'
const BASE_URL     = 'https://reviewpilot.live'

/* ── Helper: set or create a <meta> tag ─────────────────────────── */
function setMeta(attr, value, content) {
  let el = document.querySelector(`meta[${attr}="${value}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/* ── Helper: set or create a <link> tag ─────────────────────────── */
function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function SEOMeta({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage    = DEFAULT_IMG,
  ogUrl      = BASE_URL,
  ogType     = 'website',
  twitterTitle,
  twitterDescription,
  twitterImage = TWITTER_IMG,
  canonical,
  noIndex    = false,
}) {
  useEffect(() => {
    const resolvedTitle       = title       || SITE_NAME
    const resolvedOgTitle     = ogTitle     || resolvedTitle
    const resolvedTwitterTitle = twitterTitle || resolvedTitle
    const resolvedDesc        = description || ''
    const resolvedOgDesc      = ogDescription    || resolvedDesc
    const resolvedTwitterDesc = twitterDescription || resolvedDesc

    // ── Document title ──────────────────────────────────────────
    document.title = resolvedTitle

    // ── Standard meta ───────────────────────────────────────────
    if (resolvedDesc)  setMeta('name', 'description', resolvedDesc)
    if (keywords)      setMeta('name', 'keywords', keywords)
    if (noIndex)       setMeta('name', 'robots', 'noindex, nofollow')
    else               setMeta('name', 'robots', 'index, follow')

    // ── Open Graph ───────────────────────────────────────────────
    setMeta('property', 'og:title',       resolvedOgTitle)
    setMeta('property', 'og:description', resolvedOgDesc)
    setMeta('property', 'og:image',       ogImage)
    setMeta('property', 'og:url',         ogUrl)
    setMeta('property', 'og:type',        ogType)
    setMeta('property', 'og:site_name',   SITE_NAME)

    // ── Twitter Card ─────────────────────────────────────────────
    setMeta('name', 'twitter:card',        'summary_large_image')
    setMeta('name', 'twitter:title',       resolvedTwitterTitle)
    setMeta('name', 'twitter:description', resolvedTwitterDesc)
    setMeta('name', 'twitter:image',       twitterImage)

    // ── Canonical ────────────────────────────────────────────────
    if (canonical) setLink('canonical', canonical)

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, twitterTitle, twitterDescription, twitterImage, canonical, noIndex])

  return null // renders nothing
}
