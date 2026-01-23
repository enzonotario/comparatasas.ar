export function useAnalytics() {
  const { gtag } = useGtag()

  function trackProviderClick(params: {
    providerName: string
    providerUrl: string
    section: string
    contentType?: string
  }) {
    gtag('event', 'provider_click', {
      event_category: 'outbound',
      provider_name: params.providerName,
      link_url: params.providerUrl,
      section: params.section,
      content_type: params.contentType || 'link',
    })
  }

  function trackSponsorClick(params: {
    sponsorName: string
    sponsorUrl: string
    bannerId: number
  }) {
    gtag('event', 'sponsor_click', {
      event_category: 'advertising',
      sponsor_name: params.sponsorName,
      link_url: params.sponsorUrl,
      banner_id: params.bannerId,
    })
  }

  function trackOutboundLink(params: { url: string; label?: string }) {
    gtag('event', 'click', {
      event_category: 'outbound',
      event_label: params.label || params.url,
      link_url: params.url,
    })
  }

  return {
    trackProviderClick,
    trackSponsorClick,
    trackOutboundLink,
  }
}
