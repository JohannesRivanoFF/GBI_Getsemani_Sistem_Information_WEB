const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const year = document.querySelector("#year");
const yearFooter = document.querySelector("#year-footer");
const contactForm = document.querySelector("#contact-form");
const formNote = document.querySelector("#form-note");
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dots span");
const heroCard = document.querySelector(".hero-card");

// ── Navbar Transparent on Scroll ─────────────────────────────────────
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const SCROLL_THRESHOLD = 20; // px, seberapa jauh scroll sebelum navbar solid
  let ticking = false;

  function updateNavbar() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
    ticking = false;
  }

  // Saat scroll: throttle dengan rAF agar tidak membebani browser
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });

  // Set state awal (misal user refresh di tengah halaman)
  updateNavbar();
})();
// ─────────────────────────────────────────────────────────────────────


const churchWhatsapp = "6281234567890";
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Tahun footer
if (yearFooter) {
  yearFooter.textContent = new Date().getFullYear();
}

// Tahun (untuk fallback)
if (year) {
  year.textContent = new Date().getFullYear();
}

// Nav toggle
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Hero slider
let activeHeroSlide = 0;

const showHeroSlide = (index) => {
  if (!heroSlides.length) return;

  heroSlides[activeHeroSlide].classList.remove("is-active");
  if (heroDots[activeHeroSlide]) {
    heroDots[activeHeroSlide].classList.remove("is-active");
  }

  activeHeroSlide = index % heroSlides.length;
  heroSlides[activeHeroSlide].classList.add("is-active");
  if (heroDots[activeHeroSlide]) {
    heroDots[activeHeroSlide].classList.add("is-active");
  }
};

if (heroSlides.length > 1) {
  window.setInterval(() => {
    showHeroSlide(activeHeroSlide + 1);
  }, 4200);
}

// Parallax + reveal (jika tidak reduce motion)
if (!reduceMotion) {
  const revealItems = document.querySelectorAll(
    ".quick-info article, .section-heading, .schedule-card, .about-image, .about-content, .announcement, .ministry-grid article, .gallery-grid figure, .contact-card, .contact-form",
  );

  revealItems.forEach((item) => item.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -70px 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));

  let ticking = false;

  const updateParallax = () => {
    const y = window.scrollY;

    if (heroCard) {
      heroCard.style.setProperty(
        "--hero-card-offset",
        `${Math.min(y * -0.035, 0)}px`,
      );
    }

    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true },
  );

  updateParallax();
}

// Contact form
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const need = String(formData.get("need") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !contact || !need || !message) {
      if (formNote) {
        formNote.textContent = "Mohon lengkapi semua kolom sebelum mengirim.";
      }
      return;
    }

    const text = [
      "Shalom admin GBI Getsemani,",
      "",
      `Nama: ${name}`,
      `Kontak: ${contact}`,
      `Kebutuhan: ${need}`,
      `Pesan: ${message}`,
    ].join("\n");

    const url = `https://wa.me/${churchWhatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener");

    if (formNote) {
      formNote.textContent =
        "Terima kasih. WhatsApp akan terbuka untuk mengirim pesan ke admin gereja.";
    }
  });
}
// ===== MEDIA SLIDESHOW =====
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".media-slide");
  if (!slides.length) return;

  let currentSlide = 0;
  const intervalTime = 8000; // 8 detik
  let slideInterval;

  // Fungsi untuk menampilkan slide tertentu
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  }

  // Fungsi untuk pindah ke slide berikutnya
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  // Fungsi untuk memulai interval
  function startInterval() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, intervalTime);
  }

  // Inisialisasi: tampilkan slide pertama
  showSlide(0);
  startInterval();

  // Pause saat hover, lanjutkan saat leave
  const section = document.querySelector(".media-section");
  if (section) {
    section.addEventListener("mouseenter", () => {
      clearInterval(slideInterval);
    });
    section.addEventListener("mouseleave", () => {
      startInterval();
    });
  }
});
function toggleWaChat() {
  const chatBox = document.getElementById("waChatBox");
  chatBox.classList.toggle("active");
}
document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".schedule-section");
  const glow = document.querySelector(".background-glow");

  if (!section || !glow) return;

  let mouseX = 0,
    mouseY = 0;
  let currentX = 0,
    currentY = 0;

  // Mendapatkan posisi kursor saat bergerak di dalam section
  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // Fungsi animasi agar pergerakan background terasa mengalir (tidak kaku)
  function animateBackground() {
    // Angka '0.08' mengatur tingkat kehalusan/kelambatan kejar (semakin kecil semakin smooth/mengalir)
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    glow.style.left = `${currentX}px`;
    glow.style.top = `${currentY}px`;

    requestAnimationFrame(animateBackground);
  }

  animateBackground();

  // Opsi opsional: Perbesar sedikit cahaya background saat kursor masuk ke area section
  section.addEventListener("mouseenter", () => {
    glow.style.opacity = "1";
  });

  section.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });
});

// ===== DYNAMIC CMS CONTENT: KEGIATAN & KHOTBAH =====
async function loadDynamicKegiatan() {
  const galleryGrid = document.getElementById("gallery-grid");
  if (!galleryGrid) return;

  try {
    const res = await fetch("./api/kegiatan.php");
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      galleryGrid.innerHTML = result.data.map(item => `
        <figure>
          <div class="gallery-image">
            <img
              src="${escapeHtml(item.image || './Resource/IBADAH MINGGU.jpeg')}"
              alt="${escapeHtml(item.title || 'Kegiatan')}"
              loading="lazy"
            />
            <div class="gallery-overlay">
              <span class="overlay-title">${escapeHtml(item.title || '')}</span>
              <span class="overlay-desc">${escapeHtml(item.short_desc || item.description || '')}</span>
            </div>
          </div>
          <figcaption>
            <strong>${escapeHtml(item.title || '')}</strong>
            <p>${escapeHtml(item.description || item.short_desc || '')}</p>
            <span class="date">📅 ${escapeHtml(item.date || '')}</span>
          </figcaption>
        </figure>
      `).join('');
    }
  } catch (e) {
    console.debug("Dynamic kegiatan fetch skipped or failed, using fallback:", e);
  }
}

async function loadDynamicKhotbah() {
  const khotbahGrid = document.getElementById("khotbah-grid");
  if (!khotbahGrid) return;

  try {
    const res = await fetch("./api/khotbah.php");
    if (!res.ok) return;
    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      khotbahGrid.innerHTML = result.data.map(item => `
        <article class="khotbah-card">
          <a
            href="${escapeHtml(item.youtube_url || '#')}"
            target="_blank"
            rel="noopener"
            class="khotbah-link"
          >
            <div class="khotbah-device">
              <div class="khotbah-device-frame">
                <div class="device-notch"></div>
                <div class="khotbah-thumbnail">
                  <img
                    src="${escapeHtml(item.thumbnail || './Resource/Screenshot 2026-07-26 233705.png')}"
                    alt="Thumbnail Khotbah - ${escapeHtml(item.title || '')}"
                    loading="lazy"
                  />
                  <div class="khotbah-play">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      width="56"
                      height="56"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <div class="khotbah-duration">${escapeHtml(item.duration || '30:00')}</div>
                </div>
              </div>
              <div class="device-bottom"></div>
            </div>
            <div class="khotbah-info">
              <span class="khotbah-series">${escapeHtml(item.series || 'M|G')}</span>
              <h3 class="khotbah-title">${escapeHtml(item.title || '')}</h3>
              <p class="khotbah-pastor">${escapeHtml(item.pastor || 'Pdt. Michael Gunawan')}</p>
              <div class="khotbah-views">👁️ ${escapeHtml(item.views || '0 views')}</div>
            </div>
          </a>
        </article>
      `).join('');
    }
  } catch (e) {
    console.debug("Dynamic khotbah fetch skipped or failed, using fallback:", e);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener("DOMContentLoaded", () => {
  loadDynamicKegiatan();
  loadDynamicKhotbah();

  // ===== PASTOR FULL-STAGE SPOTLIGHT SLIDER (1-BY-1 CONTROLLER) =====
  function initPastorSlider() {
    const track = document.getElementById("pastorTrack");
    const slides = document.querySelectorAll(".pastor-slide");
    const tabs = document.querySelectorAll(".pastor-tab");
    const dots = document.querySelectorAll(".pastor-dot");
    const prevBtn = document.getElementById("pastorPrevBtn");
    const nextBtn = document.getElementById("pastorNextBtn");
    const currentIdxEl = document.getElementById("pastorCurrentIndex");
    const totalCountEl = document.getElementById("pastorTotalCount");
    const stage = document.getElementById("pastorStage");

    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideTimer = null;

    if (totalCountEl) {
      totalCountEl.textContent = String(totalSlides).padStart(2, "0");
    }

    function updateSlide(index) {
      currentSlide = (index + totalSlides) % totalSlides;

      // Update Track transform (sliding horizontally 100% per slide)
      track.style.transform = `translateX(-${currentSlide * 100}%)`;

      // Update Slides state
      slides.forEach((slide, idx) => {
        const isActive = idx === currentSlide;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", !isActive);
      });

      // Update Tabs state
      tabs.forEach((tab, idx) => {
        const isActive = idx === currentSlide;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive);
      });

      // Update Dots state
      dots.forEach((dot, idx) => {
        dot.classList.toggle("is-active", idx === currentSlide);
      });

      // Update Counter
      if (currentIdxEl) {
        currentIdxEl.textContent = String(currentSlide + 1).padStart(2, "0");
      }
    }

    // Prev / Next button clicks
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        updateSlide(currentSlide - 1);
        restartAutoSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        updateSlide(currentSlide + 1);
        restartAutoSlide();
      });
    }

    // Tabs clicks
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const idx = parseInt(tab.getAttribute("data-index"), 10);
        if (!isNaN(idx)) {
          updateSlide(idx);
          restartAutoSlide();
        }
      });
    });

    // Dots clicks
    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(idx)) {
          updateSlide(idx);
          restartAutoSlide();
        }
      });
    });

    // Touch Swipe support for Mobile
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 45;

    if (stage) {
      stage.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      stage.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      // Pause on hover
      stage.addEventListener("mouseenter", () => stopAutoSlide());
      stage.addEventListener("mouseleave", () => startAutoSlide());
    }

    function handleSwipe() {
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX < 0) {
          // Swiped left -> next slide
          updateSlide(currentSlide + 1);
        } else {
          // Swiped right -> prev slide
          updateSlide(currentSlide - 1);
        }
        restartAutoSlide();
      }
    }

    // Keyboard Arrow navigation when pastor section is focused
    const pastorSection = document.getElementById("gembala");
    if (pastorSection) {
      pastorSection.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          updateSlide(currentSlide - 1);
          restartAutoSlide();
        } else if (e.key === "ArrowRight") {
          updateSlide(currentSlide + 1);
          restartAutoSlide();
        }
      });
    }

    // Auto-slide every 8 seconds
    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = setInterval(() => {
        updateSlide(currentSlide + 1);
      }, 8000);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    function restartAutoSlide() {
      stopAutoSlide();
      startAutoSlide();
    }

    // Initialize
    updateSlide(0);
    startAutoSlide();
  }

  initPastorSlider();
});

// =========================================================
// Gets Media Ministry - Interactive Background Engine
// Paste snippet ini ke dalam file app.js Anda
// =========================================================
(function initMediaInteractiveBg() {
  const canvas = document.getElementById('media-interactive-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null };

  const config = {
    particleCount: 160,
    speedMult: 2,
    maxSize: 5,
    interactionMode: 'magnet', // 'repel', 'magnet', 'ripple', 'off'
    interactionRadius: 150,
    forceStrength: 3,
    particleColor: '#2dd4bf',
    glowIntensity: 16,
    constellation: true,
    bgStart: '#041316',
    bgEnd: '#0b2e34'
  };

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.offsetWidth;
    const h = canvas.parentElement.offsetHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    initParticles(w, h);
  }

  class Particle {
    constructor(w, h) {
      this.reset(w, h);
    }

    reset(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.baseSize = Math.random() * (config.maxSize - 0.8) + 0.8;
      this.size = this.baseSize;
      this.vx = (Math.random() - 0.5) * 0.5 * config.speedMult;
      this.vy = (Math.random() - 0.5) * 0.5 * config.speedMult;
      this.baseAlpha = Math.random() * 0.6 + 0.25;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      this.pulseAngle = Math.random() * Math.PI * 2;
    }

    update(w, h) {
      this.pulseAngle += this.pulseSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.15;

      this.x += this.vx * config.speedMult;
      this.y += this.vy * config.speedMult;

      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;

      if (mouse.x !== null && mouse.y !== null && config.interactionMode !== 'off') {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.interactionRadius) {
          const normDist = (config.interactionRadius - dist) / config.interactionRadius;
          const force = normDist * config.forceStrength;
          const angle = Math.atan2(dy, dx);

          if (config.interactionMode === 'repel') {
            this.x -= Math.cos(angle) * force * 1.5;
            this.y -= Math.sin(angle) * force * 1.5;
          } else if (config.interactionMode === 'magnet') {
            this.x += Math.cos(angle) * force * 1.2;
            this.y += Math.sin(angle) * force * 1.2;
          }
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);

      const r = parseInt(config.particleColor.slice(1, 3), 16);
      const g = parseInt(config.particleColor.slice(3, 5), 16);
      const b = parseInt(config.particleColor.slice(5, 7), 16);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;

      if (config.glowIntensity > 0) {
        ctx.shadowBlur = config.glowIntensity;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initParticles(w, h) {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle(w, h));
    }
  }

  function drawConstellation() {
    if (!config.constellation) return;
    const maxDist = 110;
    const r = parseInt(config.particleColor.slice(1, 3), 16);
    const g = parseInt(config.particleColor.slice(3, 5), 16);
    const b = parseInt(config.particleColor.slice(5, 7), 16);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    const w = canvas.parentElement.offsetWidth;
    const h = canvas.parentElement.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, config.bgStart);
    grad.addColorStop(1, config.bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    drawConstellation();

    particles.forEach(p => {
      p.update(w, h);
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeCanvas);

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  resizeCanvas();
  animate();
})();
document.addEventListener("DOMContentLoaded", function () {
  // ==========================================
  // 1. GEOMETRIC TOUCH GRID CANVAS ENGINE
  // ==========================================
  const canvas = document.getElementById("jadwal-interactive-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ── Konfigurasi Grid ──────────────────────────────────────────
  const CELL_SIZE   = 52;    // Ukuran dasar satu kotak (px)
  const GAP         = 10;    // Jarak antar kotak
  const HOVER_RADIUS = 160;  // Radius deteksi kursor (px)
  const MAX_SCALE   = 1.45;  // Pembesaran maksimum kotak
  const MAX_ROT     = 45;    // Rotasi maksimum (derajat)
  const MAX_DISP    = 22;    // Perpindahan anti-gravitasi (px)
  const SPRING_STIFF = 0.08; // Kekakuan pegas saat kembali
  const SPRING_DAMP  = 0.72; // Damping pegas

  // Warna dasar & sentuh
  const COLOR_BASE   = "rgba(227,179,65,";  // emas transparan
  const COLOR_TOUCH_GOLD = [227, 179, 65];
  const COLOR_TOUCH_CYAN = [56, 189, 248];

  // ── State ──────────────────────────────────────────────────────
  let width = 0, height = 0;
  let dpr = window.devicePixelRatio || 1;
  let cells = [];
  const mouse = { x: null, y: null };
  let rafId = null;

  // ── Struktur satu sel grid ────────────────────────────────────
  function makeCell(col, row) {
    const step = CELL_SIZE + GAP;
    return {
      col, row,
      // Posisi tengah sel (logical px)
      bx: col * step + CELL_SIZE / 2,
      by: row * step + CELL_SIZE / 2,
      // State saat ini (animasi)
      ox: 0, oy: 0,   // offset displacement
      vox: 0, voy: 0, // velocity offset
      scale: 1,
      vscale: 0,
      rot: 0,         // derajat
      vrot: 0,
      fillT: 0,       // 0..1 intensitas fill sentuhan
      vfill: 0,
      isCyan: false
    };
  }

  // ── Inisialisasi / Resize ──────────────────────────────────────
  function initCanvas() {
    dpr = window.devicePixelRatio || 1;

    // Fallback: gunakan ukuran section jika parentElement belum punya tinggi
    const parent = canvas.parentElement;
    const sectionEl = document.getElementById("jadwal") || canvas.closest(".jadwal-section");
    width  = parent.clientWidth  || (sectionEl ? sectionEl.clientWidth  : window.innerWidth);
    height = parent.clientHeight || (sectionEl ? sectionEl.clientHeight : window.innerHeight);

    canvas.width  = Math.round(width  * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width  = width  + "px";
    canvas.style.height = height + "px";

    // Reset transform DPR setiap kali resize
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Bangun kisi
    const step = CELL_SIZE + GAP;
    const cols = Math.ceil(width  / step) + 1;
    const rows = Math.ceil(height / step) + 1;

    cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push(makeCell(c, r));
      }
    }
  }

  // ── Loop Animasi ──────────────────────────────────────────────
  function animate() {
    ctx.clearRect(0, 0, width, height);

    const mx = mouse.x;
    const my = mouse.y;
    const hasHover = mx !== null && my !== null;

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];

      // ── Hitung target berdasarkan jarak kursor ────────────
      let targetOX = 0, targetOY = 0;
      let targetScale = 1;
      let targetRot = 0;
      let targetFill = 0;

      if (hasHover) {
        const dx = mx - (c.bx + c.ox);
        const dy = my - (c.by + c.oy);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS) {
          const t = 1 - dist / HOVER_RADIUS; // 0..1, makin dekat makin besar

          // Perpindahan anti-gravitasi: dorong menjauh dari kursor
          const pushMag = t * MAX_DISP;
          const angle   = Math.atan2(dy, dx);
          targetOX = -Math.cos(angle) * pushMag;
          targetOY = -Math.sin(angle) * pushMag;

          // Scale-up elastis
          targetScale = 1 + t * (MAX_SCALE - 1);

          // Rotasi mengarah ke tekanan
          targetRot = t * MAX_ROT * (dx > 0 ? 1 : -1);

          // Fill color
          targetFill = t;
          c.isCyan = (Math.abs(dx) < CELL_SIZE * 0.6 && Math.abs(dy) < CELL_SIZE * 0.6);
        }
      }

      // ── Spring physics ─────────────────────────────────────
      // Offset X
      const fOX = (targetOX - c.ox) * SPRING_STIFF;
      c.vox = c.vox * SPRING_DAMP + fOX;
      c.ox += c.vox;

      // Offset Y
      const fOY = (targetOY - c.oy) * SPRING_STIFF;
      c.voy = c.voy * SPRING_DAMP + fOY;
      c.oy += c.voy;

      // Scale
      const fS = (targetScale - c.scale) * SPRING_STIFF;
      c.vscale = c.vscale * SPRING_DAMP + fS;
      c.scale += c.vscale;

      // Rotasi
      const fR = (targetRot - c.rot) * SPRING_STIFF;
      c.vrot = c.vrot * SPRING_DAMP + fR;
      c.rot += c.vrot;

      // Fill
      const fF = (targetFill - c.fillT) * (SPRING_STIFF * 1.4);
      c.vfill = c.vfill * SPRING_DAMP + fF;
      c.fillT += c.vfill;
      c.fillT = Math.max(0, Math.min(1, c.fillT));

      // ── Gambar kotak ───────────────────────────────────────
      const cx = c.bx + c.ox;
      const cy = c.by + c.oy;
      const s  = CELL_SIZE * c.scale;
      const half = s / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(c.rot * Math.PI / 180);

      // Border opacity naik saat tersentuh
      const borderAlpha = 0.12 + c.fillT * 0.55;
      const borderWidth = 0.8 + c.fillT * 1.6;

      // Fill warna sentuhan
      if (c.fillT > 0.005) {
        const rgb = c.isCyan ? COLOR_TOUCH_CYAN : COLOR_TOUCH_GOLD;
        ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${c.fillT * 0.18})`;
        ctx.fillRect(-half, -half, s, s);

        // Inner glow
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, half * 1.1);
        grd.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${c.fillT * 0.22})`);
        grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(-half, -half, s, s);
      }

      // Border kotak
      ctx.strokeStyle = COLOR_BASE + borderAlpha + ")";
      ctx.lineWidth   = borderWidth;
      ctx.strokeRect(-half, -half, s, s);

      ctx.restore();
    }

    rafId = requestAnimationFrame(animate);
  }

  // ── Event Listeners ───────────────────────────────────────────
  // Targetkan seluruh <section id="jadwal"> agar kursor terdeteksi di seluruh area,
  // termasuk saat kursor ada di atas kartu jadwal yang melayang di atasnya.
  const section = document.getElementById("jadwal") || canvas.closest(".jadwal-section");

  if (section) {
    section.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    section.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  // ── Resize Handler ────────────────────────────────────────────
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(rafId);
      initCanvas();
      animate();
    }, 120);
  });

  // ── Mulai ─────────────────────────────────────────────────────
  initCanvas();
  animate();


  // ==========================================
  // 2. LIVE SEARCH & FILTER CATEGORIES
  // ==========================================
  const searchInput = document.getElementById("scheduleSearch");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".schedule-card");

  let currentCategory = "all";
  let currentSearch = "";

  function filterCards() {
    cards.forEach((card) => {
      const category = card.getAttribute("data-category");
      const title = card.getAttribute("data-title") || "";
      const day = card.getAttribute("data-day") || "";

      const matchesCat = currentCategory === "all" || category === currentCategory;
      const matchesSearch =
        title.toLowerCase().includes(currentSearch) ||
        day.toLowerCase().includes(currentSearch);

      if (matchesCat && matchesSearch) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-category");
      filterCards();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      filterCards();
    });
  }


  // ==========================================
  // 3. TIMER COUNTDOWN IBADAH TERDEKAT
  // ==========================================
  function updateCountdown() {
    const countdownEl = document.getElementById("nextCountdown");
    if (!countdownEl) return;

    const now = new Date();
    // Simulasi target ke ibadah hari Minggu jam 06:15
    let target = new Date();
    target.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    target.setHours(6, 15, 0, 0);

    if (now > target) {
      target.setDate(target.getDate() + 7);
    }

    const diff = target - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    countdownEl.textContent = `${hours}j ${mins}m ${secs}d lagi`;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();
});


// ==========================================
// 4. HELPER UTILITIES (Global Scope)
// ==========================================

// Salin Teks Jadwal
function copySchedule(title, day, time) {
  const text = `*${title}*\nHari: ${day}\nJam: ${time}`;
  navigator.clipboard.writeText(text).then(() => {
    alert(`Jadwal "${title}" berhasil disalin!`);
  }).catch(() => {
    alert("Gagal menyalin jadwal.");
  });
}

// Download File .ICS Kalender
function downloadICS(title, day, timeStr) {
  const icsData =
    `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Gereja Service Schedule//ID
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:Jadwal Ibadah Gereja - ${title} (${day} jam ${timeStr})
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}