'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { pageview, GA_TRACKING_ID } from '@/lib/analytics';

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && GA_TRACKING_ID) {
      pageview(window.location.href);
    }
  }, [pathname]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_TRACKING_ID}', {
              page_location: window.location.href,
              page_title: document.title,
              send_page_view: true,
              allow_google_signals: true,
              allow_ad_personalization_signals: true,
              enhanced_ecommerce: true,
              custom_map: {
                'custom_parameter_1': 'loyalty_level',
                'custom_parameter_2': 'traffic_source',
                'custom_parameter_3': 'product_category'
              }
            });

            // Enhanced Ecommerce configuration
            gtag('config', '${GA_TRACKING_ID}', {
              linker: {
                domains: [window.location.hostname]
              }
            });
          `,
        }}
      />
    </>
  );
}