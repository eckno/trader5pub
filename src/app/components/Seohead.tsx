import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://traderfive.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function SEOHead({
  title = 'trader5 — AI-Powered Trading Platform',
  description = 'Grow your capital 24/7 with intelligent AI trading strategies. Start with just $50.',
  canonical,
  ogImage = DEFAULT_IMAGE,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title.includes('trader5') ? title : `${title} — trader5`;
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow" />
      }
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}