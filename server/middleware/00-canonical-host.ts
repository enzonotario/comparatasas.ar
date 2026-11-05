// Single canonical origin: send www.* to the apex host with a permanent redirect.
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  if (!host.startsWith('www.')) return

  const { pathname, search } = getRequestURL(event)
  return sendRedirect(event, `https://${host.slice(4)}${pathname}${search}`, 301)
})
