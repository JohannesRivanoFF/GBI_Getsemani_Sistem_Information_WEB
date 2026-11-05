/**
 * app-umkm.js — Frontend publik untuk seksi UMKM Jemaat GBI Getsemani
 * Fitur: Fetch data aktif, render grid card, search real-time, filter kategori
 */

(function () {
  'use strict';

  // ---- State ----
  let allUmkm = [];
  let searchQuery = '';
  let filterKategori = '';

  // ---- DOM Refs ----
  const grid      = document.getElementById('umkmGrid');
  const emptyBox  = document.getElementById('umkmEmpty');
  const searchInp = document.getElementById('umkmSearchInput');
  const filterSel = document.getElementById('umkmFilterKategori');

  if (!grid) return; // Section belum ada di halaman ini

  // ---- Kategori → emoji + warna badge ----
  const KATEGORI_META = {
    kuliner:    { emoji: '🍽️', color: '#f97316' },
    fashion:    { emoji: '👗', color: '#ec4899' },
    jasa:       { emoji: '🔧', color: '#3b82f6' },
    sembako:    { emoji: '🛒', color: '#22c55e' },
    elektronik: { emoji: '📱', color: '#8b5cf6' },
    pertanian:  { emoji: '🌱', color: '#16a34a' },
    kerajinan:  { emoji: '🎨', color: '#f59e0b' },
    lainnya:    { emoji: '📦', color: '#6b7280' },
  };

  function getKatMeta(kat) {
    const key = (kat || 'lainnya').toLowerCase();
    return KATEGORI_META[key] || KATEGORI_META['lainnya'];
  }

  // ---- Fetch ----
  async function fetchUmkm() {
    try {
      const res = await fetch('./api/umkm.php');
      const result = await res.json();
      allUmkm = result.data || [];
      renderUmkm();
    } catch (err) {
      grid.innerHTML = `<div class="umkm-fetch-error">
        <span>⚠️</span>
        <p>Gagal memuat data UMKM. Pastikan server aktif.</p>
      </div>`;
    }
  }

  // ---- Render ----
  function renderUmkm() {
    const q   = searchQuery.toLowerCase().trim();
    const kat = filterKategori.toLowerCase().trim();

    let list = allUmkm.filter(item => {
      const matchQ = !q
        || (item.nama_usaha  || '').toLowerCase().includes(q)
        || (item.nama_pemilik|| '').toLowerCase().includes(q)
        || (item.deskripsi   || '').toLowerCase().includes(q);
      const matchKat = !kat || (item.kategori || '').toLowerCase() === kat;
      return matchQ && matchKat;
    });

    emptyBox.style.display = list.length === 0 ? 'flex' : 'none';

    if (list.length === 0) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = list.map(item => buildCard(item)).join('');
  }

  function buildCard(item) {
    const meta     = getKatMeta(item.kategori);
    const waNumber = (item.no_wa || '').replace(/[^0-9]/g, '');
    const waText   = encodeURIComponent(
      `Halo, saya tertarik dengan usaha "${item.nama_usaha}" yang saya temukan di website GBI Getsemani. Boleh saya bertanya lebih lanjut?`
    );
    const waLink   = `https://wa.me/${waNumber}?text=${waText}`;

    // Gambar: handle path relatif dari root index.html
    let imgSrc = item.gambar || '';
    if (imgSrc.startsWith('./Resource/')) {
      imgSrc = imgSrc; // Sudah benar relatif ke root
    }

    const nameParts = (item.nama_pemilik || '').split(' ');
    const initials  = nameParts.slice(0, 2).map(p => p[0]).join('').toUpperCase();

    return `
      <article class="umkm-card" data-id="${escUmkm(item.id)}">
        <div class="umkm-card-media">
          ${imgSrc
            ? `<img src="${escUmkm(imgSrc)}" alt="${escUmkm(item.nama_usaha)}" loading="lazy" onerror="this.parentElement.classList.add('no-img'); this.remove();" />`
            : ''
          }
          <div class="umkm-no-img-placeholder" aria-hidden="true">${initials || '🏪'}</div>
          <span class="umkm-badge" style="background: ${meta.color}20; color: ${meta.color}; border-color: ${meta.color}40;">
            ${meta.emoji} ${escUmkm(item.kategori)}
          </span>
        </div>
        <div class="umkm-card-body">
          <h3 class="umkm-card-title">${escUmkm(item.nama_usaha)}</h3>
          <p class="umkm-card-owner">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            ${escUmkm(item.nama_pemilik || '—')}
          </p>
          ${item.alamat ? `<p class="umkm-card-addr">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${escUmkm(item.alamat)}
          </p>` : ''}
          <p class="umkm-card-desc">${escUmkm(item.deskripsi || '')}</p>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="umkm-cta-btn" id="umkm-wa-${escUmkm(item.id)}">
            <svg viewBox="0 0 448 512" width="17" height="17" fill="currentColor">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
            </svg>
            Hubungi via WhatsApp
          </a>
        </div>
      </article>
    `;
  }

  // ---- XSS Helper ----
  function escUmkm(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---- Events ----
  let debounceTimer;
  searchInp && searchInp.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value;
      renderUmkm();
    }, 250);
  });

  filterSel && filterSel.addEventListener('change', e => {
    filterKategori = e.target.value;
    renderUmkm();
  });

  // ---- Init ----
  fetchUmkm();
})();
