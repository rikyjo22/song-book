(() => {
  'use strict';

  // Set this to the deployed Apps Script web app URL. Analytics stays inactive
  // until a URL is configured, so it cannot interfere with the songbook.
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzVC4JyD1zlcZpUjjqiXbQdY1PnaX_ogMTK0Tm3Z359V9J1ChcoLTeG5LPxOvBfd6mcaQ/exec';
  const PROFILE_KEY = 'song-book:profile-user-name:v1';
  const VISITOR_KEY = 'song-book:analytics-visitor:v1';
  const SESSION_KEY = 'song-book:analytics-session:v1';
  const LOCATION_KEY = 'song-book:analytics-city-consent:v1';

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
    send('page_view');
    mountLocationOptIn();

    document.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab-panel]');
      if (tab) {
        const tabName = tab.id === 'my-songs-tab' ? 'laguku'
          : tab.id === 'all-songs-tab' ? 'koleksi_lagu'
            : tab.id === 'instrument-filter-open' ? 'profile' : tab.dataset.tabPanel;
        send('collection_open', { collection: tabName });
        return;
      }

      if (event.target.closest('#apply-instrument-filter')) {
        // Profile is saved by the app's own click handler; check its success
        // message after that handler has completed before recording the name.
        window.setTimeout(() => {
          const message = document.getElementById('instrument-filter-status')?.textContent || '';
          if (/profile berhasil disimpan/i.test(message)) send('profile_save', { action: 'save_profile' });
        }, 0);
      }

      const button = event.target.closest('#add-my-song, #create-schedule');
      if (!button) return;
      send(button.id === 'add-my-song' ? 'song_create_form_open' : 'schedule_create', {
        action: button.id === 'add-my-song' ? 'open_form' : 'create'
      });
    }, true);

    document.addEventListener('submit', (event) => {
      if (event.target.id === 'my-song-form') send('song_save_submit', { action: 'save' });
    }, true);
  }

  function mountLocationOptIn() {
    if (!ENDPOINT || stored(localStorage, LOCATION_KEY)) return;
    const notice = document.createElement('aside');
    notice.className = 'analytics-location-notice';
    notice.innerHTML = '<span>Bagikan kota perkiraan untuk peta analytics? Koordinat dibulatkan untuk menentukan kota dan tidak disimpan.</span><button type="button" data-location-choice="allow">Izinkan</button><button type="button" data-location-choice="dismiss" aria-label="Tutup">×</button>';
    Object.assign(notice.style, { position: 'fixed', right: '16px', bottom: '16px', zIndex: '10000', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: 'min(540px, calc(100vw - 32px))', padding: '12px 14px', borderRadius: '12px', background: '#fff', color: '#24372a', boxShadow: '0 8px 35px #15251a38', font: '13px/1.45 system-ui,sans-serif' });
    notice.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-location-choice]')?.dataset.locationChoice;
      if (!choice) return;
      try { localStorage.setItem(LOCATION_KEY, choice); } catch { /* optional */ }
      notice.remove();
      if (choice !== 'allow') return;
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((position) => {
        // Round to roughly city/neighborhood scale before sending; exact GPS is never stored.
        const latitude = Math.round(position.coords.latitude * 100) / 100;
        const longitude = Math.round(position.coords.longitude * 100) / 100;
        send('location_share', { latitude, longitude });
      }, () => {}, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
    });
    document.body.append(notice);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
