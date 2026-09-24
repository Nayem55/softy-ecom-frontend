import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api/axios';

const SCRIPT_IDS = ['softy-google-analytics-script', 'softy-facebook-pixel-script'];
const removeScripts = () => { SCRIPT_IDS.forEach((id) => document.getElementById(id)?.remove()); delete window.gtag; delete window.fbq; };

export default function MarketingIntegrations() {
  const location = useLocation(); const [integrations, setIntegrations] = useState(null); const loaded = useRef(false);
  useEffect(() => { let active = true; API.get('/settings').then(({ data }) => active && setIntegrations(data.settings?.integrations || {})).catch(() => active && setIntegrations({})).finally(() => { loaded.current = true; }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!loaded.current || !integrations) return undefined; removeScripts();
    const analyticsId = integrations.googleAnalytics?.enabled ? integrations.googleAnalytics.measurementId : '';
    if (analyticsId) { const script = document.createElement('script'); script.id = SCRIPT_IDS[0]; script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`; document.head.appendChild(script); window.dataLayer = window.dataLayer || []; window.gtag = (...args) => window.dataLayer.push(args); window.gtag('js', new Date()); window.gtag('config', analyticsId, { send_page_view: false }); }
    const pixelId = integrations.facebookPixel?.enabled ? integrations.facebookPixel.pixelId : '';
    if (pixelId) { const script = document.createElement('script'); script.id = SCRIPT_IDS[1]; script.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId.replace(/'/g, '')}');`; document.head.appendChild(script); window.fbq?.('track', 'PageView'); }
    return () => removeScripts();
  }, [integrations]);
  useEffect(() => { if (!integrations) return; const pagePath = `${location.pathname}${location.search}`; if (integrations.googleAnalytics?.enabled && window.gtag) window.gtag('event', 'page_view', { page_path: pagePath }); if (integrations.facebookPixel?.enabled && window.fbq) window.fbq('track', 'PageView'); }, [integrations, location.pathname, location.search]);
  return null;
}
