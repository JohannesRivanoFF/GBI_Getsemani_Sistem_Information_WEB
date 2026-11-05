/**
 * admin-umkm.js — Panel Admin: Modul UMKM Jemaat GBI Getsemani
 * CRUD lengkap + toggle aktif/sembunyikan
 */

// ---- State ----
let umkmList = [];

// ---- API Endpoint ----
const UMKM_API = '../api/umkm.php';

// ---- DOM Refs ----
const tabUmkmBtn     = document.getElementById('tabUmkmBtn');
const tabUmkmSection = document.getElementById('tabUmkmSection');
const umkmGrid       = document.getElementById('umkmGrid');
const modalUmkm      = document.getElementById('modalUmkm');
const formUmkm       = document.getElementById('formUmkm');
const modalUmkmTitle = document.getElementById('modalUmkmTitle');

// Form fields
const umkmId          = document.getElementById('umkmId');
const umkmNamaUsaha   = document.getElementById('umkmNamaUsaha');
const umkmKategori    = document.getElementById('umkmKategori');
const umkmNamaPemilik = document.getElementById('umkmNamaPemilik');
const umkmNoWa        = document.getElementById('umkmNoWa');
const umkmAlamat      = document.getElementById('umkmAlamat');
const umkmDeskripsi   = document.getElementById('umkmDeskripsi');
const umkmGambar      = document.getElementById('umkmGambar');
const umkmFile        = document.getElementById('umkmFile');
const umkmPreview     = document.getElementById('umkmPreview');
const umkmAktif       = document.getElementById('umkmAktif');

// Stats
const umkmStatTotal  = document.getElementById('umkmStatTotal');
const umkmStatAktif  = document.getElementById('umkmStatAktif');
const umkmStatHidden = document.getElementById('umkmStatHidden');

// ---- Tab Switching (extend existing admin.js tabs) ----
const existingKegiatanBtn = document.getElementById('tabKegiatanBtn');
const existingKhotbahBtn  = document.getElementById('tabKhotbahBtn');
const existingKegiatanSec = document.getElementById('tabKegiatanSection');
const existingKhotbahSec  = document.getElementById('tabKhotbahSection');

function switchToUmkmTab() {
  if (typeof window.switchAdminTab === 'function') {
    window.switchAdminTab('umkm');
  } else {
    ['tabKegiatanSection', 'tabKhotbahSection', 'tabPengumumanSection', 'tabPersembahanSection', 'tabBaptisanSection'].forEach(id => {
      const s = document.getElementById(id);
      if (s) s.style.display = 'none';
    });
    ['tabKegiatanBtn', 'tabKhotbahBtn', 'tabPengumumanBtn', 'tabPersembahanBtn', 'tabBaptisanBtn'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.classList.remove('active');
    });
    if (tabUmkmBtn) tabUmkmBtn.classList.add('active');
    if (tabUmkmSection) tabUmkmSection.style.display = 'block';
    fetchUmkm();
  }
}

if (tabUmkmBtn) {
  tabUmkmBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToUmkmTab();
  });
}

// ---- Fetch UMKM (admin mode = semua data termasuk hidden) ----
async function fetchUmkm() {
  try {
    umkmGrid.innerHTML = `<div class="empty-state"><p>Memuat data UMKM...</p></div>`;
    const res = await fetch(`${UMKM_API}?admin=1`);
    const result = await res.json();
    umkmList = result.data || [];
    renderUmkmAdmin();
    updateUmkmStats();
  } catch (err) {
    umkmGrid.innerHTML = `<div class="empty-state"><p style="color:#ef4444">⚠️ Gagal memuat data UMKM.</p></div>`;
    console.error(err);
  }
}

// ---- Update Stats ----
function updateUmkmStats() {
  const total  = umkmList.length;
  const aktif  = umkmList.filter(u => u.aktif).length;
  const hidden = total - aktif;
  if (umkmStatTotal)  umkmStatTotal.textContent  = total;
  if (umkmStatAktif)  umkmStatAktif.textContent  = aktif;
  if (umkmStatHidden) umkmStatHidden.textContent = hidden;
  const badge = document.getElementById('badgeUmkm');
  if (badge) badge.textContent = total;
}

// ---- Render Admin Grid ----
function renderUmkmAdmin() {
  if (!umkmList.length) {
    umkmGrid.innerHTML = `
      <div class="empty-state">
        <p>Belum ada data UMKM jemaat.</p>
        <button class="btn-primary" onclick="openAddUmkm()">+ Tambah UMKM Sekarang</button>
      </div>
    `;
    return;
  }

  umkmGrid.innerHTML = umkmList.map(item => {
    let displayImg = item.gambar || '';
    if (displayImg.startsWith('./')) displayImg = '../' + displayImg.substring(2);

    const isAktif     = !!item.aktif;
    const statusClass = isAktif ? 'umkm-status-aktif' : 'umkm-status-hidden';
    const statusText  = isAktif ? '✅ Aktif' : '🙈 Disembunyikan';
    const toggleText  = isAktif ? '🙈 Sembunyikan' : '✅ Aktifkan';

    return `
      <div class="admin-card" id="umkm-card-${escUmkm(item.id)}">
        <div class="card-media">
          ${displayImg
            ? `<img src="${escUmkm(displayImg)}" alt="${escUmkm(item.nama_usaha)}" onerror="this.style.display='none'" />`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🏪</div>`
          }
          <span class="card-badge">${escUmkm(item.kategori || 'Lainnya')}</span>
          <span class="umkm-admin-status ${statusClass}">${statusText}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escUmkm(item.nama_usaha)}</h3>
          <div class="card-meta">
            <span>👤 ${escUmkm(item.nama_pemilik || '—')}</span>
          </div>
          ${item.no_wa ? `<div class="card-meta"><span>📱 ${escUmkm(item.no_wa)}</span></div>` : ''}
          ${item.alamat ? `<div class="card-meta"><span>📍 ${escUmkm(item.alamat)}</span></div>` : ''}
          <p class="card-desc">${escUmkm(item.deskripsi || '')}</p>
          <div class="card-actions">
            <button class="btn-card btn-edit" onclick="openEditUmkm('${escUmkm(item.id)}')">
              ✏️ Edit
            </button>
            <button class="btn-card ${isAktif ? 'btn-toggle-hide' : 'btn-toggle-show'}" onclick="toggleUmkmAktif('${escUmkm(item.id)}')">
              ${toggleText}
            </button>
            <button class="btn-card btn-delete" onclick="deleteUmkm('${escUmkm(item.id)}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Open Add ----
window.openAddUmkm = function() {
  formUmkm.reset();
  umkmId.value = '';
  modalUmkmTitle.textContent = 'Tambah UMKM Jemaat Baru';
  umkmAktif.value = '1';
  setUmkmStatus(true);
  updateUmkmPreview('');
  modalUmkm.classList.add('active');
};

// ---- Open Edit ----
window.openEditUmkm = function(id) {
  const item = umkmList.find(u => u.id === id);
  if (!item) return;

  umkmId.value          = item.id;
  umkmNamaUsaha.value   = item.nama_usaha   || '';
  umkmKategori.value    = item.kategori     || '';
  umkmNamaPemilik.value = item.nama_pemilik || '';
  umkmNoWa.value        = item.no_wa        || '';
  umkmAlamat.value      = item.alamat       || '';
  umkmDeskripsi.value   = item.deskripsi    || '';
  umkmGambar.value      = item.gambar       || '';
  updateUmkmPreview(item.gambar || '');
  setUmkmStatus(!!item.aktif);

  modalUmkmTitle.textContent = 'Edit UMKM Jemaat';
  modalUmkm.classList.add('active');
};

// ---- Status Toggle (in modal) ----
window.setUmkmStatus = function(isAktif) {
  const btnAktif   = document.getElementById('umkmToggleAktif');
  const btnSembunyi= document.getElementById('umkmToggleSembunyi');
  if (isAktif) {
    umkmAktif.value = '1';
    btnAktif   && btnAktif.classList.add('active');
    btnSembunyi&& btnSembunyi.classList.remove('active');
  } else {
    umkmAktif.value = '0';
    btnAktif   && btnAktif.classList.remove('active');
    btnSembunyi&& btnSembunyi.classList.add('active');
  }
};

// ---- Image Preview ----
function updateUmkmPreview(src) {
  if (!src) {
    umkmPreview.innerHTML = '<span class="no-img-text">Belum ada gambar</span>';
    return;
  }
  const displaySrc = src.startsWith('./') ? '../' + src.substring(2) : src;
  umkmPreview.innerHTML = `<img src="${displaySrc}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'no-img-text\\'>Gambar tidak ditemukan</span>'" />`;
}

umkmGambar && umkmGambar.addEventListener('input', e => {
  updateUmkmPreview(e.target.value.trim());
});

// ---- File Upload ----
umkmFile && umkmFile.addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    umkmPreview.innerHTML = '<span class="no-img-text">Mengunggah gambar...</span>';
    const res = await fetch('../api/upload.php', { method: 'POST', body: formData });
    const result = await res.json();
    if (res.ok && result.success) {
      umkmGambar.value = result.url;
      updateUmkmPreview(result.url);
      showToast('Gambar berhasil diunggah!', 'success');
    } else {
      showToast(result.message || 'Gagal mengunggah gambar', 'error');
      updateUmkmPreview(umkmGambar.value);
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat upload', 'error');
    updateUmkmPreview(umkmGambar.value);
  }
});

// ---- Submit Form (Create / Update) ----
formUmkm && formUmkm.addEventListener('submit', async e => {
  e.preventDefault();
  const id     = umkmId.value;
  const action = id ? 'update' : 'create';

  const payload = {
    action,
    id,
    nama_usaha:   umkmNamaUsaha.value.trim(),
    kategori:     umkmKategori.value,
    nama_pemilik: umkmNamaPemilik.value.trim(),
    no_wa:        umkmNoWa.value.trim(),
    alamat:       umkmAlamat.value.trim(),
    deskripsi:    umkmDeskripsi.value.trim(),
    gambar:       umkmGambar.value.trim(),
    aktif:        umkmAktif.value === '1'
  };

  try {
    const res = await fetch(UMKM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message, 'success');
      modalUmkm.classList.remove('active');
      fetchUmkm();
    } else {
      showToast(result.message || 'Gagal menyimpan UMKM', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan server saat menyimpan.', 'error');
  }
});

// ---- Toggle Aktif (inline dari card) ----
window.toggleUmkmAktif = async function(id) {
  try {
    const res = await fetch(UMKM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_aktif', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast(result.message, 'success');
      fetchUmkm();
    } else {
      showToast(result.message || 'Gagal mengubah status', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat mengubah status.', 'error');
  }
};

// ---- Delete ----
window.deleteUmkm = async function(id) {
  const item = umkmList.find(u => u.id === id);
  const name = item ? item.nama_usaha : 'UMKM ini';
  if (!confirm(`Hapus "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

  try {
    const res = await fetch(UMKM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast(result.message, 'success');
      fetchUmkm();
    } else {
      showToast(result.message || 'Gagal menghapus UMKM', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat menghapus.', 'error');
  }
};

// ---- Modal Close ----
document.getElementById('umkmModalCloseBtn') && document.getElementById('umkmModalCloseBtn').addEventListener('click', () => {
  modalUmkm.classList.remove('active');
});
document.getElementById('umkmCancelBtn') && document.getElementById('umkmCancelBtn').addEventListener('click', () => {
  modalUmkm.classList.remove('active');
});
window.addEventListener('click', e => {
  if (e.target === modalUmkm) modalUmkm.classList.remove('active');
});

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
