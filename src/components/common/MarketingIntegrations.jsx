import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api/axios';

const GOOGLE_SCRIPT_ID = 'softy-google-analytics-script';
const FACEBOOK_SCRIPT_ID = 'softy-facebook-pixel-script';

function removeFacebookPixel() {
  document.getElementById(FACEBOOK_SCRIPT_ID)?.remove();
  delete window.fbq;
}

export default function MarketingIntegrations() {
  const location = useLocation();
  const [integrations, setIntegrations] = useState(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const configuredAnalyticsId = useRef('');
  const trackedPagePath = useRef('');

  useEffect(() => {
    let active = true;
    API.get('/settings')
      .then(({ data }) => active && setIntegrations(data.settings?.integrations || {}))
      .catch(() => active && setIntegrations({}))
      .finally(() => active && setSettingsReady(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!settingsReady || !integrations) return undefined;
    const analyticsId = integrations.googleAnalytics?.enabled ? integrations.googleAnalytics.measurementId : '';
    if (analyticsId && configuredAnalyticsId.current !== analyticsId) {
      document.getElementById(GOOGLE_SCRIPT_ID)?.remove();
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', analyticsId);
      trackedPagePath.current = `${window.location.pathname}${window.location.search}`;

      const script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
      document.head.appendChild(script);
      configuredAnalyticsId.current = analyticsId;
    }

    const pixelId = integrations.facebookPixel?.enabled ? integrations.facebookPixel.pixelId : '';
    if (pixelId) {
      removeFacebookPixel();
      const script = document.createElement('script');
      script.id = FACEBOOK_SCRIPT_ID;
      script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId.replace(/'/g, '')}');`;
      document.head.appendChild(script);
      window.fbq?.('track', 'PageView');
    }

    return pixelId ? removeFacebookPixel : undefined;
  }, [integrations, settingsReady]);

  useEffect(() => {
    if (!integrations) return;
    const pagePath = `${location.pathname}${location.search}`;
    if (integrations.googleAnalytics?.enabled && window.gtag && trackedPagePath.current !== pagePath) {
      window.gtag('event', 'page_view', { page_path: pagePath });
      trackedPagePath.current = pagePath;
    }
    if (integrations.facebookPixel?.enabled && window.fbq) window.fbq('track', 'PageView');
  }, [integrations, location.pathname, location.search]);

  return null;
}
