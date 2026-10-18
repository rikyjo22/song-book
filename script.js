(() => {
  'use strict';

  // Gunakan URL deployment Web App yang sama dengan song-manager.
  const API_URL = 'https://script.google.com/macros/s/AKfycbySj5dccqhqMXn16w53BM0fM1XzGAd_8x0G8YR-EOO8tlRHQ_mc9oszy750yHamF_FroQ/exec';
  const CACHE_KEY = 'song-book:songs:v1';
  const SCHEDULE_KEY = 'song-book:worship-schedules:v1';
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
  const search = document.getElementById('search-input');
  const filters = document.getElementById('category-filters');
  const dialog = document.getElementById('song-dialog');
  const preview = document.getElementById('song-preview');
  const scheduleList = document.getElementById('schedule-list');
  const scheduleStatus = document.getElementById('schedule-status');
  const scheduleAddBar = document.getElementById('schedule-add-bar');
  const targetScheduleSelect = document.getElementById('target-schedule-select');
  const collectionResults = document.getElementById('collection-results');
  const collapseCollectionButton = document.getElementById('collapse-collection');
  const scheduleEditDialog = document.getElementById('schedule-edit-dialog');
  const scheduleEditForm = document.getElementById('schedule-edit-form');
  const scheduleContentInput = document.getElementById('schedule-content-input');
  const scheduleContentHighlight = document.getElementById('schedule-content-highlight');
  const scheduleViewDialog = document.getElementById('schedule-view-dialog');
  const scheduleViewList = document.getElementById('schedule-view-list');
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
  const scoreImagePosition = document.getElementById('score-image-position');
  let songs = [];
  let activeCategory = 'ALL';
  let currentSongIndex = -1;
  let currentPreviewSongs = [];
  let currentPreviewSong = null;
  let previewZoom = 1;
  let pinchStart = null;
  let sourcePreviewKey = 'C';
  let selectedPreviewKey = 'C';
  let callbackCounter = 0;
  let cacheAvailable = false;
  let isLoadingSongs = false;
  let schedules = [];
  let activeScheduleId = '';
  let draggedRow = null;
  let dragPointerId = null;
  let isCollectionCollapsed = false;
  let editingEntry = null;
  let viewedScheduleId = '';
  const songSectionPattern = /^(?:(?:\d+[.)]?\s*)?)(intro|opening|bait|verse|stanza|reff|refrain|chorus|pre[ -]?(?:reff|chorus)|post[ -]?(?:reff|chorus)|bridge|intermezzo|itermezzo|interlude|instrumental|music|musik|solo|coda|outro|ending|tag|vamp|reprise)(?:\s+(?:ke[- ]?)?\d+)?$/i;
  let activeScoreFiles = [];
  let activeScoreInstrument = '';
  let activeScoreIndex = 0;
  let scoreSwipeStart = null;

  function setStatus(message) { status.textContent = message; }
  function setSyncStatus(message) { syncStatus.textContent = message; }
  function formatTempo(value) {
    const tempo = String(value == null ? '' : value).trim().replace(/\s*BPM\s*$/i, '').trim();
    if (!tempo) return '';
    return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(tempo) ? `${tempo} BPM` : tempo;
  }
  function normalize(value) { return String(value || '').toLocaleLowerCase('id').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
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
        setSyncStatus(`Data database diperbarui · ${formatUpdatedAt(updatedAt)}`);
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

  function loadCachedSongs() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!cached || !Array.isArray(cached.songs)) return;
      songs = cached.songs;
      songs.sort(compareSongs);
      cacheAvailable = true;
      count.textContent = String(songs.length);
      setSyncStatus(`Data lokal · terakhir disinkronkan ${formatUpdatedAt(cached.updatedAt)} · tekan Perbarui data untuk mengambil perubahan`);
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
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function loadSchedules() {
    try {
      const saved = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]');
      schedules = Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === 'string').map((item) => ({
        id: item.id,
        title: String(item.title || 'Ibadah Baru'),
        date: String(item.date || ''),
        isOpen: Boolean(item.isOpen),
        songs: Array.isArray(item.songs) ? item.songs.filter((song) => song && typeof song.id === 'string').map((song, index) => ({ ...song, entryId: String(song.entryId || `entry_legacy_${item.id}_${index}`), contentHtml: String(song.contentHtml || ''), overrides: song.overrides && typeof song.overrides === 'object' ? song.overrides : {} })) : []
      })) : [];
    } catch (error) {
      schedules = [];
    }
  }

  function saveSchedules() {
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
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

  function renderSchedules() {
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
      card.className = 'schedule-card';
      card.dataset.scheduleId = schedule.id;
      card.innerHTML = `
        <div class="schedule-card-header">
          <label class="schedule-field">NAMA JADWAL<input class="schedule-title-input" data-field="title" type="text" maxlength="80" value="${escapeText(schedule.title)}" placeholder="Contoh: Ibadah Minggu Pagi"></label>
          <label class="schedule-field">TANGGAL<input data-field="date" type="date" value="${escapeText(schedule.date)}"></label>
          <button class="schedule-view-button" type="button" data-action="view-schedule">Lihat jadwal</button>
        </div>`;
      fragment.append(card);
    });
    scheduleList.append(fragment);
    scheduleStatus.textContent = `${schedules.length} jadwal tersimpan di perangkat ini.`;
  }

  function renderScheduleView(scheduleId) {
    const schedule = schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;
    viewedScheduleId = schedule.id;
    document.getElementById('schedule-view-title').textContent = schedule.title || 'Jadwal ibadah';
    document.getElementById('schedule-view-date').textContent = schedule.date
      ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(`${schedule.date}T00:00:00`))
      : 'Tanggal belum ditentukan';
    const list = document.getElementById('schedule-view-list');
    const rows = schedule.songs.map((entry, index) => {
      const song = getEffectiveScheduledSong(entry);
      return `<li class="schedule-song-row" data-entry-id="${escapeText(entry.entryId)}">
        <button type="button" class="schedule-drag-handle" aria-label="Seret untuk mengurutkan lagu" title="Seret untuk mengatur urutan">&#8942;</button>
        <span class="schedule-song-order">${index + 1}</span>
        <button type="button" class="schedule-song-name" data-action="preview-song" title="Buka preview">${escapeText(song.category)} ${escapeText(song.number)} - ${escapeText(song.title)}</button>
        <span class="schedule-song-actions">
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

  function renderScheduleTargets() {
    scheduleAddBar.hidden = schedules.length === 0;
    const previousId = activeScheduleId;
    targetScheduleSelect.replaceChildren();
    schedules.forEach((schedule) => {
      const option = document.createElement('option');
      option.value = schedule.id;
      option.textContent = schedule.title || 'Jadwal tanpa nama';
      targetScheduleSelect.append(option);
    });
    if (!schedules.some((schedule) => schedule.id === previousId)) activeScheduleId = schedules[0] ? schedules[0].id : '';
    targetScheduleSelect.value = activeScheduleId;
  }

  function addSchedule() {
    const date = todayString();
    const schedule = { id: `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, title: 'Ibadah Baru', date, songs: [] };
    schedules.push(schedule);
    activeScheduleId = schedule.id;
    saveSchedules();
    renderSchedules();
    renderList();
    const titleInput = scheduleList.querySelector('.schedule-card:last-child .schedule-title-input');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }

  function addSongToSchedule(songId) {
    const schedule = schedules.find((item) => item.id === activeScheduleId);
    const song = songs.find((item) => item.id === songId);
    if (!schedule || !song) return;
    schedule.songs.push(createScheduledEntry(song));
    schedule.isOpen = true;
    saveSchedules();
    renderSchedules();
    scheduleStatus.textContent = `${song.title} ditambahkan ke "${schedule.title || 'Jadwal tanpa nama'}".`;
  }

  function handleCollectionClick(event) {
    const addButton = event.target.closest('[data-add-song]');
    if (!addButton) return;
    event.preventDefault();
    event.stopPropagation();
    addSongToSchedule(addButton.dataset.addSong);
  }

  function createScheduledEntry(song) {
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
      contentHtml: song.contentHtml || '',
      images: song.images && typeof song.images === 'object' ? song.images : {},
      overrides: {}
    };
  }

  function getEffectiveScheduledSong(entry) {
    // Entries created before local snapshots only contain a spreadsheet song ID.
    // Use the cached library record as their base, then apply the schedule copy.
    const sourceSong = songs.find((song) => song.id === entry.id) || {};
    return { ...sourceSong, ...entry, ...(entry.overrides || {}) };
  }

  function handleScheduleClick(event) {
    const button = event.target.closest('button[data-action]');
    const card = event.target.closest('.schedule-card');
    if (!card) return;
    const scheduleIndex = schedules.findIndex((item) => item.id === card.dataset.scheduleId);
    if (scheduleIndex < 0) return;
    const schedule = schedules[scheduleIndex];
    const action = button ? button.dataset.action : '';

    if (action === 'view-schedule') {
      renderScheduleView(schedule.id);
      if (!scheduleViewDialog.open) scheduleViewDialog.showModal();
      return;
    } else if (action === 'delete-schedule') {
      schedules.splice(scheduleIndex, 1);
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
    if (event.target.closest('button')) return;
    const row = event.target.closest('.schedule-song-row');
    const card = row && row.closest('.schedule-card');
    if (!row || !card) return;
    const schedule = schedules.find((item) => item.id === card.dataset.scheduleId);
    const entry = schedule && schedule.songs.find((item) => item.entryId === row.dataset.entryId);
    if (entry) openScheduledSong(schedule, entry);
  }

  function openScheduledSong(schedule, entry) {
    const queue = schedule.songs.map(getEffectiveScheduledSong);
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
    saveSchedules();
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

  function setCollectionCollapsed(collapsed) {
    if (collapsed && search.value.trim()) return;
    isCollectionCollapsed = collapsed;
    collectionResults.hidden = collapsed;
    collapseCollectionButton.setAttribute('aria-expanded', String(!collapsed));
    collapseCollectionButton.title = collapsed ? 'Tampilkan koleksi' : 'Ciutkan koleksi';
    collapseCollectionButton.textContent = collapsed ? '\u2304' : '\u2303';
  }

  function handleSearchInput() {
    if (search.value.trim()) setCollectionCollapsed(false);
    renderList();
  }
  function handleScheduleInput(event) {
    const input = event.target.closest('input[data-field]');
    const card = event.target.closest('.schedule-card');
    if (!input || !card) return;
    const schedule = schedules.find((item) => item.id === card.dataset.scheduleId);
    if (!schedule) return;
    schedule[input.dataset.field] = input.value;
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
      const number = escapeText(song.number);
      const categoryLabel = CATEGORIES.find((entry) => entry.code === song.category);
      const extra = [song.genre, song.songCreator, song.dateCreate, formatTempo(song.tempo)].filter(Boolean).map(escapeText).join('<span aria-hidden="true">&#183;</span>');
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'song-card-main';
      openButton.setAttribute('aria-label', `Buka ${song.category} ${song.number}, ${song.title}`);
      openButton.innerHTML = `<span class="song-index">${number || '&#9835;'}</span><span class="song-details"><span class="song-title">${escapeText(song.title)}</span><span class="song-subtitle"><span class="song-category">${escapeText(song.category)} &#183; ${escapeText(categoryLabel ? categoryLabel.label : '')}</span>${song.key ? `<span class="song-key">${escapeText(song.key)}</span>` : ''}${extra}</span></span><span class="song-open" aria-hidden="true">&#8250;</span>`;
      openButton.addEventListener('click', () => openSong(song));
      card.append(openButton);
      if (schedules.length) {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-to-schedule';
        addButton.dataset.addSong = song.id;
        addButton.setAttribute('aria-label', `Tambahkan ${song.title} ke jadwal terpilih`);
        addButton.title = 'Tambahkan ke jadwal terpilih';
        addButton.textContent = '+';
        card.append(addButton);
      }
      fragment.append(card);
    });
    songList.append(fragment);
  }

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

  function openSong(song, queue = songs, queueIndex) {
    currentPreviewSongs = queue;
    currentSongIndex = Number.isInteger(queueIndex)
      ? queueIndex
      : queue.findIndex((item) => item === song || item.id === song.id);
    currentPreviewSong = song;
    previewZoom = 1;
    renderScoreInstruments(song.images);
    sourcePreviewKey = normalizeKey(song.key || 'C');
    selectedPreviewKey = sourcePreviewKey;
    populateTransposeKeys();
    transposeControls.hidden = chordModeSelect.value !== 'letters';
    document.getElementById('dialog-category').textContent = `${song.category} · ${(CATEGORIES.find((entry) => entry.code === song.category) || {}).label || ''}`;
    document.getElementById('dialog-title').textContent = `${song.number ? `${song.number}. ` : ''}${song.title}`;
    renderPreviewMetadata();
    renderSongContent();
    document.getElementById('reader-position').textContent = `${String(currentSongIndex + 1).padStart(2, '0')} / ${String(queue.length).padStart(2, '0')}`;
    document.getElementById('previous-song').disabled = currentSongIndex <= 0;
    document.getElementById('next-song').disabled = currentSongIndex < 0 || currentSongIndex >= queue.length - 1;
    if (!dialog.open) dialog.showModal();
    scheduleSongFit();
    preview.scrollTop = 0;
    preview.scrollLeft = 0;
    document.getElementById('close-dialog').focus();
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
    const content = safeSongFragment(currentPreviewSong.contentHtml);
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
      const showFullImage = () => openFullScoreImage(instrument, index);
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

  function openFullScoreImage(instrument, index) {
    const files = currentPreviewSong?.images?.[instrument];
    if (!Array.isArray(files) || !files[index]) return;
    activeScoreInstrument = instrument;
    activeScoreFiles = files;
    activeScoreIndex = index;
    renderFullScoreImage();
    if (!scoreImageDialog.open) scoreImageDialog.showModal();
  }

  function renderFullScoreImage() {
    const file = activeScoreFiles[activeScoreIndex];
    const urls = scoreImageCandidates(file);
    if (!urls.length) return;
    fullScoreImage.dataset.candidates = JSON.stringify(urls);
    fullScoreImage.dataset.attempt = '0';
    fullScoreImage.src = urls[0];
    fullScoreImage.alt = `Partitur ${activeScoreInstrument}, halaman ${activeScoreIndex + 1}`;
    scoreImagePosition.textContent = `${activeScoreIndex + 1} / ${activeScoreFiles.length}`;
    const multiple = activeScoreFiles.length > 1;
    scoreImagePrevious.hidden = !multiple;
    scoreImageNext.hidden = !multiple;
    scoreImagePrevious.disabled = activeScoreIndex === 0;
    scoreImageNext.disabled = activeScoreIndex === activeScoreFiles.length - 1;
    scoreImagePosition.hidden = !multiple;
    scoreImageDialog.scrollTop = 0;
    scoreImageDialog.scrollLeft = 0;
  }

  function moveFullScoreImage(direction) {
    const nextIndex = activeScoreIndex + direction;
    if (nextIndex < 0 || nextIndex >= activeScoreFiles.length) return;
    activeScoreIndex = nextIndex;
    renderFullScoreImage();
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
    const source = typeof file === 'string' ? file : String((file && file.url) || '');
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
    const sharpKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatKeys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const useFlats = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'].includes(info.root);
    const options = (useFlats ? flatKeys : sharpKeys).map((root) => `${root}${info.minor ? 'm' : ''}`);
    transposeKeySelect.replaceChildren(...options.map((key) => new Option(key, key)));
    transposeKeySelect.value = options[info.pitch] || options[0];
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
    const names = ['C', 'C#', 'D', parsed.root.includes('b') ? 'Eb' : 'D#', 'E', 'F', parsed.root.includes('b') ? 'Gb' : 'F#', 'G', parsed.root.includes('b') ? 'Ab' : 'G#', 'A', parsed.root.includes('b') ? 'Bb' : 'A#', 'B'];
    return names[((pitch % 12) + 12) % 12];
  }

  function parseNumberChord(token) {
    const match = token.match(/^([b#]?)([1-7])([^/]*)(?:\/([b#]?[1-7]))?$/i);
    return match ? { accidental: match[1], degree: Number(match[2]), quality: match[3], bass: match[4] || '' } : null;
  }

  function parseLetterChord(token) {
    const match = token.match(/^([A-G])([#b]?)([^/]*)(?:\/([A-G][#b]?))?$/i);
    return match ? { root: `${match[1].toUpperCase()}${match[2]}`, quality: match[3], bass: match[4] || '' } : null;
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
    const quality = chord.quality || defaultQualities[chord.degree - 1];
    const root = pitchName(degreePitch(chord.degree, key, chord.accidental), key);
    const bassMatch = chord.bass.match(/^([b#]?)([1-7])$/);
    const bass = bassMatch ? `/${pitchName(degreePitch(Number(bassMatch[2]), key, bassMatch[1]), key)}` : '';
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
      const lines = body.textContent.split(/(\r?\n)/);
      body.textContent = lines.map((line) => {
        if (/^\r?\n$/.test(line) || !line.trim()) return line;
        const tokens = line.trim().split(/\s+/);
        const chordLine = tokens.length > 0 && tokens.every((token) => parseNumberChord(token) || parseLetterChord(token));
        return chordLine ? line.replace(/\S+/g, (token) => mapChordToken(token, mode, fromKey, toKey)) : line;
      }).join('');
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
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.getElementById('close-score-image').addEventListener('click', () => scoreImageDialog.close());
  scoreImageDialog.addEventListener('click', (event) => { if (event.target === scoreImageDialog) scoreImageDialog.close(); });
  scoreImageDialog.addEventListener('close', () => {
    chordModeSelect.value = 'numbers';
    transposeControls.hidden = true;
    renderPreviewMetadata();
    renderSongContent();
  });
  scoreImagePrevious.addEventListener('click', () => moveFullScoreImage(-1));
  scoreImageNext.addEventListener('click', () => moveFullScoreImage(1));
  fullScoreImage.addEventListener('error', () => {
    const urls = JSON.parse(fullScoreImage.dataset.candidates || '[]');
    const attempt = Number(fullScoreImage.dataset.attempt || 0) + 1;
    fullScoreImage.dataset.attempt = String(attempt);
    if (attempt < urls.length) fullScoreImage.src = urls[attempt];
  });
  scoreImageDialog.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) scoreSwipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  scoreImageDialog.addEventListener('touchend', (event) => {
    if (!scoreSwipeStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - scoreSwipeStart.x;
    const dy = event.changedTouches[0].clientY - scoreSwipeStart.y;
    scoreSwipeStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) moveFullScoreImage(dx < 0 ? 1 : -1);
  }, { passive: true });
  scoreImageDialog.addEventListener('keydown', (event) => {
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
    else openScoreInstrument(button.dataset.instrument);
  });
  closeScorePreviewButton.addEventListener('click', closeScorePreview);
  scorePages.addEventListener('scroll', updateScoreCarouselControls, { passive: true });
  document.getElementById('score-previous').addEventListener('click', () => moveScorePage(-1));
  document.getElementById('score-next').addEventListener('click', () => moveScorePage(1));
  refreshButton.addEventListener('click', loadSongs);
  document.getElementById('create-schedule').addEventListener('click', addSchedule);
  scheduleList.addEventListener('click', handleScheduleClick);
  scheduleList.addEventListener('input', handleScheduleInput);
  scheduleViewDialog.addEventListener('click', handleScheduleClick);
  scheduleViewList.addEventListener('click', handleScheduleRowClick);
  document.getElementById('close-schedule-view').addEventListener('click', () => scheduleViewDialog.close());
  scheduleViewDialog.addEventListener('click', (event) => { if (event.target === scheduleViewDialog) scheduleViewDialog.close(); });
  document.getElementById('delete-viewed-schedule').addEventListener('click', () => {
    const index = schedules.findIndex((item) => item.id === viewedScheduleId);
    if (index < 0) return;
    schedules.splice(index, 1);
    saveSchedules();
    renderSchedules();
    renderList();
    scheduleViewDialog.close();
  });
  songList.addEventListener('click', handleCollectionClick);
  targetScheduleSelect.addEventListener('change', () => { activeScheduleId = targetScheduleSelect.value; });
  search.addEventListener('input', handleSearchInput);
  collapseCollectionButton.addEventListener('click', () => setCollectionCollapsed(!isCollectionCollapsed));
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
  const hasCache = loadCachedSongs();
  if (!hasCache) {
    count.textContent = '0';
    setStatus('Belum ada data lokal. Tekan "Perbarui data" untuk memuat lagu dari database.');
    setSyncStatus('Belum disinkronkan');
  }
})();


