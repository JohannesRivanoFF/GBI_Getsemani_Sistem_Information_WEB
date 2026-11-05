/**
 * GBI Getsemani — Modern Parallax & Segmented Pill Dock Navigation Engine
 * Inspired by 2026 Modern Web Trends (Apple VisionOS / Linear / Spline / Framer)
 */

(function () {
  'use strict';

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. FLOATING PILL DOCK NAVIGATION & SCROLLSPY
     ========================================================================== */
  function initDockNavigation() {
    const header = document.querySelector('.site-header.parallax-header') || document.querySelector('.site-header');
    const dockBar = document.getElementById('dockCapsuleBar');
    const indicator = document.getElementById('dockPillIndicator');
    const dockLinks = document.querySelectorAll('.dock-link');
    const mobileDrawer = document.getElementById('dockMobileDrawer');
    const navToggle = document.getElementById('dockNavToggle') || document.querySelector('.nav-toggle');

    if (!dockBar || !dockLinks.length) return;

    let activeLink = document.querySelector('.dock-link.active') || dockLinks[0];

    // Position the gliding indicator pill behind a link
    function moveIndicatorTo(link, animate = true) {
      if (!indicator || !link) return;
      const linkRect = link.getBoundingClientRect();
      const barRect = dockBar.getBoundingClientRect();

      // Relative to dockBar
      const left = linkRect.left - barRect.left;
      const width = linkRect.width;

      if (!animate) {
        indicator.style.transition = 'none';
      } else {
        indicator.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), width 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease';
      }

      indicator.style.transform = `translate3d(${left}px, 0, 0)`;
      indicator.style.width = `${width}px`;
      indicator.style.opacity = '1';
    }

    // Set initial position
    setTimeout(() => {
      if (activeLink) moveIndicatorTo(activeLink, false);
    }, 100);

    // Resize listener to re-align indicator
    window.addEventListener('resize', () => {
      if (activeLink) moveIndicatorTo(activeLink, false);
    }, { passive: true });

    // Hover effect on dock items
    dockLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        moveIndicatorTo(link, true);
      });

      link.addEventListener('mouseleave', () => {
        if (activeLink) moveIndicatorTo(activeLink, true);
      });

      // Smooth scroll on click for hash links
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            e.preventDefault();
            // Smooth scroll with offset for floating dock
            const navOffset = 85;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navOffset;
            window.scrollTo({
              top: targetPos,
              behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });

            // Set active link immediately
            dockLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            activeLink = link;
            moveIndicatorTo(activeLink, true);

            // Close mobile drawer if open
            if (mobileDrawer && mobileDrawer.classList.contains('is-open')) {
              mobileDrawer.classList.remove('is-open');
              if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
            }
          }
        }
      });
    });

    // Specular border glare tracking mouse on dock
    dockBar.addEventListener('mousemove', (e) => {
      const rect = dockBar.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      dockBar.style.setProperty('--mouse-x', `${x}%`);
      dockBar.style.setProperty('--mouse-y', `${y}%`);
    });

    // Mobile Toggle
    if (navToggle && mobileDrawer) {
      function closeMobileDrawer() {
        mobileDrawer.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }

      navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileDrawer.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      mobileDrawer.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const targetEl = document.querySelector(link.getAttribute('href'));
          if (!targetEl) return;

          e.preventDefault();
          const navOffset = 85;
          const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navOffset;

          closeMobileDrawer();
          window.scrollTo({
            top: targetPos,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        });
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!mobileDrawer.contains(e.target) && !navToggle.contains(e.target)) {
          closeMobileDrawer();
        }
      });
    }

    // ScrollSpy: Automatically highlight active section on scroll
    const sections = Array.from(dockLinks)
      .map(link => {
        const href = link.getAttribute('href');
        return href && href.startsWith('#') ? document.getElementById(href.substring(1)) : null;
      })
      .filter(Boolean);

    let scrollTicking = false;
    function onScrollSpy() {
      const scrollPos = window.scrollY + 120; // 120px offset
      let currentSection = null;

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSection = section;
        }
      });

      // Special case: if near bottom of page, activate last section (kontak)
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 80) {
        currentSection = sections[sections.length - 1];
      }

      if (currentSection) {
        const matchingLink = Array.from(dockLinks).find(link => link.getAttribute('href') === `#${currentSection.id}`);
        if (matchingLink && matchingLink !== activeLink) {
          dockLinks.forEach(l => l.classList.remove('active'));
          matchingLink.classList.add('active');
          activeLink = matchingLink;
          moveIndicatorTo(activeLink, true);
        }
      }

      // Header scrolled state
      if (header) {
        if (window.scrollY > 30) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      }

      scrollTicking = false;
    }

    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(onScrollSpy);
        scrollTicking = true;
      }
    }, { passive: true });

    onScrollSpy();
  }

  /* ==========================================================================
     2. INTERACTIVE 3D PERSPECTIVE TILT ACROSS ALL COMPONENTS
     (Coordinated with Parallax Engine & CSS Custom Properties)
     ========================================================================== */
  function initComponent3DTilt() {
    if (prefersReducedMotion) return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const tiltSelectors = [
      '.quick-info-card',
      '.tentang-value-card',
      '.next-service-banner',
      '.schedule-card',
      '.pastor-card',
      '.pastor-info-card',
      '.khotbah-card',
      '.pengumuman-card',
      '.pengumuman-pinned-container',
      '.ministry-grid article',
      '.ministry-card',
      '.gallery-grid figure',
      '.gallery-item',
      '.umkm-card',
      '.contact-card'
    ];

    const cards = document.querySelectorAll(tiltSelectors.join(', '));

    cards.forEach(card => {
      card.classList.add('parallax-tilt-card');

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left;
        const cardY = e.clientY - rect.top;

        const normX = (cardX / rect.width) - 0.5;
        const normY = (cardY / rect.height) - 0.5;

        // Subtle 7 degree max angle for sacred elegance
        const rotX = normY * -7;
        const rotY = normX * 7;

        card.style.setProperty('--card-mouse-x', `${cardX}px`);
        card.style.setProperty('--card-mouse-y', `${cardY}px`);

        if (card.hasAttribute('data-parallax') || card.hasAttribute('data-parallax-type')) {
          card.style.setProperty('--px-tilt-rot-x', `${rotX.toFixed(2)}deg`);
          card.style.setProperty('--px-tilt-rot-y', `${rotY.toFixed(2)}deg`);
          card.style.setProperty('--px-tilt-scale', '1.02');
        } else {
          card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        }
      });

      card.addEventListener('pointerleave', () => {
        if (card.hasAttribute('data-parallax') || card.hasAttribute('data-parallax-type')) {
          card.style.setProperty('--px-tilt-rot-x', '0deg');
          card.style.setProperty('--px-tilt-rot-y', '0deg');
          card.style.setProperty('--px-tilt-scale', '1');
        } else {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      });
    });
  }

  /* ==========================================================================
     3. GBI GETSEMANI — ULTRA-SMOOTH SMART PARALLAX MOTION ENGINE
     - Fully Compatible with Laptop Touchpads, Mice, Trackpads, and Mobile Touch
     - Pure RAF Lerp (Zero CSS transform transition fighting = 120 FPS fluidity)
     - Kinetic Velocity Physics: subtle squish/stretch & tilt on scroll momentum
     - Smart Multi-Depth Layering: background orbs, watermark drift, card counter-float
     - Auto-Enricher across all landmark church components
     ========================================================================== */
  function initSacredParallaxEngine() {
    if (prefersReducedMotion) {
      document.querySelectorAll('[data-parallax], [data-parallax-type]').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    // 1. Auto-enrich GBI Getsemani UI components
    const autoEnrichConfigs = [
      { selector: '.section-heading', type: 'fade-up', speed: -0.07, stagger: 0 },
      { selector: '.quick-info-card', type: 'fade-up', speed: 0.12, stagger: 90 },
      { selector: '.tentang-image', type: 'slide-left', speed: 0.1, stagger: 0 },
      { selector: '.tentang-text', type: 'slide-right', speed: -0.06, stagger: 100 },
      { selector: '.tentang-value-card', type: 'fade-up', speed: 0.1, stagger: 100 },
      { selector: '.next-service-banner', type: 'zoom-in', speed: 0.08, stagger: 0 },
      { selector: '.schedule-toolbar', type: 'fade-up', speed: 0.04, stagger: 50 },
      { selector: '.schedule-card', type: 'fade-up', speed: 0.12, stagger: 60 },
      { selector: '.pastor-card', type: 'slide-left', speed: 0.1, stagger: 0 },
      { selector: '.pastor-info-card', type: 'slide-right', speed: -0.05, stagger: 100 },
      { selector: '.khotbah-card', type: 'fade-up', speed: 0.13, stagger: 80 },
      { selector: '.pengumuman-pinned-container', type: 'zoom-in', speed: 0.08, stagger: 0 },
      { selector: '.pengumuman-card', type: 'fade-up', speed: 0.12, stagger: 60 },
      { selector: '.ministry-grid article, .ministry-card', type: 'fade-up', speed: 0.12, stagger: 60 },
      { selector: '.gallery-grid figure, .gallery-item', type: 'fade-up', speed: 0.14, stagger: 70 },
      { selector: '.contact-card', type: 'fade-up', speed: 0.1, stagger: 90 },
      { selector: '.umkm-card', type: 'fade-up', speed: 0.12, stagger: 60 }
    ];

    autoEnrichConfigs.forEach(cfg => {
      const items = document.querySelectorAll(cfg.selector);
      items.forEach((el, idx) => {
        if (!el.hasAttribute('data-parallax-type') && !el.hasAttribute('data-parallax')) {
          el.setAttribute('data-parallax-type', cfg.type);
        }
        if (!el.hasAttribute('data-parallax-speed')) {
          const modSpeed = cfg.stagger > 0 ? (idx % 2 === 0 ? cfg.speed : cfg.speed * 1.25) : cfg.speed;
          el.setAttribute('data-parallax-speed', modSpeed.toFixed(3));
        }
        if (!el.hasAttribute('data-parallax-delay') && !el.hasAttribute('data-parallax-stagger') && cfg.stagger > 0) {
          el.setAttribute('data-parallax-delay', String((idx % 6) * cfg.stagger));
        }
      });
    });

    // 2. Smart Parallax Node Object
    class SmartParallaxNode {
      constructor(el) {
        this.el = el;
        this.type = el.getAttribute('data-parallax-type') || el.getAttribute('data-parallax') || 'fade-up';
        this.speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.1;
        this.delay = parseInt(el.getAttribute('data-parallax-delay') || el.getAttribute('data-parallax-stagger'), 10) || 0;

        // Directional offsets
        this.initX = 0;
        this.initY = 0;
        this.initScale = 1;

        if (this.type.includes('up')) {
          this.initY = 50;
          this.initScale = 0.98;
        } else if (this.type.includes('down')) {
          this.initY = -50;
          this.initScale = 0.98;
        } else if (this.type.includes('left')) {
          this.initX = -54;
          this.initScale = 0.98;
        } else if (this.type.includes('right')) {
          this.initX = 54;
          this.initScale = 0.98;
        } else if (this.type.includes('zoom')) {
          this.initScale = 0.92;
        }

        // Set initial transform state immediately to prevent layout pop
        this.el.style.setProperty('--px-entrance-x', `${this.initX}px`);
        this.el.style.setProperty('--px-entrance-y', `${this.initY}px`);
        this.el.style.setProperty('--px-entrance-scale', this.initScale);

        // State trackers
        this.entranceProgress = 0;
        this.targetEntranceProgress = 0;
        this.currentParallaxY = 0;
        this.targetParallaxY = 0;

        this.isRevealed = false;
        this.revealStartTime = 0;
      }

      reveal() {
        if (!this.isRevealed) {
          this.isRevealed = true;
          this.revealStartTime = performance.now() + this.delay;
          this.el.classList.add('is-revealed');
        }
      }

      updateTarget(viewportCenter, viewportHeight, now) {
        if (this.isRevealed && now >= this.revealStartTime) {
          this.targetEntranceProgress = 1.0;
        }

        const rect = this.el.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const progress = (elementCenter - viewportCenter) / (viewportHeight / 2);
        this.targetParallaxY = progress * this.speed * 68;
      }

      tick(lerpFactor, velocity) {
        // Fluid entrance reveal calculation on GPU
        const diffEnt = this.targetEntranceProgress - this.entranceProgress;
        this.entranceProgress += diffEnt * 0.075;

        const entX = this.initX * (1 - this.entranceProgress);
        const entY = this.initY * (1 - this.entranceProgress);
        const entScale = this.initScale + (1 - this.initScale) * this.entranceProgress;

        // Continuous parallax calculation
        const diffPara = this.targetParallaxY - this.currentParallaxY;
        this.currentParallaxY += diffPara * lerpFactor;

        // Smart kinetic velocity deformation (subtle squish/stretch & tilt)
        const kineticScale = 1 - Math.min(Math.abs(velocity) * 0.00025, 0.02);
        const kineticRot = Math.max(-1.5, Math.min(1.5, velocity * 0.012));

        // Inject to GPU Custom Properties
        this.el.style.setProperty('--px-entrance-x', `${entX.toFixed(2)}px`);
        this.el.style.setProperty('--px-entrance-y', `${entY.toFixed(2)}px`);
        this.el.style.setProperty('--px-entrance-scale', entScale.toFixed(4));
        this.el.style.setProperty('--px-scroll-y', `${this.currentParallaxY.toFixed(2)}px`);
        this.el.style.setProperty('--px-scroll-scale', kineticScale.toFixed(4));
        this.el.style.setProperty('--px-scroll-rot', `${kineticRot.toFixed(2)}deg`);
        this.el.style.setProperty('--sub-scroll-y', `${(this.currentParallaxY * -0.22).toFixed(2)}px`);

        return Math.abs(diffEnt) + Math.abs(diffPara);
      }
    }

    // 3. Register Nodes
    const elements = Array.from(document.querySelectorAll('[data-parallax], [data-parallax-type]'));
    const activeNodes = new Set();
    const nodeMap = new Map();

    elements.forEach(el => {
      nodeMap.set(el, new SmartParallaxNode(el));
    });

    // 4. Intersection Observer (Handles entrance trigger & off-screen culling)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const node = nodeMap.get(entry.target);
        if (!node) return;

        if (entry.isIntersecting) {
          node.reveal();
          activeNodes.add(node);
          requestTick();
        } else {
          activeNodes.delete(node);
        }
      });
    }, {
      root: null,
      rootMargin: '120px 0px 120px 0px',
      threshold: 0.04
    });

    elements.forEach(el => observer.observe(el));

    // 5. Ambient Orbs & Section Watermarks
    const ambientOrbs = document.querySelectorAll('.parallax-ambient-orb');
    const watermarks = document.querySelectorAll('.section-watermark');

    // 6. 120 FPS RAF Lerp Loop
    let isTicking = false;
    const LERP_FACTOR = 0.075;
    let lastScrollY = window.scrollY;
    let smoothVelocity = 0;

    function renderParallaxFrame(now) {
      const scrollY = window.scrollY;
      const vHeight = window.innerHeight;
      const vCenter = vHeight / 2;

      // Calculate instantaneous scroll velocity with damping
      const rawVelocity = scrollY - lastScrollY;
      smoothVelocity += (rawVelocity - smoothVelocity) * 0.2;
      lastScrollY = scrollY;

      let maxDiff = 0;

      // Update all active nodes
      activeNodes.forEach(node => {
        node.updateTarget(vCenter, vHeight, now);
        const diff = node.tick(LERP_FACTOR, smoothVelocity);
        if (diff > maxDiff) maxDiff = diff;
      });

      // Update background ambient orbs
      ambientOrbs.forEach((orb, i) => {
        const speed = (i % 2 === 0 ? 0.06 : -0.04);
        orb.style.transform = `translate3d(0, ${(scrollY * speed).toFixed(2)}px, 0)`;
      });

      // Update smart watermarks (counter-drift)
      watermarks.forEach(wm => {
        const rect = wm.getBoundingClientRect();
        const progress = (rect.top - vCenter) / vHeight;
        wm.style.transform = `translate3d(${(progress * -35).toFixed(2)}px, ${(progress * 18).toFixed(2)}px, 0)`;
      });

      // Keep running if motion or momentum exists
      if (maxDiff > 0.03 || Math.abs(smoothVelocity) > 0.05) {
        requestAnimationFrame(renderParallaxFrame);
      } else {
        isTicking = false;
      }
    }

    function requestTick() {
      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(renderParallaxFrame);
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', () => {
      const vHeight = window.innerHeight;
      const vCenter = vHeight / 2;
      const now = performance.now();
      activeNodes.forEach(node => node.updateTarget(vCenter, vHeight, now));
      requestTick();
    }, { passive: true });

    requestTick();
  }

  /* ==========================================================================
     DOM READY INITIALIZATION
     ========================================================================== */
  function onDomReady() {
    initDockNavigation();
    initComponent3DTilt();
    initSacredParallaxEngine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDomReady);
  } else {
    onDomReady();
  }

})();



