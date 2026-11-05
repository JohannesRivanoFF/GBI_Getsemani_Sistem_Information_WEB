/**
 * ============================================================================
 * SACRED PARALLAX BACKGROUND - NATIVE JAVASCRIPT (VANILLA JS)
 * Engine Background Interaktif Sinematik & Estetik Bertema Gereja
 * ============================================================================
 * 
 * Fitur Utama:
 * 1. Sacred Stained Glass: Pecahan geometri kaca patri 3D (stained glass) semi-transparan
 *    yang mengapung dan berotasi lembut di ruang anti-gravitasi.
 * 2. Glowing Cross & Radiant Rays: Siluet salib bercahaya murni dengan pendaran
 *    sinar keagungan (God rays/volumetric light) dari atas layar.
 * 3. Ascension Particles: Partikel pujian & hadirat Roh Kudus yang bergerak naik secara
 *    organik dan merespon kursor mouse seperti pusaran angin halus (fluid vortex).
 * 4. Multi-Layer Scroll Parallax: Kedalaman 3D berlapis saat halaman di-scroll.
 * 5. Smooth Inertia (Lerp Damping): Respon kursor mouse bergradasi halus dan mewah.
 * 6. Native & Ultra Ringan: Berjalan pada 60 FPS menggunakan HTML5 Canvas 2D murni,
 *    ramah smartphone, hemat baterai, dan tidak menghalangi klik (pointer-events: none).
 */

class SacredParallaxBackground {
  /**
   * Konstruktor untuk inisialisasi background
   * @param {Object} options - Pengaturan konfigurasi
   */
  constructor(options = {}) {
    // Pengaturan default: Hanya sisakan efek kaca dan sinar kecil-kecil
    this.options = Object.assign(
      {
        container: '#hero-sacred-bg', // Container target (Hero landing page atau document.body)
        shardCount: 16,              // Jumlah pecahan kaca patri 3D (stained glass)
        particleCount: null,         // Jumlah partikel sinar kecil-kecil (otomatis jika null)
        beamCount: 0,                // HILANGKAN efek sorotan sinar besar
        enableBeams: false,          // Nonaktifkan sorotan cahaya besar
        enableCross: false,          // Nonaktifkan salib cahaya besar
        enableMouseBloom: false,     // Nonaktifkan pendaran cahaya besar
        enableStainedGlass: true,    // Hanya sisakan efek kaca patri 3D
        enableScrollParallax: true,  // Aktifkan efek paralaks scroll
        mouseDamping: 0.045,         // Kehalusan lerp kursor (0.01 - 0.1)
        transparentBase: true,       // Mode transparan (berpadu serasi di atas foto hero)
        zIndex: 1,                   // z-index canvas
      },
      options
    );

    // Cari elemen container di DOM
    this.container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    // Jika container khusus tidak ditemukan, gunakan document.body sebagai fallback
    this.isBodyContainer = false;
    if (!this.container) {
      console.warn('SacredParallaxBackground: Target container tidak ditemukan, beralih ke document.body.');
      this.container = document.body;
      this.isBodyContainer = true;
    } else if (this.container === document.body) {
      this.isBodyContainer = true;
    }

    // Properti internal canvas & rendering
    this.wrapper = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.time = 0;

    // Koordinat kursor dengan interpolasi linier (Lerp Damping)
    this.mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      screenX: -1000,
      screenY: -1000,
      prevScreenX: 0,
      prevScreenY: 0,
      velocity: 0,
    };

    // Posisi scroll halaman
    this.scroll = {
      targetY: window.scrollY || 0,
      currentY: window.scrollY || 0,
    };

    // Palet warna kaca patri katedral (Jewel Tones & Sacred Gold)
    this.jewelTones = [
      { r: 255, g: 215, b: 120, a: 0.40, name: 'Sacred Gold' },
      { r: 251, g: 146, b: 60,  a: 0.36, name: 'Warm Amber' },
      { r: 168, g: 85,  b: 247, a: 0.32, name: 'Royal Amethyst' },
      { r: 56,  g: 189, b: 248, a: 0.30, name: 'Celestial Sapphire' },
      { r: 244, g: 63,  b: 94,  a: 0.28, name: 'Sacred Ruby' },
      { r: 253, g: 230, b: 138, a: 0.42, name: 'Divine Champagne' },
    ];

    // Koleksi objek visual
    this.particles = [];
    this.shards = [];
    this.beams = [];

    // Binding fungsi ke instance
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.render = this.render.bind(this);

    // Mulai inisialisasi
    this.init();
  }

  /**
   * Fungsi pembantu Interpolasi Linier (Lerp) untuk transisi halus
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /**
   * Membuat elemen DOM Canvas secara native
   */
  createDom() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'sacred-parallax-wrapper';
    this.wrapper.setAttribute('aria-hidden', 'true');

    if (this.isBodyContainer) {
      // Mode Fullscreen pada Body
      Object.assign(this.wrapper.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: String(this.options.zIndex),
        overflow: 'hidden',
        backgroundColor: this.options.transparentBase ? 'transparent' : '#040714',
      });
      document.body.classList.add('has-sacred-bg');
      this.container.prepend(this.wrapper);
    } else {
      // Mode Khusus di dalam Hero Section
      Object.assign(this.wrapper.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: String(this.options.zIndex),
        overflow: 'hidden',
      });
      this.container.appendChild(this.wrapper);
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sacred-parallax-canvas';
    Object.assign(this.canvas.style, {
      display: 'block',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
  }

  // ==========================================================================
  // 1. INTI GEOMETRI KACA PATRI 3D (STAINED GLASS SHARDS)
  // ==========================================================================
  generateShardGeometry(type, s) {
    switch (type) {
      case 0: // Diamond Shard (Gothic Rhombus)
        return [
          { x: 0, y: -s * 1.5, z: 0 },
          { x: s * 0.8, y: 0, z: s * 0.2 },
          { x: 0, y: s * 1.4, z: 0 },
          { x: -s * 0.8, y: 0, z: -s * 0.2 },
        ];
      case 1: // Gothic Cathedral Lancet Arch Shard
        return [
          { x: 0, y: -s * 1.6, z: s * 0.1 },
          { x: s * 0.75, y: -s * 0.4, z: 0 },
          { x: s * 0.65, y: s * 1.2, z: -s * 0.1 },
          { x: -s * 0.65, y: s * 1.2, z: -s * 0.1 },
          { x: -s * 0.75, y: -s * 0.4, z: 0 },
        ];
      case 2: // Triangle Gem Shard
        return [
          { x: 0, y: -s * 1.3, z: s * 0.2 },
          { x: s * 1.1, y: s * 0.9, z: -s * 0.1 },
          { x: -s * 1.1, y: s * 0.9, z: -s * 0.1 },
        ];
      default: // Sacred Hexagonal Facet
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3;
          pts.push({
            x: Math.cos(ang) * s,
            y: Math.sin(ang) * s * 1.1,
            z: (i % 2 === 0 ? 1 : -1) * s * 0.15,
          });
        }
        return pts;
    }
  }

  createShard(isInitial = false) {
    const scale = Math.random() * 30 + 26;
    const type = Math.floor(Math.random() * 4);
    return {
      x: (Math.random() - 0.5) * this.width * 1.2,
      y: isInitial ? (Math.random() - 0.5) * this.height * 1.3 : this.height * 0.6 + Math.random() * 150,
      z: Math.random() * 550 + 150,
      speedY: -(Math.random() * 0.25 + 0.1),
      speedX: (Math.random() - 0.5) * 0.12,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      rotSpeedX: (Math.random() - 0.5) * 0.006,
      rotSpeedY: (Math.random() - 0.5) * 0.008,
      rotSpeedZ: (Math.random() - 0.5) * 0.004,
      type,
      scale,
      tone: this.jewelTones[Math.floor(Math.random() * this.jewelTones.length)],
      floatOffset: Math.random() * Math.PI * 2,
      vertices: this.generateShardGeometry(type, scale),
    };
  }

  initShards() {
    this.shards = [];
    if (!this.options.enableStainedGlass) return;
    const count = window.innerWidth < 768 ? Math.floor(this.options.shardCount * 0.6) : this.options.shardCount;
    for (let i = 0; i < count; i++) {
      this.shards.push(this.createShard(true));
    }
  }

  // ==========================================================================
  // 2. INTI PARTIKEL ASCENSION & HADIRAT ROH KUDUS
  // ==========================================================================
  createParticle(isInitial = false) {
    const layerRoll = Math.random();
    let layer, depthFactor, mouseFactor, baseRadius, baseAlpha, speedY, speedX;

    if (layerRoll < 0.42) {
      layer = 0; // Far (Debu cahaya halus kecil)
      depthFactor = 0.08;
      mouseFactor = 0.02;
      baseRadius = Math.random() * 0.9 + 0.4; // Sinar sangat kecil
      baseAlpha = Math.random() * 0.45 + 0.25;
      speedY = -(Math.random() * 0.45 + 0.2);
      speedX = (Math.random() - 0.5) * 0.12;
    } else if (layerRoll < 0.82) {
      layer = 1; // Midground (Sinar kecil berkilau)
      depthFactor = 0.24;
      mouseFactor = 0.05;
      baseRadius = Math.random() * 1.5 + 0.8; // Sinar kecil
      baseAlpha = Math.random() * 0.6 + 0.35;
      speedY = -(Math.random() * 0.75 + 0.35);
      speedX = (Math.random() - 0.5) * 0.2;
    } else {
      layer = 2; // Foreground (Sinar kecil keemasan terdekat)
      depthFactor = 0.52;
      mouseFactor = 0.09;
      baseRadius = Math.random() * 2.2 + 1.2; // Sinar kecil dengan pendaran halus
      baseAlpha = Math.random() * 0.75 + 0.45;
      speedY = -(Math.random() * 1.0 + 0.5);
      speedX = (Math.random() - 0.5) * 0.3;
    }

    let color;
    const colorRoll = Math.random();
    if (colorRoll < 0.38) {
      color = { r: 255, g: 215, b: 120 }; // Sacred Gold
    } else if (colorRoll < 0.70) {
      color = { r: 255, g: 180, b: 60 };  // Warm Amber
    } else if (colorRoll < 0.88) {
      color = { r: 255, g: 242, b: 204 }; // Divine Champagne
    } else {
      color = { r: 216, g: 180, b: 254 }; // Soft Spiritual Amethyst
    }

    return {
      layer,
      depthFactor,
      mouseFactor,
      baseRadius,
      baseAlpha,
      speedY,
      speedX,
      x: Math.random() * this.width,
      y: isInitial ? Math.random() * this.height : this.height + Math.random() * 60,
      pulseAngle: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.025 + 0.01,
      swayAngle: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.02 + 0.006,
      swayWidth: Math.random() * 1.5 + 0.5,
      vx: 0,
      vy: 0,
      color,
    };
  }

  getTargetParticleCount() {
    if (typeof this.options.particleCount === 'number') {
      return this.options.particleCount;
    }
    const area = this.width * this.height;
    if (this.width < 768) return Math.min(65, Math.floor(area / 20000));
    return Math.min(130, Math.max(65, Math.floor(area / 14000)));
  }

  initParticles() {
    this.particles = [];
    const count = this.getTargetParticleCount();
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  // ==========================================================================
  // 3. INTI PANCARAN BERKAS SINAR (VOLUMETRIC GOD RAYS)
  // ==========================================================================
  initBeams() {
    this.beams = [];
    const count = this.options.beamCount;
    for (let i = 0; i < count; i++) {
      this.beams.push({
        angle: -0.32 + (i / (count - 1 || 1)) * 0.64 + (Math.random() - 0.5) * 0.05,
        widthTop: 24 + Math.random() * 32,
        widthBottom: 190 + Math.random() * 160,
        lengthFactor: 0.95 + Math.random() * 0.3,
        alphaBase: 0.07 + Math.random() * 0.05,
        pulseSpeed: 0.007 + Math.random() * 0.008,
        pulseOffset: (i * Math.PI) / 3,
      });
    }
  }

  /**
   * Respon Ukuran Layar & Perangkat (Responsive Resize)
   */
  handleResize() {
    if (this.isBodyContainer) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else {
      this.width = this.container.clientWidth || window.innerWidth;
      this.height = this.container.clientHeight || Math.max(650, window.innerHeight * 0.88);
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.initParticles();
    this.initShards();
    this.initBeams();
  }

  /**
   * Deteksi Posisi Mouse & Touch secara Native
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    this.mouse.targetX = (relX / this.width) - 0.5;
    this.mouse.targetY = (relY / this.height) - 0.5;
    this.mouse.screenX = relX;
    this.mouse.screenY = relY;
  }

  handleTouchMove(e) {
    if (e.touches && e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const relX = e.touches[0].clientX - rect.left;
      const relY = e.touches[0].clientY - rect.top;

      this.mouse.targetX = (relX / this.width) - 0.5;
      this.mouse.targetY = (relY / this.height) - 0.5;
      this.mouse.screenX = relX;
      this.mouse.screenY = relY;
    }
  }

  handleMouseLeave() {
    this.mouse.targetX = 0;
    this.mouse.targetY = 0;
    this.mouse.screenX = -1000;
    this.mouse.screenY = -1000;
  }

  handleScroll() {
    this.scroll.targetY = window.scrollY || window.pageYOffset || 0;
  }

  /**
   * Hemat Daya: Menjeda Animasi saat Tab Tidak Aktif
   */
  handleVisibilityChange() {
    if (document.hidden) {
      cancelAnimationFrame(this.animationFrameId);
    } else {
      this.animationFrameId = requestAnimationFrame(this.render);
    }
  }

  // ==========================================================================
  // 4. SIKLUS RENDER ANIMASI (60 FPS NATIVE)
  // ==========================================================================
  render() {
    this.time += 0.016;

    // Smooth Lerp Damping Kursor Mouse
    this.mouse.currentX = this.lerp(this.mouse.currentX, this.mouse.targetX, this.options.mouseDamping);
    this.mouse.currentY = this.lerp(this.mouse.currentY, this.mouse.targetY, this.options.mouseDamping);

    // Hitung kecepatan geser kursor
    const mdx = this.mouse.screenX - this.mouse.prevScreenX;
    const mdy = this.mouse.screenY - this.mouse.prevScreenY;
    this.mouse.velocity = Math.hypot(mdx, mdy);
    this.mouse.prevScreenX = this.mouse.screenX;
    this.mouse.prevScreenY = this.mouse.screenY;

    if (this.options.enableScrollParallax) {
      this.scroll.currentY = this.lerp(this.scroll.currentY, this.scroll.targetY, 0.06);
    }

    const { width, height, ctx } = this;
    const parallaxScroll = this.options.enableScrollParallax ? this.scroll.currentY : 0;

    // Bersihkan frame sebelumnya
    ctx.clearRect(0, 0, width, height);

    // Jika bukan mode transparan penuh, gambar gradien dasar
    if (!this.options.transparentBase) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#040714');
      bgGrad.addColorStop(0.38, '#0B132B');
      bgGrad.addColorStop(0.72, '#190A2E');
      bgGrad.addColorStop(1, '#050713');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // Titik Pusat Cahaya Surgawi (Celestial Nexus Origin)
    const celestialOriginX = width * 0.5 + (this.options.enableMouseBloom ? this.mouse.currentX * width * 0.16 : 0);
    const celestialOriginY = -35 + (this.options.enableMouseBloom ? this.mouse.currentY * 40 : 0);

    // ------------------------------------------------------------------------
    // A. RADIANT SUNBURST & VOLUMETRIC GOD RAYS (Hanya jika diaktifkan)
    // ------------------------------------------------------------------------
    if (this.options.enableBeams && this.options.beamCount > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      const hueShift = 0.5 + 0.5 * Math.sin(this.time * 0.4);
      const coreR = Math.round(this.lerp(255, 255, hueShift));
      const coreG = Math.round(this.lerp(185, 225, hueShift));
      const coreB = Math.round(this.lerp(65, 120, hueShift));

      // Pendaran radial lembut di puncak
      const sunburstBloom = ctx.createRadialGradient(
        celestialOriginX, celestialOriginY, 15,
        celestialOriginX, celestialOriginY, height * 0.85
      );
      sunburstBloom.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, 0.35)`);
      sunburstBloom.addColorStop(0.28, `rgba(245, 158, 32, 0.18)`);
      sunburstBloom.addColorStop(0.60, `rgba(168, 85, 247, 0.10)`);
      sunburstBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = sunburstBloom;
      ctx.fillRect(0, 0, width, height);

      // Berkas Sinar God Rays
      for (let i = 0; i < this.beams.length; i++) {
        const beam = this.beams[i];
        const pulse = Math.sin(this.time * beam.pulseSpeed * 60 + beam.pulseOffset);
        const dynamicAlpha = Math.max(0.02, beam.alphaBase + pulse * 0.03);
        
        const beamAngle = beam.angle + this.mouse.currentX * 0.08;
        const beamLength = height * beam.lengthFactor;

        const endCenterX = celestialOriginX + Math.sin(beamAngle) * beamLength;
        const endCenterY = celestialOriginY + Math.cos(beamAngle) * beamLength;

        const p1x = celestialOriginX - beam.widthTop * 0.5;
        const p1y = celestialOriginY;
        const p2x = celestialOriginX + beam.widthTop * 0.5;
        const p2y = celestialOriginY;
        const p3x = endCenterX + beam.widthBottom * 0.5;
        const p3y = endCenterY;
        const p4x = endCenterX - beam.widthBottom * 0.5;
        const p4y = endCenterY;

        const beamGrad = ctx.createLinearGradient(
          celestialOriginX, celestialOriginY,
          endCenterX, endCenterY
        );
        beamGrad.addColorStop(0, `rgba(255, 240, 185, ${dynamicAlpha * 1.6})`);
        beamGrad.addColorStop(0.28, `rgba(${coreR}, ${coreG}, ${coreB}, ${dynamicAlpha * 1.1})`);
        beamGrad.addColorStop(0.68, `rgba(245, 158, 32, ${dynamicAlpha * 0.45})`);
        beamGrad.addColorStop(1, 'rgba(245, 158, 32, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.lineTo(p4x, p4y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // B. GLOWING CROSS OF PURE LIGHT (SALIB BERCAHAYA MURNI)
    // ------------------------------------------------------------------------
    if (this.options.enableCross) {
      const crossCenterX = celestialOriginX;
      const crossCenterY = height * 0.32 - parallaxScroll * 0.06 + this.mouse.currentY * 25;
      
      const crossPulse = 0.85 + 0.15 * Math.sin(this.time * 1.6);
      const crossAlpha = 0.58 * crossPulse;

      const vHeight = Math.min(height * 0.55, 380);
      const hWidth = vHeight * 0.62;
      const beamThickness = Math.max(8, Math.min(22, width * 0.016));

      // Pendaran radial di persilangan salib
      const crossNexusGlow = ctx.createRadialGradient(
        crossCenterX, crossCenterY, beamThickness * 0.5,
        crossCenterX, crossCenterY, hWidth * 0.75
      );
      crossNexusGlow.addColorStop(0, `rgba(255, 250, 220, ${crossAlpha * 0.75})`);
      crossNexusGlow.addColorStop(0.35, `rgba(255, 200, 80, ${crossAlpha * 0.45})`);
      crossNexusGlow.addColorStop(0.7, `rgba(168, 85, 247, ${crossAlpha * 0.18})`);
      crossNexusGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = crossNexusGlow;
      ctx.beginPath();
      ctx.arc(crossCenterX, crossCenterY, hWidth * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Berkas Salib Vertikal
      const vGrad = ctx.createLinearGradient(
        crossCenterX, crossCenterY - vHeight * 0.38,
        crossCenterX, crossCenterY + vHeight * 0.62
      );
      vGrad.addColorStop(0, 'rgba(255, 215, 120, 0)');
      vGrad.addColorStop(0.2, `rgba(255, 245, 210, ${crossAlpha * 0.95})`);
      vGrad.addColorStop(0.38, `rgba(255, 255, 255, ${crossAlpha * 1.25})`);
      vGrad.addColorStop(0.7, `rgba(255, 195, 75, ${crossAlpha * 0.85})`);
      vGrad.addColorStop(1, 'rgba(245, 158, 32, 0)');

      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(crossCenterX - beamThickness * 0.5, crossCenterY - vHeight * 0.38, beamThickness, vHeight, beamThickness * 0.5)
        : ctx.rect(crossCenterX - beamThickness * 0.5, crossCenterY - vHeight * 0.38, beamThickness, vHeight);
      ctx.fill();

      // Berkas Salib Horizontal
      const hGrad = ctx.createLinearGradient(
        crossCenterX - hWidth * 0.5, crossCenterY,
        crossCenterX + hWidth * 0.5, crossCenterY
      );
      hGrad.addColorStop(0, 'rgba(255, 215, 120, 0)');
      hGrad.addColorStop(0.25, `rgba(255, 225, 120, ${crossAlpha * 0.85})`);
      hGrad.addColorStop(0.5, `rgba(255, 255, 255, ${crossAlpha * 1.25})`);
      hGrad.addColorStop(0.75, `rgba(255, 225, 120, ${crossAlpha * 0.85})`);
      hGrad.addColorStop(1, 'rgba(255, 215, 120, 0)');

      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(crossCenterX - hWidth * 0.5, crossCenterY - beamThickness * 0.5, hWidth, beamThickness, beamThickness * 0.5)
        : ctx.rect(crossCenterX - hWidth * 0.5, crossCenterY - beamThickness * 0.5, hWidth, beamThickness);
      ctx.fill();
    }
    ctx.restore();

    // ------------------------------------------------------------------------
    // C. SACRED STAINED GLASS GEOMETRY (PECAHAN KACA PATRI 3D)
    // ------------------------------------------------------------------------
    if (this.options.enableStainedGlass) {
      const shardCenterOriginX = width * 0.5;
      const shardCenterOriginY = height * 0.5;
      const fov = 650;

      for (let i = 0; i < this.shards.length; i++) {
        const shard = this.shards[i];

        shard.y += shard.speedY;
        shard.x += shard.speedX + Math.sin(this.time * 0.6 + shard.floatOffset) * 0.18;
        shard.rotX += shard.rotSpeedX;
        shard.rotY += shard.rotSpeedY;
        shard.rotZ += shard.rotSpeedZ;

        if (shard.y < -height * 0.8 || Math.abs(shard.x) > width * 0.9) {
          Object.assign(shard, this.createShard(false));
        }

        const currentRotX = shard.rotX + this.mouse.currentY * 0.4;
        const currentRotY = shard.rotY + this.mouse.currentX * 0.5;
        const currentRotZ = shard.rotZ;

        const adjustedZ = Math.max(50, shard.z - this.mouse.currentY * 120);
        const projScale = fov / (fov + adjustedZ);

        const screenX = shardCenterOriginX + (shard.x + this.mouse.currentX * 160) * projScale;
        const screenY = shardCenterOriginY + (shard.y - parallaxScroll * 0.26 + this.mouse.currentY * 90) * projScale;

        const cosX = Math.cos(currentRotX), sinX = Math.sin(currentRotX);
        const cosY = Math.cos(currentRotY), sinY = Math.sin(currentRotY);
        const cosZ = Math.cos(currentRotZ), sinZ = Math.sin(currentRotZ);

        const projectedPts = shard.vertices.map((v) => {
          let x1 = v.x * cosY + v.z * sinY;
          let y1 = v.y;
          let z1 = -v.x * sinY + v.z * cosY;

          let x2 = x1;
          let y2 = y1 * cosX - z1 * sinX;
          let z2 = y1 * sinX + z1 * cosX;

          let x3 = x2 * cosZ - y2 * sinZ;
          let y3 = x2 * sinZ + y2 * cosZ;

          return {
            x: screenX + x3 * projScale,
            y: screenY + y3 * projScale,
            z: z2,
          };
        });

        const vA = { x: projectedPts[1].x - projectedPts[0].x, y: projectedPts[1].y - projectedPts[0].y };
        const vB = { x: projectedPts[2].x - projectedPts[0].x, y: projectedPts[2].y - projectedPts[0].y };
        const crossZ = vA.x * vB.y - vA.y * vB.x;
        const faceNormal = Math.abs(crossZ) / (Math.hypot(vA.x, vA.y) * Math.hypot(vB.x, vB.y) + 0.001);

        const shimmer = 0.5 + 0.5 * Math.sin(this.time * 2.5 + shard.floatOffset);
        const lightSpec = Math.min(1, Math.max(0, faceNormal * 0.8 + shimmer * 0.35));

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(projectedPts[0].x, projectedPts[0].y);
        for (let j = 1; j < projectedPts.length; j++) {
          ctx.lineTo(projectedPts[j].x, projectedPts[j].y);
        }
        ctx.closePath();

        const glassGrad = ctx.createLinearGradient(
          projectedPts[0].x, projectedPts[0].y,
          projectedPts[2].x, projectedPts[2].y
        );
        const baseAlpha = shard.tone.a * (0.65 + lightSpec * 0.35);
        glassGrad.addColorStop(0, `rgba(${shard.tone.r}, ${shard.tone.g}, ${shard.tone.b}, ${baseAlpha * 1.3})`);
        glassGrad.addColorStop(0.5, `rgba(255, 235, 175, ${baseAlpha * 0.85})`);
        glassGrad.addColorStop(1, `rgba(${shard.tone.r}, ${shard.tone.g}, ${shard.tone.b}, ${baseAlpha * 0.45})`);

        ctx.fillStyle = glassGrad;
        ctx.globalCompositeOperation = 'screen';
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 225, 145, ${0.48 + lightSpec * 0.48})`;
        ctx.lineWidth = Math.max(1, 1.8 * projScale);
        ctx.stroke();

        if (projectedPts.length >= 3 && lightSpec > 0.45) {
          ctx.beginPath();
          ctx.moveTo(projectedPts[0].x, projectedPts[0].y);
          ctx.lineTo(projectedPts[2].x, projectedPts[2].y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(lightSpec - 0.45) * 0.9})`;
          ctx.lineWidth = Math.max(0.8, 1.2 * projScale);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // D. ASCENSION & HADIRAT ROH KUDUS (PARTIKEL KE ATAS + PUSARAN FLUIDA)
    // ------------------------------------------------------------------------
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.pulseAngle += p.pulseSpeed;
      p.swayAngle += p.swaySpeed;

      const naturalSway = Math.sin(p.swayAngle) * p.swayWidth;
      p.x += p.speedX + naturalSway + p.vx;
      p.y += p.speedY + p.vy;

      p.vx *= 0.93;
      p.vy *= 0.93;

      // Respon pusaran fluida saat kursor mendekat
      if (this.mouse.screenX > -500) {
        const dx = p.x - this.mouse.screenX;
        const dy = p.y - this.mouse.screenY;
        const dist = Math.hypot(dx, dy);
        const maxInfluence = 160 + (p.layer === 2 ? 80 : 0);

        if (dist < maxInfluence && dist > 1) {
          const force = (1 - dist / maxInfluence);
          const angle = Math.atan2(dy, dx);
          const swirl = angle + Math.PI * 0.42;

          p.vx += Math.cos(swirl) * force * 1.8;
          p.vy += (Math.sin(swirl) * force * 1.8) - force * 1.2;
        }
      }

      if (p.y < -40 || p.x < -40 || p.x > width + 40) {
        Object.assign(p, this.createParticle(false));
      }

      const renderX = p.x + this.mouse.currentX * p.mouseFactor * width;
      const renderY = (p.y - parallaxScroll * p.depthFactor + height * 5) % (height + 70) - 35;

      const pulse = 0.72 + Math.sin(p.pulseAngle) * 0.28;
      const radius = p.baseRadius * pulse;
      const alpha = Math.max(0, Math.min(1, p.baseAlpha * pulse));

      const glowRadius = radius * (p.layer === 2 ? 4.5 : 2.8);
      const grad = ctx.createRadialGradient(
        renderX, renderY, radius * 0.15,
        renderX, renderY, glowRadius
      );
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`);
      grad.addColorStop(0.38, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.45})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(renderX, renderY, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.animationFrameId = requestAnimationFrame(this.render);
  }

  /**
   * Mengaktifkan event listener dan memulai loop animasi
   */
  init() {
    this.createDom();
    this.handleResize();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', this.handleMouseLeave);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.animationFrameId = requestAnimationFrame(this.render);
  }

  /**
   * Membersihkan event listener & DOM jika komponen dilepas
   */
  destroy() {
    document.body.classList.remove('has-sacred-bg');
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }
}

// Kompatibilitas untuk Browser Global dan Modul ES
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SacredParallaxBackground;
} else if (typeof window !== 'undefined') {
  window.SacredParallaxBackground = SacredParallaxBackground;
}
