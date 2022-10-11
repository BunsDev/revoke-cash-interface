// For some reason next-seo's DefaultSeo isn't working, so I'll do it like this
export const defaultSEO = {
  title: 'Revoke.cash - Revoke your Ethereum token allowances',
  description:
    'Protect your Ethereum token balances by revoking allowances and permissions you granted applications in the past.',
  openGraph: {
    url: 'https://revoke.cash/',
    images: [
      {
        url: 'https://revoke.cash/assets/images/revoke-card.png',
        width: 1600,
        height: 900,
      },
    ],
    site_name: 'Revoke.cash',
    type: 'website',
  },
  twitter: {
    handle: '@RoscoKalis',
    site: '@RevokeCash',
    cardType: 'summary_large_image',
  },
  additionalLinkTags: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
    { rel: 'apple-touch-icon', href: '/assets/images/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.json' },
  ],
};