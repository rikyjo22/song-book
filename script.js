(() => {
  'use strict';

  // Gunakan URL deployment Web App yang sama dengan song-manager.
  const API_URL = 'https://script.google.com/macros/s/AKfycbzOWUvFz1gSQQ9yLDXJiSEj0aOUlCjN_zlRrbk8-ZGe7lL6NZCxMimUDbKJ1SbZOhHq7g/exec';
  const CACHE_KEY = 'song-book:songs:v1';
  const SCHEDULE_KEY = 'song-book:worship-schedules:v1';
  const SCHEDULE_IMAGE_DB_NAME = 'song-book:schedule-images:v1';
  const ACTIVE_SCHEDULE_KEY = 'song-book:active-worship-schedule:v1';
  const ACTIVE_SCHEDULE_SHARE_KEY = 'song-book:active-schedule-share:v1';
  const SCHEDULE_INTRO_CACHE_KEY = 'song-book:schedule-intros:v1';
  const INSTRUMENT_PROFILE_KEY = 'song-book:instrument-profile:v1';
  const PROFILE_USER_NAME_KEY = 'song-book:profile-user-name:v1';
  const THEME_MODE_KEY = 'song-book:theme-mode:v1';
  const THEME_CHOICE_KEY = 'song-book:theme-choice:v1';
  const FONT_STYLE_KEY = 'song-book:font-style:v1';
  const FONT_SIZE_KEY = 'song-book:font-size:v1';
  const CATEGORIES = [
    { code: 'ALL', label: 'Semua' }, { code: 'PS', label: 'Psallo' },
    { code: 'NR', label: 'Nyanyian Rohani' }, { code: 'SP', label: 'Tambahan' },
    { code: 'ZR', label: 'Zangkoor' }, { code: 'KMR', label: 'Kaum Muda' },
    { code: 'SM', label: 'Sekolah Minggu' }, { code: 'OTH', label: 'Other' }
  ];
  const songList = document.getElementById('song-list');
  const status = document.getElementById('list-status');
  const count = document.getElementById('song-count');
  const syncStatus = document.getElementById('sync-status');
  const refreshButton = document.getElementById('refresh-button');
  const instrumentProfilePanel = document.getElementById('instrument-profile-panel');
  const instrumentFilterSelect = document.getElementById('instrument-filter-select');
  const profileUserNameInput = document.getElementById('profile-user-name');
  const instrumentFilterStatus = document.getElementById('instrument-filter-status');
  const search = document.getElementById('search-input');
  const mySongsSearch = document.getElementById('my-songs-search');
  const mySongsCategoryFilter = document.getElementById('my-songs-category-filter');
  const mySongsList = document.getElementById('my-songs-list');
  const mySongsStatus = document.getElementById('my-songs-status');
  const mySongsCount = document.getElementById('my-songs-count');
  const uploadMySongsButton = document.getElementById('upload-my-songs');
  const cancelMySongUploadButton = document.getElementById('cancel-my-song-upload');
  const mySongUploadAccessDialog = document.getElementById('my-song-upload-access-dialog');
  const mySongUploadAccessForm = document.getElementById('my-song-upload-access-form');
  const mySongUploadAccessCode = document.getElementById('my-song-upload-access-code');
  let isMySongUploadMode = false;
  const selectedMySongUploadIds = new Set();
  const mySongDialog = document.getElementById('my-song-dialog');
  const mySongForm = document.getElementById('my-song-form');
  const mySongInstrumentList = document.getElementById('my-song-instruments');
  const mySongContentInput = document.getElementById('my-song-content');
  const mySongHighlight = document.getElementById('my-song-highlight');
  const MY_SONG_DB = 'song-book:local-library:v1';
  const MY_SONG_STORE = 'songs';
  const deleteMySongDialog = document.getElementById('delete-my-song-dialog');
  let editingMySongId = '';
  let editingMySong = null;
  let pendingMySongDeleteId = '';
  const filters = document.getElementById('category-filters');
  const dialog = document.getElementById('song-dialog');
  const preview = document.getElementById('song-preview');
  const scheduleList = document.getElementById('schedule-list');
  const scheduleStatus = document.getElementById('schedule-status');
  const scheduleEditDialog = document.getElementById('schedule-edit-dialog');
  const scheduleEditForm = document.getElementById('schedule-edit-form');
  const scheduleContentInput = document.getElementById('schedule-content-input');
  const scheduleContentHighlight = document.getElementById('schedule-content-highlight');
  const scheduleViewDialog = document.getElementById('schedule-view-dialog');
  const scheduleViewList = document.getElementById('schedule-view-list');
  const scheduleIntroDialog = document.getElementById('schedule-intro-dialog');
  const scheduleIntroForm = document.getElementById('schedule-intro-form');
  const removeScheduleIntroDialog = document.getElementById('remove-schedule-intro-dialog');
  const removeScheduleIntroMessage = document.getElementById('remove-schedule-intro-message');
  const deleteScheduleDialog = document.getElementById('delete-schedule-dialog');
  const deleteScheduleMessage = document.getElementById('delete-schedule-message');
  const scheduleIntroNameButton = document.getElementById('schedule-intro-name-button');
  const removeScheduleIntroButton = document.getElementById('remove-schedule-intro');
  const scheduleIntroActionsGroup = document.getElementById('schedule-intro-actions-group');
  const chordModeSelect = document.getElementById('chord-mode');
  const transposeControls = document.getElementById('transpose-controls');
  const transposeKeySelect = document.getElementById('transpose-key');
  const scoreSection = document.getElementById('score-section');
  const closeScorePreviewButton = document.getElementById('close-score-preview');
  const scoreInstruments = document.getElementById('score-instruments');
  const scorePages = document.getElementById('score-pages');
  const scoreCarouselControls = document.getElementById('score-carousel-controls');
  const scoreImageDialog = document.getElementById('score-image-dialog');
  const fullScoreImage = document.getElementById('score-image-full');
  const scoreImagePrevious = document.getElementById('score-image-previous');
  const scoreImageNext = document.getElementById('score-image-next');
  const scoreImageInstruments = document.getElementById('score-image-instruments');
  const scoreImagePosition = document.getElementById('score-image-position');
  const scoreIntroBackButton = document.getElementById('score-intro-back-button');
  const scorePreviousGeneralSongButton = document.getElementById('score-previous-general-song-button');
  const scoreGeneralSongPosition = document.getElementById('score-general-song-position');
  const scoreNextGeneralSongButton = document.getElementById('score-next-general-song-button');
  const scoreNextGeneralSongLabel = document.getElementById('score-next-general-song-label');
  let songs = [];
  let mySongs = [];
  let activeCategory = 'ALL';
  let preferredInstrument = readInstrumentProfile();
  let preferredUserName = readProfileUserName();
  let currentSongIndex = -1;
  let currentPreviewSongs = [];
  let currentPreviewSong = null;
  let previewZoom = 1;
  let pinchStart = null;
  let sourcePreviewKey = 'C';
  let selectedPreviewKey = 'C';
  let callbackCounter = 0;
  let instrumentOptionsLoaded = false;
  let mySongInstrumentNames = [];
  let cacheAvailable = false;
  let isLoadingSongs = false;
  let schedules = [];
  let scheduleTitleBeforeEdit = null;
  let activeScheduleId = '';
  let draggedRow = null;
  let dragPointerId = null;
  let editingEntry = null;
  let viewedScheduleId = '';
  let scheduleIntroRequestId = 0;
  let scheduleIntroCameraStream = null;
  let capturedScheduleIntroFile = null;
  let introGeneralNavigationActive = false;
  let introGeneralSongIndex = -1;
  let scheduleIntros = readScheduleIntroCache();
  const songSectionPattern = /^(?:(?:\d+[.)]?\s*)?)(intro|opening|bait|verse|stanza|reff|refrain|chorus|pre[ -]?(?:reff|chorus)|post[ -]?(?:reff|chorus)|bridge|intermezzo|itermezzo|interlude|instrumental|music|musik|solo|coda|outro|ending|tag|vamp|reprise)(?:\s+(?:ke[- ]?)?\d+)?$/i;
  let activeScoreFiles = [];
  let activeScoreInstrument = '';
  let activeScoreIndex = 0;
  let scoreImageMode = 'score';
  let activeScheduleIntro = null;
  let scoreImageReturnTarget = 'lyrics';
  let scoreControlsHideTimer = 0;
  let scoreSwipeStart = null;
  let resolveIntroRemovalConfirmation = null;
  let pendingScheduleDeletionId = '';
  const shareDialog = document.getElementById('schedule-share-dialog');
  const pullDialog = document.getElementById('schedule-pull-dialog');
  let shareTimer = 0;
  let sharePullerSyncInFlight = false;
  let lastSharePullerSyncAt = 0;
  let activeScheduleShare = readActiveScheduleShare();
  const scheduleImageObjectUrls = new Map();
  let shareExpiresAt = activeScheduleShare ? activeScheduleShare.expiresAt : 0;

  const instrumentProfileButton = document.getElementById('instrument-filter-open');
  const profileSaveButton = document.getElementById('apply-instrument-filter');
  const requiredProfileDialog = document.getElementById('required-profile-dialog');
  const requiredProfileForm = document.getElementById('required-profile-form');
  const requiredProfileNameInput = document.getElementById('required-profile-name');
  const requiredProfileMessage = document.getElementById('required-profile-message');
  const requiredProfileStatus = document.getElementById('required-profile-status');
  const themeModeSelect = document.getElementById('theme-mode-select');
  const themeChoiceSelect = document.getElementById('theme-choice-select');
  const fontStyleSelect = document.getElementById('font-style-select');
  const fontSizeSelect = document.getElementById('font-size-select');
  const fontSizeValue = document.getElementById('font-size-value');
  const themeChoiceField = document.getElementById('theme-choice-field');
  let profileSaveFeedbackTimer = 0;
  const fontSizeBaselines = new WeakMap();
  initializeThemePreferences();
  themeModeSelect.addEventListener('change', applyThemePreferences);
  themeChoiceSelect.addEventListener('change', applyThemePreferences);
  fontStyleSelect.addEventListener('change', applyThemePreferences);
  fontSizeSelect.addEventListener('change', applyThemePreferences);
  instrumentProfileButton.title = preferredInstrument ? `Profile: ${preferredInstrument}` : 'Profile';
  document.getElementById('refresh-instrument-filter').addEventListener('click', (event) => {
    loadInstrumentOptions(event.currentTarget);
  });
  function saveProfile(userName = profileUserNameInput.value.trim()) {
    if (!userName) {
      instrumentFilterStatus.textContent = 'Masukkan nama pengguna untuk menyimpan Profile.';
      requiredProfileStatus.textContent = 'Nama pengguna harus diisi.';
      (requiredProfileDialog.open ? requiredProfileNameInput : profileUserNameInput).focus();
      return false;
    }
    if (!saveInstrumentProfile(instrumentFilterSelect.value, userName)) {
      instrumentFilterStatus.textContent = 'Profile tidak dapat disimpan di perangkat ini.';
      requiredProfileStatus.textContent = 'Nama pengguna tidak dapat disimpan. Periksa penyimpanan perangkat lalu coba lagi.';
      return false;
    }
    profileUserNameInput.value = userName;
    window.clearTimeout(profileSaveFeedbackTimer);
    profileSaveButton.textContent = 'Tersimpan ✓';
    profileSaveButton.classList.add('is-saved');
    instrumentFilterStatus.textContent = 'Profile berhasil disimpan di perangkat ini.';
    requiredProfileStatus.textContent = '';
    if (requiredProfileDialog.open) requiredProfileDialog.close();
    profileSaveFeedbackTimer = window.setTimeout(() => {
      profileSaveButton.textContent = 'Simpan Profile';
      profileSaveButton.classList.remove('is-saved');
    }, 2500);
    return true;
  }
  profileSaveButton.addEventListener('click', () => saveProfile());
  requiredProfileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const userName = requiredProfileNameInput.value.trim();
    if (!userName) {
      requiredProfileStatus.textContent = 'Nama pengguna harus diisi.';
      requiredProfileNameInput.focus();
      return;
    }
    profileUserNameInput.value = userName;
    saveProfile(userName);
  });
  requiredProfileDialog.addEventListener('cancel', (event) => event.preventDefault());
  requiredProfileDialog.addEventListener('click', (event) => {
    if (event.target === requiredProfileDialog) event.preventDefault();
  });
  function setStatus(message) { status.textContent = message; }
  function setSyncStatus(message) { syncStatus.textContent = message; }
  function formatTempo(value) {
    const tempo = String(value == null ? '' : value).trim().replace(/\s*BPM\s*$/i, '').trim();
    if (!tempo) return '';
    return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(tempo) ? `${tempo} BPM` : tempo;
  }
  function displaySongNumber(value) {
    const number = String(value || '').trim();
    return /^\d+$/.test(number) ? number : '';
  }
  function displaySongTitle(song) {
    let title = String(song && song.title || '').trim();
    const category = String(song && song.category || '').trim();
    const rawNumber = String(song && song.number || '').trim();
    if (category && rawNumber && !displaySongNumber(rawNumber)) {
      const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      title = title.replace(new RegExp(`^(?:${escapeRegExp(category)}\\s+)?${escapeRegExp(rawNumber)}\\s*(?:[-\\u2013\\u2014:|]\\s*|\\s+)`, 'i'), '').trim();
    }
    return title;
  }
  function normalize(value) { return String(value || '').toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function readInstrumentProfile() {
    try { return String(localStorage.getItem(INSTRUMENT_PROFILE_KEY) || '').trim(); }
    catch (error) { return ''; }
  }
  function readProfileUserName() {
    try { return String(localStorage.getItem(PROFILE_USER_NAME_KEY) || '').trim(); }
    catch (error) { return ''; }
  }
  function trackSuccessfulAction(event, details = {}) {
    window.dispatchEvent(new CustomEvent('songbook:analytics', { detail: { event, ...details } }));
  }
  function initializeThemePreferences() {
    let mode = 'light';
    let theme = 'ocean';
    let fontStyle = 'dm-sans';
    let fontSize = '100';
    try {
      mode = localStorage.getItem(THEME_MODE_KEY) || mode;
      theme = localStorage.getItem(THEME_CHOICE_KEY) || theme;
      fontStyle = localStorage.getItem(FONT_STYLE_KEY) || fontStyle;
      fontSize = localStorage.getItem(FONT_SIZE_KEY) || fontSize;
    } catch (error) { /* Keep the default theme when storage is unavailable. */ }
    if (!['light', 'dark', 'other'].includes(mode)) mode = 'light';
    if (!['ocean', 'forest', 'sunset', 'rose', 'lavender'].includes(theme)) theme = 'ocean';
    if (!['dm-sans', 'arial', 'georgia', 'trebuchet', 'verdana'].includes(fontStyle)) fontStyle = 'dm-sans';
    if (!/^\d+$/.test(String(fontSize)) || Number(fontSize) < 100 || Number(fontSize) > 130) fontSize = '100';
    themeModeSelect.value = mode;
    themeChoiceSelect.value = theme;
    fontStyleSelect.value = fontStyle;
    fontSizeSelect.value = fontSize;
    applyThemePreferences();
  }
  function applyThemePreferences() {
    const mode = ['light', 'dark', 'other'].includes(themeModeSelect.value) ? themeModeSelect.value : 'light';
    const theme = ['ocean', 'forest', 'sunset', 'rose', 'lavender'].includes(themeChoiceSelect.value) ? themeChoiceSelect.value : 'ocean';
    const fontStyle = ['dm-sans', 'arial', 'georgia', 'trebuchet', 'verdana'].includes(fontStyleSelect.value) ? fontStyleSelect.value : 'dm-sans';
    const fontSize = Math.max(100, Math.min(130, Number(fontSizeSelect.value) || 100));
    const activeTheme = mode === 'other' ? theme : mode;
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.dataset.fontStyle = fontStyle;
    document.documentElement.dataset.fontSize = fontSize;
    fontSizeValue.value = `${fontSize}%`;
    fontSizeValue.textContent = `${fontSize}%`;
    fontSizeSelect.setAttribute('aria-valuetext', `${fontSize}%`);
    applyUserFontScale(fontSize);
    themeChoiceField.hidden = mode !== 'other';
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
      localStorage.setItem(THEME_CHOICE_KEY, theme);
      localStorage.setItem(FONT_STYLE_KEY, fontStyle);
      localStorage.setItem(FONT_SIZE_KEY, fontSize);
    } catch (error) { /* Theme still applies for this page view. */ }
  }
  function applyUserFontScale(percent) {
    const multiplier = Number(percent) / 100;
    const excluded = 'pre, code, .song-section-body, .song-section-body *, .my-song-highlight, .schedule-content-highlight, #my-song-content, #schedule-content-input';
    document.querySelectorAll('body *').forEach((element) => {
      if (element.matches(excluded) || element.closest(excluded)) return;
      const hasDirectText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const isTextControl = element.matches('button,select,textarea,input:not([type="checkbox"]):not([type="radio"]):not([type="file"])');
      if (!hasDirectText && !isTextControl) return;
      if (!fontSizeBaselines.has(element)) {
        const size = Number.parseFloat(getComputedStyle(element).fontSize);
        if (Number.isFinite(size) && size > 0) fontSizeBaselines.set(element, size);
      }
      const baseline = fontSizeBaselines.get(element);
      if (baseline) element.style.fontSize = `${baseline * multiplier}px`;
    });
  }
  const fontSizeObserver = new MutationObserver(() => {
    window.requestAnimationFrame(() => applyUserFontScale(Number(fontSizeSelect.value) || 100));
  });
  fontSizeObserver.observe(document.body, { childList: true, subtree: true });
  function escapeText(value) {
    const span = document.createElement('span');
    span.textContent = String(value == null ? '' : value);
    return span.innerHTML;
  }

  function loadSongs() {
    if (isLoadingSongs) return;
    isLoadingSongs = true;
    setSyncStatus('Mengambil data terbaru dari database...');
    refreshButton.disabled = true;
    refreshButton.classList.add('is-loading');
    const callbackName = `cb_${Date.now()}_${++callbackCounter}`;
    const script = document.createElement('script');
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error('Waktu koneksi habis. Periksa URL API dan deployment Apps Script.')), 20000);

    function finish(error, result) {
      if (settled) return;
      settled = true;
      isLoadingSongs = false;
      window.clearTimeout(timeout);
      refreshButton.disabled = false;
      refreshButton.classList.remove('is-loading');
      delete window.SongBookCallbacks[callbackName];
      script.remove();
      if (error) {
        setSyncStatus(cacheAvailable ? 'Tidak tersambung · menampilkan data lokal terakhir' : 'Gagal memperbarui data');
        if (!cacheAvailable) setStatus(error.message || 'Gagal memuat daftar lagu.');
        return;
      }
      if (!result || !result.ok) {
        setSyncStatus(cacheAvailable ? 'Pembaruan gagal · menampilkan data lokal terakhir' : 'Gagal memperbarui data');
        if (!cacheAvailable) setStatus((result && result.error) || 'Apps Script gagal mengirim daftar lagu.');
        return;
      }
      songs = Array.isArray(result.songs) ? result.songs : [];
      songs.sort(compareSongs);
      const updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt, songs }));
        cacheAvailable = true;
        setSyncStatus(`Update terakhir: ${formatUpdatedAt(updatedAt)}`);
      } catch (storageError) {
        setSyncStatus('Data terbaru dimuat · penyimpanan lokal tidak tersedia');
      }
      count.textContent = String(songs.length);
      buildFilters();
      renderList();
      renderSchedules();
    }

    window.SongBookCallbacks = window.SongBookCallbacks || {};
    window.SongBookCallbacks[callbackName] = (result) => finish(null, result);
    script.onerror = () => finish(new Error('Tidak dapat mengakses API Apps Script. Periksa akses deployment dan URL /exec.'));
    const url = new URL(API_URL);
    url.searchParams.set('action', 'songs');
    url.searchParams.set('callback', `SongBookCallbacks.${callbackName}`);
    script.src = url.toString();
    document.head.append(script);
  }

  function loadInstrumentOptions(refreshButton = null) {
    const selectedBeforeRefresh = instrumentFilterSelect.value;
    const callbackName = `cb_${Date.now()}_${++callbackCounter}`;
    const script = document.createElement('script');
    let settled = false;
    instrumentFilterStatus.textContent = 'Memuat daftar instrumen…';
    instrumentFilterSelect.disabled = true;
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.classList.add('is-loading');
    }
    const timeout = window.setTimeout(() => finish(new Error('Waktu koneksi habis.')), 8000);
    function finish(error, result) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      delete window.SongBookCallbacks[callbackName];
      script.remove();
      instrumentFilterSelect.disabled = false;
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.classList.remove('is-loading');
      }
      if (error || !result || !result.ok) {
        if (refreshButton) {
          instrumentFilterStatus.textContent = 'Daftar instrumen gagal diperbarui. Periksa koneksi lalu coba lagi.';
          return;
        }
        instrumentFilterSelect.replaceChildren(new Option('Belum memilih', ''));
        const localNames = new Set(['Flute', 'Clarinet', 'Violin', 'Saxophone', 'Alto Sax', 'Trumpet']);
        songs.forEach((song) => Object.keys(song.images || {}).forEach((name) => localNames.add(name)));
        if (preferredInstrument) localNames.add(preferredInstrument);
        [...localNames].forEach((name) => instrumentFilterSelect.add(new Option(name, name)));
        instrumentFilterSelect.value = preferredInstrument;
        instrumentFilterStatus.textContent = refreshButton
          ? 'Daftar instrumen gagal diperbarui. Periksa koneksi lalu coba lagi.'
          : 'Daftar online belum tersedia; pilihan lokal ditampilkan sementara.';
        return;
      }
      instrumentFilterSelect.replaceChildren(new Option('Belum memilih', ''));
      (Array.isArray(result.instruments) ? result.instruments : []).forEach((name) => {
        instrumentFilterSelect.add(new Option(name, name));
      });
      const selectionToKeep = selectedBeforeRefresh || preferredInstrument;
      if (selectionToKeep && ![...instrumentFilterSelect.options].some((option) => normalize(option.value) === normalize(selectionToKeep))) {
        instrumentFilterSelect.add(new Option(selectionToKeep, selectionToKeep));
      }
      instrumentFilterSelect.value = selectionToKeep;
      instrumentOptionsLoaded = true;
      instrumentFilterStatus.textContent = result.instruments && result.instruments.length
        ? 'Pilihan ini menentukan instrumen utama saat membuka partitur.'
        : 'Belum ada instrumen di sheet Instruments.';
      if (refreshButton) instrumentFilterStatus.textContent = `Daftar instrumen diperbarui (${result.instruments.length}).`;
    }
    window.SongBookCallbacks = window.SongBookCallbacks || {};
    window.SongBookCallbacks[callbackName] = (result) => finish(null, result);
    script.onerror = () => finish(new Error('Tidak dapat mengakses API Apps Script.'));
    const url = new URL(API_URL);
    url.searchParams.set('action', 'instruments');
    url.searchParams.set('callback', `SongBookCallbacks.${callbackName}`);
    url.searchParams.set('_refresh', String(Date.now()));
    script.src = url.toString();
    document.head.append(script);
  }

  function prepareInstrumentProfileOptions() {
    profileUserNameInput.value = preferredUserName;
    if (!instrumentOptionsLoaded) {
      instrumentFilterSelect.replaceChildren(new Option('Belum memilih', ''));
      if (preferredInstrument) instrumentFilterSelect.add(new Option(preferredInstrument, preferredInstrument));
      instrumentFilterStatus.textContent = 'Profil tersimpan di perangkat ini. Tekan perbarui untuk mengambil daftar terbaru.';
    }
    instrumentFilterSelect.value = preferredInstrument;
  }

  function loadCachedSongs() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!cached || !Array.isArray(cached.songs)) return;
      songs = cached.songs;
      songs.sort(compareSongs);
      cacheAvailable = true;
      count.textContent = String(songs.length);
      setSyncStatus(`Update terakhir: ${formatUpdatedAt(cached.updatedAt)}`);
      buildFilters();
      renderList();
      renderSchedules();
      return true;
    } catch (error) {
      cacheAvailable = false;
    }
    return false;
  }

  function formatUpdatedAt(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'waktu tidak diketahui';
    const parts = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((result, part) => { result[part.type] = part.value; return result; }, {});
    return `${parts.weekday} ${parts.day} ${parts.month} ${parts.year} ${parts.hour}.${parts.minute}`;
  }

  function formatWorshipDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    const parts = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
    }).formatToParts(date).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
    return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year}`;
  }

  function readScheduleIntroCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(SCHEDULE_INTRO_CACHE_KEY) || '{}');
      return cached && typeof cached === 'object' && !Array.isArray(cached) ? cached : {};
    } catch (error) { return {}; }
  }

  function persistScheduleIntroCache() {
    try { localStorage.setItem(SCHEDULE_INTRO_CACHE_KEY, JSON.stringify(scheduleIntros)); }
    catch (error) { console.warn('Cache intro jadwal tidak dapat disimpan:', error); }
  }

  function readActiveScheduleShare() {
    try {
      const share = JSON.parse(localStorage.getItem(ACTIVE_SCHEDULE_SHARE_KEY) || 'null');
      if (!share || !/^[A-Z0-9]{3}$/.test(String(share.code || '')) || !share.scheduleId || !Number.isFinite(Number(share.expiresAt))) return null;
      return { scheduleId: String(share.scheduleId), code: String(share.code), expiresAt: Number(share.expiresAt) };
    } catch (error) { return null; }
  }

  function persistActiveScheduleShare() {
    try {
      if (activeScheduleShare) localStorage.setItem(ACTIVE_SCHEDULE_SHARE_KEY, JSON.stringify(activeScheduleShare));
      else localStorage.removeItem(ACTIVE_SCHEDULE_SHARE_KEY);
    } catch (error) { console.warn('Status berbagi tidak dapat disimpan di perangkat ini:', error); }
  }

  function loadSchedules() {
    try {
      const saved = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]');
      schedules = Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string').map((item) => ({
        id: item.id,
        title: String(item.title || 'Ibadah Baru'),
        date: String(item.date || ''),
        isOpen: Boolean(item.isOpen),
        sharedIntro: item.sharedIntro && typeof item.sharedIntro === 'object' ? item.sharedIntro : null,
        pulledBy: Array.isArray(item.pulledBy) ? item.pulledBy.map((name) => String(name || '').trim()).filter(Boolean) : [],
        songs: Array.isArray(item.songs) ? item.songs.filter((song) => song && typeof song.id === 'string').map((song, index) => ({ ...song, entryId: String(song.entryId || `entry_legacy_${item.id}_${index}`), contentHtml: String(song.contentHtml || ''), overrides: song.overrides && typeof song.overrides === 'object' ? song.overrides : {} })) : []
      })) : [];
      activeScheduleId = localStorage.getItem(ACTIVE_SCHEDULE_KEY) || '';
    } catch (error) {
      schedules = [];
    }
  }

  function saveSchedules() {
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
      if (activeScheduleId && schedules.some((item) => item.id === activeScheduleId)) localStorage.setItem(ACTIVE_SCHEDULE_KEY, activeScheduleId);
      else localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
      scheduleStatus.textContent = schedules.length ? `${schedules.length} jadwal tersimpan di perangkat ini.` : 'Jadwal tersimpan di perangkat ini.';
      return true;
    } catch (error) {
      scheduleStatus.textContent = 'Jadwal tidak dapat disimpan. Penyimpanan browser mungkin penuh atau dinonaktifkan.';
      return false;
    }
  }

  function todayString() {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function callScheduleApi(action, params) {
    return new Promise((resolve, reject) => {
      const callbackName = `cb_${Date.now()}_${++callbackCounter}`;
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => finish(new Error('Koneksi ke server habis.')), 20000);
      let settled = false;
      function finish(error, result) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        delete window.SongBookCallbacks[callbackName];
        script.remove();
        if (error) reject(error); else if (!result || !result.ok) reject(new Error((result && result.error) || 'Permintaan gagal.')); else resolve(result);
      }
      window.SongBookCallbacks = window.SongBookCallbacks || {};
      window.SongBookCallbacks[callbackName] = (result) => finish(null, result);
      script.onerror = () => finish(new Error('Tidak dapat mengakses API Apps Script.'));
      const url = new URL(API_URL);
      url.searchParams.set('action', action);
      url.searchParams.set('callback', `SongBookCallbacks.${callbackName}`);
      Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value)));
      script.src = url.toString();
      document.head.append(script);
    });
  }

  function postScheduleApi(action, data, timeoutMs = 25000) {
    return new Promise((resolve, reject) => {
      const nonce = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const frame = document.createElement('iframe');
      frame.name = `schedule_share_${nonce}`;
      frame.hidden = true;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = API_URL;
      form.target = frame.name;
      form.hidden = true;
      const input = document.createElement('input');
      input.name = 'payload';
      input.value = JSON.stringify({ action, requestNonce: nonce, ...data });
      form.append(input);
      const timeout = window.setTimeout(() => finish(new Error('Koneksi ke server habis.')), timeoutMs);
      function onMessage(event) {
        const reply = event.data;
        if (!reply || reply.nonce !== nonce) return;
        window.removeEventListener('message', onMessage);
        finish(reply.ok ? null : new Error(reply.error || 'Permintaan gagal.'), reply.result);
      }
      function finish(error, result) {
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        form.remove();
        frame.remove();
        if (error) reject(error); else resolve(result);
      }
      window.addEventListener('message', onMessage);
      document.body.append(frame, form);
      form.submit();
    });
  }

  function fillShareSchedules() {
    const select = document.getElementById('share-schedule-select');
    const options = document.getElementById('share-schedule-options');
    const label = document.getElementById('share-schedule-picker-label');
    const previousId = select.value;
    select.replaceChildren();
    options.replaceChildren();
    schedules.forEach((schedule) => {
      const option = document.createElement('option');
      option.value = schedule.id;
      option.textContent = `${schedule.title || 'Jadwal ibadah'}${schedule.date ? ` · ${formatWorshipDate(schedule.date)}` : ''}`;
      select.append(option);
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.className = 'share-schedule-option';
      choice.setAttribute('role', 'option');
      choice.dataset.scheduleId = schedule.id;
      choice.textContent = option.textContent;
      options.append(choice);
    });
    if (schedules.length) {
      select.value = schedules.some((schedule) => schedule.id === previousId) ? previousId : schedules[0].id;
      const selected = schedules.find((schedule) => schedule.id === select.value);
      label.textContent = `${selected.title || 'Jadwal ibadah'}${selected.date ? ` · ${selected.date}` : ''}`;
      options.querySelector(`[data-schedule-id="${select.value}"]`)?.setAttribute('aria-selected', 'true');
    } else label.textContent = 'Belum ada jadwal';
    document.getElementById('share-schedule-submit').disabled = !schedules.length;
  }

  function updateShareCountdown() {
    if (!activeScheduleShare) return;
    shareExpiresAt = activeScheduleShare.expiresAt;
    const remaining = Math.max(0, Math.ceil((shareExpiresAt - Date.now()) / 1000));
    const countdown = formatShareCountdown(remaining);
    document.getElementById('share-countdown').textContent = countdown;
    const cardCountdown = scheduleList.querySelector(`[data-schedule-share-countdown="${CSS.escape(activeScheduleShare.scheduleId)}"]`);
    if (cardCountdown) cardCountdown.textContent = countdown;
    renderShareButtonState();
    if (remaining && Date.now() - lastSharePullerSyncAt >= 5000) syncSchedulePullers();
    if (!remaining) stopSharing(true);
  }

  async function syncSchedulePullers() {
    if (!activeScheduleShare || sharePullerSyncInFlight) return;
    sharePullerSyncInFlight = true;
    lastSharePullerSyncAt = Date.now();
    try {
      const result = await callScheduleApi('getScheduleShareStatus', { code: activeScheduleShare.code });
      const schedule = schedules.find((item) => item.id === activeScheduleShare.scheduleId);
      const pulledBy = Array.isArray(result.pulledBy) ? result.pulledBy.map((name) => String(name || '').trim()).filter(Boolean) : [];
      if (schedule && JSON.stringify(schedule.pulledBy || []) !== JSON.stringify(pulledBy)) {
        schedule.pulledBy = pulledBy;
        saveSchedules();
        renderSchedules();
      }
    } catch (error) {
      // Status penerima bersifat tambahan; jangan mengganggu jadwal yang sedang dibagikan.
      console.warn('Status penarik jadwal tidak dapat disinkronkan:', error);
    } finally {
      sharePullerSyncInFlight = false;
    }
  }

  function formatShareCountdown(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function renderShareButtonState() {
    const button = document.getElementById('share-schedule-open');
    const isActive = Boolean(activeScheduleShare && activeScheduleShare.expiresAt > Date.now());
    button.textContent = isActive ? `Berhenti bagikan (${activeScheduleShare.code})` : 'Bagikan jadwal';
    button.classList.toggle('is-sharing', isActive);
    button.setAttribute('aria-label', isActive ? `Berhenti membagikan jadwal dengan kode ${activeScheduleShare.code}` : 'Bagikan jadwal');
    document.getElementById('share-schedule-submit').disabled = isActive || !schedules.length;
  }

  async function stopSharing(expired) {
    window.clearInterval(shareTimer);
    shareTimer = 0;
    const headerButton = document.getElementById('share-schedule-open');
    headerButton.disabled = true;
    const code = activeScheduleShare?.code || document.getElementById('share-code').textContent;
    if (code) {
      try { await callScheduleApi('stopScheduleShare', { code }); }
      catch (error) {
        console.warn(error);
        if (!expired) {
          document.getElementById('share-status').textContent = `Gagal menghentikan berbagi: ${error.message}`;
          headerButton.disabled = false;
          shareTimer = window.setInterval(updateShareCountdown, 1000);
          return;
        }
      }
    }
    activeScheduleShare = null;
    shareExpiresAt = 0;
    persistActiveScheduleShare();
    renderShareButtonState();
    renderSchedules();
    headerButton.disabled = false;
    document.getElementById('share-result').hidden = true;
    document.getElementById('share-status').textContent = expired ? 'Waktu berbagi habis. Data sementara telah dihapus.' : 'Berbagi dihentikan dan data sementara telah dihapus.';
  }

  async function shareSelectedSchedule() {
    if (activeScheduleShare && activeScheduleShare.expiresAt > Date.now()) return;
    const schedule = schedules.find((item) => item.id === document.getElementById('share-schedule-select').value);
    if (!schedule) return;
    const button = document.getElementById('share-schedule-submit');
    button.disabled = true;
    document.getElementById('share-status').textContent = 'Mengirim jadwal…';
    try {
      let intro = schedule.sharedIntro || (Object.prototype.hasOwnProperty.call(scheduleIntros, schedule.id) ? scheduleIntros[schedule.id] : undefined);
      if (intro === undefined) {
        const introResult = await callScheduleApi('getScheduleIntro', { scheduleId: schedule.id });
        intro = introResult.intro || null;
        scheduleIntros[schedule.id] = intro;
        persistScheduleIntroCache();
      }
      const sharedByName = String(profileUserNameInput.value || preferredUserName || '').trim();
      if (!sharedByName) {
        document.getElementById('share-status').textContent = 'Simpan nama pengguna di Profile sebelum membagikan jadwal.';
        openRequiredProfile('membagikan jadwal');
        return;
      }
      const durationMinutes = Number(document.getElementById('share-duration-select').value) || 15;
      const sharedSongs = (schedule.songs || []).map((entry) => ({
        ...entry,
        ...(String(entry.id || '').startsWith('local_') ? { localSourceName: sharedByName } : {}),
        images: imagesForScheduleShare(entry.images || {})
      }));
      const result = await postScheduleApi('shareSchedule', { sharedByName, durationMinutes, schedule: { ...schedule, sharedByName, songs: sharedSongs, intro: intro || null } });
      document.getElementById('share-code').textContent = result.code;
      document.getElementById('share-result').hidden = false;
      document.getElementById('share-status').textContent = 'Bagikan kode ini kepada penerima.';
      activeScheduleShare = { scheduleId: schedule.id, code: result.code, expiresAt: Number(result.expiresAt) };
      schedule.pulledBy = [];
      saveSchedules();
      shareExpiresAt = activeScheduleShare.expiresAt;
      persistActiveScheduleShare();
      window.clearInterval(shareTimer);
      document.getElementById('share-schedule-submit').disabled = true;
      renderShareButtonState();
      renderSchedules();
      updateShareCountdown();
      syncSchedulePullers();
      shareTimer = window.setInterval(updateShareCountdown, 1000);
      trackSuccessfulAction('schedule_share_success', { scheduleName: schedule.title || 'Jadwal tanpa nama' });
    } catch (error) {
      document.getElementById('share-status').textContent = error.message;
    } finally { button.disabled = Boolean(activeScheduleShare && activeScheduleShare.expiresAt > Date.now()); }
  }

  function restoreActiveScheduleShare() {
    if (!activeScheduleShare) {
      renderShareButtonState();
      return;
    }
    if (activeScheduleShare.expiresAt <= Date.now()) {
      stopSharing(true);
      return;
    }
    document.getElementById('share-code').textContent = activeScheduleShare.code;
    document.getElementById('share-schedule-submit').disabled = true;
    renderShareButtonState();
    updateShareCountdown();
    syncSchedulePullers();
    shareTimer = window.setInterval(updateShareCountdown, 1000);
  }

  async function pullSharedSchedule() {
    const code = document.getElementById('pull-schedule-code').value.trim().toUpperCase();
    const statusEl = document.getElementById('pull-status');
    if (!/^[A-Z0-9]{3}$/.test(code)) { statusEl.textContent = 'Masukkan kode 3 karakter yang valid.'; return; }
    const pullerName = readProfileUserName();
    if (!pullerName) {
      statusEl.textContent = 'Simpan nama pengguna di Profile sebelum menarik jadwal.';
      openRequiredProfile('menarik jadwal');
      return;
    }
    const button = document.getElementById('pull-schedule-submit');
    button.disabled = true;
    statusEl.textContent = 'Mengambil jadwal…';
    try {
      const result = await callScheduleApi('pullSchedule', { code, pullerName });
      const received = result.schedule;
      const rawSharerName = String(received.sharedByName || '').trim() || 'Pengguna';
      const sharerName = `${rawSharerName.charAt(0).toLocaleUpperCase('id')}${rawSharerName.slice(1)}`;
      const sourceTitle = String(received.title || 'Jadwal ibadah').replace(/\s*\(salinan(?:\s+dari[^)]*)?\)\s*$/i, '').trim() || 'Jadwal ibadah';
      const imported = { ...received, id: `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: `${sourceTitle} (salinan dari ${sharerName})`, sharedIntro: received.intro && typeof received.intro === 'object' ? received.intro : null, songs: Array.isArray(received.songs) ? received.songs.map((song, index) => ({ ...song, entryId: `entry_${Date.now()}_${index}`, overrides: song.overrides && typeof song.overrides === 'object' ? song.overrides : {} })) : [] };
      schedules.unshift(imported);
      activeScheduleId = imported.id;
      const saved = saveSchedules();
      renderSchedules();
      renderList();
      document.getElementById('pull-schedule-code').value = '';
      pullDialog.close();
      highlightNewSchedule(imported.id);
      if (saved) trackSuccessfulAction('schedule_pull_success', { scheduleName: imported.title });
    } catch (error) { statusEl.textContent = error.message; }
    finally { button.disabled = false; }
  }

  function renderSchedules() {
    renderShareButtonState();
    renderScheduleTargets();
    scheduleList.replaceChildren();
    if (!schedules.length) {
      const empty = document.createElement('div');
      empty.className = 'schedule-empty';
      empty.textContent = 'Belum ada jadwal. Buat jadwal untuk mulai menyusun lagu ibadah.';
      scheduleList.append(empty);
      scheduleStatus.textContent = 'Jadwal disimpan hanya di browser/perangkat ini.';
      return;
    }

    const fragment = document.createDocumentFragment();
    schedules.forEach((schedule) => {
      const card = document.createElement('article');
      card.className = `schedule-card${schedule.id === activeScheduleId ? ' is-active-schedule' : ''}`;
      card.dataset.scheduleId = schedule.id;
      const shareCountdown = activeScheduleShare && activeScheduleShare.scheduleId === schedule.id && activeScheduleShare.expiresAt > Date.now()
        ? `<div class="schedule-share-status"><span>Jadwal dibagikan · kode ${escapeText(activeScheduleShare.code)}</span><strong data-schedule-share-countdown="${escapeText(schedule.id)}">${formatShareCountdown(Math.max(0, Math.ceil((activeScheduleShare.expiresAt - Date.now()) / 1000)))}</strong></div>`
        : '';
      const pulledBy = formatSchedulePullers(schedule.pulledBy);
      card.innerHTML = `
        <label class="active-schedule-choice"><input type="radio" name="active-worship-schedule" value="${escapeText(schedule.id)}" ${schedule.id === activeScheduleId ? 'checked' : ''}><span>${schedule.id === activeScheduleId ? 'Aktif' : 'Tidak Aktif'}</span></label>
        <div class="schedule-card-header">
          <label class="schedule-field">NAMA JADWAL<input class="schedule-title-input" data-field="title" type="text" maxlength="80" value="${escapeText(schedule.title)}" placeholder="Contoh: Ibadah Minggu Pagi"></label>
          <label class="schedule-field">TANGGAL<span class="schedule-date-control"><span class="schedule-date-display">${escapeText(formatWorshipDate(schedule.date) || 'Pilih tanggal')}</span><input data-field="date" type="date" value="${escapeText(schedule.date)}" aria-label="Tanggal ibadah"></span>${pulledBy ? `<span class="schedule-pullers">${escapeText(pulledBy)}</span>` : ''}</label>
          <button class="schedule-view-button" type="button" data-action="view-schedule">Lihat jadwal</button>
        </div>${shareCountdown}`;
      fragment.append(card);
    });
    scheduleList.append(fragment);
    scheduleStatus.textContent = `${schedules.length} jadwal tersimpan di perangkat ini.`;
  }

  function formatSchedulePullers(names) {
    const values = Array.isArray(names) ? names.map((name) => String(name || '').trim()).filter(Boolean) : [];
    if (!values.length) return '';
    if (values.length === 1) return `${values[0]} sudah menarik data.`;
    if (values.length === 2) return `${values[0]} dan ${values[1]} sudah menarik data.`;
    return `${values.slice(0, -1).join(', ')}, dan ${values[values.length - 1]} sudah menarik data.`;
  }

  function renderScheduleView(scheduleId) {
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;
    viewedScheduleId = schedule.id;
    document.getElementById('schedule-view-title').textContent = schedule.title || 'Jadwal ibadah';
    document.getElementById('schedule-view-date').textContent = schedule.date
      ? formatWorshipDate(schedule.date)
      : 'Tanggal belum ditentukan';
    document.getElementById('refresh-schedule-songs-status').textContent = '';
    const compactButton = document.getElementById('toggle-schedule-compact');
    compactButton.setAttribute('aria-pressed', String(Boolean(schedule.compactView)));
    compactButton.setAttribute('aria-label', schedule.compactView ? 'Tampilan lengkap' : 'Tampilan ringkas');
    compactButton.title = schedule.compactView ? 'Tampilan lengkap' : 'Tampilan ringkas';
    document.getElementById('schedule-view-dialog').classList.toggle('is-compact', Boolean(schedule.compactView));
    loadScheduleIntro(schedule.id);
    const list = document.getElementById('schedule-view-list');
    const rows = schedule.songs.map((entry, index) => {
      const song = getEffectiveScheduledSong(entry);
      const visibleNumber = displaySongNumber(song.number || entry.number);
      const sourceClass = String(entry.id || '').startsWith('local_') ? ' is-local-song' : ' is-database-song';
      const localAttribution = entry.localSourceName ? `<span class="schedule-song-attribution">Diambil dari data lokal “${escapeText(entry.localSourceName)}”</span>` : '';
      return `<li class="schedule-song-row${sourceClass}${entry.preWorship ? ' is-pre-worship' : ''}" data-entry-id="${escapeText(entry.entryId)}">
        <button type="button" class="schedule-drag-handle" aria-label="Seret untuk mengurutkan lagu" title="Seret untuk mengatur urutan">&#8942;</button>
        <span class="schedule-song-order">${index + 1}</span>
        <button type="button" class="schedule-song-name" data-action="preview-song" title="Buka preview"><span class="schedule-song-full-name">${[song.category || entry.category, visibleNumber, displaySongTitle({ ...song, title: song.title || entry.title })].filter(Boolean).map(escapeText).join(' ')}</span><span class="schedule-song-compact-name">${[song.category || entry.category, visibleNumber, displaySongTitle({ ...song, title: song.title || entry.title })].filter(Boolean).map(escapeText).join(' ')}${song.key ? ` (${escapeText(song.key)})` : ''}${song.tempo ? ` ${escapeText(song.tempo)}` : ''}${song.genre ? ` · ${escapeText(song.genre)}` : ''}</span>${localAttribution}</button>
        <span class="schedule-song-actions">
          <label class="pre-worship-toggle"><input type="checkbox" data-action="toggle-pre-worship" data-entry-id="${escapeText(entry.entryId)}" ${entry.preWorship ? 'checked' : ''}><span>Pra-ibadah</span></label>
          <button type="button" data-action="copy-to-my-songs" data-entry-id="${escapeText(entry.entryId)}" aria-label="Add to Laguku: ${escapeText(song.title || entry.title || '')}" title="Add to Laguku">Laguku</button>
          <button type="button" data-action="move-up" data-entry-id="${escapeText(entry.entryId)}" aria-label="Pindahkan lagu ke atas" ${index === 0 ? 'disabled' : ''}>&#8593;</button>
          <button type="button" data-action="move-down" data-entry-id="${escapeText(entry.entryId)}" aria-label="Pindahkan lagu ke bawah" ${index === schedule.songs.length - 1 ? 'disabled' : ''}>&#8595;</button>
          <button type="button" data-action="edit-song" data-entry-id="${escapeText(entry.entryId)}" aria-label="Edit lagu di jadwal">&#9998;</button>
          <button type="button" class="remove-scheduled-song" data-action="remove-song" data-entry-id="${escapeText(entry.entryId)}" aria-label="Hapus lagu dari jadwal">&#215;</button>
        </span>
      </li>`;
    }).join('');
    list.innerHTML = `<article class="schedule-card" data-schedule-id="${escapeText(schedule.id)}">${schedule.songs.length
      ? `<ol class="schedule-song-list">${rows}</ol>`
      : '<p class="schedule-no-songs">Belum ada lagu di jadwal ini. Tambahkan lagu dari koleksi menggunakan tombol +.</p>'}</article>`;
  }

  async function refreshViewedScheduleSongsFromLibrary() {
    const schedule = schedules.find((item) => item.id === viewedScheduleId);
    const status = document.getElementById('refresh-schedule-songs-status');
    if (!schedule) return;
    let updatedCount = 0;
    let missingCount = 0;
    for (const entry of schedule.songs) {
      const latestSong = songs.find((song) => String(song.id) === String(entry.id));
      if (!latestSong) {
        missingCount += 1;
        continue;
      }
      const entryId = entry.entryId;
      const preWorship = Boolean(entry.preWorship);
      Object.assign(entry, createScheduledEntry(latestSong), { entryId, preWorship, overrides: {} });
      updatedCount += 1;
    }
    if (!updatedCount) {
      status.textContent = missingCount ? 'Tidak ada lagu jadwal yang cocok dengan data lokal.' : 'Jadwal ini belum memiliki lagu.';
      return;
    }
    saveSchedules();
    renderSchedules();
    renderScheduleView(schedule.id);
    status.textContent = `${updatedCount} lagu diperbarui dari data lokal${missingCount ? ` · ${missingCount} lagu tidak ditemukan` : ''}.`;
  }

  async function loadScheduleIntro(scheduleId) {
    const requestId = ++scheduleIntroRequestId;
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (schedule && schedule.sharedIntro) {
      scheduleIntros[scheduleId] = schedule.sharedIntro;
      showScheduleIntro(schedule.sharedIntro);
      return;
    }
    const hasCachedIntro = Object.prototype.hasOwnProperty.call(scheduleIntros, scheduleId);
    const cachedIntro = hasCachedIntro ? scheduleIntros[scheduleId] : null;
    showScheduleIntro(cachedIntro);
    try {
      const result = await callScheduleApi('getScheduleIntro', { scheduleId });
      if (requestId !== scheduleIntroRequestId || viewedScheduleId !== scheduleId) return;
      scheduleIntros[scheduleId] = result.intro || null;
      persistScheduleIntroCache();
      showScheduleIntro(result.intro || null);
    } catch (error) {
      console.warn('Intro jadwal tidak dapat dimuat:', error);
    }
  }

  function showScheduleIntro(intro) {
    if (!intro) {
      scheduleIntroActionsGroup.hidden = true;
      scheduleIntroNameButton.textContent = '';
      return;
    }
    scheduleIntroNameButton.textContent = intro.name || 'Intro';
    scheduleIntroNameButton.setAttribute('aria-label', `Buka gambar intro ${intro.name || ''}`);
    scheduleIntroActionsGroup.hidden = false;
  }

  function openScheduleIntroForm() {
    document.getElementById('schedule-intro-file').value = '';
    document.getElementById('schedule-intro-camera').value = '';
    capturedScheduleIntroFile = null;
    document.getElementById('schedule-intro-file-name').textContent = 'Pilih gambar dari perangkat atau ambil foto dengan kamera.';
    document.getElementById('schedule-intro-status').textContent = '';
    if (!scheduleIntroDialog.open) scheduleIntroDialog.showModal();
  }

  function openScheduleIntroImage(intro, fromActiveSong = false, scheduleContext = null) {
    if (!intro || !intro.url) return;
    if (scheduleContext) {
      const activeEntryId = currentPreviewSong && currentPreviewSong.entryId;
      currentPreviewSongs = scheduleContext.songs.map((item) => ({
        ...getEffectiveScheduledSong(item),
        preWorship: Boolean(item.preWorship),
        scheduleIntro: intro
      }));
      const activeIndex = activeEntryId
        ? currentPreviewSongs.findIndex((song) => song.entryId === activeEntryId && findDefaultScoreInstrument(song))
        : -1;
      const firstScoreIndex = currentPreviewSongs.findIndex((song) => findDefaultScoreInstrument(song));
      currentSongIndex = activeIndex >= 0
        ? activeIndex
        : firstScoreIndex >= 0 ? firstScoreIndex : (currentPreviewSongs.length ? 0 : -1);
      currentPreviewSong = currentPreviewSongs[currentSongIndex] || null;
      introGeneralSongIndex = currentSongIndex;
      introGeneralNavigationActive = Boolean(findDefaultScoreInstrument(currentPreviewSong));
      scoreImageReturnTarget = 'schedule';
    } else {
      if (fromActiveSong) {
        introGeneralSongIndex = currentSongIndex;
        introGeneralNavigationActive = Boolean(findDefaultScoreInstrument(currentPreviewSong));
      }
      scoreImageReturnTarget = fromActiveSong ? 'lyrics' : 'schedule';
    }
    showScheduleIntroInScoreViewer(intro);
  }

  function showScheduleIntroInScoreViewer(intro) {
    if (!intro || !intro.url) return;
    activeScheduleIntro = intro;
    scoreImageMode = 'intro';
    activeScoreInstrument = 'Intro';
    activeScoreFiles = [{ id: intro.fileId, url: intro.url }];
    activeScoreIndex = 0;
    scoreImageInstruments.hidden = true;
    const closeLabel = document.querySelector('#close-score-image span');
    const returnLabel = scoreImageReturnTarget === 'schedule' ? 'Kembali ke jadwal' : 'Kembali ke lirik';
    if (closeLabel) closeLabel.textContent = returnLabel;
    document.getElementById('close-score-image').setAttribute('aria-label', `Tutup gambar dan ${returnLabel.toLowerCase()}`);
    if (!scoreImageDialog.open) scoreImageDialog.showModal();
    renderFullScoreImage();
    showScoreImageControls();
  }

  async function saveScheduleIntro(event) {
    event.preventDefault();
    const schedule = schedules.find((item) => item.id === viewedScheduleId);
    const name = 'Intro';
    const file = document.getElementById('schedule-intro-file').files[0]
      || document.getElementById('schedule-intro-camera').files[0]
      || capturedScheduleIntroFile;
    const statusEl = document.getElementById('schedule-intro-status');
    if (!schedule || !file) { statusEl.textContent = 'Pilih gambar intro.'; return; }
    if (!file.type.startsWith('image/')) { statusEl.textContent = 'Pilih file gambar yang valid.'; return; }
    if (file.size > 8 * 1024 * 1024) { statusEl.textContent = 'Ukuran gambar maksimal 8 MB.'; return; }
    const submit = document.getElementById('save-schedule-intro');
    submit.disabled = true;
    statusEl.textContent = 'Upload gambar…';
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] || '';
      const result = await postScheduleApi('saveScheduleIntro', { intro: {
        scheduleId: schedule.id, name,
        scheduleName: schedule.title || 'Jadwal ibadah', scheduleDate: schedule.date || 'Tanpa tanggal',
        image: { originalName: file.name, mimeType: file.type, base64 }
      } });
      scheduleIntros[schedule.id] = result;
      schedule.sharedIntro = null;
      persistScheduleIntroCache();
      saveSchedules();
      scheduleIntroDialog.close();
      await loadScheduleIntro(schedule.id);
    } catch (error) {
      statusEl.textContent = error.message || 'Intro gagal disimpan.';
    } finally { submit.disabled = false; }
  }

  async function removeScheduleIntro() {
    const scheduleId = viewedScheduleId;
    const intro = scheduleIntros[scheduleId];
    if (!scheduleId || !intro) return;
    const schedule = schedules.find((item) => item.id === scheduleId);
    const removesSharedCopy = Boolean(schedule && schedule.sharedIntro);
    removeScheduleIntroMessage.textContent = `Hapus semua data "${intro.name}"?`;
    const confirmed = await new Promise((resolve) => {
      resolveIntroRemovalConfirmation = resolve;
      removeScheduleIntroDialog.showModal();
    });
    if (!confirmed) return;
    removeScheduleIntroButton.disabled = true;
    try {
      if (removesSharedCopy) {
        schedule.sharedIntro = null;
        saveSchedules();
      } else {
        await postScheduleApi('deleteScheduleIntro', { scheduleId });
      }
      delete scheduleIntros[scheduleId];
      persistScheduleIntroCache();
      scheduleIntroActionsGroup.hidden = true;
      if (scoreImageDialog.open && scoreImageMode === 'intro') scoreImageDialog.close();
      scheduleStatus.textContent = 'Intro berhasil dihapus.';
    } catch (error) {
      scheduleStatus.textContent = error.message || 'Intro gagal dihapus.';
    } finally {
      removeScheduleIntroButton.disabled = false;
    }
  }

  function finishIntroRemovalConfirmation(confirmed) {
    const resolve = resolveIntroRemovalConfirmation;
    resolveIntroRemovalConfirmation = null;
    if (removeScheduleIntroDialog.open) removeScheduleIntroDialog.close();
    if (resolve) resolve(confirmed);
  }

  function confirmScheduleDeletion(schedule) {
    if (!schedule) return;
    const title = schedule.title || 'Jadwal ibadah';
    const date = schedule.date ? formatWorshipDate(schedule.date) : 'tanpa tanggal';
    pendingScheduleDeletionId = schedule.id;
    deleteScheduleMessage.textContent = `Hapus jadwal "${title}" tanggal ${date}?`;
    deleteScheduleDialog.showModal();
  }

  async function finishScheduleDeletion(confirmed) {
    const scheduleId = pendingScheduleDeletionId;
    pendingScheduleDeletionId = '';
    if (deleteScheduleDialog.open) deleteScheduleDialog.close();
    if (!confirmed || !scheduleId) return;
    const removedSchedule = schedules.find((schedule) => schedule.id === scheduleId);
    if (removedSchedule) await removeScheduleOfflineImages(removedSchedule.songs || []);
    schedules = schedules.filter((schedule) => schedule.id !== scheduleId);
    saveSchedules();
    renderSchedules();
    renderList();
    if (viewedScheduleId === scheduleId && scheduleViewDialog.open) scheduleViewDialog.close();
  }

  async function removeScheduleOfflineImages(entries) {
    const keys = new Set();
    (entries || []).forEach((entry) => {
      Object.values(entry.images || {}).forEach((files) => {
        (Array.isArray(files) ? files : []).forEach((file) => {
          if (file && typeof file === 'object' && file.localCacheKey) keys.add(String(file.localCacheKey));
        });
      });
    });
    if (!keys.size) return;
    try {
      const db = await openScheduleImageDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('images', 'readwrite');
        const store = transaction.objectStore('images');
        keys.forEach((key) => store.delete(key));
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Gagal menghapus salinan gambar jadwal.'));
      });
      db.close();
    } catch (error) {
      console.warn('Salinan gambar offline jadwal tidak dapat dibersihkan:', error);
    }
    keys.forEach((key) => {
      const objectUrl = scheduleImageObjectUrls.get(key);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      scheduleImageObjectUrls.delete(key);
    });
  }

  function renderScheduleTargets() {
    if (!schedules.some((schedule) => schedule.id === activeScheduleId)) activeScheduleId = schedules[0] ? schedules[0].id : '';
    try {
      if (activeScheduleId) localStorage.setItem(ACTIVE_SCHEDULE_KEY, activeScheduleId);
      else localStorage.removeItem(ACTIVE_SCHEDULE_KEY);
    } catch (error) { console.warn('Jadwal aktif tidak dapat disimpan:', error); }
  }

  function addSchedule() {
    const date = todayString();
    const schedule = { id: `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: 'Ibadah Baru', date, songs: [] };
    schedules.unshift(schedule);
    activeScheduleId = schedule.id;
    if (saveSchedules()) trackSuccessfulAction('schedule_create_success', { scheduleName: schedule.title });
    renderSchedules();
    renderList();
    highlightNewSchedule(schedule.id);
    const titleInput = scheduleList.querySelector('.schedule-card:first-child .schedule-title-input');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }

  function highlightNewSchedule(scheduleId) {
    const card = scheduleList.querySelector(`[data-schedule-id="${scheduleId}"]`);
    if (!card) return;
    card.classList.add('schedule-just-imported');
    window.setTimeout(() => card.classList.remove('schedule-just-imported'), 7000);
  }

  function addSongToSchedule(songId) {
    const schedule = schedules.find((item) => item.id === activeScheduleId);
    const song = songs.find((item) => item.id === songId) || mySongs.find((item) => item.id === songId);
    if (!schedule || !song) return;
    const currentSchedule = schedules.find((item) => item.id === schedule.id);
    if (!currentSchedule) return;
    currentSchedule.songs.push(createScheduledEntry(song));
    currentSchedule.isOpen = true;
    if (saveSchedules()) trackSuccessfulAction('song_add_to_schedule_success', {
      scheduleName: currentSchedule.title || 'Jadwal tanpa nama',
      songTitle: song.title || '', songCategory: song.category || '', songNumber: song.number || ''
    });
    renderSchedules();
    scheduleStatus.textContent = `${song.title} ditambahkan ke "${currentSchedule.title || 'Jadwal tanpa nama'}".`;
  }

  function handleCollectionClick(event) {
    const saveLocalButton = event.target.closest('[data-save-song-to-my-songs]');
    if (saveLocalButton) {
      event.preventDefault();
      event.stopPropagation();
      const song = songs.find((item) => String(item.id) === String(saveLocalButton.dataset.saveSongToMySongs));
      if (song) addSongToMySongs(song, song.id);
      return;
    }
    const addButton = event.target.closest('[data-add-song]');
    if (!addButton) return;
    event.preventDefault();
    event.stopPropagation();
    addSongToSchedule(addButton.dataset.addSong);
  }

  function handleMySongListClick(event) {
    const button = event.target.closest('button[data-my-song-action]');
    if (!button) return;
    const song = mySongs.find((item) => item.id === button.dataset.songId);
    if (!song) return;
    const action = button.dataset.mySongAction;
    if (action === 'edit') openMySongEditor(song);
    if (action === 'delete') confirmMySongDeletion(song);
    if (action === 'add') addSongToSchedule(song.id);
  }

  function handleActiveScheduleChange(event) {
    const radio = event.target.closest('input[name="active-worship-schedule"]');
    if (!radio || !schedules.some((item) => item.id === radio.value)) return;
    activeScheduleId = radio.value;
    saveSchedules();
    renderSchedules();
    renderList();
    renderMySongs();
    const selected = schedules.find((item) => item.id === activeScheduleId);
    scheduleStatus.textContent = `Jadwal aktif: ${selected.title || 'Jadwal tanpa nama'}.`;
  }

  function createScheduledEntry(song, images = song.images || {}) {
    return {
      entryId: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      id: song.id,
      category: song.category,
      number: song.number,
      title: song.title,
      key: song.key || '',
      genre: song.genre || '',
      songCreator: song.songCreator || '',
      dateCreate: song.dateCreate || '',
      tempo: song.tempo || '',
      contentHtml: normalizeSongContentHtml(song.contentHtml),
      images: images && typeof images === 'object' ? images : {},
      overrides: {}
    };
  }

  function getEffectiveScheduledSong(entry) {
    // Entries created before local snapshots only contain a spreadsheet song ID.
    // Use the cached library record as their base, then apply the schedule copy.
    const sourceSong = songs.find((song) => song.id === entry.id) || mySongs.find((song) => song.id === entry.id) || {};
    const entryImages = entry.images && typeof entry.images === 'object' && Object.keys(entry.images).length ? entry.images : sourceSong.images || {};
    return { ...sourceSong, ...entry, ...(entry.overrides || {}), images: entryImages };
  }

  function openScheduleImageDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(SCHEDULE_IMAGE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('images')) request.result.createObjectStore('images', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Penyimpanan gambar jadwal tidak tersedia.'));
    });
  }

  function imagesForScheduleShare(images) {
    const shareable = {};
    Object.entries(images || {}).forEach(([instrument, files]) => {
      if (!Array.isArray(files)) return;
      shareable[instrument] = files.map((file) => {
        if (typeof file === 'string') return /^data:image\//i.test(file) ? '' : file;
        const image = { ...file };
        if (/^data:image\//i.test(String(image.url || ''))) image.url = image.driveUrl || '';
        delete image.driveUrl;
        delete image.localCacheKey;
        return image;
      });
    });
    return shareable;
  }

  function handleScheduleClick(event) {
    const preWorshipCheckbox = event.target.closest('input[data-action="toggle-pre-worship"]');
    const button = event.target.closest('button[data-action]');
    const card = event.target.closest('.schedule-card');
    if (!card) return;
    const scheduleIndex = schedules.findIndex((item) => item.id === card.dataset.scheduleId);
    if (scheduleIndex < 0) return;
    const schedule = schedules[scheduleIndex];
    if (preWorshipCheckbox) {
      const entry = schedule.songs.find((item) => item.entryId === preWorshipCheckbox.dataset.entryId);
      if (!entry) return;
      entry.preWorship = preWorshipCheckbox.checked;
      preWorshipCheckbox.closest('.schedule-song-row')?.classList.toggle('is-pre-worship', entry.preWorship);
      saveSchedules();
      return;
    }
    const action = button ? button.dataset.action : '';

    if (action === 'copy-to-my-songs') {
      const entry = schedule.songs.find((item) => item.entryId === button.dataset.entryId);
      if (!entry) return;
      const effectiveSong = getEffectiveScheduledSong(entry);
      const sourceSong = songs.find((item) => String(item.id) === String(entry.id))
        || mySongs.find((item) => String(item.id) === String(entry.id))
        || effectiveSong;
      addSongToMySongs({ ...sourceSong, ...effectiveSong, images: sourceSong.images || effectiveSong.images || {} }, entry.id);
      return;
    }

    if (action === 'view-schedule') {
      renderScheduleView(schedule.id);
      if (!scheduleViewDialog.open) {
        scheduleViewDialog.showModal();
        document.body.classList.add('schedule-view-open');
      }
      return;
    } else if (action === 'delete-schedule') {
      confirmScheduleDeletion(schedule);
      return;
    } else if (action === 'edit-song') {
      openScheduleSongEditor(schedule.id, button.dataset.entryId);
      return;
    } else if (action === 'preview-song') {
      const row = button.closest('.schedule-song-row');
      const entry = schedule.songs.find((item) => item.entryId === row.dataset.entryId);
      if (entry) openScheduledSong(schedule, entry);
      return;
    } else if (action === 'remove-song' || action === 'move-up' || action === 'move-down') {
      const index = schedule.songs.findIndex((item) => item.entryId === button.dataset.entryId);
      if (index < 0) return;
      if (action === 'remove-song') schedule.songs.splice(index, 1);
      if (action === 'move-up' && index > 0) [schedule.songs[index - 1], schedule.songs[index]] = [schedule.songs[index], schedule.songs[index - 1]];
      if (action === 'move-down' && index < schedule.songs.length - 1) [schedule.songs[index + 1], schedule.songs[index]] = [schedule.songs[index], schedule.songs[index + 1]];
    } else {
      return;
    }
    saveSchedules();
    renderSchedules();
    if (scheduleViewDialog.open) {
      if (schedules.some((item) => item.id === viewedScheduleId)) renderScheduleView(viewedScheduleId);
      else scheduleViewDialog.close();
    }
    renderList();
  }

  function handleScheduleRowClick(event) {
    if (event.target.closest('button, input, label')) return;
    const row = event.target.closest('.schedule-song-row');
    const card = row && row.closest('.schedule-card');
    if (!row || !card) return;
    const schedule = schedules.find((item) => item.id === card.dataset.scheduleId);
    const entry = schedule && schedule.songs.find((item) => item.entryId === row.dataset.entryId);
    if (entry) openScheduledSong(schedule, entry);
  }

  async function openScheduledSong(schedule, entry) {
    let intro = schedule.sharedIntro || (Object.prototype.hasOwnProperty.call(scheduleIntros, schedule.id) ? scheduleIntros[schedule.id] : undefined);
    if (intro === undefined) {
      try {
        const result = await callScheduleApi('getScheduleIntro', { scheduleId: schedule.id });
        intro = result.intro || null;
        scheduleIntros[schedule.id] = intro;
        persistScheduleIntroCache();
      } catch (error) { console.warn('Intro jadwal tidak dapat dimuat:', error); }
    }
    const queue = schedule.songs.map((item) => ({ ...getEffectiveScheduledSong(item), preWorship: Boolean(item.preWorship), scheduleIntro: intro }));
    const index = schedule.songs.findIndex((item) => item.entryId === entry.entryId);
    if (index >= 0) openSong(queue[index], queue, index);
  }

  function openScheduleSongEditor(scheduleId, entryId) {
    const schedule = schedules.find((item) => item.id === scheduleId);
    const entry = schedule && schedule.songs.find((item) => item.entryId === entryId);
    if (!entry) return;
    editingEntry = { scheduleId, entryId };
    const song = getEffectiveScheduledSong(entry);
    scheduleEditForm.elements.title.value = song.title || '';
    scheduleEditForm.elements.number.value = song.number || '';
    scheduleEditForm.elements.key.value = song.key || '';
    scheduleEditForm.elements.genre.value = song.genre || '';
    scheduleEditForm.elements.tempo.value = song.tempo || '';
    scheduleContentInput.value = htmlToEditableText(song.contentHtml || '');
    updateScheduleContentHighlight();
    scheduleEditDialog.showModal();
    scheduleEditForm.elements.title.focus();
  }

  function scheduleSectionLabel(line) {
    const trimmed = line.trim();
    const bracketed = trimmed.match(/^\[([^\]\n]{1,60})\]\s*:?[ \t]*$/) || trimmed.match(/^\{([^}\n]{1,60})\}\s*:?[ \t]*$/);
    if (bracketed) return bracketed[1].trim();
    const plain = trimmed.replace(/:$/, '').trim();
    return songSectionPattern.test(plain) ? plain.replace(/^\d+[.)]?\s*/, '') : '';
  }

  function updateScheduleContentHighlight() {
    const value = scheduleContentInput.value || '[Intro]\nG   D   Em\n\n[Bait 1]\nG       C\nLirik lagu\n\n[Reff]\nC   D   G';
    scheduleContentHighlight.classList.toggle('is-placeholder', !scheduleContentInput.value);
    scheduleContentHighlight.innerHTML = value.split('\n').map((line) => {
      return scheduleSectionLabel(line)
        ? `<span class="schedule-section-marker">${escapeText(line)}</span>`
        : escapeText(line);
    }).join('\n') + '\n';
    scheduleContentHighlight.style.transform = `translate(${-scheduleContentInput.scrollLeft}px, ${-scheduleContentInput.scrollTop}px)`;
  }

  function htmlToEditableText(html) {
    const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
    const sections = [...parsed.querySelectorAll('.song-section')];
    if (!sections.length) return parsed.body.textContent || '';
    return sections.map((section) => {
      const heading = section.dataset.section || section.querySelector('h3')?.textContent || '';
      const body = section.querySelector('.song-section-body') || section;
      return `${heading ? `[${heading}]\n` : ''}${textWithBreaks(body)}`.trimEnd();
    }).join('\n\n');
  }

  function textWithBreaks(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    if (node.tagName === 'BR') return '\n';
    return [...node.childNodes].map(textWithBreaks).join('');
  }

  function editableTextToHtml(text) {
    const sections = [];
    let current = { label: 'Lagu', lines: [] };
    String(text || '').split('\n').forEach((line) => {
      const sectionLabel = scheduleSectionLabel(line);
      if (sectionLabel) {
        if (current.lines.length || current.label !== 'Lagu' || sections.length) sections.push(current);
        current = { label: sectionLabel, lines: [] };
      } else {
        current.lines.push(line);
      }
    });
    if (current.lines.length || !sections.length) sections.push(current);
    return `<div class="song-content">${sections.map((section) => {
      const label = escapeText(section.label);
      const body = escapeText(section.lines.join('\n'));
      return `<section class="song-section" data-section="${label}"><h3 class="song-section-title">${label}</h3><div class="song-section-body">${body}</div></section>`;
    }).join('')}</div>`;
  }

  function normalizeSongContentHtml(contentHtml) {
    const editableText = htmlToEditableText(contentHtml);
    return editableText.trim() ? editableTextToHtml(editableText) : '';
  }

  function saveScheduleSongEdit(event) {
    event.preventDefault();
    if (!scheduleEditForm.reportValidity() || !editingEntry) return;
    const schedule = schedules.find((item) => item.id === editingEntry.scheduleId);
    const entry = schedule && schedule.songs.find((item) => item.entryId === editingEntry.entryId);
    if (!entry) return;
    entry.overrides = {
      title: scheduleEditForm.elements.title.value.trim(),
      number: scheduleEditForm.elements.number.value.trim(),
      key: scheduleEditForm.elements.key.value.trim(),
      genre: scheduleEditForm.elements.genre.value.trim(),
      tempo: scheduleEditForm.elements.tempo.value.trim(),
      contentHtml: editableTextToHtml(scheduleContentInput.value)
    };
    const saved = saveSchedules();
    if (saved) trackSuccessfulAction('song_edit_success', {
      songTitle: entry.overrides.title || entry.title || '', songCategory: entry.category || '', songNumber: entry.overrides.number || entry.number || '',
      scheduleName: schedule.title || 'Jadwal tanpa nama'
    });
    renderSchedules();
    if (scheduleViewDialog.open) renderScheduleView(editingEntry.scheduleId);
    scheduleEditDialog.close();
    editingEntry = null;
  }

  function handleScheduleDragStart(event) {
    const handle = event.target.closest('.schedule-drag-handle');
    if (!handle) return;
    const row = handle.closest('.schedule-song-row');
    if (!row) return;
    event.preventDefault();
    draggedRow = row;
    dragPointerId = event.pointerId;
    row.classList.add('is-dragging');
    try { handle.setPointerCapture(event.pointerId); } catch (ignored) {}
  }

  function handleScheduleDragMove(event) {
    if (!draggedRow || event.pointerId !== dragPointerId) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.schedule-song-row');
    if (!target || target === draggedRow || target.closest('.schedule-card') !== draggedRow.closest('.schedule-card')) return;
    const bounds = target.getBoundingClientRect();
    target.parentNode.insertBefore(draggedRow, event.clientY < bounds.top + bounds.height / 2 ? target : target.nextSibling);
  }

  function finishScheduleDrag(event) {
    if (!draggedRow || (event && event.pointerId !== dragPointerId)) return;
    const row = draggedRow;
    row.classList.remove('is-dragging');
    const card = row.closest('.schedule-card');
    const schedule = schedules.find((item) => item.id === card?.dataset.scheduleId);
    if (schedule) {
      const byId = new Map(schedule.songs.map((entry) => [entry.entryId, entry]));
      const ordered = [...card.querySelectorAll('.schedule-song-row')].map((item) => byId.get(item.dataset.entryId)).filter(Boolean);
      if (ordered.length === schedule.songs.length) schedule.songs = ordered;
      saveSchedules();
    }
    draggedRow = null;
    dragPointerId = null;
    renderSchedules();
    if (scheduleViewDialog.open) renderScheduleView(viewedScheduleId);
  }

  function handleSearchInput() {
    renderList();
  }
  function handleScheduleInput(event) {
    const input = event.target.closest('input[data-field]');
    const card = event.target.closest('.schedule-card');
    if (!input || !card) return;
    const schedule = schedules.find((item) => item.id === card.dataset.scheduleId);
    if (!schedule) return;
    schedule[input.dataset.field] = input.value;
    if (input.dataset.field === 'date') {
      const display = input.closest('.schedule-date-control')?.querySelector('.schedule-date-display');
      if (display) display.textContent = formatWorshipDate(input.value) || 'Pilih tanggal';
    }
    saveSchedules();
    renderScheduleTargets();
  }

  function compareSongs(a, b) {
    const categoryOrder = CATEGORIES.findIndex((entry) => entry.code === a.category) - CATEGORIES.findIndex((entry) => entry.code === b.category);
    if (categoryOrder) return categoryOrder;
    const numberOrder = String(a.number || '').localeCompare(String(b.number || ''), 'id', { numeric: true, sensitivity: 'base' });
    return numberOrder || String(a.title || '').localeCompare(String(b.title || ''), 'id', { sensitivity: 'base' });
  }

  function buildFilters() {
    filters.replaceChildren();
    CATEGORIES.forEach(({ code, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-chip';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(activeCategory === code));
      button.addEventListener('click', () => {
        activeCategory = code;
        buildFilters();
        renderList();
      });
      filters.append(button);
    });
  }

  function renderList() {
    const query = normalize(search.value.trim());
    const visible = songs.filter((song) => {
      if (activeCategory !== 'ALL' && song.category !== activeCategory) return false;
      if (!query) return true;
      return normalize([song.category, song.number, song.title, song.key, song.genre, song.songCreator, song.dateCreate, song.tempo, stripHtml(song.contentHtml)].join(' ')).includes(query);
    });
    renderMySongs();
    songList.replaceChildren();
    if (!songs.length) {
      setStatus('Belum ada lagu di database. Tambahkan lagu melalui Song Manager.');
      return;
    }
    if (!visible.length) {
      setStatus('Tidak ada lagu yang cocok. Coba kata kunci atau kategori lain.');
      return;
    }
    setStatus('');
    const fragment = document.createDocumentFragment();
    visible.forEach((song) => {
      const card = document.createElement('article');
      card.className = 'song-card';
      const number = escapeText(displaySongNumber(song.number));
      const categoryLabel = CATEGORIES.find((entry) => entry.code === song.category);
      const showUploader = song.uploader && String(song.uploader).trim().toLowerCase() !== 'admin';
      const extra = [song.genre, song.songCreator, song.dateCreate, formatTempo(song.tempo), showUploader ? `Uploader: ${song.uploader}` : ''].filter(Boolean).map(escapeText).join('<span aria-hidden="true">&#183;</span>');
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'song-card-main';
      openButton.setAttribute('aria-label', `Buka ${song.category} ${displaySongNumber(song.number)}, ${song.title}`);
      openButton.innerHTML = `<span class="song-index">${number || '&#9835;'}</span><span class="song-details"><span class="song-title">${escapeText(song.title)}</span><span class="song-subtitle"><span class="song-category">${escapeText(song.category)} &#183; ${escapeText(categoryLabel ? categoryLabel.label : '')}</span>${song.key ? `<span class="song-key">${escapeText(song.key)}</span>` : ''}${extra}</span></span><span class="song-open" aria-hidden="true">&#8250;</span>`;
      openButton.addEventListener('click', () => openSong(song));
      card.append(openButton);
      const quickActions = document.createElement('span');
      quickActions.className = 'song-card-quick-actions';
      if (schedules.length) {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-to-schedule';
        addButton.dataset.addSong = song.id;
        addButton.setAttribute('aria-label', `Tambahkan ${song.title} ke jadwal terpilih`);
        addButton.title = 'Add to Jadwal';
        addButton.textContent = 'Add to Jadwal';
        quickActions.append(addButton);
      }
      const saveLocalButton = document.createElement('button');
      saveLocalButton.type = 'button';
      saveLocalButton.className = 'add-to-my-songs';
      saveLocalButton.dataset.saveSongToMySongs = song.id;
      saveLocalButton.textContent = 'Add to Laguku';
      saveLocalButton.setAttribute('aria-label', `Add ${song.category} ${displaySongNumber(song.number)} ${song.title} to Laguku`);
      saveLocalButton.title = 'Simpan salinan lagu ini ke Laguku di perangkat';
      quickActions.append(saveLocalButton);
      card.append(quickActions);
      fragment.append(card);
    });
    songList.append(fragment);
  }

  function renderMySongs() {
    const query = normalize(mySongsSearch.value.trim());
    const selectedCategory = mySongsCategoryFilter.value || 'ALL';
    const visible = mySongs.filter((song) => (selectedCategory === 'ALL' || song.category === selectedCategory)
      && (!query || normalize([song.number, song.title, stripHtml(song.contentHtml)].join(' ')).includes(query)));
    if (selectedCategory === 'ALL') {
      visible.sort((a, b) => (Number(b.localUpdatedAt || b.storedAt) || 0) - (Number(a.localUpdatedAt || a.storedAt) || 0) || compareSongs(a, b));
    }
    mySongsCount.textContent = String(mySongs.length);
    mySongsList.classList.toggle('is-upload-request-mode', isMySongUploadMode);
    mySongsList.replaceChildren();
    if (!mySongs.length) {
      mySongsStatus.textContent = 'Belum ada lagu lokal. Tekan “Lagu baru” untuk menambahkan.';
      return;
    }
    if (!visible.length) {
      mySongsStatus.textContent = 'Tidak ada lagu yang cocok dengan pencarian.';
      return;
    }
    mySongsStatus.textContent = '';
    const fragment = document.createDocumentFragment();
    visible.forEach((song, index) => {
      const card = document.createElement('article');
      card.className = 'song-card';
      const categoryLabel = CATEGORIES.find((entry) => entry.code === song.category);
      const extra = [song.genre, song.songCreator, song.dateCreate, formatTempo(song.tempo)].filter(Boolean).map(escapeText).join('<span aria-hidden="true">&#183;</span>');
      if (isMySongUploadMode) {
        const choice = document.createElement('label');
        choice.className = 'my-song-upload-choice';
        choice.innerHTML = `<input type="checkbox" data-upload-song-id="${escapeText(song.id)}" ${selectedMySongUploadIds.has(song.id) ? 'checked' : ''}><span class="song-index">${escapeText(displaySongNumber(song.number)) || '&#9835;'}</span><span class="song-details"><span class="song-title">${escapeText(displaySongTitle(song))}</span><span class="song-subtitle"><span class="song-category">${escapeText(song.category)} &#183; ${escapeText(categoryLabel ? categoryLabel.label : '')}</span>${song.key ? `<span class="song-key">${escapeText(song.key)}</span>` : ''}${extra}</span></span>`;
        card.append(choice);
        fragment.append(card);
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'song-card-main';
      button.setAttribute('aria-label', `Buka ${song.category} ${displaySongNumber(song.number)}, ${song.title}`);
      button.innerHTML = `<span class="song-index">${escapeText(displaySongNumber(song.number)) || '&#9835;'}</span><span class="song-details"><span class="song-title">${escapeText(displaySongTitle(song))}</span><span class="song-subtitle"><span class="song-category">${escapeText(song.category)} &#183; ${escapeText(categoryLabel ? categoryLabel.label : '')}</span>${song.key ? `<span class="song-key">${escapeText(song.key)}</span>` : ''}${extra}</span></span><span class="song-open" aria-hidden="true">&#8250;</span>`;
      button.addEventListener('click', () => openSong(song, visible, index));
      card.append(button);
      const actions = document.createElement('span');
      actions.className = 'my-song-list-actions';
      actions.innerHTML = `<button type="button" data-my-song-action="edit" data-song-id="${escapeText(song.id)}" aria-label="Edit ${escapeText(song.title)}" title="Edit">&#9998;</button><button type="button" data-my-song-action="delete" data-song-id="${escapeText(song.id)}" aria-label="Hapus ${escapeText(song.title)}" title="Hapus"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg></button><button type="button" data-my-song-action="add" data-song-id="${escapeText(song.id)}" aria-label="Tambahkan ${escapeText(song.title)} ke jadwal aktif" title="Tambahkan ke jadwal aktif" ${activeScheduleId ? '' : 'disabled'}>+</button>`;
      card.append(actions);
      fragment.append(card);
    });
    mySongsList.append(fragment);
  }

  mySongsSearch.addEventListener('input', renderMySongs);
  mySongsCategoryFilter.addEventListener('change', renderMySongs);
  mySongsList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-upload-song-id]');
    if (!checkbox) return;
    if (checkbox.checked) selectedMySongUploadIds.add(checkbox.dataset.uploadSongId);
    else selectedMySongUploadIds.delete(checkbox.dataset.uploadSongId);
    mySongsStatus.textContent = `${selectedMySongUploadIds.size} lagu dipilih.`;
  });

  function setMySongUploadMode(enabled) {
    isMySongUploadMode = enabled;
    selectedMySongUploadIds.clear();
    uploadMySongsButton.textContent = enabled ? 'Request' : 'Upload ke koleksi lagu';
    cancelMySongUploadButton.hidden = !enabled;
    renderMySongs();
    if (enabled) mySongsStatus.textContent = 'Pilih lagu yang ingin diunggah ke Koleksi Lagu.';
  }

  async function buildDatabaseSongPayload(song) {
    const instruments = {};
    for (const [instrument, files] of Object.entries(song.images || {})) {
      const uploadFiles = [];
      for (const file of (Array.isArray(files) ? files : [])) {
        const dataUrl = typeof file === 'string' ? file : String(file?.url || file?.dataUrl || file?.data || '');
        const match = dataUrl.match(/^data:([^;,]+)?;base64,([\s\S]+)$/i);
        if (!match) throw new Error(`Gambar “${file?.name || instrument}” tidak memiliki data lokal yang bisa diunggah.`);
        uploadFiles.push({
          originalName: String(file?.name || `${song.title || 'Lagu'}_${instrument}.jpg`).split(/[\\/]/).pop(),
          mimeType: file?.mimeType || match[1] || 'image/jpeg',
          base64: match[2]
        });
      }
      if (uploadFiles.length) instruments[instrument] = uploadFiles;
    }
    return {
      category: song.category,
      number: song.number,
      title: song.title,
      key: song.key || '',
      genre: song.genre || '',
      songCreator: song.songCreator || '',
      dateCreate: song.dateCreate || '',
      tempo: song.tempo || '',
      contentHtml: song.contentHtml || '',
      instrumentNames: Object.keys(song.images || {}),
      instrumentRenames: [],
      instruments
    };
  }

  async function uploadSelectedMySongs(accessCode) {
    const selected = mySongs.filter((song) => selectedMySongUploadIds.has(song.id));
    if (!selected.length) {
      mySongsStatus.textContent = 'Pilih minimal satu lagu untuk diunggah.';
      return;
    }
    const uploaderName = readProfileUserName();
    if (!uploaderName) {
      mySongsStatus.textContent = 'Simpan nama pengguna di Profile sebelum mengirim lagu.';
      instrumentProfileButton.click();
      return;
    }
    uploadMySongsButton.disabled = true;
    cancelMySongUploadButton.disabled = true;
    try {
      const songs = await Promise.all(selected.map(buildDatabaseSongPayload));
      mySongsStatus.textContent = `Mengirim ${songs.length} lagu sementara…`;
      const result = await postScheduleApi('submitTemporarySongs', { code: accessCode, uploaderName, songs }, 120000);
      selected.forEach((song) => selectedMySongUploadIds.delete(song.id));
      setMySongUploadMode(false);
      mySongsStatus.textContent = `${result.count || songs.length} lagu berhasil dikirim oleh ${uploaderName} ke New Song Temporary.`;
      const successList = document.getElementById('my-song-upload-success-list');
      successList.replaceChildren();
      selected.forEach((song) => {
        const item = document.createElement('li');
        item.textContent = `${[song.category, displaySongNumber(song.number), song.title].filter(Boolean).join(' ')} berhasil dikirim.`;
        successList.append(item);
      });
      document.getElementById('my-song-upload-success-dialog').showModal();
    } catch (error) {
      renderMySongs();
      mySongsStatus.textContent = `Request gagal: ${error.message || 'Terjadi kesalahan.'}`;
    } finally {
      uploadMySongsButton.disabled = false;
      cancelMySongUploadButton.disabled = false;
    }
  }

  uploadMySongsButton.addEventListener('click', () => {
    if (!isMySongUploadMode) setMySongUploadMode(true);
    else if (!selectedMySongUploadIds.size) mySongsStatus.textContent = 'Pilih minimal satu lagu untuk diunggah.';
    else {
      document.getElementById('my-song-upload-access-status').textContent = '';
      mySongUploadAccessCode.value = '';
      mySongUploadAccessDialog.showModal();
      mySongUploadAccessCode.focus();
    }
  });
  cancelMySongUploadButton.addEventListener('click', () => setMySongUploadMode(false));
  document.getElementById('close-my-song-upload-access').addEventListener('click', () => mySongUploadAccessDialog.close());
  document.getElementById('close-my-song-upload-success').addEventListener('click', () => document.getElementById('my-song-upload-success-dialog').close());
  document.getElementById('dismiss-my-song-upload-success').addEventListener('click', () => document.getElementById('my-song-upload-success-dialog').close());
  mySongUploadAccessCode.addEventListener('input', (event) => {
    event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  });
  mySongUploadAccessForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{3}$/.test(mySongUploadAccessCode.value)) {
      document.getElementById('my-song-upload-access-status').textContent = 'Kode harus terdiri dari 3 karakter dan memuat huruf serta angka.';
      mySongUploadAccessCode.focus();
      return;
    }
    const code = mySongUploadAccessCode.value;
    mySongUploadAccessDialog.close();
    uploadSelectedMySongs(code);
  });

  function openMySongDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(MY_SONG_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(MY_SONG_STORE, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Penyimpanan lokal tidak dapat dibuka.'));
    });
  }

  async function addSongToMySongs(sourceSong, sourceId = sourceSong.id) {
    const sourceKey = String(sourceId || sourceSong.id || '');
    const existing = mySongs.find((song) => String(song.id) === sourceKey || String(song.sourceSongId || '') === sourceKey);
    if (existing) {
      const message = `${existing.title} sudah ada di Laguku.`;
      mySongsStatus.textContent = message;
      setStatus(message);
      return;
    }
    const now = Date.now();
    const localSong = {
      id: `local_${now}_${Math.random().toString(36).slice(2, 8)}`,
      sourceSongId: sourceKey,
      category: sourceSong.category || '',
      number: sourceSong.number || '',
      title: sourceSong.title || '',
      key: sourceSong.key || '',
      genre: sourceSong.genre || '',
      songCreator: sourceSong.songCreator || '',
      dateCreate: sourceSong.dateCreate || '',
      tempo: sourceSong.tempo || '',
      contentHtml: normalizeSongContentHtml(sourceSong.contentHtml),
      images: sourceSong.images && typeof sourceSong.images === 'object' ? JSON.parse(JSON.stringify(sourceSong.images)) : {},
      storedAt: now,
      localUpdatedAt: now
    };
    try {
      const db = await openMySongDatabase();
      await new Promise((resolve, reject) => {
        const request = db.transaction(MY_SONG_STORE, 'readwrite').objectStore(MY_SONG_STORE).put(localSong);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error || new Error('Penyimpanan gagal.'));
      });
      db.close();
      mySongs.unshift(localSong);
      renderMySongs();
      const message = `${[localSong.category, displaySongNumber(localSong.number), localSong.title].filter(Boolean).join(' ')} berhasil ditambahkan ke Laguku.`;
      mySongsStatus.textContent = message;
      setStatus(message);
    } catch (error) {
      const message = `Gagal menyimpan lagu ke Laguku: ${error.message || 'Penyimpanan lokal tidak tersedia.'}`;
      mySongsStatus.textContent = message;
      setStatus(message);
    }
  }

  async function loadMySongs() {
    try {
      const db = await openMySongDatabase();
      const records = await new Promise((resolve, reject) => {
        const request = db.transaction(MY_SONG_STORE, 'readonly').objectStore(MY_SONG_STORE).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      db.close();
      mySongs = records.sort(compareSongs);
      renderMySongs();
    } catch (error) {
      mySongsStatus.textContent = 'Penyimpanan lagu lokal tidak tersedia di browser ini.';
      console.warn('Daftar Laguku tidak dapat dimuat:', error);
    }
  }

  function addMySongInstrument(instrumentName = 'Partitur') {
    const row = document.createElement('div');
    row.className = 'my-song-instrument-row';
    row.innerHTML = '<label class="schedule-field">INSTRUMEN<span class="my-song-instrument-select-row"><select class="my-song-instrument-name"><option value="Partitur">Partitur</option><option value="Others">Others</option></select><button class="schedule-refresh-songs my-song-refresh-instruments" type="button" aria-label="Perbarui daftar instrumen" title="Perbarui daftar instrumen"><span aria-hidden="true">&#8635;</span></button></span><input class="my-song-other-instrument" placeholder="Ketik nama instrumen" aria-label="Nama instrumen lainnya" hidden></label><label class="schedule-field">GAMBAR PARTITUR<span class="my-song-existing-score-files"></span><span class="my-song-score-inputs"></span></label><button class="my-song-remove-instrument" type="button" aria-label="Hapus instrumen"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg></button>';
    const select = row.querySelector('.my-song-instrument-name');
    const otherInput = row.querySelector('.my-song-other-instrument');
    populateMySongInstrumentSelect(select, otherInput, instrumentName);
    select.addEventListener('change', (event) => {
      otherInput.hidden = event.target.value !== 'Others';
      otherInput.required = event.target.value === 'Others';
      if (event.target.value === 'Others') otherInput.focus();
    });
    row.querySelector('.my-song-refresh-instruments').addEventListener('click', (event) => loadMySongInstrumentOptions(event.currentTarget));
    row.querySelector('.my-song-remove-instrument').addEventListener('click', () => row.remove());
    mySongInstrumentList.append(row);
    appendMySongScoreInput(row);
  }

  function appendMySongScoreInput(row) {
    const item = document.createElement('span');
    item.className = 'my-song-score-input-item';
    const input = document.createElement('input');
    input.className = 'my-song-score-files';
    input.type = 'file';
    input.accept = 'image/*';
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'my-song-new-score-preview';
    previewButton.hidden = true;
    previewButton.setAttribute('aria-label', 'Pratinjau gambar yang dipilih');
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      const image = document.createElement('img');
      image.src = objectUrl;
      image.alt = file.name;
      previewButton.replaceChildren(image);
      previewButton.dataset.previewUrl = objectUrl;
      previewButton.dataset.previewName = file.name;
      previewButton.hidden = false;
      row.classList.add('has-new-score-selection');
      const inputs = [...row.querySelectorAll('.my-song-score-files')];
      if (inputs[inputs.length - 1] === input) appendMySongScoreInput(row);
    });
    item.append(input, previewButton);
    row.querySelector('.my-song-score-inputs').append(item);
  }

  function renderMySongExistingImages(row, files) {
    const list = row?.querySelector('.my-song-existing-score-files');
    if (!list) return;
    list.replaceChildren();
    (Array.isArray(files) ? files : []).forEach((file, index) => {
      const item = document.createElement('span');
      item.className = 'my-song-existing-score-file';
      const previewButton = document.createElement('button');
      previewButton.type = 'button';
      previewButton.className = 'my-song-existing-score-preview';
      previewButton.dataset.imageIndex = String(index);
      const image = document.createElement('img');
      image.src = (file && typeof file === 'object' && (file.url || file.dataUrl || file.data)) || '';
      image.alt = `Gambar partitur tersimpan ${index + 1}`;
      const name = document.createElement('span');
      name.textContent = file && typeof file === 'object' && file.name ? file.name : `Gambar tersimpan ${index + 1}`;
      previewButton.append(image);
      item.append(previewButton, name);
      list.append(item);
    });
  }

  mySongInstrumentList.addEventListener('click', (event) => {
    const button = event.target.closest('.my-song-existing-score-preview, .my-song-new-score-preview');
    if (!button) return;
    const row = button.closest('.my-song-instrument-row');
    const name = row?.querySelector('.my-song-instrument-name');
    const instrument = name?.value === 'Others' ? row.querySelector('.my-song-other-instrument').value.trim() : name?.value;
    const selectedUrl = button.dataset.previewUrl;
    const file = selectedUrl ? null : editingMySong?.images?.[instrument]?.[Number(button.dataset.imageIndex)];
    const url = selectedUrl || (file && typeof file === 'object' ? (file.url || file.dataUrl || file.data) : '');
    if (!url) return;
    const dialog = document.getElementById('my-song-image-preview');
    document.getElementById('my-song-image-preview-img').src = url;
    document.getElementById('my-song-image-preview-name').textContent = button.dataset.previewName || file?.name || 'Gambar partitur';
    dialog.showModal();
  });

  function populateMySongInstrumentSelect(select, otherInput, selectedName) {
    const names = [...new Set(mySongInstrumentNames.map((name) => String(name || '').trim()).filter((name) => name && !/^(partitur|others)$/i.test(name)))];
    select.replaceChildren(new Option('Partitur', 'Partitur'));
    names.forEach((name) => select.add(new Option(name, name)));
    select.add(new Option('Others', 'Others'));
    const selected = String(selectedName || '').trim();
    const match = names.find((name) => normalize(name) === normalize(selected));
    if (!selected || normalize(selected) === 'partitur') {
      select.value = 'Partitur'; otherInput.value = ''; otherInput.hidden = true; otherInput.required = false;
    } else if (match) {
      select.value = match; otherInput.value = ''; otherInput.hidden = true; otherInput.required = false;
    } else {
      select.value = 'Others'; otherInput.value = selected; otherInput.hidden = false; otherInput.required = true;
    }
  }

  function loadMySongInstrumentOptions(triggerButton = null) {
    const callbackName = `cb_${Date.now()}_${++callbackCounter}`;
    const script = document.createElement('script');
    let settled = false;
    if (triggerButton) { triggerButton.disabled = true; triggerButton.classList.add('is-loading'); }
    const timeout = window.setTimeout(() => finish(new Error('Waktu memuat daftar instrumen habis.')), 10000);
    function finish(error, result) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      delete window.SongBookCallbacks[callbackName];
      script.remove();
      if (triggerButton) { triggerButton.disabled = false; triggerButton.classList.remove('is-loading'); }
      if (error || !result || !result.ok || !Array.isArray(result.instruments)) {
        console.warn('Daftar instrumen untuk lagu baru tidak dapat dimuat:', (error && error.message) || (result && result.error) || 'Respons tidak valid.');
        if (triggerButton) triggerButton.title = 'Gagal memperbarui daftar instrumen';
        return;
      }
      mySongInstrumentNames = result.instruments;
      mySongInstrumentList.querySelectorAll('.my-song-instrument-row').forEach((row) => {
        const select = row.querySelector('.my-song-instrument-name');
        const input = row.querySelector('.my-song-other-instrument');
        const selected = select.value === 'Others' ? input.value : select.value;
        populateMySongInstrumentSelect(select, input, selected);
      });
      if (triggerButton) {
        triggerButton.title = 'Daftar instrumen berhasil diperbarui';
        window.setTimeout(() => { if (triggerButton.isConnected) triggerButton.title = 'Perbarui daftar instrumen'; }, 2500);
      }
    }
    window.SongBookCallbacks = window.SongBookCallbacks || {};
    window.SongBookCallbacks[callbackName] = (result) => finish(null, result);
    script.onerror = () => finish(new Error('Tidak dapat mengakses API daftar instrumen.'));
    const url = new URL(API_URL);
    url.searchParams.set('action', 'instruments');
    url.searchParams.set('callback', `SongBookCallbacks.${callbackName}`);
    url.searchParams.set('_refresh', String(Date.now()));
    script.src = url.toString();
    document.head.append(script);
  }

  function readLocalImage(file, path) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: path, url: String(reader.result), mimeType: file.type || 'application/octet-stream' });
      reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  function safeLocalFilePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'Lagu';
  }

  function getSongSectionLabel(line) {
    const trimmed = line.trim();
    const bracketed = trimmed.match(/^\[([^\]\n]{1,60})\]\s*:?[ \t]*$/) || trimmed.match(/^\{([^}\n]{1,60})\}\s*:?[ \t]*$/);
    if (bracketed) return bracketed[1].trim();
    const unwrapped = trimmed.replace(/:$/, '').trim();
    return songSectionPattern.test(unwrapped) ? unwrapped.replace(/^\d+[.)]?\s*/, '') : '';
  }

  function updateMySongHighlight() {
    const value = mySongContentInput.value || '[Intro]\nG   D   Em\n\n[Bait 1]\nLirik lagu\n\n[Reff]\nC   D   G';
    mySongHighlight.classList.toggle('is-placeholder', !mySongContentInput.value);
    mySongHighlight.innerHTML = value.split('\n').map((line) => getSongSectionLabel(line)
      ? `<span class="my-song-section-marker">${escapeText(line)}</span>`
      : escapeText(line)).join('\n') + '\n';
    mySongContentInput.style.height = 'auto';
    const maxHeight = Math.max(180, Math.floor(window.innerHeight * 0.62));
    mySongContentInput.style.height = `${Math.min(Math.max(mySongContentInput.scrollHeight, 340), maxHeight)}px`;
    mySongHighlight.style.height = mySongContentInput.style.height;
    mySongContentInput.parentElement.style.height = mySongContentInput.style.height;
    mySongHighlight.style.transform = `translate(${-mySongContentInput.scrollLeft}px, ${-mySongContentInput.scrollTop}px)`;
  }

  mySongContentInput.addEventListener('input', updateMySongHighlight);
  mySongContentInput.addEventListener('scroll', updateMySongHighlight, { passive: true });

  function localFileExtension(file) {
    const ext = String(file.name || '').match(/\.([a-z0-9]{1,8})$/i)?.[1];
    if (ext) return `.${ext.toLowerCase()}`;
    return ({ 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' })[file.type] || '.jpg';
  }

  async function saveMySong(event) {
    event.preventDefault();
    if (!mySongForm.reportValidity()) return;
    const statusEl = document.getElementById('my-song-form-status');
    const submit = document.getElementById('save-my-song');
    const wasEditing = Boolean(editingMySongId);
    submit.disabled = true;
    statusEl.textContent = 'Menyimpan di perangkat ini…';
    try {
      const category = document.getElementById('my-song-category').value;
      const number = document.getElementById('my-song-number').value.trim();
      const title = document.getElementById('my-song-title').value.trim();
      const stem = safeLocalFilePart(`${category} ${number} ${title}`);
      const images = {};
      const seenInstruments = new Set();
      for (const row of mySongInstrumentList.querySelectorAll('.my-song-instrument-row')) {
        const select = row.querySelector('.my-song-instrument-name');
        const instrument = select.value === 'Others' ? row.querySelector('.my-song-other-instrument').value.trim() : select.value;
        const files = [...row.querySelectorAll('.my-song-score-files')].flatMap((input) => [...input.files]);
        const existingFiles = editingMySong?.images?.[instrument] || [];
        if (!instrument && files.length) throw new Error('Isi nama instrumen untuk gambar yang dipilih.');
        if (!instrument) continue;
        if (seenInstruments.has(instrument.toLowerCase())) throw new Error(`Nama instrumen “${instrument}” muncul lebih dari satu kali.`);
        seenInstruments.add(instrument.toLowerCase());
        if (!files.length) {
          if (existingFiles.length) images[instrument] = existingFiles;
          continue;
        }
        if (files.some((file) => !file.type.startsWith('image/'))) throw new Error('Pilih file gambar yang valid.');
        if (files.some((file) => file.size > 8 * 1024 * 1024)) throw new Error('Ukuran setiap gambar maksimal 8 MB.');
        const slug = safeLocalFilePart(instrument.toLowerCase());
        const addedImages = await Promise.all(files.map((file, fileIndex) => readLocalImage(file, `SongImg/${stem} _${slug}${existingFiles.length + files.length > 1 ? `_${existingFiles.length + fileIndex + 1}` : ''}${localFileExtension(file)}`)));
        images[instrument] = addedImages;
      }
      const localSong = {
        id: editingMySongId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sourceSongId: editingMySong?.sourceSongId || '',
        category, number, title,
        key: document.getElementById('my-song-key').value.trim(),
        genre: document.getElementById('my-song-genre').value.trim(),
        songCreator: document.getElementById('my-song-creator').value.trim(),
        dateCreate: document.getElementById('my-song-date').value.trim(),
        tempo: document.getElementById('my-song-tempo').value.trim(),
        contentHtml: editableTextToHtml(document.getElementById('my-song-content').value),
        images,
        storedAt: editingMySong?.storedAt || Date.now(),
        localUpdatedAt: Date.now()
      };
      const db = await openMySongDatabase();
      await new Promise((resolve, reject) => {
        const request = db.transaction(MY_SONG_STORE, 'readwrite').objectStore(MY_SONG_STORE).put(localSong);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
      db.close();
      trackSuccessfulAction(wasEditing ? 'song_edit_success' : 'song_create_success', {
        songTitle: localSong.title, songCategory: localSong.category, songNumber: localSong.number
      });
      const oldIndex = mySongs.findIndex((item) => item.id === localSong.id);
      if (oldIndex >= 0) mySongs.splice(oldIndex, 1, localSong);
      else mySongs.push(localSong);
      mySongs.sort(compareSongs);
      renderMySongs();
      mySongForm.reset();
      mySongInstrumentList.replaceChildren();
      addMySongInstrument();
      statusEl.textContent = editingMySongId ? 'Perubahan lagu tersimpan lokal di perangkat ini.' : 'Lagu dan gambar tersimpan lokal di perangkat ini.';
      editingMySongId = '';
      editingMySong = null;
      document.getElementById('my-song-form-title').textContent = 'Detail lagu baru';
      document.getElementById('save-my-song').textContent = 'Simpan lagu';
      mySongDialog.close();
    } catch (error) {
      statusEl.textContent = error.message || 'Lagu gagal disimpan.';
    } finally {
      submit.disabled = false;
    }
  }

  function openMySongEditor(song) {
    editingMySongId = song.id;
    editingMySong = song;
    mySongForm.reset();
    document.getElementById('my-song-form-title').textContent = 'Edit lagu';
    document.getElementById('save-my-song').textContent = 'Simpan perubahan';
    document.getElementById('my-song-category').value = song.category || '';
    document.getElementById('my-song-number').value = song.number || '';
    document.getElementById('my-song-title').value = song.title || '';
    document.getElementById('my-song-key').value = song.key || '';
    document.getElementById('my-song-genre').value = song.genre || '';
    document.getElementById('my-song-creator').value = song.songCreator || '';
    document.getElementById('my-song-date').value = song.dateCreate || '';
    document.getElementById('my-song-tempo').value = song.tempo || '';
    mySongContentInput.value = htmlToEditableText(song.contentHtml || '');
    mySongInstrumentList.replaceChildren();
    const names = Object.keys(song.images || {});
    if (names.length) names.forEach((name) => {
      addMySongInstrument(name);
      renderMySongExistingImages(mySongInstrumentList.lastElementChild, song.images[name]);
    });
    else addMySongInstrument();
    updateMySongHighlight();
    document.getElementById('my-song-form-status').textContent = 'Perubahan hanya disimpan di perangkat ini.';
    mySongDialog.showModal();
  }

  function confirmMySongDeletion(song) {
    pendingMySongDeleteId = song.id;
    document.getElementById('delete-my-song-message').textContent = `Hapus lagu "${song.category} ${song.number} · ${song.title}" dari Laguku?`;
    deleteMySongDialog.showModal();
  }

  async function finishMySongDeletion(confirmed) {
    const songId = pendingMySongDeleteId;
    pendingMySongDeleteId = '';
    if (deleteMySongDialog.open) deleteMySongDialog.close();
    if (!confirmed || !songId) return;
    try {
      const db = await openMySongDatabase();
      await new Promise((resolve, reject) => {
        const request = db.transaction(MY_SONG_STORE, 'readwrite').objectStore(MY_SONG_STORE).delete(songId);
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
      db.close();
      mySongs = mySongs.filter((song) => song.id !== songId);
      renderMySongs();
      mySongsStatus.textContent = 'Lagu berhasil dihapus dari perangkat ini.';
    } catch (error) {
      mySongsStatus.textContent = 'Lagu tidak dapat dihapus dari penyimpanan lokal.';
    }
  }

  document.getElementById('add-my-song').addEventListener('click', () => {
    if (!readProfileUserName()) {
      openRequiredProfile('menambahkan lagu baru');
      return;
    }
    editingMySongId = '';
    editingMySong = null;
    mySongForm.reset();
    mySongInstrumentList.replaceChildren();
    addMySongInstrument();
    updateMySongHighlight();
    document.getElementById('my-song-form-title').textContent = 'Detail lagu baru';
    document.getElementById('save-my-song').textContent = 'Simpan lagu';
    document.getElementById('my-song-form-status').textContent = 'Hanya kategori, judul, dan lirik yang wajib diisi.';
    mySongDialog.showModal();
  });
  document.getElementById('close-my-song-form').addEventListener('click', () => mySongDialog.close());
  document.getElementById('close-my-song-image-preview').addEventListener('click', () => document.getElementById('my-song-image-preview').close());
  document.getElementById('my-song-image-preview').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  document.getElementById('add-my-song-instrument').addEventListener('click', () => addMySongInstrument());
  mySongForm.addEventListener('submit', saveMySong);
  document.getElementById('confirm-delete-my-song').addEventListener('click', () => finishMySongDeletion(true));
  document.getElementById('cancel-delete-my-song').addEventListener('click', () => finishMySongDeletion(false));
  document.getElementById('close-delete-my-song').addEventListener('click', () => finishMySongDeletion(false));
  deleteMySongDialog.addEventListener('close', () => { pendingMySongDeleteId = ''; });
  mySongsList.addEventListener('click', handleMySongListClick);
  const libraryTabs = document.querySelector('.library-tabs');
  function activateLibraryTab(tab) {
    libraryTabs.querySelectorAll('[role="tab"]').forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      item.classList.toggle('is-selected', selected);
      document.getElementById(item.dataset.tabPanel).hidden = !selected;
      if (item === instrumentProfileButton && selected) prepareInstrumentProfileOptions();
    });
  }

  function openRequiredProfile(action = 'melanjutkan') {
    activateLibraryTab(instrumentProfileButton);
    instrumentFilterStatus.textContent = `Nama pengguna belum diisi. Isi dan simpan nama di sini sebelum ${action}.`;
    requiredProfileMessage.textContent = `Nama pengguna wajib diisi sebelum ${action}. Simpan nama untuk melanjutkan.`;
    requiredProfileNameInput.value = profileUserNameInput.value.trim();
    requiredProfileStatus.textContent = '';
    if (!requiredProfileDialog.open) requiredProfileDialog.showModal();
    window.setTimeout(() => requiredProfileNameInput.focus(), 0);
  }
  libraryTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activateLibraryTab(tab);
  });
  libraryTabs.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...libraryTabs.querySelectorAll('[role="tab"]')];
    const current = tabs.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    tabs[next].focus();
    activateLibraryTab(tabs[next]);
  });
  addMySongInstrument();
  loadMySongInstrumentOptions();
  loadMySongs();

  function stripHtml(value) {
    const parsed = new DOMParser().parseFromString(String(value || ''), 'text/html');
    return parsed.body.textContent || '';
  }

  function safeSongFragment(html) {
    const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
    const allowed = new Set(['DIV', 'SECTION', 'H3', 'PRE', 'BR', 'P', 'SPAN', 'STRONG', 'EM']);
    const allowedClasses = new Set(['song-content', 'song-section', 'song-section-title', 'song-section-body', 'chord', 'lyric', 'song-line']);

    function copyNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || '');
      if (node.nodeType !== Node.ELEMENT_NODE || !allowed.has(node.tagName)) return document.createTextNode(node.textContent || '');
      const clone = document.createElement(node.tagName.toLowerCase());
      const classNames = [...node.classList].filter((className) => allowedClasses.has(className));
      if (classNames.length) clone.className = classNames.join(' ');
      if (node.tagName === 'SECTION' && node.dataset.section) clone.dataset.section = node.dataset.section.slice(0, 80);
      [...node.childNodes].forEach((child) => clone.append(copyNode(child)));
      return clone;
    }

    const root = document.createDocumentFragment();
    [...parsed.body.childNodes].forEach((node) => root.append(copyNode(node)));
    return root;
  }

  function previewSongFragment(contentHtml) {
    return safeSongFragment(normalizeSongContentHtml(contentHtml));
  }

  function openSong(song, queue = songs, queueIndex, showPreview = true) {
    currentPreviewSongs = queue;
    currentSongIndex = Number.isInteger(queueIndex)
      ? queueIndex
      : queue.findIndex((item) => item === song || item.id === song.id);
    currentPreviewSong = song;
    const introButton = document.getElementById('schedule-intro-preview-button');
    const previewIntro = song.scheduleIntro || null;
    introButton.hidden = !previewIntro;
    introButton.textContent = previewIntro ? `Intro · ${previewIntro.name}` : 'Intro';
    if (previewIntro) introButton.setAttribute('aria-label', `Tampilkan intro ${previewIntro.name}`);
    preview.classList.toggle('is-pre-worship', Boolean(song.preWorship));
    previewZoom = 1;
    renderScoreInstruments(song.images);
    sourcePreviewKey = normalizeKey(song.key || 'C');
    selectedPreviewKey = sourcePreviewKey;
    populateTransposeKeys();
    transposeControls.hidden = chordModeSelect.value !== 'letters';
    document.getElementById('dialog-category').textContent = `${song.category} · ${(CATEGORIES.find((entry) => entry.code === song.category) || {}).label || ''}`;
    const displayNumber = displaySongNumber(song.number);
    document.getElementById('dialog-title').textContent = `${displayNumber ? `${displayNumber}. ` : ''}${song.title}`;
    renderPreviewMetadata();
    renderSongContent();
    const readerPosition = document.getElementById('reader-position');
    const hasWorshipGrouping = queue.some((item) => typeof item.preWorship === 'boolean');
    if (hasWorshipGrouping) {
      const isPreWorship = Boolean(song.preWorship);
      const matchingIndexes = queue.reduce((indexes, item, index) => {
        if (Boolean(item.preWorship) === isPreWorship) indexes.push(index);
        return indexes;
      }, []);
      const position = matchingIndexes.indexOf(currentSongIndex) + 1;
      readerPosition.textContent = `${isPreWorship ? 'Pra ' : ''}${position}/${matchingIndexes.length}`;
    } else {
      readerPosition.textContent = `${String(currentSongIndex + 1).padStart(2, '0')} / ${String(queue.length).padStart(2, '0')}`;
    }
    document.getElementById('previous-song').disabled = currentSongIndex <= 0;
    document.getElementById('next-song').disabled = currentSongIndex < 0 || currentSongIndex >= queue.length - 1;
    if (showPreview && !dialog.open) dialog.showModal();
    if (dialog.open) document.body.classList.add('song-reader-open');
    scheduleSongFit();
    preview.scrollTop = 0;
    preview.scrollLeft = 0;
    if (dialog.open) document.getElementById('close-dialog').focus();
  }

  function renderPreviewMetadata() {
    const song = currentPreviewSong;
    const parts = [];
    if (song.key || chordModeSelect.value === 'letters') parts.push(`(${selectedPreviewKey}=1)`);
    if (song.genre) parts.push(song.genre);
    if (song.tempo) parts.push(`Tempo: ${formatTempo(song.tempo)}`);
    document.getElementById('dialog-meta').textContent = parts.join(' | ');
    const credits = [];
    if (song.songCreator) credits.push(`Pencipta: ${song.songCreator}`);
    if (song.dateCreate) credits.push(`Tahun: ${song.dateCreate}`);
    const creditsElement = document.getElementById('dialog-credits');
    creditsElement.textContent = credits.join(' · ');
    creditsElement.hidden = credits.length === 0;
  }

  function renderSongContent() {
    preview.replaceChildren();
    const content = previewSongFragment(currentPreviewSong.contentHtml);
    transformChordLines(content, chordModeSelect.value, sourcePreviewKey, selectedPreviewKey);
    if (content.childNodes.length) preview.append(content);
    else {
      const empty = document.createElement('p');
      empty.className = 'preview-note';
      empty.textContent = 'Lirik dan chord belum tersedia untuk lagu ini.';
      preview.append(empty);
    }
    const songContent = preview.querySelector('.song-content');
    if (songContent) songContent.style.zoom = String(previewZoom);
    scheduleSongFit();
  }

  // Keep each preformatted chord/lyric block on screen as one aligned unit.
  function fitSongSections() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    preview.querySelectorAll('.song-section-body, .song-content pre').forEach((body) => {
      body.style.fontSize = '';
      const available = body.parentElement.clientWidth || preview.clientWidth;
      if (!available || !context) return;
      const style = getComputedStyle(body);
      const baseSize = parseFloat(style.fontSize) || 14;
      const lines = (body.innerText || body.textContent).split(/\r?\n/);
      context.font = `${style.fontWeight} ${baseSize}px ${style.fontFamily}`;
      const longestWidth = Math.max(0, ...lines.map((line) => context.measureText(line.replace(/\t/g, '    ')).width));
      if (longestWidth > available) body.style.fontSize = `${baseSize * available / longestWidth * 0.97}px`;
    });
  }

  let fitResizeFrame = 0;
  function scheduleSongFit() {
    cancelAnimationFrame(fitResizeFrame);
    // A closed dialog has no layout width. Wait for showModal and its styles to settle.
    fitResizeFrame = requestAnimationFrame(() => {
      fitResizeFrame = requestAnimationFrame(fitSongSections);
    });
  }

  const songFitObserver = new ResizeObserver(scheduleSongFit);
  songFitObserver.observe(preview);

  window.addEventListener('resize', () => {
    scheduleSongFit();
  }, { passive: true });

  function touchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  preview.addEventListener('touchstart', (event) => {
    if (event.touches.length !== 2) return;
    pinchStart = { distance: touchDistance(event.touches), zoom: previewZoom };
  }, { passive: true });

  preview.addEventListener('touchmove', (event) => {
    if (!pinchStart || event.touches.length !== 2) return;
    event.preventDefault();
    const nextZoom = Math.max(0.7, Math.min(2.5, pinchStart.zoom * touchDistance(event.touches) / pinchStart.distance));
    if (!Number.isFinite(nextZoom)) return;
    const rect = preview.getBoundingClientRect();
    const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2 - rect.left;
    const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2 - rect.top;
    const ratio = nextZoom / previewZoom;
    preview.scrollLeft = (preview.scrollLeft + centerX) * ratio - centerX;
    preview.scrollTop = (preview.scrollTop + centerY) * ratio - centerY;
    previewZoom = nextZoom;
    const songContent = preview.querySelector('.song-content');
    if (songContent) songContent.style.zoom = String(previewZoom);
  }, { passive: false });

  preview.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) pinchStart = null;
  }, { passive: true });
  preview.addEventListener('touchcancel', () => { pinchStart = null; }, { passive: true });

  function renderScoreInstruments(images) {
    scoreInstruments.replaceChildren();
    scorePages.replaceChildren();
    scorePages.hidden = true;
    scoreCarouselControls.hidden = true;
    const entries = images && typeof images === 'object'
      ? Object.entries(images).filter(([, files]) => Array.isArray(files) && files.length)
      : [];
    // Keep the lyric preview unobstructed until an instrument is selected.
    scoreSection.hidden = true;
    closeScorePreviewButton.hidden = true;
    scoreInstruments.hidden = entries.length === 0;
    entries.forEach(([instrument, files]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'score-instrument-button';
      button.dataset.instrument = instrument;
      button.textContent = `${instrument} (${files.length})`;
      button.setAttribute('aria-pressed', 'false');
      scoreInstruments.append(button);
    });
  }

  function openScoreInstrument(instrument) {
    const files = currentPreviewSong?.images?.[instrument];
    if (!Array.isArray(files)) return;
    scoreSection.hidden = false;
    closeScorePreviewButton.hidden = false;
    activeScoreInstrument = instrument;
    activeScoreFiles = files;
    scoreInstruments.querySelectorAll('.score-instrument-button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.instrument === instrument));
    });
    scorePages.replaceChildren();
    files.forEach((file, index) => {
      const urls = scoreImageCandidates(file);
      if (!urls.length) return;
      const figure = document.createElement('figure');
      figure.className = 'score-page';
      const image = document.createElement('img');
      image.alt = `Partitur ${instrument}, halaman ${index + 1}`;
      image.loading = 'lazy';
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `Buka tampilan penuh partitur ${instrument}, halaman ${index + 1}`);
      const showFullImage = () => {
        // Scheduled songs keep their queue context even when the schedule has no Intro.
        introGeneralNavigationActive = Boolean(currentPreviewSong?.scheduleIntro || currentPreviewSong?.entryId);
        introGeneralSongIndex = introGeneralNavigationActive ? currentSongIndex : -1;
        openFullScoreImage(instrument, index);
      };
      image.addEventListener('click', showFullImage);
      image.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showFullImage();
        }
      });
      const caption = document.createElement('figcaption');
      caption.textContent = file && typeof file === 'object' && file.name ? file.name : `${instrument} · ${index + 1}`;
      let attempt = 0;
      image.addEventListener('error', () => {
        attempt += 1;
        if (attempt < urls.length) {
          image.src = urls[attempt];
          return;
        }
        image.remove();
        caption.textContent = 'Tidak dapat menampilkan gambar di halaman ini. ';
        const link = document.createElement('a');
        const fileId = scoreImageId(file);
        link.href = fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view` : urls[0];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Buka partitur di Google Drive';
        caption.append(link);
      });
      figure.append(image, caption);
      scorePages.append(figure);
      image.src = urls[0];
    });
    scorePages.scrollLeft = 0;
    scorePages.hidden = false;
    scoreCarouselControls.hidden = scorePages.children.length < 2;
    updateScoreCarouselControls();
  }

  function openFullScoreImage(instrument, index, showControlsInitially = false) {
    const files = currentPreviewSong?.images?.[instrument];
    if (!Array.isArray(files) || !files[index]) return;
    if (!scoreImageDialog.open) scoreImageReturnTarget = 'lyrics';
    scoreImageMode = 'score';
    activeScheduleIntro = currentPreviewSong?.scheduleIntro || null;
    const closeLabel = document.querySelector('#close-score-image span');
    const returnLabel = scoreImageReturnTarget === 'schedule' ? 'Kembali ke jadwal' : 'Kembali ke lirik';
    if (closeLabel) closeLabel.textContent = returnLabel;
    document.getElementById('close-score-image').setAttribute('aria-label', `Tutup gambar dan ${returnLabel.toLowerCase()}`);
    activeScoreInstrument = instrument;
    activeScoreFiles = files;
    activeScoreIndex = index;
    const hasOtherInstruments = renderScoreImageInstrumentButtons();
    renderFullScoreImage();
    if (!scoreImageDialog.open) scoreImageDialog.showModal();
    if (showControlsInitially) showScoreImageControls();
    else {
      setScoreImageControlsHidden(false);
      scoreImageDialog.classList.toggle('instrument-controls-hidden', !hasOtherInstruments);
      scheduleScoreControlsHide();
    }
  }

  function openGeneralSongScoreAt(index, pageIndex = 0) {
    const song = currentPreviewSongs[index];
    const instrument = findDefaultScoreInstrument(song);
    if (!song) return;
    openSong(song, currentPreviewSongs, index, dialog.open);
    introGeneralSongIndex = index;
    // Follow the schedule order exactly. A song without a score returns the
    // reader to its lyric/chord preview instead of being skipped.
    if (!instrument) {
      scoreImageDialog.close();
      return;
    }
    activeScheduleIntro = song.scheduleIntro || activeScheduleIntro;
    scoreImageMode = 'score';
    activeScoreInstrument = instrument;
    activeScoreFiles = song.images[instrument];
    activeScoreIndex = Math.max(0, Math.min(pageIndex, activeScoreFiles.length - 1));
    renderScoreImageInstrumentButtons();
    renderFullScoreImage();
    showScoreImageControls();
  }

  function renderScoreImageInstrumentButtons() {
    const instruments = Object.entries(currentPreviewSong?.images || {})
      .filter(([, files]) => Array.isArray(files) && files.length);
    scoreImageInstruments.replaceChildren();
    if (instruments.length < 2) {
      scoreImageInstruments.hidden = true;
      scoreImageDialog.classList.add('instrument-controls-hidden');
      return false;
    }
    instruments.forEach(([name]) => {
      const button = document.createElement('button');
      button.className = 'score-image-instrument-button';
      button.type = 'button';
      button.dataset.instrument = name;
      button.textContent = name;
      button.setAttribute('aria-pressed', String(name === activeScoreInstrument));
      scoreImageInstruments.append(button);
    });
    scoreImageInstruments.hidden = false;
    return true;
  }

  function setScoreImageControlsHidden(hidden) {
    scoreImageDialog.classList.toggle('controls-hidden', Boolean(hidden));
    window.clearTimeout(scoreControlsHideTimer);
    scoreControlsHideTimer = 0;
  }

  function showScoreImageControls() {
    if (!scoreImageDialog.open) return;
    setScoreImageControlsHidden(false);
    scoreImageDialog.classList.remove('instrument-controls-hidden');
    scheduleScoreControlsHide();
  }

  function scheduleScoreControlsHide() {
    window.clearTimeout(scoreControlsHideTimer);
    scoreControlsHideTimer = window.setTimeout(() => {
      scoreImageDialog.classList.add('controls-hidden');
      scoreImageDialog.classList.add('instrument-controls-hidden');
      scoreControlsHideTimer = 0;
    }, 2800);
  }

  function renderFullScoreImage() {
    const file = activeScoreFiles[activeScoreIndex];
    const urls = scoreImageCandidates(file);
    if (!urls.length) return;
    fullScoreImage.dataset.candidates = JSON.stringify(urls);
    fullScoreImage.dataset.attempt = '0';
    fullScoreImage.src = urls[0];
    const showingIntro = scoreImageMode === 'intro';
    fullScoreImage.alt = showingIntro ? `Intro: ${activeScheduleIntro?.name || 'Intro'}` : `Partitur ${activeScoreInstrument}, halaman ${activeScoreIndex + 1}`;
    scoreImagePosition.textContent = `${activeScoreIndex + 1} / ${activeScoreFiles.length}`;
    const multiple = !showingIntro && activeScoreFiles.length > 1;
    scoreImagePrevious.hidden = !multiple || activeScoreIndex === 0;
    scoreImageNext.hidden = !multiple || activeScoreIndex === activeScoreFiles.length - 1;
    scoreImagePosition.hidden = !multiple;
    scoreImageInstruments.querySelectorAll('.score-image-instrument-button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.instrument === activeScoreInstrument));
    });
    const hasIntro = Boolean(activeScheduleIntro || currentPreviewSong?.scheduleIntro);
    const defaultInstrument = findDefaultScoreInstrument(currentPreviewSong);
    const activeSongLabel = formatScoreSongLabel(currentPreviewSong);
    scoreIntroBackButton.textContent = showingIntro
      ? (defaultInstrument ? activeSongLabel : 'Lirik & Chord')
      : 'Intro';
    scoreIntroBackButton.title = showingIntro
      ? (defaultInstrument ? activeSongLabel : 'Buka preview lirik dan chord')
      : 'Kembali ke Intro';
    scoreIntroBackButton.setAttribute('aria-label', showingIntro && defaultInstrument
      ? `Tampilkan partitur ${activeSongLabel}`
      : (showingIntro ? 'Buka preview lirik dan chord' : 'Kembali ke Intro'));
    scoreIntroBackButton.hidden = showingIntro
      ? !currentPreviewSong
      : !hasIntro;
    scoreImageInstruments.hidden = showingIntro || scoreImageInstruments.childElementCount < 2;
    const previousSongIndex = findPreviousGeneralSongIndex();
    const nextSongIndex = findNextGeneralSongIndex();
    scorePreviousGeneralSongButton.hidden = showingIntro || !introGeneralNavigationActive || previousSongIndex < 0;
    const previousSongLabel = formatScoreSongLabel(currentPreviewSongs[previousSongIndex]);
    scorePreviousGeneralSongButton.textContent = `< ${previousSongLabel || 'Sebelumnya'}`;
    scorePreviousGeneralSongButton.title = previousSongLabel ? `Sebelumnya: ${previousSongLabel}` : 'Partitur sebelumnya';
    scorePreviousGeneralSongButton.setAttribute('aria-label', scorePreviousGeneralSongButton.title);
    updateGeneralSongPosition();
    if (showingIntro) scoreGeneralSongPosition.hidden = true;
    scoreNextGeneralSongButton.hidden = showingIntro || !introGeneralNavigationActive || nextSongIndex < 0;
    const nextSongLabel = formatScoreSongLabel(currentPreviewSongs[nextSongIndex]);
    scoreNextGeneralSongLabel.textContent = nextSongLabel || 'Berikutnya';
    scoreNextGeneralSongButton.title = nextSongLabel ? `Berikutnya: ${nextSongLabel}` : 'Partitur berikutnya';
    scoreNextGeneralSongButton.setAttribute('aria-label', scoreNextGeneralSongButton.title);
    scoreImageDialog.scrollTop = 0;
    scoreImageDialog.scrollLeft = 0;
  }

  function moveFullScoreImage(direction) {
    const nextIndex = activeScoreIndex + direction;
    if (nextIndex >= 0 && nextIndex < activeScoreFiles.length) {
      activeScoreIndex = nextIndex;
      renderFullScoreImage();
      return;
    }
    if (direction > 0 && scoreImageMode === 'score' && nextIndex >= activeScoreFiles.length) {
      const nextSongIndex = findNextGeneralSongIndex();
      if (nextSongIndex >= 0) {
        introGeneralNavigationActive = true;
        openGeneralSongScoreAt(nextSongIndex);
      }
      return;
    }
    if (direction < 0 && scoreImageMode === 'score' && nextIndex < 0) {
      const previousSongIndex = findPreviousGeneralSongIndex();
      if (previousSongIndex >= 0) {
        introGeneralNavigationActive = true;
        const previousSong = currentPreviewSongs[previousSongIndex];
        const instrument = findDefaultScoreInstrument(previousSong);
        const previousPages = previousSong?.images?.[instrument] || [];
        openGeneralSongScoreAt(previousSongIndex, previousPages.length - 1);
      }
    }
  }

  function findDefaultScoreInstrument(song) {
    const images = song && song.images && typeof song.images === 'object' ? song.images : {};
    const names = Object.keys(images).filter((name) => Array.isArray(images[name]) && images[name].length);
    if (preferredInstrument) {
      const preferred = names.find((name) => normalize(name) === normalize(preferredInstrument));
      if (preferred) return preferred;
    }
    return names.find((name) => name.trim().toLowerCase() === 'partitur')
      || names.find((name) => name.trim().toLowerCase() === 'general')
      || names[0]
      || '';
  }

  function saveInstrumentProfile(value, userName) {
    preferredInstrument = String(value || '').trim();
    preferredUserName = String(userName || '').trim();
    try {
      if (preferredInstrument) localStorage.setItem(INSTRUMENT_PROFILE_KEY, preferredInstrument);
      else localStorage.removeItem(INSTRUMENT_PROFILE_KEY);
      if (preferredUserName) localStorage.setItem(PROFILE_USER_NAME_KEY, preferredUserName);
      else localStorage.removeItem(PROFILE_USER_NAME_KEY);
    } catch (error) {
      console.warn('Profile tidak dapat disimpan di perangkat ini:', error);
      return false;
    }
    instrumentProfileButton.title = preferredInstrument ? `Profile: ${preferredInstrument}` : 'Profile';

    if (currentPreviewSong) {
      const instrument = findDefaultScoreInstrument(currentPreviewSong);
      if (instrument && scoreImageDialog.open && scoreImageMode === 'score') {
        openFullScoreImage(instrument, 0, true);
      } else if (instrument && !scoreSection.hidden) {
        openScoreInstrument(instrument);
      }
    }
    return true;
  }

  function formatScoreSongLabel(song) {
    if (!song) return '';
    return [song.category, song.number, song.title]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(' ');
  }

  function findNextGeneralSongIndex() {
    const startIndex = introGeneralSongIndex >= 0 ? introGeneralSongIndex : currentSongIndex;
    const nextIndex = startIndex + 1;
    return nextIndex < currentPreviewSongs.length ? nextIndex : -1;
  }

  function findPreviousGeneralSongIndex() {
    const startIndex = introGeneralSongIndex >= 0 ? introGeneralSongIndex : currentSongIndex;
    const previousIndex = startIndex - 1;
    return previousIndex >= 0 ? previousIndex : -1;
  }

  function updateGeneralSongPosition() {
    const songIndex = introGeneralSongIndex >= 0 ? introGeneralSongIndex : currentSongIndex;
    const song = currentPreviewSongs[songIndex] || currentPreviewSong;
    if (!introGeneralNavigationActive || !song) {
      scoreGeneralSongPosition.hidden = true;
      scoreGeneralSongPosition.textContent = '';
      return;
    }
    const isPreWorship = Boolean(song.preWorship);
    const matchingSongIndexes = currentPreviewSongs.reduce((indexes, item, index) => {
      if (Boolean(item.preWorship) === isPreWorship) indexes.push(index);
      return indexes;
    }, []);
    const position = matchingSongIndexes.indexOf(songIndex) + 1;
    if (!position || !matchingSongIndexes.length) {
      scoreGeneralSongPosition.hidden = true;
      scoreGeneralSongPosition.textContent = '';
      return;
    }
    scoreGeneralSongPosition.textContent = `${isPreWorship ? 'Pra ' : ''}${position}/${matchingSongIndexes.length}`;
    scoreGeneralSongPosition.hidden = false;
  }

  function openPreviousGeneralSong() {
    const previousIndex = findPreviousGeneralSongIndex();
    if (previousIndex < 0) return;
    introGeneralNavigationActive = true;
    openGeneralSongScoreAt(previousIndex);
  }

  function openNextGeneralSong() {
    const nextIndex = findNextGeneralSongIndex();
    if (nextIndex < 0) return;
    introGeneralNavigationActive = true;
    openGeneralSongScoreAt(nextIndex);
  }

  function closeScorePreview() {
    scoreSection.hidden = true;
    closeScorePreviewButton.hidden = true;
    scorePages.hidden = true;
    scoreInstruments.querySelectorAll('.score-instrument-button').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
    });
    chordModeSelect.value = 'numbers';
    transposeControls.hidden = true;
    renderPreviewMetadata();
    renderSongContent();
  }

  function updateScoreCarouselControls() {
    const pages = scorePages.children;
    if (!pages.length) return;
    const pageIndex = Math.min(pages.length - 1, Math.round(scorePages.scrollLeft / Math.max(1, scorePages.clientWidth)));
    document.getElementById('score-page-position').textContent = `${pageIndex + 1} / ${pages.length}`;
    document.getElementById('score-previous').disabled = pageIndex === 0;
    document.getElementById('score-next').disabled = pageIndex === pages.length - 1;
  }

  function moveScorePage(direction) {
    scorePages.scrollBy({ left: direction * scorePages.clientWidth, behavior: 'smooth' });
  }

  function scoreImageId(file) {
    if (file && typeof file === 'object' && file.id) return String(file.id);
    const url = typeof file === 'string' ? file : String((file && file.url) || '');
    return url.match(/[?&]id=([^&]+)/)?.[1] || url.match(/\/d\/([^/]+)/)?.[1] || '';
  }

  function scoreImageCandidates(file) {
    if (file && typeof file === 'object' && file.localCacheKey) {
      const cachedUrl = scheduleImageObjectUrls.get(file.localCacheKey);
      if (cachedUrl) return [cachedUrl];
    }
    const source = typeof file === 'string' ? file : String((file && (file.url || file.dataUrl || file.data)) || '');
    if (/^data:image\//i.test(source)) return [source];
    const id = scoreImageId(file);
    if (!id) return source ? [source] : [];
    const encodedId = encodeURIComponent(id);
    const candidates = [
      `https://drive.google.com/thumbnail?id=${encodedId}&sz=w2000`,
      `https://lh3.googleusercontent.com/d/${encodedId}=w2000`,
      `https://drive.google.com/uc?export=view&id=${encodedId}`,
      source
    ];
    return [...new Set(candidates.filter(Boolean))];
  }

  function populateTransposeKeys() {
    const info = parseKey(selectedPreviewKey);
    const keyRoots = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    const options = keyRoots.map((root) => {
      const value = `${root}${info.minor ? 'm' : ''}`;
      return { value, pitch: parseKey(value).pitch };
    });
    transposeKeySelect.replaceChildren(...options.map(({ value }) => new Option(value, value)));
    const currentValue = `${info.root}${info.minor ? 'm' : ''}`;
    transposeKeySelect.value = options.some(({ value }) => value === currentValue)
      ? currentValue
      : (options.find(({ pitch }) => pitch === info.pitch) || options[0]).value;
    selectedPreviewKey = transposeKeySelect.value;
  }

  function parseKey(key) {
    const value = String(key || 'C').replace(/\u266D/g, 'b').replace(/\u266F/g, '#').trim();
    const match = value.match(/^([A-Ga-g])([#b]?)(m)?/);
    if (!match) return { root: 'C', pitch: 0, minor: false };
    const root = `${match[1].toUpperCase()}${match[2]}`;
    const pitches = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
    return { root, pitch: pitches[root] ?? 0, minor: Boolean(match[3]) };
  }

  function normalizeKey(key) {
    const parsed = parseKey(key);
    return `${parsed.root}${parsed.minor ? 'm' : ''}`;
  }

  function scaleFor(key) {
    const parsed = parseKey(key);
    const steps = parsed.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return steps.map((step) => (parsed.pitch + step) % 12);
  }

  function pitchName(pitch, key) {
    const parsed = parseKey(key);
    const flatFamily = prefersFlatFamily(parsed);
    const names = ['C', flatFamily ? 'Db' : 'C#', 'D', flatFamily ? 'Eb' : 'D#', 'E', 'F', flatFamily ? 'Gb' : 'F#', 'G', flatFamily ? 'Ab' : 'G#', 'A', flatFamily ? 'Bb' : 'A#', 'B'];
    return names[((pitch % 12) + 12) % 12];
  }

  function prefersFlatFamily(key) {
    const parsed = typeof key === 'object' && key.root ? key : parseKey(key);
    return ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(parsed.root)
      || (parsed.minor && ['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'].includes(parsed.root));
  }

  function spellScaleDegree(degree, key, accidental = '') {
    const parsedKey = parseKey(key);
    const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const naturalPitches = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const naturalNamesByPitch = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };
    const rootLetter = parsedKey.root[0];
    const rootIndex = letters.indexOf(rootLetter);
    const letter = letters[(rootIndex + degree - 1) % letters.length];
    const targetPitch = degreePitch(degree, key, accidental);
    if (Object.prototype.hasOwnProperty.call(naturalNamesByPitch, targetPitch)) {
      return naturalNamesByPitch[targetPitch];
    }
    const difference = (targetPitch - naturalPitches[letter] + 12) % 12;
    if (difference === 1 && degree !== 1 && prefersFlatFamily(parsedKey)) {
      return pitchName(targetPitch, key);
    }
    if (difference === 0) return letter;
    if (difference === 1) return `${letter}#`;
    if (difference === 11) return `${letter}b`;
    return pitchName(targetPitch, key);
  }

  function parseNumberChord(token) {
    const match = token.match(/^([b#]?)([1-7])([b#]?)([^/]*?)(?:\/([b#]?)([1-7])([b#]?))?$/i);
    if (!match) return null;
    const bass = match[6] ? `${match[5] || match[7]}${match[6]}` : '';
    return {
      accidental: match[1] || match[3],
      degree: Number(match[2]),
      quality: match[4],
      bass
    };
  }

  function parseLetterChord(token) {
    const match = token.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G][#b]?))?$/i);
    if (!match) return null;
    const quality = match[3];
    // Do not treat ordinary words beginning with A-G as chords (for example,
    // "Belum", "ada", and "data" in empty-state messages).
    if (quality && !/^(?:(?:maj|min|m|sus|dim|aug|add|omit)?(?:2|4|5|6|7|9|11|13)?(?:sus[24])?(?:\([#b]?\d+\))?(?:[#b]?\d+)*)$/i.test(quality)) return null;
    return { root: `${match[1].toUpperCase()}${match[2]}`, quality, bass: match[4] || '' };
  }

  function degreePitch(degree, key, accidental = '') {
    const scale = scaleFor(key);
    return ((scale[(degree - 1) % 7] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0)) % 12 + 12) % 12;
  }

  function numericToLetter(token, key) {
    const chord = parseNumberChord(token);
    if (!chord) return token;
    const scale = scaleFor(key);
    const minor = parseKey(key).minor;
    const defaultQualities = minor ? ['m', 'dim', '', 'm', 'm', '', ''] : ['', 'm', 'm', '', '', 'm', 'dim'];
    const quality = chord.quality || (chord.accidental ? '' : defaultQualities[chord.degree - 1]);
    const root = spellScaleDegree(chord.degree, key, chord.accidental);
    const bassMatch = chord.bass.match(/^([b#]?)([1-7])$/);
    const bass = bassMatch ? `/${spellScaleDegree(Number(bassMatch[2]), key, bassMatch[1])}` : '';
    return `${root}${quality}${bass}`;
  }

  function letterToNumeric(token, key) {
    const chord = parseLetterChord(token);
    if (!chord) return token;
    const rootPitch = parseKey(chord.root).pitch;
    const scale = scaleFor(key);
    let degreeText = String((scale.indexOf(rootPitch) + 1) || 1);
    if (scale.includes(rootPitch)) degreeText = String(scale.indexOf(rootPitch) + 1);
    else {
      for (let index = 0; index < scale.length; index += 1) {
        if ((scale[index] + 1) % 12 === rootPitch) { degreeText = `#${index + 1}`; break; }
        if ((scale[index] + 11) % 12 === rootPitch) { degreeText = `b${index + 1}`; break; }
      }
    }
    const bass = chord.bass ? `/${letterToNumeric(chord.bass, key)}` : '';
    return `${degreeText}${chord.quality}${bass}`;
  }

  function transposeLetterChord(token, fromKey, toKey) {
    const chord = parseLetterChord(token);
    if (!chord) return token;
    const shift = parseKey(toKey).pitch - parseKey(fromKey).pitch;
    const root = pitchName(parseKey(chord.root).pitch + shift, toKey);
    const bass = chord.bass ? `/${pitchName(parseKey(chord.bass).pitch + shift, toKey)}` : '';
    return `${root}${chord.quality}${bass}`;
  }

  function mapChordToken(token, mode, fromKey, toKey) {
    if (mode === 'letters') return parseNumberChord(token) ? numericToLetter(token, toKey) : transposeLetterChord(token, fromKey, toKey);
    return parseLetterChord(token) ? letterToNumeric(token, toKey) : token;
  }

  function transformChordLines(fragment, mode, fromKey, toKey) {
    fragment.querySelectorAll('.song-section-body').forEach((body) => {
      if (mode === 'none') {
        // Chords are stored as their own lines. Remove those lines entirely so
        // the lyric lines close up instead of leaving empty chord rows behind.
        const lyricLines = body.textContent.split(/\r?\n/).filter((line) => {
          const tokens = line.trim().split(/\s+/).filter(Boolean);
          return !tokens.length || !tokens.every((token) => parseNumberChord(token) || parseLetterChord(token));
        });
        body.textContent = lyricLines.join('\n');
        return;
      }
      const lines = body.textContent.split(/(\r?\n)/);
      const rendered = document.createDocumentFragment();
      lines.forEach((line) => {
        if (/^\r?\n$/.test(line) || !line.trim()) {
          rendered.append(document.createTextNode(line));
          return;
        }
        const tokens = line.trim().split(/\s+/);
        const chordLine = tokens.length > 0 && tokens.every((token) => parseNumberChord(token) || parseLetterChord(token));
        if (!chordLine) {
          rendered.append(document.createTextNode(line));
          return;
        }
        (line.match(/\s+|\S+/g) || []).forEach((part) => {
          if (/^\s+$/.test(part)) {
            rendered.append(document.createTextNode(part));
            return;
          }
          const converted = mapChordToken(part, mode, fromKey, toKey);
          const chord = parseLetterChord(converted);
          const extensionIndex = chord ? chord.quality.indexOf('7') : -1;
          if (extensionIndex < 0) {
            rendered.append(document.createTextNode(converted));
            return;
          }
          const qualityStart = chord.root.length;
          const sevenIndex = qualityStart + extensionIndex;
          rendered.append(document.createTextNode(converted.slice(0, sevenIndex)));
          const extension = document.createElement('sup');
          extension.className = 'chord-extension';
          extension.textContent = '7';
          rendered.append(extension, document.createTextNode(converted.slice(sevenIndex + 1)));
        });
      });
      body.replaceChildren(rendered);
    });
  }

  function stepTranspose(amount) {
    const current = parseKey(selectedPreviewKey);
    selectedPreviewKey = `${pitchName(current.pitch + amount, selectedPreviewKey)}${current.minor ? 'm' : ''}`;
    populateTransposeKeys();
    renderPreviewMetadata();
    renderSongContent();
  }

  function openPreviewAt(index) {
    if (index < 0 || index >= currentPreviewSongs.length) return;
    openSong(currentPreviewSongs[index], currentPreviewSongs, index);
  }

  document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('song-reader-open'));
  dialog.addEventListener('cancel', (event) => event.preventDefault());
  document.getElementById('close-score-image').addEventListener('click', () => scoreImageDialog.close());
  scoreImageDialog.addEventListener('cancel', (event) => event.preventDefault());
  scoreImageDialog.addEventListener('close', () => {
    window.clearTimeout(scoreControlsHideTimer);
    scoreControlsHideTimer = 0;
    scoreImageDialog.classList.remove('controls-hidden');
    scoreImageDialog.classList.remove('instrument-controls-hidden');
    scoreImageInstruments.hidden = true;
    scoreImageMode = 'score';
    activeScheduleIntro = null;
    scoreImageReturnTarget = 'lyrics';
    introGeneralNavigationActive = false;
    introGeneralSongIndex = -1;
    scoreIntroBackButton.hidden = true;
    scorePreviousGeneralSongButton.hidden = true;
    scoreGeneralSongPosition.hidden = true;
    scoreNextGeneralSongButton.hidden = true;
    chordModeSelect.value = 'numbers';
    transposeControls.hidden = true;
    renderPreviewMetadata();
    renderSongContent();
  });
  scoreImagePrevious.addEventListener('click', () => moveFullScoreImage(-1));
  scoreImageNext.addEventListener('click', () => moveFullScoreImage(1));
  scoreImageInstruments.addEventListener('click', (event) => {
    const button = event.target.closest('.score-image-instrument-button');
    if (button) openFullScoreImage(button.dataset.instrument, 0, true);
  });
  scoreIntroBackButton.addEventListener('click', () => {
    if (scoreImageMode === 'score') {
      const intro = activeScheduleIntro || currentPreviewSong?.scheduleIntro;
      if (intro) showScheduleIntroInScoreViewer(intro);
      return;
    }
    const instrument = findDefaultScoreInstrument(currentPreviewSong);
    if (instrument) {
      introGeneralNavigationActive = true;
      introGeneralSongIndex = currentSongIndex;
      openFullScoreImage(instrument, 0, true);
      return;
    }
    if (currentPreviewSong) {
      const song = currentPreviewSong;
      const queue = currentPreviewSongs;
      const index = currentSongIndex;
      scoreImageDialog.close();
      openSong(song, queue, index);
    }
  });
  scoreNextGeneralSongButton.addEventListener('click', openNextGeneralSong);
  scorePreviousGeneralSongButton.addEventListener('click', openPreviousGeneralSong);
  fullScoreImage.addEventListener('error', () => {
    const urls = JSON.parse(fullScoreImage.dataset.candidates || '[]');
    const attempt = Number(fullScoreImage.dataset.attempt || 0) + 1;
    fullScoreImage.dataset.attempt = String(attempt);
    if (attempt < urls.length) fullScoreImage.src = urls[attempt];
  });
  fullScoreImage.addEventListener('click', showScoreImageControls);
  scoreImageDialog.addEventListener('touchstart', (event) => {
    showScoreImageControls();
    if (event.touches.length === 1) scoreSwipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  scoreImageDialog.addEventListener('click', showScoreImageControls);
  scoreImageDialog.addEventListener('touchend', (event) => {
    if (!scoreSwipeStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - scoreSwipeStart.x;
    const dy = event.changedTouches[0].clientY - scoreSwipeStart.y;
    scoreSwipeStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) moveFullScoreImage(dx < 0 ? 1 : -1);
  }, { passive: true });
  scoreImageDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') showScoreImageControls();
    if (event.key === 'ArrowRight') moveFullScoreImage(1);
    if (event.key === 'ArrowLeft') moveFullScoreImage(-1);
  });
  document.getElementById('previous-song').addEventListener('click', () => openPreviewAt(currentSongIndex - 1));
  document.getElementById('next-song').addEventListener('click', () => openPreviewAt(currentSongIndex + 1));
  chordModeSelect.addEventListener('change', () => {
    transposeControls.hidden = chordModeSelect.value !== 'letters';
    renderPreviewMetadata();
    renderSongContent();
  });
  transposeKeySelect.addEventListener('change', () => {
    selectedPreviewKey = transposeKeySelect.value;
    renderPreviewMetadata();
    renderSongContent();
  });
  document.getElementById('transpose-down').addEventListener('click', () => stepTranspose(-1));
  document.getElementById('transpose-up').addEventListener('click', () => stepTranspose(1));
  scoreInstruments.addEventListener('click', (event) => {
    const button = event.target.closest('.score-instrument-button');
    if (!button) return;
    if (!scoreSection.hidden && button.getAttribute('aria-pressed') === 'true') closeScorePreview();
    else if (currentPreviewSong?.scheduleIntro || currentPreviewSong?.entryId) {
      introGeneralNavigationActive = true;
      introGeneralSongIndex = currentSongIndex;
      openFullScoreImage(button.dataset.instrument, 0, true);
    } else openScoreInstrument(button.dataset.instrument);
  });
  closeScorePreviewButton.addEventListener('click', closeScorePreview);
  scorePages.addEventListener('scroll', updateScoreCarouselControls, { passive: true });
  document.getElementById('score-previous').addEventListener('click', () => moveScorePage(-1));
  document.getElementById('score-next').addEventListener('click', () => moveScorePage(1));
  refreshButton.addEventListener('click', () => {
    if (!readProfileUserName()) {
      openRequiredProfile('memperbarui koleksi lagu');
      return;
    }
    loadSongs();
  });
  const aboutProgramDialog = document.getElementById('about-program-dialog');
  document.getElementById('about-program-open').addEventListener('click', () => aboutProgramDialog.showModal());
  document.getElementById('close-about-program').addEventListener('click', () => aboutProgramDialog.close());
  aboutProgramDialog.addEventListener('click', (event) => { if (event.target === aboutProgramDialog) aboutProgramDialog.close(); });
  document.getElementById('create-schedule').addEventListener('click', addSchedule);
  document.getElementById('share-schedule-open').addEventListener('click', () => {
    if (activeScheduleShare && activeScheduleShare.expiresAt > Date.now()) {
      stopSharing(false);
      return;
    }
    fillShareSchedules();
    document.getElementById('share-result').hidden = true;
    document.getElementById('share-status').textContent = '';
    renderShareButtonState();
    shareDialog.showModal();
  });
  document.getElementById('pull-schedule-open').addEventListener('click', () => { document.getElementById('pull-status').textContent = ''; pullDialog.showModal(); });
  document.querySelector('[data-close-share]').addEventListener('click', () => shareDialog.close());
  document.querySelector('[data-close-pull]').addEventListener('click', () => pullDialog.close());
  document.getElementById('share-schedule-submit').addEventListener('click', shareSelectedSchedule);
  document.getElementById('minimize-share-dialog').addEventListener('click', () => shareDialog.close());
  document.getElementById('share-schedule-options').addEventListener('click', (event) => {
    const choice = event.target.closest('[data-schedule-id]');
    if (!choice) return;
    const select = document.getElementById('share-schedule-select');
    select.value = choice.dataset.scheduleId;
    document.getElementById('share-schedule-picker-label').textContent = choice.textContent;
    document.querySelectorAll('.share-schedule-option').forEach((option) => option.setAttribute('aria-selected', String(option === choice)));
    document.getElementById('share-schedule-picker').open = false;
  });
  document.getElementById('share-schedule-picker').addEventListener('toggle', (event) => {
    const picker = event.currentTarget;
    if (!picker.open) {
      picker.classList.remove('opens-up');
      return;
    }
    const bounds = picker.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bounds.bottom;
    const spaceAbove = bounds.top;
    picker.classList.toggle('opens-up', spaceBelow < Math.min(220, window.innerHeight * 0.35) && spaceAbove > spaceBelow);
  });
  document.getElementById('stop-sharing').addEventListener('click', () => stopSharing(false));
  document.getElementById('pull-schedule-submit').addEventListener('click', pullSharedSchedule);
  document.getElementById('pull-schedule-code').addEventListener('input', (event) => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3); });
  scheduleList.addEventListener('click', handleScheduleClick);
  scheduleList.addEventListener('input', handleScheduleInput);
  scheduleViewDialog.addEventListener('click', handleScheduleClick);
  scheduleViewList.addEventListener('click', handleScheduleRowClick);
  document.getElementById('close-schedule-view').addEventListener('click', () => scheduleViewDialog.close());
  document.getElementById('refresh-schedule-songs').addEventListener('click', refreshViewedScheduleSongsFromLibrary);
  document.getElementById('toggle-schedule-compact').addEventListener('click', () => {
    const schedule = schedules.find((item) => item.id === viewedScheduleId);
    if (!schedule) return;
    schedule.compactView = !schedule.compactView;
    saveSchedules();
    renderScheduleView(schedule.id);
  });
  scheduleViewDialog.addEventListener('close', () => document.body.classList.remove('schedule-view-open'));
  document.getElementById('add-schedule-intro').addEventListener('click', openScheduleIntroForm);
  removeScheduleIntroButton.addEventListener('click', removeScheduleIntro);
  scheduleIntroNameButton.addEventListener('click', () => {
    const schedule = schedules.find((item) => item.id === viewedScheduleId);
    openScheduleIntroImage(scheduleIntros[viewedScheduleId], false, schedule || null);
  });
  document.getElementById('schedule-intro-preview-button').addEventListener('click', () => {
    openScheduleIntroImage(currentPreviewSong && currentPreviewSong.scheduleIntro, true);
  });
  document.getElementById('close-schedule-intro').addEventListener('click', () => scheduleIntroDialog.close());
  const scheduleIntroFileInput = document.getElementById('schedule-intro-file');
  const scheduleIntroCameraInput = document.getElementById('schedule-intro-camera');
  const scheduleIntroCameraDialog = document.getElementById('schedule-intro-camera-dialog');
  const scheduleIntroCameraPreview = document.getElementById('schedule-intro-camera-preview');
  const scheduleIntroCameraStatus = document.getElementById('schedule-intro-camera-status');
  const stopScheduleIntroCamera = () => {
    if (scheduleIntroCameraStream) scheduleIntroCameraStream.getTracks().forEach((track) => track.stop());
    scheduleIntroCameraStream = null;
    scheduleIntroCameraPreview.srcObject = null;
    document.getElementById('take-schedule-intro-photo').disabled = true;
  };
  const openScheduleIntroWebcam = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      document.getElementById('schedule-intro-status').textContent = 'Webcam tidak tersedia. Buka aplikasi melalui HTTPS atau pilih gambar dari perangkat.';
      return;
    }
    scheduleIntroCameraStatus.textContent = 'Meminta izin akses webcam…';
    scheduleIntroCameraDialog.showModal();
    try {
      scheduleIntroCameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (!scheduleIntroCameraDialog.open) {
        stopScheduleIntroCamera();
        return;
      }
      scheduleIntroCameraPreview.srcObject = scheduleIntroCameraStream;
      await scheduleIntroCameraPreview.play();
      scheduleIntroCameraStatus.textContent = '';
      document.getElementById('take-schedule-intro-photo').disabled = false;
    } catch (error) {
      stopScheduleIntroCamera();
      scheduleIntroCameraStatus.textContent = error.name === 'NotAllowedError'
        ? 'Izin webcam ditolak. Izinkan akses kamera di pengaturan browser.'
        : 'Webcam tidak dapat dibuka. Periksa koneksi kamera atau pilih gambar dari perangkat.';
    }
  };
  document.getElementById('choose-schedule-intro-file').addEventListener('click', () => {
    scheduleIntroCameraInput.value = '';
    capturedScheduleIntroFile = null;
    scheduleIntroFileInput.click();
  });
  document.getElementById('capture-schedule-intro-file').addEventListener('click', () => {
    scheduleIntroFileInput.value = '';
    capturedScheduleIntroFile = null;
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobileDevice) scheduleIntroCameraInput.click();
    else openScheduleIntroWebcam();
  });
  [scheduleIntroFileInput, scheduleIntroCameraInput].forEach((input) => {
    input.addEventListener('change', () => {
      const otherInput = input === scheduleIntroFileInput ? scheduleIntroCameraInput : scheduleIntroFileInput;
      if (input.files.length) otherInput.value = '';
      const selectedFile = input.files[0] || otherInput.files[0];
      if (selectedFile) capturedScheduleIntroFile = null;
      document.getElementById('schedule-intro-file-name').textContent = selectedFile
        ? selectedFile.name
        : 'Pilih gambar dari perangkat atau ambil foto dengan kamera.';
      document.getElementById('schedule-intro-status').textContent = '';
    });
  });
  document.getElementById('close-schedule-intro-camera').addEventListener('click', () => scheduleIntroCameraDialog.close());
  scheduleIntroCameraDialog.addEventListener('close', stopScheduleIntroCamera);
  document.getElementById('take-schedule-intro-photo').addEventListener('click', () => {
    const video = scheduleIntroCameraPreview;
    if (!video.videoWidth || !video.videoHeight) {
      scheduleIntroCameraStatus.textContent = 'Kamera belum siap. Coba beberapa saat lagi.';
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        scheduleIntroCameraStatus.textContent = 'Foto tidak dapat diproses. Silakan coba lagi.';
        return;
      }
      capturedScheduleIntroFile = new File([blob], `intro-${Date.now()}.jpg`, { type: 'image/jpeg' });
      scheduleIntroFileInput.value = '';
      scheduleIntroCameraInput.value = '';
      document.getElementById('schedule-intro-file-name').textContent = capturedScheduleIntroFile.name;
      document.getElementById('schedule-intro-status').textContent = '';
      scheduleIntroCameraDialog.close();
    }, 'image/jpeg', 0.88);
  });
  scheduleIntroForm.addEventListener('submit', saveScheduleIntro);
  document.getElementById('confirm-remove-schedule-intro').addEventListener('click', () => finishIntroRemovalConfirmation(true));
  document.getElementById('cancel-remove-schedule-intro').addEventListener('click', () => finishIntroRemovalConfirmation(false));
  document.getElementById('close-remove-schedule-intro').addEventListener('click', () => finishIntroRemovalConfirmation(false));
  removeScheduleIntroDialog.addEventListener('close', () => {
    if (resolveIntroRemovalConfirmation) finishIntroRemovalConfirmation(false);
  });
  document.getElementById('delete-viewed-schedule').addEventListener('click', () => {
    const schedule = schedules.find((item) => item.id === viewedScheduleId);
    confirmScheduleDeletion(schedule);
  });
  document.getElementById('confirm-delete-schedule').addEventListener('click', () => finishScheduleDeletion(true));
  document.getElementById('cancel-delete-schedule').addEventListener('click', () => finishScheduleDeletion(false));
  document.getElementById('close-delete-schedule').addEventListener('click', () => finishScheduleDeletion(false));
  deleteScheduleDialog.addEventListener('close', () => { pendingScheduleDeletionId = ''; });
  songList.addEventListener('click', handleCollectionClick);
  scheduleList.addEventListener('change', handleActiveScheduleChange);
  scheduleList.addEventListener('focusin', (event) => {
    const titleInput = event.target.closest('input.schedule-title-input');
    const schedule = titleInput && schedules.find((item) => item.id === titleInput.closest('.schedule-card')?.dataset.scheduleId);
    scheduleTitleBeforeEdit = schedule ? schedule.title || '' : null;
  });
  scheduleList.addEventListener('change', (event) => {
    const titleInput = event.target.closest('input.schedule-title-input');
    if (!titleInput || scheduleTitleBeforeEdit === null) return;
    const schedule = schedules.find((item) => item.id === titleInput.closest('.schedule-card')?.dataset.scheduleId);
    const previousName = scheduleTitleBeforeEdit;
    scheduleTitleBeforeEdit = null;
    if (!schedule || schedule.title === previousName) return;
    if (saveSchedules()) trackSuccessfulAction('schedule_rename_success', { previousName, scheduleName: schedule.title });
  });
  search.addEventListener('input', handleSearchInput);
  scheduleList.addEventListener('pointerdown', handleScheduleDragStart);
  scheduleList.addEventListener('pointermove', handleScheduleDragMove);
  scheduleList.addEventListener('pointerup', finishScheduleDrag);
  scheduleList.addEventListener('pointercancel', finishScheduleDrag);
  scheduleViewList.addEventListener('pointerdown', handleScheduleDragStart);
  scheduleViewList.addEventListener('pointermove', handleScheduleDragMove);
  scheduleViewList.addEventListener('pointerup', finishScheduleDrag);
  scheduleViewList.addEventListener('pointercancel', finishScheduleDrag);
  scheduleEditForm.addEventListener('submit', saveScheduleSongEdit);
  scheduleContentInput.addEventListener('input', updateScheduleContentHighlight);
  scheduleContentInput.addEventListener('scroll', updateScheduleContentHighlight, { passive: true });
  document.getElementById('cancel-schedule-edit').addEventListener('click', () => { scheduleEditDialog.close(); editingEntry = null; });
  scheduleEditDialog.addEventListener('cancel', (event) => event.preventDefault());
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !dialog.open && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
    if (dialog.open && !scoreImageDialog.open && event.key === 'ArrowRight') openPreviewAt(currentSongIndex + 1);
    if (dialog.open && !scoreImageDialog.open && event.key === 'ArrowLeft') openPreviewAt(currentSongIndex - 1);
  });
  filters.replaceChildren();
  loadSchedules();
  renderSchedules();
  restoreActiveScheduleShare();
  if (!preferredUserName) openRequiredProfile();
  const hasCache = loadCachedSongs();
  if (!hasCache) {
    count.textContent = '0';
    setStatus('Belum ada data lokal. Tekan "Perbarui data" untuk memuat lagu dari database.');
    setSyncStatus('Belum disinkronkan');
  }
})();


