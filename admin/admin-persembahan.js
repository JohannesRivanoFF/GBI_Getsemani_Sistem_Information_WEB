/**
 * admin-persembahan.js — Panel Admin: Modul Konfirmasi Persembahan Masuk
 * GBI Getsemani
 */

// ---- State ----
let persembahanList = [];
let psbCurrentFilter = {
  keyword: '',
  status: '',
  jenis: ''
};

// ---- API Endpoint ----
const PSB_API = '../api/persembahan.php';

// ---- DOM Refs ----
const tabPsbBtn     = document.getElementById('tabPersembahanBtn');
const tabPsbSection = document.getElementById('tabPersembahanSection');
const psbTableBody  = document.getElementById('persembahanTableBody');
const psbSearch     = document.getElementById('psbSearchInput');
const psbFilterSt   = document.getElementById('psbFilterStatus');
const psbFilterJn   = document.getElementById('psbFilterJenis');

// Stats
const psbStatTotal    = document.getElementById('psbStatTotal');
const psbStatPending  = document.getElementById('psbStatPending');
const psbStatVerified = document.getElementById('psbStatVerified');
const psbStatNominal  = document.getElementById('psbStatNominal');

// Modal Preview
const modalPreviewBukti = document.getElementById('modalPreviewBukti');
const modalPreviewImg   = document.getElementById('modalPreviewImg');
const modalPreviewDoc   = document.getElementById('modalPreviewDoc');
const modalPreviewDocLink = document.getElementById('modalPreviewDocLink');
const modalPreviewDownload = document.getElementById('modalPreviewDownload');
const modalPreviewTitle = document.getElementById('modalPreviewTitle');
const closePreviewBtn   = document.getElementById('closePreviewBtn');
const btnTutupPreview   = document.getElementById('btnTutupPreview');

// ---- Tab Switching Integration ----
function hideAllAdminSections() {
  const sections = [
    'tabKegiatanSection',
    'tabKhotbahSection',
    'tabPengumumanSection',
    'tabUmkmSection',
    'tabPersembahanSection',
    'tabBaptisanSection'
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const buttons = [
    'tabKegiatanBtn',
    'tabKhotbahBtn',
    'tabPengumumanBtn',
    'tabUmkmBtn',
    'tabPersembahanBtn',
    'tabBaptisanBtn'
  ];
  buttons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}

function switchToPersembahanTab() {
  if (typeof window.switchAdminTab === 'function') {
    window.switchAdminTab('persembahan');
  } else {
    hideAllAdminSections();
    if (tabPsbBtn) tabPsbBtn.classList.add('active');
    if (tabPsbSection) tabPsbSection.style.display = 'block';
    fetchPersembahan();
  }
}

if (tabPsbBtn) {
  tabPsbBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchToPersembahanTab();
  });
}

// ---- Fetch Data ----
async function fetchPersembahan() {
  if (!psbTableBody) return;
  psbTableBody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">
        ⏳ Memuat data konfirmasi persembahan...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(PSB_API);
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const result = await res.json();
    if (result.success) {
      persembahanList = result.data || [];
      updatePersembahanStats();
      renderPersembahanTable();
    } else {
      psbTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--danger);">${result.message || 'Gagal memuat data.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Fetch persembahan error:', err);
    psbTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--danger);">Gagal terhubung ke server.</td></tr>`;
  }
}

// ---- Stats Updater ----
function updatePersembahanStats() {
  const total = persembahanList.length;
  const pending = persembahanList.filter(p => (p.status || '').toLowerCase() === 'pending').length;
  const verifiedList = persembahanList.filter(p => (p.status || '').toLowerCase() === 'terverifikasi');
  const verified = verifiedList.length;
  const totalNominal = verifiedList.reduce((acc, curr) => acc + (parseInt(curr.nominal) || 0), 0);

  if (psbStatTotal) psbStatTotal.textContent = total;
  if (psbStatPending) psbStatPending.textContent = pending;
  if (psbStatVerified) psbStatVerified.textContent = verified;
  if (psbStatNominal) psbStatNominal.textContent = formatRupiah(totalNominal);
  updatePersembahanTabBadge();
}

// ---- Format Helpers ----
function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    const hr = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${yr}, ${hr}:${mi}`;
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Helper Resolve File URL ----
function resolvePsbFileUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const clean = url.replace(/^\.?\//, '');
  return '../' + clean;
}

// ---- Render Table ----
function renderPersembahanTable() {
  if (!psbTableBody) return;

  const kw = psbCurrentFilter.keyword.toLowerCase();
  const st = psbCurrentFilter.status.toLowerCase();
  const jn = psbCurrentFilter.jenis.toLowerCase();

  const filtered = persembahanList.filter(item => {
    const matchKw = !kw || 
      (item.nama && item.nama.toLowerCase().includes(kw)) ||
      (item.catatan && item.catatan.toLowerCase().includes(kw));
    const matchSt = !st || (item.status && item.status.toLowerCase() === st);
    const matchJn = !jn || (item.jenis && item.jenis.toLowerCase() === jn);
    return matchKw && matchSt && matchJn;
  });

  if (filtered.length === 0) {
    psbTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🕊️</div>
          Tidak ada data persembahan yang sesuai dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  psbTableBody.innerHTML = filtered.map(item => {
    const statusLower = (item.status || 'pending').toLowerCase();
    let badgeClass = 'status-badge-pending';
    if (statusLower === 'terverifikasi') badgeClass = 'status-badge-verified';
    if (statusLower === 'ditolak') badgeClass = 'status-badge-rejected';

    const rawBukti = item.bukti_url || '';
    const buktiUrl = resolvePsbFileUrl(rawBukti);
    const isPdf = rawBukti && rawBukti.toLowerCase().endsWith('.pdf');

    return `
      <tr id="psb-row-${item.id}">
        <td style="font-size: 0.85rem; color: var(--text-muted); white-space: nowrap;">
          ${formatDateIndo(item.created_at)}
        </td>
        <td style="font-weight: 600; color: #fff;">
          ${escapeHtml(item.nama)}
        </td>
        <td>
          <span class="psb-jenis-badge">${escapeHtml(item.jenis)}</span>
        </td>
        <td style="font-weight: 700; color: var(--primary); font-family: monospace; font-size: 0.95rem; white-space: nowrap;">
          ${formatRupiah(item.nominal)}
        </td>
        <td>
          ${buktiUrl ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="table-img-thumb" onclick="openPreviewBukti('${buktiUrl}', '${escapeHtml(item.nama)}', ${isPdf})" title="Klik untuk memperbesar bukti">
                ${isPdf 
                  ? `<div class="pdf-thumb-box">📄 PDF</div>` 
                  : `<img src="${buktiUrl}" alt="Bukti" onerror="this.onerror=null; this.src='../Resource/logo (1).png'"/>`
                }
                <span class="zoom-hover-icon">🔍</span>
              </div>
              <button type="button" class="table-file-btn" onclick="openDetailPersembahan('${item.id}')" title="Cek Berkas & Data Lengkap">
                👁️ Cek Berkas
              </button>
            </div>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Tanpa Berkas</span>'}
        </td>
        <td style="font-size: 0.85rem; max-width: 200px; color: var(--text-muted);">
          <div style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(item.catatan || '-')}</div>
        </td>
        <td>
          <span class="status-badge ${badgeClass}">${escapeHtml(item.status || 'Pending')}</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div class="action-btn-group">
            <button class="btn-action-sm btn-detail" onclick="openDetailPersembahan('${item.id}')" title="Lihat Detail & Cek Berkas">
              🔍 Detail &amp; Berkas
            </button>
            ${statusLower !== 'terverifikasi' ? `
              <button class="btn-action-sm btn-verify" onclick="updateStatusPersembahan('${item.id}', 'Terverifikasi')" title="Tandai Terverifikasi Langsung">
                ✓
              </button>
            ` : `
              <button class="btn-action-sm btn-unverify" onclick="updateStatusPersembahan('${item.id}', 'Pending')" title="Kembalikan ke Pending">
                ↺
              </button>
            `}
            <button class="btn-action-sm btn-edit-sm" onclick="openEditPersembahan('${item.id}')" title="Edit Data">
              ✏️
            </button>
            <button class="btn-action-sm btn-delete" onclick="deletePersembahan('${item.id}', '${escapeHtml(item.nama)}')" title="Hapus Data">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- Action: Update Status ----
window.updateStatusPersembahan = async function(id, newStatus) {
  try {
    const res = await fetch(PSB_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', id, status: newStatus })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      const idx = persembahanList.findIndex(p => p.id === id);
      if (idx !== -1) {
        persembahanList[idx].status = newStatus;
      }
      updatePersembahanStats();
      renderPersembahanTable();
    } else {
      alert(result.message || 'Gagal mengubah status.');
    }
  } catch (err) {
    alert('Kesalahan jaringan saat mengubah status.');
  }
};

// ---- Action: Delete ----
window.deletePersembahan = async function(id, nama) {
  if (!confirm(`Apakah Anda yakin ingin menghapus data persembahan dari "${nama}"?`)) return;

  try {
    const res = await fetch(PSB_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      persembahanList = persembahanList.filter(p => p.id !== id);
      updatePersembahanStats();
      renderPersembahanTable();
    } else {
      alert(result.message || 'Gagal menghapus data.');
    }
  } catch (err) {
    alert('Kesalahan jaringan saat menghapus data.');
  }
};

// ---- Update tab badge counter ----
function updatePersembahanTabBadge() {
  const badge = document.getElementById('badgePersembahan');
  if (!badge) return;
  const pending = persembahanList.filter(p => (p.status || '').toLowerCase() === 'pending').length;
  badge.textContent = persembahanList.length;
  if (pending > 0) {
    badge.classList.add('tab-badge-alert');
    badge.title = `${pending} menunggu verifikasi`;
  } else {
    badge.classList.remove('tab-badge-alert');
  }
}

// ---- Modal Tambah/Edit Persembahan ----
const modalPersembahan   = document.getElementById('modalPersembahan');
const formPersembahan    = document.getElementById('formPersembahan');
const modalPsbTitle      = document.getElementById('modalPersembahanTitle');
const persembahanEditId  = document.getElementById('persembahanEditId');
const psbNamaEl          = document.getElementById('psbNama');
const psbJenisEl         = document.getElementById('psbJenis');
const psbNominalEl       = document.getElementById('psbNominal');
const psbStatusEl        = document.getElementById('psbStatus');
const psbCatatanEl       = document.getElementById('psbCatatan');
const psbBuktiUrlEl      = document.getElementById('psbBuktiUrl');

window.openAddPersembahan = function() {
  if (!modalPersembahan) return;
  if (formPersembahan) formPersembahan.reset();
  if (persembahanEditId) persembahanEditId.value = '';
  if (modalPsbTitle) modalPsbTitle.textContent = 'Tambah Catatan Persembahan';
  if (psbStatusEl) psbStatusEl.value = 'Terverifikasi';
  modalPersembahan.classList.add('active', 'show');
};

window.openEditPersembahan = function(id) {
  const item = persembahanList.find(p => p.id === id);
  if (!item || !modalPersembahan) return;
  if (persembahanEditId) persembahanEditId.value = item.id;
  if (psbNamaEl) psbNamaEl.value = item.nama || '';
  if (psbJenisEl) psbJenisEl.value = item.jenis || 'Kolekte';
  if (psbNominalEl) psbNominalEl.value = item.nominal || '';
  if (psbStatusEl) psbStatusEl.value = item.status || 'Pending';
  if (psbCatatanEl) psbCatatanEl.value = item.catatan || '';
  if (psbBuktiUrlEl) psbBuktiUrlEl.value = item.bukti_url || '';
  if (modalPsbTitle) modalPsbTitle.textContent = 'Edit Data Persembahan';
  modalPersembahan.classList.add('active', 'show');
};

function closePersembahanModal() {
  if (modalPersembahan) modalPersembahan.classList.remove('active', 'show');
}

if (document.getElementById('closePersembahanModalBtn')) {
  document.getElementById('closePersembahanModalBtn').addEventListener('click', closePersembahanModal);
}
if (document.getElementById('cancelPersembahanBtn')) {
  document.getElementById('cancelPersembahanBtn').addEventListener('click', closePersembahanModal);
}
if (modalPersembahan) {
  modalPersembahan.addEventListener('click', (e) => {
    if (e.target === modalPersembahan) closePersembahanModal();
  });
}

if (formPersembahan) {
  formPersembahan.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = persembahanEditId ? persembahanEditId.value.trim() : '';
    const action = id ? 'update' : 'create';
    const payload = {
      action,
      id,
      nama: psbNamaEl ? psbNamaEl.value.trim() : '',
      jenis: psbJenisEl ? psbJenisEl.value : 'Kolekte',
      nominal: psbNominalEl ? psbNominalEl.value : 0,
      status: psbStatusEl ? psbStatusEl.value : 'Pending',
      catatan: psbCatatanEl ? psbCatatanEl.value.trim() : '',
      bukti_url: psbBuktiUrlEl ? psbBuktiUrlEl.value.trim() : ''
    };

    try {
      const res = await fetch(PSB_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        if (typeof showToast === 'function') showToast(result.message, 'success');
        closePersembahanModal();
        fetchPersembahan();
      } else {
        if (typeof showToast === 'function') showToast(result.message || 'Gagal menyimpan.', 'error');
      }
    } catch (err) {
      if (typeof showToast === 'function') showToast('Terjadi kesalahan jaringan.', 'error');
    }
  });
}

// ---- Modal Detail & Verifikasi Persembahan ----
const modalDetailPersembahan   = document.getElementById('modalDetailPersembahan');
const detailPersembahanContent = document.getElementById('detailPersembahanContent');
const closeDetailPsbBtn        = document.getElementById('closeDetailPsbBtn');
const btnTutupDetailPsb        = document.getElementById('btnTutupDetailPsb');
const modalPreviewExternal     = document.getElementById('modalPreviewExternal');

window.openDetailPersembahan = function(id) {
  const item = persembahanList.find(p => p.id === id);
  if (!item || !modalDetailPersembahan || !detailPersembahanContent) return;

  const rawBukti = item.bukti_url || '';
  const buktiUrl = resolvePsbFileUrl(rawBukti);
  const isPdf = rawBukti && rawBukti.toLowerCase().endsWith('.pdf');
  const statusLower = (item.status || 'pending').toLowerCase();
  
  let badgeClass = 'status-badge-pending';
  if (statusLower === 'terverifikasi') badgeClass = 'status-badge-verified';
  if (statusLower === 'ditolak') badgeClass = 'status-badge-rejected';

  detailPersembahanContent.innerHTML = `
    <div class="psb-detail-grid">
      <div class="psb-detail-field">
        <label>Nama Pengirim / Jemaat</label>
        <div class="val" style="font-size: 1.15rem; font-weight: 700; color: #fff;">${escapeHtml(item.nama)}</div>
      </div>
      <div class="psb-detail-field">
        <label>Status Saat Ini</label>
        <div><span class="status-badge ${badgeClass}" style="font-size: 0.9rem; padding: 5px 12px;">${escapeHtml(item.status || 'Pending')}</span></div>
      </div>
      <div class="psb-detail-field">
        <label>Jenis Persembahan</label>
        <div><span class="psb-jenis-badge" style="font-size: 0.9rem;">${escapeHtml(item.jenis)}</span></div>
      </div>
      <div class="psb-detail-field">
        <label>Nominal Donasi</label>
        <div class="val" style="font-size: 1.25rem; font-weight: 800; color: var(--primary); font-family: monospace;">
          ${formatRupiah(item.nominal)}
        </div>
      </div>
      <div class="psb-detail-field" style="grid-column: 1 / -1;">
        <label>Waktu Konfirmasi</label>
        <div class="val" style="color: var(--text-muted);">📅 ${formatDateIndo(item.created_at)}</div>
      </div>
      <div class="psb-detail-field" style="grid-column: 1 / -1;">
        <label>Catatan Khusus / Permohonan Doa Jemaat</label>
        <div class="val" style="background: rgba(0,0,0,0.25); border: 1px solid var(--dark-border); padding: 12px; border-radius: 6px; font-style: italic; line-height: 1.5;">
          ${escapeHtml(item.catatan || 'Tidak ada catatan khusus yang disertakan.')}
        </div>
      </div>
      <div class="psb-detail-field" style="grid-column: 1 / -1;">
        <label>Berkas Bukti Transfer (Screenshot / Resi)</label>
        ${buktiUrl ? `
          <div class="detail-file-card">
            <div class="detail-file-preview" onclick="openPreviewBukti('${buktiUrl}', '${escapeHtml(item.nama)}', ${isPdf})">
              ${isPdf 
                ? `<div style="text-align: center; padding: 25px;"><div style="font-size: 3rem;">📄</div><div style="color: #38bdf8; font-weight: 600; margin-top: 8px;">Dokumen Bukti PDF</div><div style="font-size: 0.8rem; color: var(--text-muted);">Klik untuk membuka dokumen</div></div>`
                : `<img src="${buktiUrl}" alt="Bukti Transfer" title="Klik untuk memperbesar bukti" onerror="this.onerror=null; this.src='../Resource/logo (1).png'"/>`
              }
            </div>
            <div class="detail-file-actions">
              <span class="detail-file-name">📎 ${rawBukti.split('/').pop()}</span>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-primary" style="padding: 5px 12px; font-size: 0.82rem;" onclick="openPreviewBukti('${buktiUrl}', '${escapeHtml(item.nama)}', ${isPdf})">
                  🔍 Perbesar Ukuran
                </button>
                <a href="${buktiUrl}" target="_blank" class="btn-ghost" style="padding: 5px 12px; font-size: 0.82rem; text-decoration: none;">
                  ↗ Buka Tab Baru
                </a>
                <a href="${buktiUrl}" download class="btn-ghost" style="padding: 5px 12px; font-size: 0.82rem; text-decoration: none;">
                  ⬇️ Unduh
                </a>
              </div>
            </div>
          </div>
        ` : `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 14px; color: #f87171; font-size: 0.88rem;">
            ⚠️ Jemaat tidak melampirkan berkas foto bukti transfer pada saat mengisi formulir.
          </div>
        `}
      </div>
    </div>

    <!-- Quick Status Update inside Detail Modal -->
    <div class="psb-status-updater">
      <h4 style="margin-bottom: 12px; color: #fff; font-size: 0.95rem;">⚡ Perbarui Status Verifikasi</h4>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${statusLower !== 'terverifikasi' ? `
          <button type="button" class="btn-primary" style="background: #22c55e; border-color: #22c55e;" onclick="updateStatusFromDetail('${item.id}', 'Terverifikasi')">
            ✓ Tandai Terverifikasi
          </button>
        ` : ''}
        ${statusLower !== 'pending' ? `
          <button type="button" class="btn-ghost" onclick="updateStatusFromDetail('${item.id}', 'Pending')">
            ↺ Kembalikan ke Pending
          </button>
        ` : ''}
        ${statusLower !== 'ditolak' ? `
          <button type="button" class="btn-ghost" style="color: #ef4444;" onclick="updateStatusFromDetail('${item.id}', 'Ditolak')">
            ✕ Tolak Persembahan
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modalDetailPersembahan.classList.add('active', 'show');
};

window.updateStatusFromDetail = async function(id, newStatus) {
  await updateStatusPersembahan(id, newStatus);
  closeDetailPersembahanModal();
};

window.closeDetailPersembahanModal = function() {
  if (modalDetailPersembahan) modalDetailPersembahan.classList.remove('active', 'show');
};

if (closeDetailPsbBtn) closeDetailPsbBtn.addEventListener('click', closeDetailPersembahanModal);
if (btnTutupDetailPsb) btnTutupDetailPsb.addEventListener('click', closeDetailPersembahanModal);
if (modalDetailPersembahan) {
  modalDetailPersembahan.addEventListener('click', (e) => {
    if (e.target === modalDetailPersembahan) closeDetailPersembahanModal();
  });
}

// ---- Preview Bukti Modal ----
window.openPreviewBukti = function(fileUrl, nama, isPdf) {
  if (!modalPreviewBukti) return;
  const resolved = resolvePsbFileUrl(fileUrl);

  if (modalPreviewTitle) modalPreviewTitle.textContent = `Bukti Transfer / Berkas — ${nama}`;
  if (modalPreviewDownload) modalPreviewDownload.href = resolved;
  if (modalPreviewExternal) modalPreviewExternal.href = resolved;

  if (isPdf) {
    if (modalPreviewImg) modalPreviewImg.style.display = 'none';
    if (modalPreviewDoc) modalPreviewDoc.style.display = 'block';
    if (modalPreviewDocLink) modalPreviewDocLink.href = resolved;
  } else {
    if (modalPreviewDoc) modalPreviewDoc.style.display = 'none';
    if (modalPreviewImg) {
      modalPreviewImg.style.display = 'block';
      modalPreviewImg.src = resolved;
    }
  }
  modalPreviewBukti.classList.add('active', 'show');
};

window.closePreviewModal = function() {
  if (modalPreviewBukti) modalPreviewBukti.classList.remove('active', 'show');
};

if (closePreviewBtn) closePreviewBtn.addEventListener('click', closePreviewModal);
if (btnTutupPreview) btnTutupPreview.addEventListener('click', closePreviewModal);
if (modalPreviewBukti) {
  modalPreviewBukti.addEventListener('click', (e) => {
    if (e.target === modalPreviewBukti) closePreviewModal();
  });
}

// ---- Filters Listeners ----
if (psbSearch) {
  psbSearch.addEventListener('input', (e) => {
    psbCurrentFilter.keyword = e.target.value.trim();
    renderPersembahanTable();
  });
}
if (psbFilterSt) {
  psbFilterSt.addEventListener('change', (e) => {
    psbCurrentFilter.status = e.target.value;
    renderPersembahanTable();
  });
}
if (psbFilterJn) {
  psbFilterJn.addEventListener('change', (e) => {
    psbCurrentFilter.jenis = e.target.value;
    renderPersembahanTable();
  });
}

// ---- CSV Export ----
window.exportPersembahanCsv = function() {
  if (!persembahanList.length) {
    alert('Tidak ada data persembahan untuk diekspor.');
    return;
  }

  const headers = ['ID', 'Tanggal', 'Nama Pengirim', 'Jenis', 'Nominal', 'Status', 'Catatan', 'Bukti URL'];
  const rows = persembahanList.map(item => [
    `"${item.id}"`,
    `"${item.created_at || ''}"`,
    `"${(item.nama || '').replace(/"/g, '""')}"`,
    `"${item.jenis || ''}"`,
    `"${item.nominal || 0}"`,
    `"${item.status || ''}"`,
    `"${(item.catatan || '').replace(/"/g, '""')}"`,
    `"${item.bukti_url || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Persembahan_GBI_Getsemani_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
