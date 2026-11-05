/**
 * admin-pengumuman.js — Modul Admin Pengumuman Gereja GBI Getsemani
 * Fitur: Form Tambah/Edit (Judul, Tanggal, Ringkasan, Kategori, Switch Toggle Pinned),
 * Tabel daftar pengumuman, Aksi Edit, Hapus, Fast Toggle Pin, dan Filter/Search.
 */

// ---- State ----
let pengumumanList = [];
let pengumumanFilter = {
  keyword: '',
  category: '',
  pinned: ''
};

const PENGUMUMAN_API = '../api/pengumuman.php';

// ---- DOM Elements ----
const tabPengumumanBtn     = document.getElementById('tabPengumumanBtn');
const tabPengumumanSection = document.getElementById('tabPengumumanSection');
const pengumumanTableBody  = document.getElementById('pengumumanTableBody');
const pengumumanSearch     = document.getElementById('pengumumanSearch');
const pengumumanFilterCat  = document.getElementById('pengumumanFilterCat');
const pengumumanFilterPin  = document.getElementById('pengumumanFilterPin');

// Stats
const statTotalPengumuman  = document.getElementById('statTotalPengumuman');
const statPinnedPengumuman = document.getElementById('statPinnedPengumuman');
const statIbadahPengumuman = document.getElementById('statIbadahPengumuman');
const statOtherPengumuman  = document.getElementById('statOtherPengumuman');

// Modal Elements
const modalPengumuman      = document.getElementById('modalPengumuman');
const formPengumuman       = document.getElementById('formPengumuman');
const modalPengumumanTitle = document.getElementById('modalPengumumanTitle');
const pengumumanId         = document.getElementById('pengumumanId');
const pengumumanTitle      = document.getElementById('pengumumanTitle');
const pengumumanDate       = document.getElementById('pengumumanDate');
const pengumumanCategory   = document.getElementById('pengumumanCategory');
const pengumumanIsPinned   = document.getElementById('pengumumanIsPinned');
const pengumumanSummary    = document.getElementById('pengumumanSummary');
const pengumumanContent    = document.getElementById('pengumumanContent');
const modalPengumumanClose = document.getElementById('modalPengumumanClose');
const modalPengumumanCancel= document.getElementById('modalPengumumanCancel');

// ---- Helper Escape HTML ----
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format Tanggal Indonesia (YYYY-MM-DD -> DD MMMM YYYY)
function formatTanggalIndo(dateStr) {
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

// Helper category badge class
function getCategoryBadgeClass(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ibadah')) return 'badge-cat-ibadah';
  if (cat.includes('pemuda') || cat.includes('youth') || cat.includes('remaja')) return 'badge-cat-pemuda';
  if (cat.includes('sosial') || cat.includes('bakti') || cat.includes('peduli')) return 'badge-cat-baksos';
  if (cat.includes('doa') || cat.includes('puasa')) return 'badge-cat-doa';
  if (cat.includes('pelayanan')) return 'badge-cat-pelayanan';
  return 'badge-cat-umum';
}

// ---- Tab Switching Integration ----
function switchToPengumumanTab() {
  if (typeof window.switchAdminTab === 'function') {
    window.switchAdminTab('pengumuman');
  } else {
    ['tabKegiatanSection', 'tabKhotbahSection', 'tabUmkmSection', 'tabPersembahanSection', 'tabBaptisanSection'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    ['tabKegiatanBtn', 'tabKhotbahBtn', 'tabUmkmBtn', 'tabPersembahanBtn', 'tabBaptisanBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    if (tabPengumumanBtn) tabPengumumanBtn.classList.add('active');
    if (tabPengumumanSection) tabPengumumanSection.style.display = 'block';
    fetchPengumuman();
  }
}

if (tabPengumumanBtn) {
  tabPengumumanBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToPengumumanTab();
  });
}

// ---- Fetch Data ----
async function fetchPengumuman() {
  try {
    const res = await fetch(PENGUMUMAN_API);
    const result = await res.json();
    if (result.success) {
      pengumumanList = result.data || [];
      updatePengumumanStats();
      renderPengumumanTable();
    } else {
      if (typeof showToast === 'function') {
        showToast(result.message || 'Gagal memuat pengumuman', 'error');
      }
    }
  } catch (err) {
    console.error('Error fetching pengumuman:', err);
    if (typeof showToast === 'function') {
      showToast('Gagal terhubung ke server pengumuman', 'error');
    }
  }
}

// ---- Update Stats Bar ----
function updatePengumumanStats() {
  if (!statTotalPengumuman) return;
  const total = pengumumanList.length;
  const pinned = pengumumanList.filter(item => !!item.is_pinned).length;
  const ibadah = pengumumanList.filter(item => (item.category || '').toLowerCase().includes('ibadah')).length;
  const others = total - ibadah;

  statTotalPengumuman.textContent = total;
  statPinnedPengumuman.textContent = pinned;
  statIbadahPengumuman.textContent = ibadah;
  statOtherPengumuman.textContent = others;
  const badge = document.getElementById('badgePengumuman');
  if (badge) badge.textContent = total;
}

// ---- Render Table ----
function renderPengumumanTable() {
  if (!pengumumanTableBody) return;

  const keyword = (pengumumanFilter.keyword || '').toLowerCase().trim();
  const cat = (pengumumanFilter.category || '').toLowerCase().trim();
  const pin = pengumumanFilter.pinned;

  const filtered = pengumumanList.filter(item => {
    // Keyword match
    const matchKw = !keyword ||
      (item.title || '').toLowerCase().includes(keyword) ||
      (item.summary || '').toLowerCase().includes(keyword) ||
      (item.content || '').toLowerCase().includes(keyword) ||
      (item.category || '').toLowerCase().includes(keyword);

    // Category match
    const matchCat = !cat || (item.category || '').toLowerCase() === cat;

    // Pinned match
    let matchPin = true;
    if (pin === '1') {
      matchPin = !!item.is_pinned;
    } else if (pin === '0') {
      matchPin = !item.is_pinned;
    }

    return matchKw && matchCat && matchPin;
  });

  if (filtered.length === 0) {
    pengumumanTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📢</div>
          <p style="font-size: 1rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Tidak ada pengumuman ditemukan</p>
          <p style="font-size: 0.85rem;">Coba sesuaikan kata kunci pencarian atau tambah pengumuman baru.</p>
        </td>
      </tr>
    `;
    return;
  }

  pengumumanTableBody.innerHTML = filtered.map(item => {
    const isPinned = !!item.is_pinned;
    const catBadgeClass = getCategoryBadgeClass(item.category);
    const summaryText = item.summary || (item.content ? item.content.substring(0, 100) + '...' : '-');

    return `
      <tr style="${isPinned ? 'background: rgba(245, 158, 11, 0.04);' : ''}">
        <td>
          ${isPinned 
            ? `<span class="badge-pinned">📌 Pinned</span>` 
            : `<span class="badge-normal">Standar</span>`}
        </td>
        <td style="white-space: nowrap; font-size: 0.86rem; color: var(--text-muted);">
          📅 ${escHtml(formatTanggalIndo(item.date))}
        </td>
        <td>
          <strong style="color: ${isPinned ? '#fbbf24' : 'var(--text-main)'}; font-size: 0.95rem;">
            ${escHtml(item.title)}
          </strong>
        </td>
        <td>
          <span class="badge-cat ${catBadgeClass}">${escHtml(item.category || 'Umum')}</span>
        </td>
        <td style="max-width: 320px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
          ${escHtml(summaryText)}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="action-btn-group">
            <button type="button" class="btn-action-sm btn-pin-sm ${isPinned ? 'is-pinned' : ''}"
                    onclick="togglePinPengumuman('${item.id}')"
                    title="${isPinned ? 'Lepas Pin' : 'Sematkan di Atas (Pin)'}">
              ${isPinned ? '📌' : '📍'}
            </button>
            <button type="button" class="btn-action-sm btn-edit-sm"
                    onclick="openEditPengumuman('${item.id}')" title="Edit Pengumuman">
              ✏️ Edit
            </button>
            <button type="button" class="btn-action-sm btn-delete"
                    onclick="deletePengumuman('${item.id}')" title="Hapus Pengumuman">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- Modal Tambah Pengumuman ----
window.openAddPengumuman = function() {
  if (!modalPengumuman) return;
  if (formPengumuman) formPengumuman.reset();
  if (pengumumanId) pengumumanId.value = '';
  if (modalPengumumanTitle) modalPengumumanTitle.textContent = '+ Tambah Pengumuman Warta Baru';
  
  // Set default date to today (local time)
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  if (pengumumanDate) pengumumanDate.value = today;
  if (pengumumanIsPinned) pengumumanIsPinned.checked = false;
  
  const submitBtn = formPengumuman ? formPengumuman.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.textContent = '💾 Simpan Pengumuman';

  modalPengumuman.classList.add('active', 'show');
};

// ---- Modal Edit Pengumuman ----
window.openEditPengumuman = function(id) {
  const item = pengumumanList.find(p => p.id === id);
  if (!item || !modalPengumuman) return;

  if (pengumumanId) pengumumanId.value = item.id;
  if (pengumumanTitle) pengumumanTitle.value = item.title || '';
  if (pengumumanDate) pengumumanDate.value = item.date || '';
  if (pengumumanCategory) pengumumanCategory.value = item.category || 'Ibadah Minggu';
  if (pengumumanIsPinned) pengumumanIsPinned.checked = !!item.is_pinned;
  if (pengumumanSummary) pengumumanSummary.value = item.summary || '';
  if (pengumumanContent) pengumumanContent.value = item.content || '';

  if (modalPengumumanTitle) modalPengumumanTitle.textContent = '✏️ Edit Pengumuman Warta Jemaat';

  const submitBtn = formPengumuman ? formPengumuman.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.textContent = '💾 Simpan Perubahan Pengumuman';

  modalPengumuman.classList.add('active', 'show');
};

// ---- Tutup Modal ----
function closePengumumanModal() {
  if (modalPengumuman) {
    modalPengumuman.classList.remove('active', 'show');
  }
}

if (modalPengumumanClose) modalPengumumanClose.addEventListener('click', closePengumumanModal);
if (modalPengumumanCancel) modalPengumumanCancel.addEventListener('click', closePengumumanModal);

// Close on overlay click
if (modalPengumuman) {
  modalPengumuman.addEventListener('click', (e) => {
    if (e.target === modalPengumuman) closePengumumanModal();
  });
}

// ---- Simpan / Submit Form (Tambah & Edit) ----
if (formPengumuman) {
  formPengumuman.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = pengumumanId ? pengumumanId.value.trim() : '';
    const action = id ? 'update' : 'create';

    const payload = {
      action: action,
      id: id,
      title: pengumumanTitle ? pengumumanTitle.value.trim() : '',
      date: pengumumanDate ? pengumumanDate.value.trim() : '',
      category: pengumumanCategory ? pengumumanCategory.value.trim() : 'Umum',
      is_pinned: pengumumanIsPinned ? pengumumanIsPinned.checked : false,
      summary: pengumumanSummary ? pengumumanSummary.value.trim() : '',
      content: pengumumanContent ? pengumumanContent.value.trim() : ''
    };

    if (!payload.title) {
      if (typeof showToast === 'function') showToast('Judul pengumuman wajib diisi.', 'error');
      return;
    }

    try {
      const res = await fetch(PENGUMUMAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        if (typeof showToast === 'function') {
          showToast(result.message || 'Pengumuman berhasil disimpan!', 'success');
        }
        closePengumumanModal();
        fetchPengumuman();
      } else {
        if (typeof showToast === 'function') {
          showToast(result.message || 'Gagal menyimpan pengumuman.', 'error');
        }
      }
    } catch (err) {
      console.error('Error saving pengumuman:', err);
      if (typeof showToast === 'function') {
        showToast('Terjadi kesalahan jaringan.', 'error');
      }
    }
  });
}

// ---- Hapus Pengumuman ----
window.deletePengumuman = async function(id) {
  const item = pengumumanList.find(p => p.id === id);
  const title = item ? item.title : 'pengumuman ini';
  if (!confirm(`Apakah Anda yakin ingin menghapus "${title}"?`)) {
    return;
  }

  try {
    const res = await fetch(PENGUMUMAN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: id })
    });
    const result = await res.json();

    if (result.success) {
      if (typeof showToast === 'function') {
        showToast('Pengumuman berhasil dihapus!', 'success');
      }
      fetchPengumuman();
    } else {
      if (typeof showToast === 'function') {
        showToast(result.message || 'Gagal menghapus pengumuman.', 'error');
      }
    }
  } catch (err) {
    console.error('Error deleting pengumuman:', err);
    if (typeof showToast === 'function') {
      showToast('Terjadi kesalahan jaringan saat menghapus.', 'error');
    }
  }
};

// ---- Fast Toggle Pin ----
window.togglePinPengumuman = async function(id) {
  try {
    const res = await fetch(PENGUMUMAN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_pin', id: id })
    });
    const result = await res.json();

    if (result.success) {
      if (typeof showToast === 'function') {
        showToast(result.message, 'success');
      }
      fetchPengumuman();
    } else {
      if (typeof showToast === 'function') {
        showToast(result.message || 'Gagal mengubah status pin.', 'error');
      }
    }
  } catch (err) {
    console.error('Error toggling pin:', err);
  }
};

// ---- Filter & Search Listeners ----
if (pengumumanSearch) {
  pengumumanSearch.addEventListener('input', (e) => {
    pengumumanFilter.keyword = e.target.value;
    renderPengumumanTable();
  });
}

if (pengumumanFilterCat) {
  pengumumanFilterCat.addEventListener('change', (e) => {
    pengumumanFilter.category = e.target.value;
    renderPengumumanTable();
  });
}

if (pengumumanFilterPin) {
  pengumumanFilterPin.addEventListener('change', (e) => {
    pengumumanFilter.pinned = e.target.value;
    renderPengumumanTable();
  });
}

// Export Pengumuman CSV
window.exportPengumumanCsv = function() {
  if (!pengumumanList.length) {
    alert('Tidak ada data pengumuman untuk diexport.');
    return;
  }

  const headers = ['ID', 'Judul', 'Tanggal', 'Kategori', 'Status Pinned', 'Ringkasan', 'Isi Lengkap'];
  const rows = pengumumanList.map(item => [
    `"${(item.id || '').replace(/"/g, '""')}"`,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${item.date || ''}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    item.is_pinned ? '"PINNED"' : '"STANDAR"',
    `"${(item.summary || '').replace(/"/g, '""')}"`,
    `"${(item.content || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pengumuman-gbi-getsemani-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
