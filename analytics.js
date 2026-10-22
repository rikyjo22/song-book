(() => {
  'use strict';

  // Set this to the deployed Apps Script web app URL. Analytics stays inactive
  // until a URL is configured, so it cannot interfere with the songbook.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxM32NsAFP9gD2tkx9voSQ4NPHwYU2_r7rFLoRYX6lF4dTcSLbB16fvARDEFjirYMNkkQ/exec';
  const PROFILE_KEY = 'song-book:profile-user-name:v1';
  const VISITOR_KEY = 'song-book:analytics-visitor:v1';
  const SESSION_KEY = 'song-book:analytics-session:v1';

  function stored(storage, key) {
    try { return storage.getItem(key) || ''; } catch { return ''; }
  }

  function makeId() {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function getId(storage, key) {
    let id = stored(storage, key);
    if (!id) {
      id = makeId();
      try { storage.setItem(key, id); } catch { /* analytics remains best effort */ }
    }
    return id;
  }

  function browserName() {
    const brands = navigator.userAgentData?.brands
      ?.filter((item) => !/not.?a.?brand/i.test(item.brand))
      .map((item) => `${item.brand} ${item.version.split('.')[0]}`);
    if (brands?.length) return brands.join(', ');
    const ua = navigator.userAgent || '';
    const patterns = [
      [/Edg(?:e|A|iOS)?\/([\d.]+)/, 'Microsoft Edge'],
      [/OPR\/([\d.]+)/, 'Opera'],
      [/Firefox\/([\d.]+)/, 'Firefox'],
      [/CriOS\/([\d.]+)/, 'Chrome'],
      [/Chrome\/([\d.]+)/, 'Chrome'],
      [/Version\/([\d.]+).*Safari/, 'Safari']
    ];
    for (const [pattern, name] of patterns) {
      const match = ua.match(pattern);
      if (match) return `${name} ${match[1].split('.')[0]}`;
    }
    return 'Tidak diketahui';
  }

  function send(eventName, details = {}) {
    if (!ENDPOINT) return;
    try {
      const payload = {
        event: eventName,
        occurredAt: new Date().toISOString(),
        visitorId: getId(localStorage, VISITOR_KEY),
        sessionId: getId(sessionStorage, SESSION_KEY),
        userName: stored(localStorage, PROFILE_KEY).slice(0, 80),
        page: `${location.pathname}${location.hash}`.slice(0, 200),
        referrer: document.referrer ? new URL(document.referrer).origin : '',
        language: navigator.language || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        screen: `${screen.width}x${screen.height}`,
        viewport: `${innerWidth}x${innerHeight}`,
        platform: navigator.userAgentData?.platform || navigator.platform || '',
        browser: browserName(),
        ...details
      };
      // no-cors avoids blocking the app on Apps Script's cross-origin response.
      fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    } catch { /* analytics must never interrupt songbook behavior */ }
  }

  function init() {
    window.addEventListener('songbook:analytics', (event) => {
      const details = event.detail || {};
      if (!details.event) return;
      const { event: eventName, ...fields } = details;
      send(eventName, fields);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
