import React, { useEffect, useRef } from 'react';

/**
 * SacredParallaxBackground
 * Komponen background interaktif bertema gereja modern, estetik, dan sinematik.
 * Fitur Utama:
 * 1. Sacred Stained Glass Geometry: Pecahan ornamen kaca patri 3D semi-transparan mengapung & berotasi di ruang anti-gravitasi.
 * 2. Glowing Cross & Radiant Rays: Siluet salib abstrak dari cahaya murni yang memancarkan volumetric God rays hangat keemasan.
 * 3. Ascension & Holy Spirit Particles: Ratusan partikel cahaya bergerak naik organik (praise/ascension) dengan efek pusaran angin kursor halus.
 * 4. Multi-Layer Cinematic Scroll Parallax: Pemisahan depth 3D (Background Salib, Midground Kaca Patri, Foreground Embers).
 * 5. Fluid Mouse Inertia (Lerp Damping): Respon kursor mouse bergradasi halus dengan pendaran spektrum cahaya dan pantulan kaca.
 * 6. 60 FPS Lightweight Canvas 2D engine dengan auto-pause saat tab tidak aktif & CSS pointer-events: none.
 */
export const SacredParallaxBackground = ({
  className = '',
  style = {},
  particleCount,
  shardCount = 16,
  beamCount = 0,
  enableBeams = false,
  mouseDamping = 0.045,
  enableScrollParallax = true,
  enableMouseBloom = false,
  enableStainedGlass = true,
  enableCross = false,
  transparentBase = true,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    // Koordinat kursor & Scroll dengan Smooth Damping (Lerp)
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      screenX: -1000,
      screenY: -1000,
      velocity: 0,
      prevScreenX: 0,
      prevScreenY: 0,
    };

    const scroll = {
      targetY: window.scrollY || 0,
      currentY: window.scrollY || 0,
    };

    const lerp = (start, end, factor) => start + (end - start) * factor;

    // Palet Warna Kaca Patri & Spiritualitas Gereja (Cathedral Jewel & Sacred Gold)
    const jewelTones = [
      { r: 255, g: 215, b: 120, a: 0.38, name: 'Sacred Gold' },     // Emas Suci
      { r: 251, g: 146, b: 60,  a: 0.35, name: 'Warm Amber' },      // Amber Hangat
      { r: 168, g: 85,  b: 247, a: 0.32, name: 'Royal Amethyst' },   // Ungu Kerajaan
      { r: 56,  g: 189, b: 248, a: 0.30, name: 'Celestial Sapphire' }, // Biru Surgawi
      { r: 244, g: 63,  b: 94,  a: 0.28, name: 'Sacred Ruby' },      // Merah Delima
      { r: 253, g: 230, b: 138, a: 0.40, name: 'Divine Champagne' }, // Champagne Terang
    ];

    // =========================================================================
    // 1. SISTEM PECAHAN GEOMETRI KACA PATRI 3D (SACRED STAINED GLASS)
    // =========================================================================
    class StainedGlassShard {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial = false) {
        // Posisi dalam ruang 3D virtual
        this.x = (Math.random() - 0.5) * width * 1.3;
        this.y = isInitial ? (Math.random() - 0.5) * height * 1.4 : height * 0.7 + Math.random() * 200;
        this.z = Math.random() * 600 + 150; // Kedalaman Z (150 - 750)
        
        // Kecepatan melayang anti-gravitasi
        this.speedY = -(Math.random() * 0.28 + 0.12);
        this.speedX = (Math.random() - 0.5) * 0.14;

        // Rotasi 3D (Euler Angles)
        this.rotX = Math.random() * Math.PI * 2;
        this.rotY = Math.random() * Math.PI * 2;
        this.rotZ = Math.random() * Math.PI * 2;
        this.rotSpeedX = (Math.random() - 0.5) * 0.007;
        this.rotSpeedY = (Math.random() - 0.5) * 0.009;
        this.rotSpeedZ = (Math.random() - 0.5) * 0.005;

        // Tipe Poligon Kaca Patri (Diamond, Arch Shard, Hexagon, Triangle Gem)
        this.type = Math.floor(Math.random() * 4);
        this.scale = Math.random() * 32 + 28;
        this.tone = jewelTones[Math.floor(Math.random() * jewelTones.length)];

        // Kecepatan osilasi breathing & pantulan cahaya
        this.floatOffset = Math.random() * Math.PI * 2;
        this.shimmerSpeed = Math.random() * 0.03 + 0.01;

        // Definisi vertex lokal 3D
        this.vertices = this.generateGeometry(this.type, this.scale);
      }

      generateGeometry(type, s) {
        // Poligon 3D dengan sedikit ketebalan/facet bevel
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

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(time * 0.6 + this.floatOffset) * 0.18;

        this.rotX += this.rotSpeedX;
        this.rotY += this.rotSpeedY;
        this.rotZ += this.rotSpeedZ;

        // Reset jika mengapung melebihi batas atas
        if (this.y < -height * 0.8 || Math.abs(this.x) > width * 0.9) {
          this.reset(false);
        }
      }

      draw(centerX, centerY, parallaxY, mouseOffsetX, mouseOffsetY) {
        // Efek rotasi tambahan dari gaya lerp kursor mouse (dynamic tilt)
        const currentRotX = this.rotX + mouseOffsetY * 0.4;
        const currentRotY = this.rotY + mouseOffsetX * 0.5;
        const currentRotZ = this.rotZ;

        // Proyeksi Perspektif 3D
        const fov = 650;
        const adjustedZ = Math.max(50, this.z - mouseOffsetY * 120);
        const projScale = fov / (fov + adjustedZ);

        // Posisi layar dengan multi-layer scroll parallax (midground factor ~0.26)
        const screenX = centerX + (this.x + mouseOffsetX * 160) * projScale;
        const screenY = centerY + (this.y - parallaxY * 0.26 + mouseOffsetY * 90) * projScale;

        // Rotasi matriks 3D titik vertex
        const cosX = Math.cos(currentRotX), sinX = Math.sin(currentRotX);
        const cosY = Math.cos(currentRotY), sinY = Math.sin(currentRotY);
        const cosZ = Math.cos(currentRotZ), sinZ = Math.sin(currentRotZ);

        const projectedPts = this.vertices.map((v) => {
          // Rotasi Y
          let x1 = v.x * cosY + v.z * sinY;
          let y1 = v.y;
          let z1 = -v.x * sinY + v.z * cosY;

          // Rotasi X
          let x2 = x1;
          let y2 = y1 * cosX - z1 * sinX;
          let z2 = y1 * sinX + z1 * cosX;

          // Rotasi Z
          let x3 = x2 * cosZ - y2 * sinZ;
          let y3 = x2 * sinZ + y2 * cosZ;

          return {
            x: screenX + x3 * projScale,
            y: screenY + y3 * projScale,
            z: z2,
          };
        });

        // Hitung normal vektor permukaan untuk pantulan kilau (specular sheen)
        const vA = { x: projectedPts[1].x - projectedPts[0].x, y: projectedPts[1].y - projectedPts[0].y };
        const vB = { x: projectedPts[2].x - projectedPts[0].x, y: projectedPts[2].y - projectedPts[0].y };
        const crossZ = vA.x * vB.y - vA.y * vB.x;
        const faceNormal = Math.abs(crossZ) / (Math.hypot(vA.x, vA.y) * Math.hypot(vB.x, vB.y) + 0.001);

        // Pantulan cahaya kaca patri (shimmering glass reflection)
        const shimmer = 0.5 + 0.5 * Math.sin(time * 2.5 + this.floatOffset);
        const lightSpec = Math.min(1, Math.max(0, faceNormal * 0.8 + shimmer * 0.35));

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(projectedPts[0].x, projectedPts[0].y);
        for (let i = 1; i < projectedPts.length; i++) {
          ctx.lineTo(projectedPts[i].x, projectedPts[i].y);
        }
        ctx.closePath();

        // 1. Badan Kaca Patri Semi-transparan dengan Gradien Spektrum
        const glassGrad = ctx.createLinearGradient(
          projectedPts[0].x, projectedPts[0].y,
          projectedPts[2].x, projectedPts[2].y
        );
        const baseAlpha = this.tone.a * (0.65 + lightSpec * 0.35);
        glassGrad.addColorStop(0, `rgba(${this.tone.r}, ${this.tone.g}, ${this.tone.b}, ${baseAlpha * 1.25})`);
        glassGrad.addColorStop(0.5, `rgba(255, 235, 175, ${baseAlpha * 0.8})`);
        glassGrad.addColorStop(1, `rgba(${this.tone.r}, ${this.tone.g}, ${this.tone.b}, ${baseAlpha * 0.4})`);

        ctx.fillStyle = glassGrad;
        ctx.globalCompositeOperation = 'screen';
        ctx.fill();

        // 2. Garis Tepi Emas Kaca Patri (Sacred Gilded Camework)
        ctx.strokeStyle = `rgba(255, 225, 145, ${0.45 + lightSpec * 0.45})`;
        ctx.lineWidth = Math.max(1, 1.8 * projScale);
        ctx.stroke();

        // 3. Garis Refraksi / Spektrum Cahaya di Permukaan (Prism Specular Streak)
        if (projectedPts.length >= 3 && lightSpec > 0.45) {
          ctx.beginPath();
          ctx.moveTo(projectedPts[0].x, projectedPts[0].y);
          ctx.lineTo(projectedPts[2].x, projectedPts[2].y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(lightSpec - 0.45) * 0.85})`;
          ctx.lineWidth = Math.max(0.8, 1.2 * projScale);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // =========================================================================
    // 2. SISTEM PARTIKEL ASCENSION & ROH KUDUS (ORGANIC PRAISE ASCENSION)
    // =========================================================================
    class AscensionParticle {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial = false) {
        const layerRoll = Math.random();
        if (layerRoll < 0.42) {
          this.layer = 0; // Far (Background spiritual dust)
          this.depthFactor = 0.08;
          this.mouseFactor = 0.02;
          this.baseRadius = Math.random() * 1.3 + 0.6;
          this.baseAlpha = Math.random() * 0.35 + 0.18;
          this.speedY = -(Math.random() * 0.45 + 0.22);
          this.speedX = (Math.random() - 0.5) * 0.12;
        } else if (layerRoll < 0.82) {
          this.layer = 1; // Midground (Praise ascension motes)
          this.depthFactor = 0.24;
          this.mouseFactor = 0.05;
          this.baseRadius = Math.random() * 2.2 + 1.4;
          this.baseAlpha = Math.random() * 0.5 + 0.3;
          this.speedY = -(Math.random() * 0.75 + 0.38);
          this.speedX = (Math.random() - 0.5) * 0.22;
        } else {
          this.layer = 2; // Foreground (Radiant Holy Spirit embers)
          this.depthFactor = 0.52;
          this.mouseFactor = 0.09;
          this.baseRadius = Math.random() * 3.6 + 2.5;
          this.baseAlpha = Math.random() * 0.65 + 0.4;
          this.speedY = -(Math.random() * 1.1 + 0.6);
          this.speedX = (Math.random() - 0.5) * 0.32;
        }

        this.x = Math.random() * width;
        this.y = isInitial ? Math.random() * height : height + Math.random() * 60;
        
        // Gelombang harmonic ascension
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.025 + 0.01;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.swaySpeed = Math.random() * 0.02 + 0.006;
        this.swayWidth = Math.random() * 1.5 + 0.5;

        // Vektor interaksi fluida kursor
        this.vx = 0;
        this.vy = 0;

        // Warna keemasan & cahaya suci
        const colorRoll = Math.random();
        if (colorRoll < 0.38) {
          this.color = { r: 255, g: 215, b: 120 }; // Sacred Gold
        } else if (colorRoll < 0.70) {
          this.color = { r: 255, g: 180, b: 60 };  // Warm Amber
        } else if (colorRoll < 0.88) {
          this.color = { r: 255, g: 242, b: 204 }; // Divine Champagne
        } else {
          this.color = { r: 216, g: 180, b: 254 }; // Soft Spiritual Amethyst
        }
      }

      update(mouseScreenX, mouseScreenY, mouseVel) {
        this.pulseAngle += this.pulseSpeed;
        this.swayAngle += this.swaySpeed;

        // Gerak dasar ascension ke atas & goyangan lembut
        const naturalSway = Math.sin(this.swayAngle) * this.swayWidth;
        this.x += this.speedX + naturalSway + this.vx;
        this.y += this.speedY + this.vy;

        // Damping peluruhan gaya fluida angin kursor
        this.vx *= 0.93;
        this.vy *= 0.93;

        // Respon Pusaran Angin Kursor Mouse (Fluid Ethereal Vortex)
        if (mouseScreenX > -500) {
          const dx = this.x - mouseScreenX;
          const dy = this.y - mouseScreenY;
          const dist = Math.hypot(dx, dy);
          const maxInfluence = 160 + (this.layer === 2 ? 80 : 0);

          if (dist < maxInfluence && dist > 1) {
            const force = (1 - dist / maxInfluence);
            // Gaya dorong radial + pusaran sudut (tangential swirl)
            const angle = Math.atan2(dy, dx);
            const swirl = angle + Math.PI * 0.42;

            this.vx += Math.cos(swirl) * force * 1.8;
            this.vy += (Math.sin(swirl) * force * 1.8) - force * 1.2; // Tambahan daya angkat ke atas (ascension lift)
          }
        }

        // Looping partikel jika sudah melewati layar atas
        if (this.y < -40 || this.x < -40 || this.x > width + 40) {
          this.reset(false);
        }
      }

      draw(parallaxY, mouseOffsetX, mouseOffsetY) {
        const renderX = this.x + mouseOffsetX * this.mouseFactor * width;
        const renderY = (this.y - parallaxY * this.depthFactor + height * 5) % (height + 70) - 35;

        const pulse = 0.72 + Math.sin(this.pulseAngle) * 0.28;
        const radius = this.baseRadius * pulse;
        const alpha = Math.max(0, Math.min(1, this.baseAlpha * pulse));

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Outer holy glow
        const glowRadius = radius * (this.layer === 2 ? 4.5 : 2.8);
        const grad = ctx.createRadialGradient(
          renderX, renderY, radius * 0.15,
          renderX, renderY, glowRadius
        );
        grad.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        grad.addColorStop(0.38, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(renderX, renderY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inti putih berkilau
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(renderX, renderY, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // =========================================================================
    // 3. GLOWING CROSS & RADIANT VOLUMETRIC GOD RAYS (SALIB CAHAYA MURNI)
    // =========================================================================
    const beams = [];
    const initBeams = () => {
      beams.length = 0;
      for (let i = 0; i < beamCount; i++) {
        beams.push({
          angle: -0.32 + (i / (beamCount - 1 || 1)) * 0.64 + (Math.random() - 0.5) * 0.05,
          widthTop: 24 + Math.random() * 32,
          widthBottom: 190 + Math.random() * 160,
          lengthFactor: 0.95 + Math.random() * 0.3,
          alphaBase: 0.06 + Math.random() * 0.05,
          pulseSpeed: 0.007 + Math.random() * 0.008,
          pulseOffset: (i * Math.PI) / 3,
        });
      }
    };

    // Array objek
    let particles = [];
    let shards = [];

    const getTargetParticleCount = () => {
      if (typeof particleCount === 'number') return particleCount;
      const area = window.innerWidth * window.innerHeight;
      if (window.innerWidth < 768) return Math.min(65, Math.floor(area / 22000));
      return Math.min(130, Math.max(70, Math.floor(area / 15000)));
    };

    const initEntities = () => {
      particles = [];
      const pCount = getTargetParticleCount();
      for (let i = 0; i < pCount; i++) {
        particles.push(new AscensionParticle(true));
      }

      shards = [];
      if (enableStainedGlass) {
        const sCount = window.innerWidth < 768 ? Math.floor(shardCount * 0.6) : shardCount;
        for (let i = 0; i < sCount; i++) {
          shards.push(new StainedGlassShard(true));
        }
      }
      initBeams();
    };

    // =========================================================================
    // 4. LOOP RENDER UTAMA (60 FPS OPTIMIZED)
    // =========================================================================
    const render = () => {
      time += 0.016;

      // Update Lerp Damping Kursor (-0.5 hingga 0.5)
      mouse.currentX = lerp(mouse.currentX, mouse.targetX, mouseDamping);
      mouse.currentY = lerp(mouse.currentY, mouse.targetY, mouseDamping);

      // Hitung kecepatan perpindahan kursor
      const dx = mouse.screenX - mouse.prevScreenX;
      const dy = mouse.screenY - mouse.prevScreenY;
      mouse.velocity = Math.hypot(dx, dy);
      mouse.prevScreenX = mouse.screenX;
      mouse.prevScreenY = mouse.screenY;

      // Update Lerp Damping Scroll
      if (enableScrollParallax) {
        scroll.currentY = lerp(scroll.currentY, scroll.targetY, 0.06);
      }

      const parallaxScroll = enableScrollParallax ? scroll.currentY : 0;

      // Bersihkan frame sebelumnya
      ctx.clearRect(0, 0, width, height);

      // Jika bukan mode transparan penuh, gambar gradien dasar
      if (!transparentBase) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#040714');       // Midnight Obsidian Blue
        bgGrad.addColorStop(0.38, '#0B132B');    // Deep Cathedral Navy
        bgGrad.addColorStop(0.72, '#190A2E');    // Sacred Royal Amethyst
        bgGrad.addColorStop(1, '#050713');       // Deep Grounded Indigo
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Titik Pusat Cahaya Surgawi (Celestial Nexus Origin)
      const celestialOriginX = width * 0.5 + (enableMouseBloom ? mouse.currentX * width * 0.16 : 0);
      const celestialOriginY = -35 + (enableMouseBloom ? mouse.currentY * 40 : 0);

      // -----------------------------------------------------------------------
      // B. SPIRITUAL RADIANT BLOOM & VOLUMETRIC GOD RAYS (Hanya jika diaktifkan)
      // -----------------------------------------------------------------------
      if (enableBeams && beamCount > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // 1. Radiant Sunburst Aura di Puncak
        const sunburstBloom = ctx.createRadialGradient(
          celestialOriginX, celestialOriginY, 15,
          celestialOriginX, celestialOriginY, height * 0.85
        );
        const hueShift = 0.5 + 0.5 * Math.sin(time * 0.4);
        const coreR = Math.round(lerp(255, 255, hueShift));
        const coreG = Math.round(lerp(185, 225, hueShift));
        const coreB = Math.round(lerp(65, 120, hueShift));

        sunburstBloom.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, 0.32)`);
        sunburstBloom.addColorStop(0.25, `rgba(245, 158, 32, 0.16)`);
        sunburstBloom.addColorStop(0.55, `rgba(168, 85, 247, 0.09)`);
        sunburstBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = sunburstBloom;
        ctx.fillRect(0, 0, width, height);

        // 2. Volumetric God Rays
        beams.forEach((beam) => {
          const pulse = Math.sin(time * beam.pulseSpeed * 60 + beam.pulseOffset);
          const dynamicAlpha = Math.max(0.015, beam.alphaBase + pulse * 0.025);
          
          const beamAngle = beam.angle + mouse.currentX * 0.08;
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
          beamGrad.addColorStop(0.68, `rgba(245, 158, 32, ${dynamicAlpha * 0.4})`);
          beamGrad.addColorStop(1, 'rgba(245, 158, 32, 0)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.lineTo(p4x, p4y);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      // -----------------------------------------------------------------------
      // C. GLOWING CROSS DARI CAHAYA MURNI (ABSTRACT RADIANT CROSS)
      // -----------------------------------------------------------------------
      if (enableCross) {
        // Posisi Salib di Kedalaman Background (Scroll parallax lambat ~0.06x)
        const crossCenterX = celestialOriginX;
        const crossCenterY = height * 0.32 - parallaxScroll * 0.06 + mouse.currentY * 25;
        
        const crossPulse = 0.85 + 0.15 * Math.sin(time * 1.6);
        const crossAlpha = 0.55 * crossPulse;

        // Dimensi Salib
        const vHeight = Math.min(height * 0.55, 380);
        const hWidth = vHeight * 0.62;
        const beamThickness = Math.max(8, Math.min(22, width * 0.016));

        // 1. Radiant Cross Halo / Pendaran Berkas Cahaya di Titik Temu Salib
        const crossNexusGlow = ctx.createRadialGradient(
          crossCenterX, crossCenterY, beamThickness * 0.5,
          crossCenterX, crossCenterY, hWidth * 0.75
        );
        crossNexusGlow.addColorStop(0, `rgba(255, 250, 220, ${crossAlpha * 0.7})`);
        crossNexusGlow.addColorStop(0.35, `rgba(255, 200, 80, ${crossAlpha * 0.4})`);
        crossNexusGlow.addColorStop(0.7, `rgba(168, 85, 247, ${crossAlpha * 0.15})`);
        crossNexusGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = crossNexusGlow;
        ctx.beginPath();
        ctx.arc(crossCenterX, crossCenterY, hWidth * 0.75, 0, Math.PI * 2);
        ctx.fill();

        // 2. Berkas Sinar Vertikal Salib
        const vGrad = ctx.createLinearGradient(
          crossCenterX, crossCenterY - vHeight * 0.38,
          crossCenterX, crossCenterY + vHeight * 0.62
        );
        vGrad.addColorStop(0, 'rgba(255, 215, 120, 0)');
        vGrad.addColorStop(0.2, `rgba(255, 245, 210, ${crossAlpha * 0.95})`);
        vGrad.addColorStop(0.38, `rgba(255, 255, 255, ${crossAlpha * 1.2})`); // Titik temu putih murni
        vGrad.addColorStop(0.7, `rgba(255, 195, 75, ${crossAlpha * 0.8})`);
        vGrad.addColorStop(1, 'rgba(245, 158, 32, 0)');

        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.roundRect
          ? ctx.roundRect(crossCenterX - beamThickness * 0.5, crossCenterY - vHeight * 0.38, beamThickness, vHeight, beamThickness * 0.5)
          : ctx.rect(crossCenterX - beamThickness * 0.5, crossCenterY - vHeight * 0.38, beamThickness, vHeight);
        ctx.fill();

        // 3. Berkas Sinar Horizontal Salib
        const hGrad = ctx.createLinearGradient(
          crossCenterX - hWidth * 0.5, crossCenterY,
          crossCenterX + hWidth * 0.5, crossCenterY
        );
        hGrad.addColorStop(0, 'rgba(255, 215, 120, 0)');
        hGrad.addColorStop(0.25, `rgba(255, 225, 120, ${crossAlpha * 0.85})`);
        hGrad.addColorStop(0.5, `rgba(255, 255, 255, ${crossAlpha * 1.2})`);
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

      // -----------------------------------------------------------------------
      // D. SACRED STAINED GLASS GEOMETRY (LAYER MIDGROUND)
      // -----------------------------------------------------------------------
      if (enableStainedGlass) {
        const shardCenterOriginX = width * 0.5;
        const shardCenterOriginY = height * 0.5;

        for (let i = 0; i < shards.length; i++) {
          shards[i].update();
          shards[i].draw(shardCenterOriginX, shardCenterOriginY, parallaxScroll, mouse.currentX, mouse.currentY);
        }
      }

      // -----------------------------------------------------------------------
      // E. ASCENSION & HOLY SPIRIT PARTICLES (LAYER FOREGROUND & MIDGROUND)
      // -----------------------------------------------------------------------
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse.screenX, mouse.screenY, mouse.velocity);
        particles[i].draw(parallaxScroll, mouse.currentX, mouse.currentY);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Resize Handler dengan DPR Clamping
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initEntities();
    };

    // Event Handler Kursor & Touch
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / width) - 0.5;
      mouse.targetY = (e.clientY / height) - 0.5;
      mouse.screenX = e.clientX;
      mouse.screenY = e.clientY;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        mouse.targetX = (e.touches[0].clientX / width) - 0.5;
        mouse.targetY = (e.touches[0].clientY / height) - 0.5;
        mouse.screenX = e.touches[0].clientX;
        mouse.screenY = e.touches[0].clientY;
      }
    };

    const handleMouseLeave = () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
      mouse.screenX = -1000;
      mouse.screenY = -1000;
    };

    const handleScroll = () => {
      scroll.targetY = window.scrollY || window.pageYOffset || 0;
    };

    // Auto-Pause saat Tab Tidak Terlihat (Hemat Baterai & Performa)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    document.body.classList.add('has-sacred-bg');
    handleResize();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      document.body.classList.remove('has-sacred-bg');
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [particleCount, shardCount, beamCount, mouseDamping, enableScrollParallax, enableMouseBloom, enableStainedGlass, enableCross]);

  return (
    <div
      className={`sacred-parallax-container ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
        background: '#040714',
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default SacredParallaxBackground;
