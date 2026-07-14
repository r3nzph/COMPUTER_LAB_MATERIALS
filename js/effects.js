/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Effects & Animations
   ============================================ */

// ===== PERFORMANCE DETECTION =====
const PerformanceDetector = {
  isLowEnd() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    // Check for reduced data preference
    if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return true;
    // Check low CPU cores
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
    // Check low memory (Chrome only)
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
    // Check for mobile connection (slow network)
    if (navigator.connection) {
      if (navigator.connection.saveData) return true;
      if (navigator.connection.effectiveType === 'slow-2g' || navigator.connection.effectiveType === '2g') return true;
    }
    return false;
  },

  getParticleCount() {
    const base = Math.min(Math.floor(window.innerWidth / 30), 40);
    if (this.isLowEnd()) return Math.min(base, 6);
    return base;
  },

  shouldSkipHeavyEffects() {
    return this.isLowEnd() || !!document.querySelector('.reduce-animations');
  }
};

// Add no-animations class to body for low-end devices
if (PerformanceDetector.isLowEnd()) {
  document.documentElement.classList.add('reduce-animations');
}

// ===== PARTICLES SYSTEM =====
class ParticleSystem {
  constructor() {
    this.container = document.querySelector('.particles-container');
    if (!this.container) return;
    // Skip particles entirely on low-end devices
    if (PerformanceDetector.shouldSkipHeavyEffects()) return;
    this.particleCount = PerformanceDetector.getParticleCount();
    if (this.particleCount <= 0) return;
    this.init();
  }

  init() {
    for (let i = 0; i < this.particleCount; i++) {
      this.createParticle();
    }
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 4 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = Math.random() * 15 + 10 + 's';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.opacity = Math.random() * 0.3 + 0.1;
    this.container.appendChild(particle);
  }
}

// ===== TYPING EFFECT =====
class TypeWriter {
  constructor(element, texts, options = {}) {
    this.element = element;
    this.texts = texts;
    this.textIndex = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.speed = options.speed || 80;
    this.deleteSpeed = options.deleteSpeed || 40;
    this.pauseEnd = options.pauseEnd || 2000;
    this.pauseStart = options.pauseStart || 500;
    this.cursor = element.querySelector('.typing-cursor');
    this.init();
  }

  init() {
    this.type();
  }

  type() {
    const currentText = this.texts[this.textIndex];

    if (this.isDeleting) {
      this.charIndex--;
      this.speed = this.deleteSpeed;
    } else {
      this.charIndex++;
      this.speed = 80;
    }

    let displayText = currentText.substring(0, this.charIndex);

    // Remove cursor from text content
    this.element.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        node.textContent = '';
      }
    });

    // Update text while preserving cursor element
    const textNode = document.createTextNode(displayText);
    this.element.insertBefore(textNode, this.cursor);

    // Remove old text nodes
    const oldTextNodes = [];
    this.element.childNodes.forEach(node => {
      if (node.nodeType === 3 && node !== textNode) {
        oldTextNodes.push(node);
      }
    });
    oldTextNodes.forEach(node => node.remove());

    if (!this.isDeleting && this.charIndex === currentText.length) {
      this.speed = this.pauseEnd;
      this.isDeleting = true;
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.textIndex = (this.textIndex + 1) % this.texts.length;
      this.speed = this.pauseStart;
    }

    setTimeout(() => this.type(), this.speed);
  }
}

// ===== COUNTER ANIMATION =====
class CounterAnimation {
  constructor() {
    this.counters = document.querySelectorAll('.counter');
    this.observed = new Set();
    this.init();
  }

  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.observed.has(entry.target)) {
            this.observed.add(entry.target);
            this.animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.counters.forEach((counter) => observer.observe(counter));
  }

  animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target')) || 0;
    const duration = 2000;
    const start = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }
}

// ===== SCROLL REVEAL =====
class ScrollReveal {
  constructor() {
    this.revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .scroll-reveal, .stagger-children');
    this.init();
  }

  init() {
    window.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            window.revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.revealElements.forEach((el) => window.revealObserver.observe(el));
  }
}

// ===== LOADING SCREEN =====
class LoadingScreen {
  constructor() {
    this.screen = document.querySelector('.loading-screen');
    if (!this.screen) return;
    this.init();
  }

  init() {
    const minLoadTime = 2000;
    const startTime = Date.now();

    window.addEventListener('load', () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);

      setTimeout(() => {
        this.screen.classList.add('hidden');
        document.body.style.overflow = 'visible';
      }, remaining);
    });

    // Fallback: hide after 4 seconds even if not loaded
    setTimeout(() => {
      if (!this.screen.classList.contains('hidden')) {
        this.screen.classList.add('hidden');
        document.body.style.overflow = 'visible';
      }
    }, 4000);
  }
}

// ===== NAVBAR =====
class Navbar {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.toggle = document.querySelector('.nav-toggle');
    this.links = document.querySelector('.nav-links');
    this.init();
  }

  init() {
    // Scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        this.navbar?.classList.add('scrolled');
      } else {
        this.navbar?.classList.remove('scrolled');
      }
    });

    // Mobile toggle
    this.toggle?.addEventListener('click', () => {
      this.toggle.classList.toggle('active');
      this.links?.classList.toggle('open');
    });

    // Close on link click
    this.links?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        this.toggle?.classList.remove('active');
        this.links?.classList.remove('open');
      });
    });

    // Active link handled by auth.renderRoleNav()
  }
}

// ===== NOTIFICATION TOAST =====
class Notification {
  static show(title, message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
      <div class="notif-title">${title}</div>
      <div class="notif-message">${message}</div>
    `;
    document.body.appendChild(notif);

    requestAnimationFrame(() => {
      notif.classList.add('show');
    });

    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 400);
    }, 3500);
  }
}

// ===== TABLE SORT =====
class TableSort {
  constructor(tableElement) {
    this.table = tableElement;
    this.tbody = tableElement.querySelector('tbody');
    this.thead = tableElement.querySelector('thead');
    this.rows = Array.from(this.tbody.querySelectorAll('tr'));
    this.sortIndex = -1;
    this.sortAsc = true;
    this.init();
  }

  init() {
    this.thead.querySelectorAll('th').forEach((th, index) => {
      if (!th.classList.contains('no-sort')) {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => this.sort(index));

        // Add sort icon
        const icon = document.createElement('span');
        icon.className = 'sort-icon';
        icon.textContent = ' ↕';
        th.appendChild(icon);
      }
    });
  }

  sort(index) {
    if (this.sortIndex === index) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortIndex = index;
      this.sortAsc = true;
    }

    // Update sort icons
    this.thead.querySelectorAll('.sort-icon').forEach((icon) => {
      icon.textContent = ' ↕';
    });

    const header = this.thead.querySelectorAll('th')[index];
    const icon = header.querySelector('.sort-icon');
    if (icon) {
      icon.textContent = this.sortAsc ? ' ↑' : ' ↓';
    }

    const sortedRows = this.rows.sort((a, b) => {
      const aVal = a.children[index]?.textContent.trim() || '';
      const bVal = b.children[index]?.textContent.trim() || '';

      const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
      const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return this.sortAsc ? aNum - bNum : bNum - aNum;
      }

      return this.sortAsc
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    sortedRows.forEach((row) => this.tbody.appendChild(row));
  }
}

// ===== TABLE FILTER =====
class TableFilter {
  constructor(tableElement) {
    this.table = tableElement;
    this.tbody = tableElement.querySelector('tbody');
    this.rows = Array.from(this.tbody.querySelectorAll('tr'));
    this.init();
  }

  filter(searchText, columnIndex = -1) {
    const text = searchText.toLowerCase();
    this.rows.forEach((row) => {
      if (!text) {
        row.style.display = '';
        return;
      }

      const cells = row.querySelectorAll('td');
      let match = false;

      if (columnIndex >= 0) {
        match = cells[columnIndex]?.textContent.toLowerCase().includes(text);
      } else {
        cells.forEach((cell) => {
          if (cell.textContent.toLowerCase().includes(text)) match = true;
        });
      }

      row.style.display = match ? '' : 'none';
    });
  }
}

// ===== INITIALIZE ALL EFFECTS =====
document.addEventListener('DOMContentLoaded', () => {
  new LoadingScreen();
  new ParticleSystem();
  new Navbar();
  new ScrollReveal();
  new CounterAnimation();

  // Global modal close handler
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Initialize table sort/filter if tables exist
  document.querySelectorAll('table.sortable').forEach((table) => {
    new TableSort(table);
  });
});
