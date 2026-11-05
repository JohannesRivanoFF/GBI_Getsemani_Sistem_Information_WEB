/**
 * app-pengumuman.js — Frontend Publik Pengumuman Gereja GBI Getsemani
 * Fitur: Card / Slider dinamis dari API admin, kartu pinned di paling atas dengan
 * penanda visual khusus, filter kategori, slider nav, dan modal "Baca Selengkapnya".
 */

(function () {
  'use strict';

  // ---- State ----
  let announcements = [];
  let currentCategory = 'semua';

  // ---- DOM Refs ----
  const sectionEl       = document.getElementById('pengumuman');
  const pinnedContainer = document.getElementById('pengumumanPinnedContainer');
  const sliderTrack     = document.getElementById('pengumumanSliderTrack');
  const emptyNotice     = document.getElementById('pengumumanEmptyNotice');
  const filterTabsWrap  = document.getElementById('pengumumanFilterTabs');
  const btnPrev         = document.getElementById('pengumumanBtnPrev');
  const btnNext         = document.getElementById('pengumumanBtnNext');

  // Modal Refs
  const modalEl         = document.getElementById('modalPengumumanDetail');
  const modalCategory   = document.getElementById('pengumumanDetailCategory');
  const modalPinnedTag  = document.getElementById('pengumumanDetailPinnedTag');
  const modalDate       = document.getElementById('pengumumanDetailDate');
  const modalTitle      = document.getElementById('pengumumanDetailTitle');
  const modalBody       = document.getElementById('pengumumanDetailBody');
  const modalCloseBtn   = document.getElementById('pengumumanDetailClose');
  const modalBackdrop   = document.getElementById('pengumumanDetailBackdrop');
  const modalShareBtn   = document.getElementById('pengumumanDetailShareBtn');

  if (!sectionEl) return;

  // Helper Escape HTML
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format Tanggal Indonesia
  function formatTgl(dateStr) {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${day} ${months[month]} ${year}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  // Helper Category Color & Icon
  function getCategoryMeta(cat) {
    const c = (cat || 'Umum').toLowerCase();
    if (c.includes('ibadah')) {
      return { label: cat, icon: '⛪', bg: 'rgba(59, 130, 246, 0.16)', border: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa' };
    }
    if (c.includes('pemuda') || c.includes('youth') || c.includes('remaja')) {
      return { label: cat, icon: '🔥', bg: 'rgba(168, 85, 247, 0.16)', border: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' };
    }
    if (c.includes('sosial') || c.includes('bakti') || c.includes('peduli')) {
      return { label: cat, icon: '🤝', bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.35)', color: '#34d399' };
    }
    if (c.includes('doa') || c.includes('puasa')) {
      return { label: cat, icon: '🙏', bg: 'rgba(239, 68, 68, 0.16)', border: 'rgba(239, 68, 68, 0.35)', color: '#f87171' };
    }
    if (c.includes('pelayanan')) {
      return { label: cat, icon: '✨', bg: 'rgba(20, 184, 166, 0.16)', border: 'rgba(20, 184, 166, 0.35)', color: '#2dd4bf' };
    }
    return { label: cat, icon: '📢', bg: 'rgba(255, 158, 32, 0.16)', border: 'rgba(255, 158, 32, 0.35)', color: '#ff9e20' };
  }

  // ---- Fetch Data ----
  async function fetchAnnouncements() {
    try {
      const res = await fetch('./api/pengumuman.php');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        announcements = data.data;
        renderAll();
      } else {
        renderError();
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      renderError();
    }
  }

  function renderError() {
    if (sliderTrack) {
      sliderTrack.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-muted); width: 100%;">
          <p>Belum dapat memuat warta pengumuman saat ini.</p>
        </div>
      `;
    }
  }

  // ---- Render Main Logic ----
  function renderAll() {
    const cat = currentCategory.toLowerCase();

    // Filter by category
    const filtered = announcements.filter(item => {
      if (cat === 'semua' || cat === '') return true;
      return (item.category || '').toLowerCase() === cat;
    });

    // Pinned announcements vs standard announcements
    const pinnedItems = filtered.filter(item => !!item.is_pinned);
    const standardItems = filtered.filter(item => !item.is_pinned);

    // 1. Render Pinned Cards (Ditampilkan paling atas dengan penanda visual khusus)
    renderPinned(pinnedItems);

    // 2. Render Slider / Cards
    renderSlider(standardItems, pinnedItems);

    // Handle Empty state
    if (filtered.length === 0) {
      if (emptyNotice) emptyNotice.style.display = 'block';
      if (sliderTrack) sliderTrack.style.display = 'none';
      if (pinnedContainer) pinnedContainer.style.display = 'none';
    } else {
      if (emptyNotice) emptyNotice.style.display = 'none';
      if (sliderTrack) sliderTrack.style.display = 'flex';
      if (pinnedContainer && pinnedItems.length > 0) pinnedContainer.style.display = 'grid';
    }
  }

  // ---- Render Pinned Section (Top Visual Highlight) ----
  function renderPinned(items) {
    if (!pinnedContainer) return;

    if (items.length === 0) {
      pinnedContainer.innerHTML = '';
      pinnedContainer.style.display = 'none';
      return;
    }

    pinnedContainer.style.display = 'grid';
    pinnedContainer.innerHTML = items.map(item => {
      const meta = getCategoryMeta(item.category);
      const summaryText = item.summary || (item.content ? item.content.substring(0, 140) + '...' : '');

      return `
        <article class="pengumuman-pinned-card" data-id="${esc(item.id)}">
          <div class="pinned-banner-indicator">
            <span class="pinned-pulse-dot"></span>
            <span class="pinned-badge-text">📌 PENGUMUMAN PENTING (PINNED)</span>
          </div>
          <div class="pinned-card-inner">
            <div class="pinned-meta-row">
              <span class="pengumuman-badge-cat" style="background:${meta.bg}; border-color:${meta.border}; color:${meta.color};">
                ${meta.icon} ${esc(item.category || 'Umum')}
              </span>
              <span class="pengumuman-card-date">
                📅 ${esc(formatTgl(item.date))}
              </span>
            </div>
            <h3 class="pinned-card-title">${esc(item.title)}</h3>
            <p class="pinned-card-desc">${esc(summaryText)}</p>
            <div class="pinned-card-footer">
              <button type="button" class="btn-read-more btn-read-more-pinned" data-id="${esc(item.id)}">
                <span>Baca Selengkapnya</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events
    pinnedContainer.querySelectorAll('.pengumuman-pinned-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-id');
        openDetailModal(id);
      });
    });
  }

  // ---- Render Slider / Grid Cards ----
  function renderSlider(standardItems, pinnedItems) {
    if (!sliderTrack) return;

    // In slider, we can display standard items. If no standard items, we can show message or display all items.
    const displayList = standardItems.length > 0 ? standardItems : (pinnedItems.length > 0 ? [] : []);

    if (displayList.length === 0 && pinnedItems.length > 0) {
      sliderTrack.innerHTML = '';
      sliderTrack.style.display = 'none';
      return;
    }

    sliderTrack.style.display = 'flex';
    sliderTrack.innerHTML = displayList.map(item => {
      const meta = getCategoryMeta(item.category);
      const summaryText = item.summary || (item.content ? item.content.substring(0, 110) + '...' : '');

      return `
        <article class="pengumuman-slide-card" data-id="${esc(item.id)}">
          <div class="slide-card-header">
            <span class="pengumuman-badge-cat" style="background:${meta.bg}; border-color:${meta.border}; color:${meta.color};">
              ${meta.icon} ${esc(item.category || 'Umum')}
            </span>
            <span class="pengumuman-card-date">
              📅 ${esc(formatTgl(item.date))}
            </span>
          </div>
          <div class="slide-card-body">
            <h3 class="slide-card-title">${esc(item.title)}</h3>
            <p class="slide-card-desc">${esc(summaryText)}</p>
          </div>
          <div class="slide-card-footer">
            <button type="button" class="btn-read-more" data-id="${esc(item.id)}">
              <span>Baca Selengkapnya</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events
    sliderTrack.querySelectorAll('.pengumuman-slide-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        openDetailModal(id);
      });
    });
  }

  // ---- Open Detail Modal ----
  function openDetailModal(id) {
    const item = announcements.find(a => a.id === id);
    if (!item || !modalEl) return;

    const meta = getCategoryMeta(item.category);

    modalCategory.textContent = `${meta.icon} ${item.category || 'Umum'}`;
    modalCategory.style.background = meta.bg;
    modalCategory.style.borderColor = meta.border;
    modalCategory.style.color = meta.color;

    if (item.is_pinned) {
      modalPinnedTag.style.display = 'inline-flex';
    } else {
      modalPinnedTag.style.display = 'none';
    }

    modalDate.textContent = `📅 ${formatTgl(item.date)}`;
    modalTitle.textContent = item.title;

    // Format content: convert multiple newlines into paragraphs
    const paragraphs = (item.content || item.summary || '')
      .split(/\n\s*\n/)
      .map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        // If line starts with bullet / dash
        if (trimmed.includes('\n•') || trimmed.includes('\n-')) {
          const lines = trimmed.split('\n');
          return lines.map(line => `<p style="margin-bottom: 6px;">${esc(line)}</p>`).join('');
        }
        return `<p style="margin-bottom: 14px; line-height: 1.7;">${esc(trimmed).replace(/\n/g, '<br>')}</p>`;
      })
      .join('');

    modalBody.innerHTML = paragraphs || '<p>Tidak ada rincian tambahan.</p>';

    // Configure WhatsApp share button
    if (modalShareBtn) {
      const shareText = encodeURIComponent(
        `📢 *${item.title}*\n` +
        `Tanggal: ${formatTgl(item.date)}\n` +
        `Kategori: ${item.category}\n\n` +
        `${item.summary || (item.content ? item.content.substring(0, 160) + '...' : '')}\n\n` +
        `Informasi resmi GBI Getsemani: ${window.location.origin}${window.location.pathname}#pengumuman`
      );
      modalShareBtn.href = `https://wa.me/?text=${shareText}`;
    }

    modalEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  // ---- Close Detail Modal ----
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('is-open')) {
      closeModal();
    }
  });

  // ---- Slider Navigation Buttons ----
  if (btnPrev && sliderTrack) {
    btnPrev.addEventListener('click', () => {
      const scrollAmount = sliderTrack.clientWidth * 0.8;
      sliderTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (btnNext && sliderTrack) {
    btnNext.addEventListener('click', () => {
      const scrollAmount = sliderTrack.clientWidth * 0.8;
      sliderTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // ---- Filter Tabs ----
  if (filterTabsWrap) {
    const filterButtons = filterTabsWrap.querySelectorAll('.pengumuman-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentCategory = btn.getAttribute('data-category') || 'semua';
        renderAll();
      });
    });
  }

  // ---- Init on Load ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAnnouncements);
  } else {
    fetchAnnouncements();
  }
})();
