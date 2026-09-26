// State & Data
let kegiatanList = [];
let khotbahList = [];

// API Endpoints
const API = {
  auth: '../api/auth.php',
  kegiatan: '../api/kegiatan.php',
  khotbah: '../api/khotbah.php',
  upload: '../api/upload.php'
};

// DOM Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userDisplay = document.getElementById('userDisplay');
const btnLogout = document.getElementById('btnLogout');

const tabKegiatanBtn = document.getElementById('tabKegiatanBtn');
const tabKhotbahBtn = document.getElementById('tabKhotbahBtn');
const tabKegiatanSection = document.getElementById('tabKegiatanSection');
const tabKhotbahSection = document.getElementById('tabKhotbahSection');

const kegiatanGrid = document.getElementById('kegiatanGrid');
const khotbahGrid = document.getElementById('khotbahGrid');

// Kegiatan Modal
const modalKegiatan = document.getElementById('modalKegiatan');
const formKegiatan = document.getElementById('formKegiatan');
const modalKegiatanTitle = document.getElementById('modalKegiatanTitle');
const kegiatanId = document.getElementById('kegiatanId');
const kegiatanTitle = document.getElementById('kegiatanTitle');
const kegiatanDate = document.getElementById('kegiatanDate');
const kegiatanShortDesc = document.getElementById('kegiatanShortDesc');
const kegiatanDesc = document.getElementById('kegiatanDesc');
const kegiatanImage = document.getElementById('kegiatanImage');
const kegiatanFile = document.getElementById('kegiatanFile');
const kegiatanPreview = document.getElementById('kegiatanPreview');

// Khotbah Modal
const modalKhotbah = document.getElementById('modalKhotbah');
const formKhotbah = document.getElementById('formKhotbah');
const modalKhotbahTitle = document.getElementById('modalKhotbahTitle');
const khotbahId = document.getElementById('khotbahId');
const khotbahTitle = document.getElementById('khotbahTitle');
const khotbahPastor = document.getElementById('khotbahPastor');
const khotbahSeries = document.getElementById('khotbahSeries');
const khotbahYoutube = document.getElementById('khotbahYoutube');
const khotbahDuration = document.getElementById('khotbahDuration');
const khotbahViews = document.getElementById('khotbahViews');
const khotbahThumbnail = document.getElementById('khotbahThumbnail');
const khotbahFile = document.getElementById('khotbahFile');
const khotbahPreview = document.getElementById('khotbahPreview');
const btnAutoThumb = document.getElementById('btnAutoThumb');

// Helper: Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '⚠️'}</span>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Extract YouTube ID
function extractYouTubeId(url) {
  if (!url) return '';
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : '';
}

// ===== AUTHENTICATION =====
async function checkAuth() {
  try {
    const res = await fetch(`${API.auth}?action=check`);
    const data = await res.json();
    if (data.authenticated) {
      loginOverlay.style.display = 'none';
      userDisplay.textContent = data.username || 'admin';
      loadAllData();
    } else {
      loginOverlay.style.display = 'flex';
    }
  } catch (err) {
    console.error('Error checking auth:', err);
    loginOverlay.style.display = 'flex';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch(API.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast('Login berhasil! Selamat datang.', 'success');
      loginOverlay.style.display = 'none';
      userDisplay.textContent = result.username || 'admin';
      loadAllData();
    } else {
      loginError.textContent = result.message || 'Login gagal. Periksa username dan password.';
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = 'Terjadi kesalahan server saat mencoba login.';
    loginError.style.display = 'block';
  }
});

btnLogout.addEventListener('click', async () => {
  try {
    await fetch(API.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
    showToast('Berhasil logout.', 'success');
    loginOverlay.style.display = 'flex';
  } catch (err) {
    location.reload();
  }
});

// ===== TABS SWITCHER =====
tabKegiatanBtn.addEventListener('click', () => {
  tabKegiatanBtn.classList.add('active');
  tabKhotbahBtn.classList.remove('active');
  tabKegiatanSection.style.display = 'block';
  tabKhotbahSection.style.display = 'none';
});

tabKhotbahBtn.addEventListener('click', () => {
  tabKhotbahBtn.classList.add('active');
  tabKegiatanBtn.classList.remove('active');
  tabKhotbahSection.style.display = 'block';
  tabKegiatanSection.style.display = 'none';
});

// ===== LOAD ALL DATA =====
function loadAllData() {
  fetchKegiatan();
  fetchKhotbah();
}

// ===== KEGIATAN LOGIC =====
async function fetchKegiatan() {
  try {
    const res = await fetch(API.kegiatan);
    const result = await res.json();
    kegiatanList = result.data || [];
    renderKegiatan();
  } catch (err) {
    console.error('Failed to fetch kegiatan:', err);
    showToast('Gagal memuat data kegiatan', 'error');
  }
}

function renderKegiatan() {
  if (!kegiatanList.length) {
    kegiatanGrid.innerHTML = `
      <div class="empty-state">
        <p>Belum ada dokumentasi kegiatan.</p>
        <button class="btn-primary" onclick="openAddKegiatan()">+ Tambah Kegiatan Sekarang</button>
      </div>
    `;
    return;
  }

  kegiatanGrid.innerHTML = kegiatanList.map(item => {
    const displayImg = item.image.startsWith('./') ? '../' + item.image.substring(2) : item.image;
    return `
      <div class="admin-card">
        <div class="card-media">
          <img src="${displayImg}" alt="${escapeHtml(item.title)}" onerror="this.src='../Resource/IBADAH MINGGU.jpeg'" />
          <span class="card-badge">Kegiatan</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <div class="card-meta">
            <span>📅 ${escapeHtml(item.date || 'Tanpa Tanggal')}</span>
          </div>
          <p class="card-desc">${escapeHtml(item.description || item.short_desc || '')}</p>
          <div class="card-actions">
            <button class="btn-card btn-edit" onclick="openEditKegiatan('${item.id}')">
              ✏️ Edit
            </button>
            <button class="btn-card btn-delete" onclick="deleteKegiatan('${item.id}')">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openAddKegiatan = function() {
  formKegiatan.reset();
  kegiatanId.value = '';
  modalKegiatanTitle.textContent = 'Tambah Dokumentasi Kegiatan Baru';
  kegiatanDate.value = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());
  kegiatanImage.value = './Resource/IBADAH MINGGU.jpeg';
  updateKegiatanPreview('./Resource/IBADAH MINGGU.jpeg');
  modalKegiatan.classList.add('active');
};

window.openEditKegiatan = function(id) {
  const item = kegiatanList.find(k => k.id === id);
  if (!item) return;

  kegiatanId.value = item.id;
  kegiatanTitle.value = item.title || '';
  kegiatanDate.value = item.date || '';
  kegiatanShortDesc.value = item.short_desc || '';
  kegiatanDesc.value = item.description || '';
  kegiatanImage.value = item.image || '';
  updateKegiatanPreview(item.image);

  modalKegiatanTitle.textContent = 'Edit Dokumentasi Kegiatan';
  modalKegiatan.classList.add('active');
};

function updateKegiatanPreview(src) {
  if (!src) {
    kegiatanPreview.innerHTML = '<span class="no-img-text">Belum ada gambar</span>';
    return;
  }
  const displaySrc = src.startsWith('./') ? '../' + src.substring(2) : src;
  kegiatanPreview.innerHTML = `<img src="${displaySrc}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'no-img-text\\'>Gambar tidak ditemukan</span>'"/>`;
}

kegiatanImage.addEventListener('input', (e) => {
  updateKegiatanPreview(e.target.value.trim());
});

// Upload image file for Kegiatan
kegiatanFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    kegiatanPreview.innerHTML = '<span class="no-img-text">Mengunggah gambar...</span>';
    const res = await fetch(API.upload, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (res.ok && result.success) {
      kegiatanImage.value = result.url;
      updateKegiatanPreview(result.url);
      showToast('Gambar berhasil diunggah!', 'success');
    } else {
      showToast(result.message || 'Gagal mengunggah file', 'error');
      updateKegiatanPreview(kegiatanImage.value);
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat upload', 'error');
    updateKegiatanPreview(kegiatanImage.value);
  }
});

// Submit Kegiatan Form
formKegiatan.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = kegiatanId.value;
  const action = id ? 'update' : 'create';

  const payload = {
    action,
    id,
    title: kegiatanTitle.value.trim(),
    date: kegiatanDate.value.trim(),
    short_desc: kegiatanShortDesc.value.trim(),
    description: kegiatanDesc.value.trim(),
    image: kegiatanImage.value.trim()
  };

  try {
    const res = await fetch(API.kegiatan, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message, 'success');
      modalKegiatan.classList.remove('active');
      fetchKegiatan();
    } else {
      showToast(result.message || 'Gagal menyimpan kegiatan', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan server saat menyimpan.', 'error');
  }
});

window.deleteKegiatan = async function(id) {
  const item = kegiatanList.find(k => k.id === id);
  const title = item ? item.title : 'kegiatan ini';
  if (!confirm(`Apakah Anda yakin ingin menghapus "${title}"?`)) return;

  try {
    const res = await fetch(API.kegiatan, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast(result.message, 'success');
      fetchKegiatan();
    } else {
      showToast(result.message || 'Gagal menghapus kegiatan', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat menghapus.', 'error');
  }
};

// ===== KHOTBAH LOGIC =====
async function fetchKhotbah() {
  try {
    const res = await fetch(API.khotbah);
    const result = await res.json();
    khotbahList = result.data || [];
    renderKhotbah();
  } catch (err) {
    console.error('Failed to fetch khotbah:', err);
    showToast('Gagal memuat data khotbah', 'error');
  }
}

function renderKhotbah() {
  if (!khotbahList.length) {
    khotbahGrid.innerHTML = `
      <div class="empty-state">
        <p>Belum ada video khotbah terbaru.</p>
        <button class="btn-primary" onclick="openAddKhotbah()">+ Tambah Khotbah Sekarang</button>
      </div>
    `;
    return;
  }

  khotbahGrid.innerHTML = khotbahList.map(item => {
    const displayThumb = item.thumbnail && item.thumbnail.startsWith('./') ? '../' + item.thumbnail.substring(2) : item.thumbnail;
    return `
      <div class="admin-card">
        <div class="card-media">
          <img src="${displayThumb}" alt="${escapeHtml(item.title)}" onerror="this.src='../Resource/Screenshot 2026-07-26 233705.png'" />
          <span class="card-badge">${escapeHtml(item.series || 'Khotbah')}</span>
          <div class="card-play-icon">▶</div>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <div class="card-meta">
            <span>👤 ${escapeHtml(item.pastor || 'Pdt. Michael Gunawan')}</span>
            <span>⏱️ ${escapeHtml(item.duration || '30:00')}</span>
          </div>
          <a href="${escapeHtml(item.youtube_url)}" target="_blank" rel="noopener" class="card-link-preview">
            🔗 Buka YouTube Video ↗
          </a>
          <div class="card-meta" style="margin-bottom: 14px;">
            <span>👁️ ${escapeHtml(item.views || '0 views')}</span>
          </div>
          <div class="card-actions">
            <button class="btn-card btn-edit" onclick="openEditKhotbah('${item.id}')">
              ✏️ Edit Link / Gambar
            </button>
            <button class="btn-card btn-delete" onclick="deleteKhotbah('${item.id}')">
              🗑️ Hapus
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.openAddKhotbah = function() {
  formKhotbah.reset();
  khotbahId.value = '';
  modalKhotbahTitle.textContent = 'Tambah Khotbah Terbaru';
  khotbahSeries.value = 'M|G';
  khotbahPastor.value = 'Pdt. Michael Gunawan';
  khotbahDuration.value = '30:00';
  khotbahViews.value = '1,200 views';
  khotbahThumbnail.value = './Resource/Screenshot 2026-07-26 233705.png';
  updateKhotbahPreview('./Resource/Screenshot 2026-07-26 233705.png');
  modalKhotbah.classList.add('active');
};

window.openEditKhotbah = function(id) {
  const item = khotbahList.find(k => k.id === id);
  if (!item) return;

  khotbahId.value = item.id;
  khotbahTitle.value = item.title || '';
  khotbahSeries.value = item.series || 'M|G';
  khotbahPastor.value = item.pastor || '';
  khotbahYoutube.value = item.youtube_url || '';
  khotbahDuration.value = item.duration || '';
  khotbahViews.value = item.views || '';
  khotbahThumbnail.value = item.thumbnail || '';
  updateKhotbahPreview(item.thumbnail);

  modalKhotbahTitle.textContent = 'Edit Khotbah Terbaru';
  modalKhotbah.classList.add('active');
};

function updateKhotbahPreview(src) {
  if (!src) {
    khotbahPreview.innerHTML = '<span class="no-img-text">Belum ada thumbnail</span>';
    return;
  }
  const displaySrc = src.startsWith('./') ? '../' + src.substring(2) : src;
  khotbahPreview.innerHTML = `<img src="${displaySrc}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'no-img-text\\'>Thumbnail tidak ditemukan</span>'"/>`;
}

khotbahThumbnail.addEventListener('input', (e) => {
  updateKhotbahPreview(e.target.value.trim());
});

// Auto-Thumbnail button from YouTube link
btnAutoThumb.addEventListener('click', () => {
  const url = khotbahYoutube.value.trim();
  const vidId = extractYouTubeId(url);
  if (!vidId) {
    showToast('Silakan isi Link Video YouTube yang valid terlebih dahulu.', 'error');
    return;
  }
  const autoUrl = `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`;
  khotbahThumbnail.value = autoUrl;
  updateKhotbahPreview(autoUrl);
  showToast('Thumbnail otomatis dari YouTube berhasil diambil!', 'success');
});

// Upload image file for Khotbah
khotbahFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    khotbahPreview.innerHTML = '<span class="no-img-text">Mengunggah gambar...</span>';
    const res = await fetch(API.upload, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (res.ok && result.success) {
      khotbahThumbnail.value = result.url;
      updateKhotbahPreview(result.url);
      showToast('Thumbnail berhasil diunggah!', 'success');
    } else {
      showToast(result.message || 'Gagal mengunggah thumbnail', 'error');
      updateKhotbahPreview(khotbahThumbnail.value);
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat upload', 'error');
    updateKhotbahPreview(khotbahThumbnail.value);
  }
});

// Submit Khotbah Form
formKhotbah.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = khotbahId.value;
  const action = id ? 'update' : 'create';

  const payload = {
    action,
    id,
    title: khotbahTitle.value.trim(),
    series: khotbahSeries.value.trim(),
    pastor: khotbahPastor.value.trim(),
    youtube_url: khotbahYoutube.value.trim(),
    duration: khotbahDuration.value.trim(),
    views: khotbahViews.value.trim(),
    thumbnail: khotbahThumbnail.value.trim()
  };

  try {
    const res = await fetch(API.khotbah, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showToast(result.message, 'success');
      modalKhotbah.classList.remove('active');
      fetchKhotbah();
    } else {
      showToast(result.message || 'Gagal menyimpan khotbah', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan server saat menyimpan.', 'error');
  }
});

window.deleteKhotbah = async function(id) {
  const item = khotbahList.find(k => k.id === id);
  const title = item ? item.title : 'khotbah ini';
  if (!confirm(`Apakah Anda yakin ingin menghapus "${title}"?`)) return;

  try {
    const res = await fetch(API.khotbah, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast(result.message, 'success');
      fetchKhotbah();
    } else {
      showToast(result.message || 'Gagal menghapus khotbah', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat menghapus.', 'error');
  }
};

// Modal Close Triggers
document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    modalKegiatan.classList.remove('active');
    modalKhotbah.classList.remove('active');
  });
});

window.addEventListener('click', (e) => {
  if (e.target === modalKegiatan) modalKegiatan.classList.remove('active');
  if (e.target === modalKhotbah) modalKhotbah.classList.remove('active');
});

// Helper XSS Escape
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', checkAuth);
