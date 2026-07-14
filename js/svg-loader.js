/* ============================================
   COMLAB System - SVG Loader & Icon Manager
   ============================================ */

const SVG = {
  // Map category to SVG file path
  equipmentIcons: {
    'Hand Tool': 'assets/icon-handtool.svg',
    'Testing': 'assets/icon-testing.svg',
    'Networking': 'assets/icon-networking.svg',
    'Safety': 'assets/icon-safety.svg',
    'Cleaning': 'assets/icon-cleaning.svg',
    'Storage': 'assets/icon-storage.svg'
  },

  emptyStates: {
    search: 'assets/empty-search.svg',
    history: 'assets/empty-history.svg',
    data: 'assets/empty-data.svg'
  },

  // Get icon path for an equipment category
  getEquipIcon(category) {
    return this.equipmentIcons[category] || 'assets/icon-handtool.svg';
  },

  // Create an img element for an equipment icon
  createEquipIcon(category, size = 28) {
    const img = document.createElement('img');
    img.src = this.getEquipIcon(category);
    img.width = size;
    img.height = size;
    img.alt = category;
    img.style.objectFit = 'contain';
    return img;
  },

  // Get SVG as HTML string for inline embedding (for card icons)
  getEquipIconHTML(category, size = 28) {
    const src = this.getEquipIcon(category);
    return `<img src="${src}" width="${size}" height="${size}" alt="${category}" style="object-fit:contain;" />`;
  },

  // Inject SVG into a container (fetch and replace)
  injectSVG(container, url) {
    if (!container) return;
    fetch(url)
      .then(r => r.text())
      .then(svg => {
        container.innerHTML = svg;
        // Remove width/height from SVG to allow CSS sizing
        const svgEl = container.querySelector('svg');
        if (svgEl) {
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
        }
      })
      .catch(() => {
        // Fallback: just show nothing
        container.innerHTML = '';
      });
  },

  // Get empty state HTML
  getEmptyStateHTML(type, title, message) {
    const src = this.emptyStates[type] || this.emptyStates.data;
    return `
      <div style="text-align:center;padding:2rem;">
        <img src="${src}" alt="${title}" style="width:120px;height:100px;margin-bottom:1rem;opacity:0.6;" />
        <h3 style="margin-bottom:0.5rem;font-size:1.1rem;">${title}</h3>
        <p style="color:var(--text-secondary);font-size:0.9rem;">${message}</p>
      </div>
    `;
  }
};
