/**
 * admin-baptisan.js — Panel Admin: Modul Manajemen Pendaftaran Baptisan Kudus
 * GBI Getsemani
 */

// ---- State ----
let baptisanList = [];
let bptCurrentFilter = {
  keyword: '',
  status: ''
};

// ---- API Endpoint ----
const BPT_API = '../api/baptisan.php';

// ---- DOM Refs ----
const tabBptBtn       = document.getElementById('tabBaptisanBtn');
const tabBptSection   = document.getElementById('tabBaptisanSection');
const bptTableBody    = document.getElementById('baptisanTableBody');
const bptSearch       = document.getElementById('bptSearchInput');
const bptFilterSt     = document.getElementById('bptFilterStatus');

// Stats
const bptStatTotal     = document.getElementById('bptStatTotal');
const bptStatPending   = document.getElementById('bptStatPending');
const bptStatApproved  = document.getElementById('bptStatApproved');
const bptStatCompleted = document.getElementById('bptStatCompleted');

// Modal Detail
const modalDetailBaptisan   = document.getElementById('modalDetailBaptisan');
const detailBaptisanContent = document.getElementById('detailBaptisanContent');
const closeDetailBaptisanBtn = document.getElementById('closeDetailBaptisanBtn');
const btnTutupDetailBaptisan = document.getElementById('btnTutupDetailBaptisan');

// ---- Tab Switching Integration ----
function switchToBaptisanTab() {
  if (typeof window.switchAdminTab === 'function') {
    window.switchAdminTab('baptisan');
  } else {
    ['tabKegiatanSection', 'tabKhotbahSection', 'tabPengumumanSection', 'tabUmkmSection', 'tabPersembahanSection'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    ['tabKegiatanBtn', 'tabKhotbahBtn', 'tabPengumumanBtn', 'tabUmkmBtn', 'tabPersembahanBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    if (tabBptBtn) tabBptBtn.classList.add('active');
    if (tabBptSection) tabBptSection.style.display = 'block';
    fetchBaptisan();
  }
}

if (tabBptBtn) {
  tabBptBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToBaptisanTab();
  });
}

// ---- Fetch Data ----
async function fetchBaptisan() {
  if (!bptTableBody) return;
  bptTableBody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">
        ⏳ Memuat data pendaftaran baptisan...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(BPT_API);
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const result = await res.json();
    if (result.success) {
      baptisanList = result.data || [];
      updateBaptisanStats();
      renderBaptisanTable();
    } else {
      bptTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--danger);">${result.message || 'Gagal memuat data.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Fetch baptisan error:', err);
    bptTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--danger);">Gagal terhubung ke server.</td></tr>`;
  }
}

// ---- Stats Updater ----
function updateBaptisanStats() {
  const total = baptisanList.length;
  const pending = baptisanList.filter(b => (b.status || '').toLowerCase() === 'pending').length;
  const approved = baptisanList.filter(b => (b.status || '').toLowerCase() === 'disetujui').length;
  const completed = baptisanList.filter(b => (b.status || '').toLowerCase() === 'selesai').length;

  if (bptStatTotal) bptStatTotal.textContent = total;
  if (bptStatPending) bptStatPending.textContent = pending;
  if (bptStatApproved) bptStatApproved.textContent = approved;
  if (bptStatCompleted) bptStatCompleted.textContent = completed;
  // Update tab badge
  const badge = document.getElementById('badgeBaptisan');
  if (badge) { badge.textContent = total; }
}

// ---- Format Helpers ----
function formatBptDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    return `${day} ${mon} ${yr}`;
  } catch {
    return dateStr;
  }
}

function escapeBptHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Helper Resolve File URL ----
function resolveBptFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const clean = url.replace(/^\.?\//, '');
  return '../' + clean;
}

// ---- Render Table ----
function renderBaptisanTable() {
  if (!bptTableBody) return;

  const kw = bptCurrentFilter.keyword.toLowerCase();
  const st = bptCurrentFilter.status.toLowerCase();

  const filtered = baptisanList.filter(item => {
    const matchKw = !kw || 
      (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(kw)) ||
      (item.nama_orang_tua && item.nama_orang_tua.toLowerCase().includes(kw)) ||
      (item.tgl_baptisan && item.tgl_baptisan.toLowerCase().includes(kw));
    const matchSt = !st || (item.status && item.status.toLowerCase() === st);
    return matchKw && matchSt;
  });

  if (filtered.length === 0) {
    bptTableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🕊️</div>
          Tidak ada data pendaftaran baptisan yang sesuai dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  bptTableBody.innerHTML = filtered.map(item => {
    const stLower = (item.status || 'pending').toLowerCase();
    let badgeClass = 'status-badge-pending';
    if (stLower === 'disetujui') badgeClass = 'status-badge-info';
    if (stLower === 'selesai') badgeClass = 'status-badge-verified';
    if (stLower === 'ditolak') badgeClass = 'status-badge-rejected';

    const cleanWa = (item.no_wa || '').replace(/[^0-9]/g, '');
    const waLink = cleanWa ? (cleanWa.startsWith('62') ? cleanWa : (cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : '62' + cleanWa)) : '';

    const rawBerkas = item.berkas_url || '';
    const berkasUrl = resolveBptFileUrl(rawBerkas);
    const isPdf = rawBerkas && rawBerkas.toLowerCase().endsWith('.pdf');

    return `
      <tr id="bpt-row-${item.id}">
        <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">
          ${formatBptDate(item.created_at)}
        </td>
        <td style="font-weight: 600; color: #fff;">
          ${escapeBptHtml(item.nama_lengkap)}
        </td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">
          ${escapeBptHtml(item.tempat_tanggal_lahir || '-')}
        </td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">
          ${escapeBptHtml(item.nama_orang_tua || '-')}
        </td>
        <td>
          ${waLink ? `
            <a href="https://wa.me/${waLink}" target="_blank" class="table-wa-link" title="Chat WhatsApp pendaftar">
              💬 +${waLink}
            </a>
          ` : '-'}
        </td>
        <td style="font-size: 0.85rem; max-width: 180px;">
          <span class="jadwal-badge">${escapeBptHtml(item.tgl_baptisan || '-')}</span>
        </td>
        <td>
          ${berkasUrl ? `
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" class="btn-action-sm btn-berkas" onclick="openPreviewBukti('${berkasUrl}', '${escapeBptHtml(item.nama_lengkap)} (Berkas Identitas)', ${isPdf})" title="Lihat Berkas Identitas">
                📁 ${isPdf ? 'PDF' : 'Lihat'}
              </button>
              <button type="button" class="table-file-btn" onclick="openDetailBaptisan('${item.id}')" title="Cek Berkas & Rincian">
                👁️ Cek
              </button>
            </div>
          ` : '<span style="color: var(--text-dim); font-size: 0.8rem; font-style: italic;">Tanpa Berkas</span>'}
        </td>
        <td>
          <span class="status-badge ${badgeClass}">${escapeBptHtml(item.status || 'Pending')}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="action-btn-group">
            <button class="btn-action-sm btn-detail" onclick="openDetailBaptisan('${item.id}')" title="Lihat Detail & Cek Berkas">
              🔍 Detail &amp; Berkas
            </button>
            <button class="btn-action-sm btn-edit-sm" onclick="openEditBaptisan('${item.id}')" title="Edit Data Pendaftar">
              ✏️
            </button>
            <button class="btn-action-sm btn-delete" onclick="deleteBaptisan('${item.id}', '${escapeBptHtml(item.nama_lengkap)}')" title="Hapus Data">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- Modal Detail & Ubah Status ----
window.openDetailBaptisan = function(id) {
  const item = baptisanList.find(b => b.id === id);
  if (!item || !modalDetailBaptisan) return;

  const rawBerkas = item.berkas_url || '';
  const berkasUrl = resolveBptFileUrl(rawBerkas);
  const isPdf = rawBerkas && rawBerkas.toLowerCase().endsWith('.pdf');
  const cleanWa = (item.no_wa || '').replace(/[^0-9]/g, '');

  detailBaptisanContent.innerHTML = `
    <div class="bpt-detail-grid">
      <div class="bpt-detail-field">
        <label>Nama Lengkap Calon Baptis</label>
        <div class="val" style="font-size: 1.15rem; font-weight: 700; color: #fff;">${escapeBptHtml(item.nama_lengkap)}</div>
      </div>
      <div class="bpt-detail-field">
        <label>Status Pendaftaran</label>
        <div><span class="status-badge status-badge-${(item.status || 'pending').toLowerCase()}">${escapeBptHtml(item.status || 'Pending')}</span></div>
      </div>
      <div class="bpt-detail-field">
        <label>Tempat & Tanggal Lahir</label>
        <div class="val">${escapeBptHtml(item.tempat_tanggal_lahir || '-')}</div>
      </div>
      <div class="bpt-detail-field">
        <label>Nama Orang Tua / Wali</label>
        <div class="val">${escapeBptHtml(item.nama_orang_tua || '-')}</div>
      </div>
      <div class="bpt-detail-field">
        <label>No. WhatsApp Aktif</label>
        <div class="val">
          <a href="https://wa.me/${cleanWa}" target="_blank" style="color: #25d366; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            💬 +${cleanWa} (Buka WhatsApp Jemaat ↗)
          </a>
        </div>
      </div>
      <div class="bpt-detail-field">
        <label>Pilihan Gelombang Baptisan</label>
        <div class="val" style="color: var(--primary); font-weight: 600;">${escapeBptHtml(item.tgl_baptisan || '-')}</div>
      </div>
      <div class="bpt-detail-field" style="grid-column: 1 / -1;">
        <label>Alamat Domisili</label>
        <div class="val">${escapeBptHtml(item.alamat || '-')}</div>
      </div>
      <div class="bpt-detail-field" style="grid-column: 1 / -1;">
        <label>Catatan / Riwayat Gereja dari Jemaat</label>
        <div class="val" style="background: rgba(0,0,0,0.25); border: 1px solid var(--dark-border); padding: 12px; border-radius: 6px; font-style: italic; line-height: 1.5;">
          ${escapeBptHtml(item.catatan || 'Tidak ada catatan tambahan.')}
        </div>
      </div>
      <div class="bpt-detail-field" style="grid-column: 1 / -1;">
        <label>Berkas Identitas (KTP / Kartu Keluarga / Akta Kelahiran)</label>
        ${berkasUrl ? `
          <div class="detail-file-card">
            <div class="detail-file-preview" onclick="openPreviewBukti('${berkasUrl}', '${escapeBptHtml(item.nama_lengkap)} (Berkas Identitas)', ${isPdf})">
              ${isPdf 
                ? `<div style="text-align: center; padding: 25px;"><div style="font-size: 3rem;">📄</div><div style="color: #38bdf8; font-weight: 600; margin-top: 8px;">Dokumen Berkas Identitas PDF</div><div style="font-size: 0.8rem; color: var(--text-muted);">Klik untuk membuka dokumen PDF</div></div>`
                : `<img src="${berkasUrl}" alt="Berkas Identitas" title="Klik untuk memperbesar berkas" onerror="this.onerror=null; this.src='../Resource/logo (1).png'"/>`
              }
            </div>
            <div class="detail-file-actions">
              <span class="detail-file-name">📎 ${rawBerkas.split('/').pop()}</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" style="padding: 5px 12px; font-size: 0.82rem;" onclick="openPreviewBukti('${berkasUrl}', '${escapeBptHtml(item.nama_lengkap)} (Berkas Identitas)', ${isPdf})">
                  🔍 Perbesar Berkas
                </button>
                <a href="${berkasUrl}" target="_blank" class="btn-ghost" style="padding: 5px 12px; font-size: 0.82rem; text-decoration: none;">
                  ↗ Buka Tab Baru
                </a>
                <a href="${berkasUrl}" download class="btn-ghost" style="padding: 5px 12px; font-size: 0.82rem; text-decoration: none;">
                  ⬇️ Unduh
                </a>
              </div>
            </div>
          </div>
        ` : `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 14px; color: #f87171; font-size: 0.88rem;">
            ⚠️ Calon baptis belum mengunggah berkas foto identitas (KTP/KK/Akta).
          </div>
        `}
      </div>
    </div>

    <!-- Form Ubah Status -->
    <div class="bpt-status-updater">
      <h4 style="margin-bottom: 12px; color: #fff; font-size: 0.95rem;">⚡ Perbarui Status &amp; Catatan Pastoral</h4>
      <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
        <select id="detailSelectStatus" class="form-control" style="flex: 1; min-width: 160px;">
          <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          <option value="Disetujui" ${item.status === 'Disetujui' ? 'selected' : ''}>✅ Disetujui (Ikut Katekisasi)</option>
          <option value="Selesai" ${item.status === 'Selesai' ? 'selected' : ''}>🕊️ Selesai (Sudah Dibaptis)</option>
          <option value="Ditolak" ${item.status === 'Ditolak' ? 'selected' : ''}>✕ Ditolak / Dibatalkan</option>
        </select>
        <button type="button" class="btn-primary" onclick="submitStatusBaptisan('${item.id}')">
          Simpan Status &amp; Catatan
        </button>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <input type="text" id="detailCatatanAdmin" class="form-control" placeholder="Catatan internal pastoral (misal: info jadwal katekisasi, kelengkapan berkas, pembimbing, dll.)" value="${escapeBptHtml(item.catatan_admin || '')}" />
      </div>
    </div>
  `;

  modalDetailBaptisan.classList.add('active', 'show');
};

window.closeDetailBaptisanModal = function() {
  if (modalDetailBaptisan) modalDetailBaptisan.classList.remove('active', 'show');
};

if (closeDetailBaptisanBtn) closeDetailBaptisanBtn.addEventListener('click', closeDetailBaptisanModal);
if (btnTutupDetailBaptisan) btnTutupDetailBaptisan.addEventListener('click', closeDetailBaptisanModal);
if (modalDetailBaptisan) {
  modalDetailBaptisan.addEventListener('click', (e) => {
    if (e.target === modalDetailBaptisan) closeDetailBaptisanModal();
  });
}

// ---- Action: Submit Status & Catatan ----
window.submitStatusBaptisan = async function(id) {
  const statusEl = document.getElementById('detailSelectStatus');
  const catEl = document.getElementById('detailCatatanAdmin');
  if (!statusEl) return;

  const newStatus = statusEl.value;
  const catatan_admin = catEl ? catEl.value.trim() : '';

  try {
    const res = await fetch(BPT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_status',
        id,
        status: newStatus,
        catatan_admin
      })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      const idx = baptisanList.findIndex(b => b.id === id);
      if (idx !== -1) {
        baptisanList[idx].status = newStatus;
        baptisanList[idx].catatan_admin = catatan_admin;
      }
      updateBaptisanStats();
      renderBaptisanTable();
      closeDetailBaptisanModal();
      alert(`Status pendaftar berhasil diperbarui menjadi: ${newStatus}`);
    } else {
      alert(result.message || 'Gagal mengubah status.');
    }
  } catch (err) {
    alert('Kesalahan jaringan saat mengubah status baptisan.');
  }
};

// ---- Action: Delete ----
window.deleteBaptisan = async function(id, nama) {
  if (!confirm(`Hapus data pendaftaran baptisan atas nama "${nama}"?`)) return;

  try {
    const res = await fetch(BPT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      baptisanList = baptisanList.filter(b => b.id !== id);
      updateBaptisanStats();
      renderBaptisanTable();
    } else {
      alert(result.message || 'Gagal menghapus data.');
    }
  } catch (err) {
    alert('Kesalahan jaringan saat menghapus pendaftaran.');
  }
};

// ---- Filters Listeners ----
if (bptSearch) {
  bptSearch.addEventListener('input', (e) => {
    bptCurrentFilter.keyword = e.target.value.trim();
    renderBaptisanTable();
  });
}
if (bptFilterSt) {
  bptFilterSt.addEventListener('change', (e) => {
    bptCurrentFilter.status = e.target.value;
    renderBaptisanTable();
  });
}

// ---- CSV Export ----
window.exportBaptisanCsv = function() {
  if (!baptisanList.length) {
    alert('Tidak ada data pendaftaran baptisan untuk diekspor.');
    return;
  }

  const headers = ['ID', 'Tanggal Daftar', 'Nama Lengkap', 'TTL', 'Nama Orang Tua', 'WhatsApp', 'Jadwal Baptisan', 'Status', 'Alamat', 'Catatan Jemaat', 'Catatan Pastoral', 'Berkas URL'];
  const rows = baptisanList.map(item => [
    `"${item.id}"`,
    `"${item.created_at || ''}"`,
    `"${(item.nama_lengkap || '').replace(/"/g, '""')}"`,
    `"${(item.tempat_tanggal_lahir || '').replace(/"/g, '""')}"`,
    `"${(item.nama_orang_tua || '').replace(/"/g, '""')}"`,
    `"${item.no_wa || ''}"`,
    `"${(item.tgl_baptisan || '').replace(/"/g, '""')}"`,
    `"${item.status || ''}"`,
    `"${(item.alamat || '').replace(/"/g, '""')}"`,
    `"${(item.catatan || '').replace(/"/g, '""')}"`,
    `"${(item.catatan_admin || '').replace(/"/g, '""')}"`,
    `"${item.berkas_url || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Pendaftaran_Baptisan_GBI_Getsemani_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
// ---- Modal Tambah/Edit Baptisan ----
const modalBaptisan      = document.getElementById('modalBaptisan');
const formBaptisan       = document.getElementById('formBaptisan');
const modalBaptisanTitle = document.getElementById('modalBaptisanTitle');
const baptisanEditId     = document.getElementById('baptisanEditId');
const bptNamaLengkap     = document.getElementById('bptNamaLengkap');
const bptNoWa            = document.getElementById('bptNoWa');
const bptTtl             = document.getElementById('bptTtl');
const bptOrangTua        = document.getElementById('bptOrangTua');
const bptJadwal          = document.getElementById('bptJadwal');
const bptStatusSel       = document.getElementById('bptStatus');
const bptAlamat          = document.getElementById('bptAlamat');
const bptCatatan         = document.getElementById('bptCatatan');
const bptCatatanAdmin    = document.getElementById('bptCatatanAdmin');
const bptBerkasUrl       = document.getElementById('bptBerkasUrl');

window.openAddBaptisan = function() {
  if (!modalBaptisan) return;
  if (formBaptisan) formBaptisan.reset();
  if (baptisanEditId) baptisanEditId.value = '';
  if (modalBaptisanTitle) modalBaptisanTitle.textContent = 'Tambah Pendaftar Baptisan';
  if (bptStatusSel) bptStatusSel.value = 'Pending';
  modalBaptisan.classList.add('active', 'show');
};

window.openEditBaptisan = function(id) {
  const item = baptisanList.find(b => b.id === id);
  if (!item || !modalBaptisan) return;
  if (baptisanEditId) baptisanEditId.value = item.id;
  if (bptNamaLengkap) bptNamaLengkap.value = item.nama_lengkap || '';
  if (bptNoWa) bptNoWa.value = item.no_wa || '';
  if (bptTtl) bptTtl.value = item.tempat_tanggal_lahir || '';
  if (bptOrangTua) bptOrangTua.value = item.nama_orang_tua || '';
  if (bptJadwal) bptJadwal.value = item.tgl_baptisan || '';
  if (bptStatusSel) bptStatusSel.value = item.status || 'Pending';
  if (bptAlamat) bptAlamat.value = item.alamat || '';
  if (bptCatatan) bptCatatan.value = item.catatan || '';
  if (bptCatatanAdmin) bptCatatanAdmin.value = item.catatan_admin || '';
  if (bptBerkasUrl) bptBerkasUrl.value = item.berkas_url || '';
  if (modalBaptisanTitle) modalBaptisanTitle.textContent = 'Edit Data Pendaftar Baptisan';
  modalBaptisan.classList.add('active', 'show');
};

function closeBaptisanFormModal() {
  if (modalBaptisan) modalBaptisan.classList.remove('active', 'show');
}

if (document.getElementById('closeBaptisanModalBtn')) {
  document.getElementById('closeBaptisanModalBtn').addEventListener('click', closeBaptisanFormModal);
}
if (document.getElementById('cancelBaptisanBtn')) {
  document.getElementById('cancelBaptisanBtn').addEventListener('click', closeBaptisanFormModal);
}
if (modalBaptisan) {
  modalBaptisan.addEventListener('click', (e) => {
    if (e.target === modalBaptisan) closeBaptisanFormModal();
  });
}

if (formBaptisan) {
  formBaptisan.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = baptisanEditId ? baptisanEditId.value.trim() : '';
    const action = id ? 'update' : 'create';
    const payload = {
      action,
      id,
      nama_lengkap: bptNamaLengkap ? bptNamaLengkap.value.trim() : '',
      no_wa: bptNoWa ? bptNoWa.value.trim() : '',
      tempat_tanggal_lahir: bptTtl ? bptTtl.value.trim() : '',
      nama_orang_tua: bptOrangTua ? bptOrangTua.value.trim() : '',
      tgl_baptisan: bptJadwal ? bptJadwal.value.trim() : '',
      status: bptStatusSel ? bptStatusSel.value : 'Pending',
      alamat: bptAlamat ? bptAlamat.value.trim() : '',
      catatan: bptCatatan ? bptCatatan.value.trim() : '',
      catatan_admin: bptCatatanAdmin ? bptCatatanAdmin.value.trim() : '',
      berkas_url: bptBerkasUrl ? bptBerkasUrl.value.trim() : ''
    };

    try {
      const res = await fetch(BPT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (typeof showToast === 'function') showToast(result.message, 'success');
        closeBaptisanFormModal();
        fetchBaptisan();
      } else {
        if (typeof showToast === 'function') showToast(result.message || 'Gagal menyimpan.', 'error');
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast('Terjadi kesalahan jaringan.', 'error');
    }
  });
}
