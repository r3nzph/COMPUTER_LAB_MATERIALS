/* ============================================
   COMLAB System - SVG Loader & Icon Manager
   Inline SVGs — no external file dependencies
   ============================================ */

const SVG = {
  // ===== HIGH-QUALITY INLINE SVG ICONS per category =====
  _icons: {
    'Hand Tool': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L8 12v8c0 10.5 6.5 20.3 16 24 9.5-3.7 16-13.5 16-24v-8L24 4z" fill="#990000" opacity="0.15"/><path d="M24 8L12 14v6c0 8.5 5.2 16.5 12 19.5 6.8-3 12-11 12-19.5v-6L24 8z" fill="#990000" opacity="0.08"/><rect x="20" y="16" width="8" height="16" rx="2" fill="#990000"/><rect x="14" y="20" width="20" height="3" rx="1.5" fill="#d32f2f"/><rect x="18" y="28" width="12" height="2" rx="1" fill="#d32f2f"/><circle cx="24" cy="13" r="3" fill="#990000"/><rect x="22.5" y="10" width="3" height="24" rx="1.5" fill="#990000"/></svg>`,

    'Testing': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="6" width="28" height="36" rx="4" fill="#990000" opacity="0.12"/><rect x="14" y="10" width="20" height="28" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="24" cy="20" r="8" fill="#990000" opacity="0.12" stroke="#d32f2f" stroke-width="1.5"/><circle cx="24" cy="20" r="3" fill="#990000"/><rect x="16" y="30" width="16" height="2" rx="1" fill="#d32f2f" opacity="0.5"/><rect x="16" y="33" width="10" height="2" rx="1" fill="#d32f2f" opacity="0.3"/><line x1="24" y1="12" x2="24" y2="28" stroke="#990000" stroke-width="1.5"/><line x1="16" y1="20" x2="32" y2="20" stroke="#990000" stroke-width="1.5"/></svg>`,

    'Networking': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="14" width="32" height="20" rx="4" fill="#990000" opacity="0.12"/><rect x="12" y="16" width="24" height="16" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="20" cy="24" r="2" fill="#990000"/><circle cx="28" cy="24" r="2" fill="#990000"/><circle cx="24" cy="24" r="2" fill="#d32f2f"/><rect x="12" y="18" width="24" height="2" rx="1" fill="#d32f2f" opacity="0.3"/><rect x="22" y="32" width="4" height="4" rx="1" fill="#990000" opacity="0.5"/><rect x="22" y="36" width="4" height="4" rx="1" fill="#990000"/><rect x="10" y="40" width="28" height="2" rx="1" fill="#d32f2f" opacity="0.2"/></svg>`,

    'Safety': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4L6 12v10c0 12.5 7.5 24.2 18 28 10.5-3.8 18-15.5 18-28V12L24 4z" fill="#990000" opacity="0.1"/><path d="M24 8L10 15v9c0 10.5 6.5 20.3 14 23.5 7.5-3.2 14-13 14-23.5v-9L24 8z" fill="white" stroke="#990000" stroke-width="1.5"/><path d="M24 16l-6 6h4v8h4v-8h4l-6-6z" fill="#990000"/><circle cx="24" cy="30" r="2" fill="#d32f2f"/><rect x="22" y="22" width="4" height="6" rx="1" fill="white"/></svg>`,

    'Cleaning': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="16" y="6" width="16" height="36" rx="3" fill="#990000" opacity="0.12"/><rect x="18" y="8" width="12" height="32" rx="2" fill="white" stroke="#990000" stroke-width="1.5"/><rect x="14" y="40" width="20" height="4" rx="2" fill="#990000"/><circle cx="24" cy="16" r="6" fill="#990000" opacity="0.08" stroke="#d32f2f" stroke-width="1.5"/><circle cx="24" cy="16" r="2" fill="#990000"/><rect x="18" y="32" width="12" height="2" rx="1" fill="#d32f2f" opacity="0.3"/><rect x="18" y="35" width="8" height="2" rx="1" fill="#d32f2f" opacity="0.2"/><rect x="18" y="26" width="12" height="3" rx="1.5" fill="#990000" opacity="0.15"/></svg>`,

    'Storage': `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="8" width="28" height="32" rx="4" fill="#990000" opacity="0.12"/><rect x="12" y="10" width="24" height="28" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><rect x="16" y="14" width="16" height="10" rx="2" fill="#990000" opacity="0.1"/><rect x="19" y="17" width="10" height="4" rx="1" fill="#990000" opacity="0.3"/><rect x="16" y="28" width="16" height="8" rx="2" fill="#990000" opacity="0.06"/><rect x="19" y="30" width="10" height="4" rx="1" fill="#d32f2f" opacity="0.4"/><rect x="14" y="14" width="2" height="24" rx="1" fill="#d32f2f" opacity="0.15"/></svg>`
  },

  // ===== PER-EQUIPMENT CUSTOM ICONS =====
  _equipIcons: {
    'Precision Screwdriver Set': `<svg viewBox="0 0 48 48" fill="none"><rect x="18" y="6" width="12" height="36" rx="3" fill="#990000" opacity="0.12"/><rect x="22" y="8" width="4" height="20" rx="2" fill="#990000"/><rect x="20" y="28" width="8" height="12" rx="3" fill="#d32f2f"/><circle cx="24" cy="12" r="2" fill="#d32f2f"/></svg>`,
    'Long Nose Pliers': `<svg viewBox="0 0 48 48" fill="none"><path d="M14 4L22 24v12l-8 8" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M34 4L26 24v12l8 8" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="12" y="4" width="24" height="3" rx="1.5" fill="#d32f2f"/><circle cx="18" cy="40" r="3" fill="#d32f2f" opacity="0.3"/><circle cx="30" cy="40" r="3" fill="#d32f2f" opacity="0.3"/></svg>`,
    'Wire Cutter': `<svg viewBox="0 0 48 48" fill="none"><path d="M10 6L26 24l-8 14" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38 6L22 24l8 14" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="24" cy="24" r="3" fill="#d32f2f"/><rect x="8" y="4" width="32" height="3" rx="1.5" fill="#990000" opacity="0.5"/></svg>`,
    'Soldering Iron': `<svg viewBox="0 0 48 48" fill="none"><rect x="16" y="6" width="12" height="24" rx="3" fill="#990000" opacity="0.12"/><rect x="20" y="8" width="4" height="20" rx="1.5" fill="#990000"/><path d="M22 28l-8 10h-4" stroke="#d32f2f" stroke-width="2" fill="none"/><circle cx="14" cy="38" r="2" fill="#ff6d00"/><circle cx="10" cy="38" r="1.5" fill="#ffab00"/></svg>`,
    'Digital Multimeter': `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="6" width="28" height="36" rx="4" fill="#990000" opacity="0.12"/><rect x="14" y="10" width="20" height="28" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><text x="24" y="22" text-anchor="middle" fill="#990000" font-size="10" font-weight="bold">Ω</text><text x="24" y="32" text-anchor="middle" fill="#d32f2f" font-size="7">200k</text></svg>`,
    'PSU Tester': `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="8" width="28" height="32" rx="4" fill="#990000" opacity="0.12"/><rect x="14" y="12" width="20" height="24" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="20" cy="20" r="4" fill="#00c853" opacity="0.3" stroke="#00c853" stroke-width="1.5"/><circle cx="28" cy="20" r="4" fill="#00c853" opacity="0.3" stroke="#00c853" stroke-width="1.5"/><rect x="16" y="28" width="16" height="4" rx="1" fill="#d32f2f" opacity="0.3"/></svg>`,
    'LAN Cable Tester': `<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="8" width="28" height="32" rx="4" fill="#990000" opacity="0.12"/><rect x="14" y="12" width="20" height="24" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><rect x="18" y="16" width="12" height="4" rx="1" fill="#990000" opacity="0.2"/><rect x="18" y="22" width="12" height="2" rx="1" fill="#d32f2f"/><circle cx="20" cy="30" r="2" fill="#00c853"/><circle cx="28" cy="30" r="2" fill="#ff6d00"/></svg>`,
    'Crimping Tool': `<svg viewBox="0 0 48 48" fill="none"><path d="M8 8l16 16-6 16" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M40 8L24 24l6 16" stroke="#990000" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="10" y="6" width="28" height="3" rx="1.5" fill="#d32f2f"/><rect x="20" y="22" width="8" height="8" rx="2" fill="#990000" opacity="0.15"/></svg>`,
    'Network Switch': `<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="4" fill="#990000" opacity="0.12"/><rect x="10" y="14" width="28" height="20" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="16" cy="24" r="2" fill="#00c853"/><circle cx="24" cy="24" r="2" fill="#00c853"/><circle cx="32" cy="24" r="2" fill="#00c853"/><rect x="10" y="16" width="28" height="2" rx="1" fill="#990000" opacity="0.15"/><rect x="18" y="30" width="12" height="2" rx="1" fill="#d32f2f"/></svg>`,
    'Router': `<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="16" width="36" height="16" rx="6" fill="#990000" opacity="0.12"/><rect x="8" y="18" width="32" height="12" rx="4" fill="white" stroke="#990000" stroke-width="1.5"/><path d="M24 22v4M20 24h8" stroke="#990000" stroke-width="2"/><circle cx="24" cy="24" r="1.5" fill="#d32f2f"/><rect x="14" y="30" width="20" height="2" rx="1" fill="#990000" opacity="0.3"/><path d="M16 6l4 8M32 6l-4 8" stroke="#d32f2f" stroke-width="1.5" fill="none"/></svg>`,
    'Anti Static Wrist Strap': `<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="16" width="32" height="8" rx="4" fill="#990000" opacity="0.12"/><rect x="10" y="18" width="28" height="4" rx="2" fill="#990000" opacity="0.3"/><path d="M14 20H8v-4" stroke="#990000" stroke-width="2" fill="none"/><path d="M34 20h6v-4" stroke="#990000" stroke-width="2" fill="none"/><path d="M8 16L4 8l4-2" stroke="#d32f2f" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="#990000"/></svg>`,
    'Safety Goggles': `<svg viewBox="0 0 48 48" fill="none"><rect x="4" y="16" width="40" height="16" rx="8" fill="#990000" opacity="0.12"/><rect x="6" y="18" width="36" height="12" rx="6" fill="white" stroke="#990000" stroke-width="1.5"/><ellipse cx="18" cy="24" rx="6" ry="5" fill="#990000" opacity="0.08" stroke="#d32f2f" stroke-width="1.2"/><ellipse cx="30" cy="24" rx="6" ry="5" fill="#990000" opacity="0.08" stroke="#d32f2f" stroke-width="1.2"/><line x1="24" y1="24" x2="24" y2="18" stroke="#990000" stroke-width="1.5"/><path d="M10 30v4h28v-4" stroke="#990000" stroke-width="1.5" fill="none"/></svg>`,
    'Electric Air Blower': `<svg viewBox="0 0 48 48" fill="none"><rect x="14" y="6" width="20" height="36" rx="4" fill="#990000" opacity="0.12"/><rect x="16" y="8" width="16" height="32" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="24" cy="18" r="6" fill="#990000" opacity="0.1" stroke="#d32f2f" stroke-width="1.5"/><circle cx="24" cy="18" r="2" fill="#990000"/><rect x="12" y="36" width="24" height="4" rx="2" fill="#990000" opacity="0.3"/><rect x="20" y="22" width="8" height="8" rx="2" fill="#990000" opacity="0.08"/></svg>`,
    'Isopropyl Alcohol': `<svg viewBox="0 0 48 48" fill="none"><rect x="14" y="4" width="20" height="40" rx="4" fill="#990000" opacity="0.12"/><rect x="16" y="6" width="16" height="36" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><rect x="14" y="4" width="20" height="6" rx="3" fill="#990000" opacity="0.2"/><text x="24" y="18" text-anchor="middle" fill="#990000" font-size="6" font-weight="bold">C₂H₆O</text><rect x="16" y="30" width="16" height="8" rx="2" fill="#990000" opacity="0.08"/></svg>`,
    'USB Flash Drive': `<svg viewBox="0 0 48 48" fill="none"><rect x="16" y="4" width="16" height="40" rx="4" fill="#990000" opacity="0.12"/><rect x="18" y="6" width="12" height="36" rx="3" fill="white" stroke="#990000" stroke-width="1.5"/><rect x="18" y="6" width="12" height="14" rx="2" fill="#990000" opacity="0.1"/><rect x="22" y="10" width="4" height="6" rx="1" fill="#990000" opacity="0.3"/><rect x="18" y="32" width="12" height="8" rx="2" fill="#d32f2f" opacity="0.4"/></svg>`,
    'default': `<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="6" fill="#990000" opacity="0.12"/><rect x="12" y="12" width="24" height="24" rx="4" fill="white" stroke="#990000" stroke-width="1.5"/><circle cx="24" cy="24" r="6" fill="#990000" opacity="0.1" stroke="#d32f2f" stroke-width="1.5"/><circle cx="24" cy="24" r="2" fill="#990000"/></svg>`
  },

  // ===== LOCAL EQUIPMENT IMAGE MAPPING =====
  // ===== CENTRALIZED EQUIPMENT IMAGE MAPPING =====
  // All equipment images are stored locally in /images/equipments/
  // Never hardcode image paths — always use SVG.getEquipImagePath(name, data)
  _imageMap: {
    'Digital Multimeter': 'images/equipments/digital-multimeter.jpg',
    'Soldering Iron': 'images/equipments/soldering-iron.jpg',
    'LAN Cable Tester': 'images/equipments/lan-cable-tester.jpg',
    'Network Switch': 'images/equipments/network-switch.jpg',
    'Safety Goggles': 'images/equipments/safety-goggles.jpg',
    'USB Flash Drive': 'images/equipments/usb-flash-drive.jpg',
    'Wire Cutter': 'images/equipments/wire-cutter.jpg',
    'Long Nose Pliers': 'images/equipments/long-nose-pliers.jpg',
    'Electric Air Blower': 'images/equipments/electric-air-blower.jpg',
    'PSU Tester': 'images/equipments/psu-tester.jpg',
    'Crimping Tool': 'images/equipments/crimping-tool.jpg',
    'Isopropyl Alcohol': 'images/equipments/isopropyl-alcohol.jpg',
    'Precision Screwdriver Set': 'images/equipments/precision-screwdriver-set.jpg',
    'Anti Static Wrist Strap': 'images/equipments/anti-static-wrist-strap.jpg',
    'Router': 'images/equipments/router.jpg',
    'default': 'images/equipments/placeholder.jpg'
  },

  _categoryImages: {
    'Hand Tool': 'images/categories/hand-tool.jpg',
    'Testing': 'images/categories/testing.jpg',
    'Networking': 'images/categories/networking.jpg',
    'Safety': 'images/categories/safety.jpg',
    'Cleaning': 'images/categories/cleaning.jpg',
    'Storage': 'images/categories/storage.jpg'
  },

  // ===== GET LOCAL IMAGE PATH FOR EQUIPMENT =====
  getEquipImagePath(equipName, equipData) {
    // If equipment has a custom imagePath (e.g. base64 from admin upload), use it
    if (equipData && equipData.imagePath && equipData.imagePath.startsWith('data:')) {
      return equipData.imagePath;
    }
    // If equipment has a custom imagePath that's a file path, use it
    if (equipData && equipData.imagePath && equipData.imagePath !== SVG.getEquipImagePath(equipData.name)) {
      return equipData.imagePath;
    }
    // Fallback to static map
    return this._imageMap[equipName] || this._imageMap['default'];
  },

  // ===== FALLBACK HTML (shown when image fails to load) =====
  // Returns a zero-quote SINGLE-LINE HTML safe to embed inside onerror="this.outerHTML='...'"
  // Uses a Unicode emoji instead of inline SVG to avoid quoting issues in JS/eval context
  // Single-line = no newlines that could confuse HTML attribute parsing
  getFallbackHTML(size) {
    const iconSize = size ? Math.min(size * 0.5, 32) : 24;
    return `<div style=display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:rgba(var(--primary-rgb),0.03);color:var(--text-light);font-size:.6rem;text-align:center;gap:3px;padding:4px;box-sizing:border-box;border-radius:6px;><span style=display:block;font-size:${iconSize}px;line-height:1;opacity:.4;>📷</span><span>No Equipment<br/>Image Available</span></div>`;
  },

  // ===== GET EQUIPMENT IMAGE HTML WITH FALLBACK =====
  getEquipImageHTML(equipName, category, size = 48, equipData) {
    const imgPath = equipData ? this.getEquipImagePath(equipName, equipData) : this.getEquipImagePath(equipName);
    return `<img src="${imgPath}" width="${size}" height="${size}" alt="${equipName}" style="object-fit:cover;border-radius:8px;" loading="lazy" onerror="this.remove();" />`;
  },

  // ===== GET EQUIPMENT CARD IMAGE (larger, for featured cards) =====
  getEquipCardImage(equipName, equipData) {
    return this.getEquipImageHTML(equipName, null, 180, equipData);
  },

  // ===== GET ICON FOR SPECIFIC EQUIPMENT =====
  getEquipIconHTML(category, size = 28) {
    // First check per-equipment icons, fallback to category icon
    const svg = this._equipIcons['default'];
    let categorySvg = this._icons[category] || this._icons['Hand Tool'];
    return `<img src="data:image/svg+xml,${encodeURIComponent(categorySvg)}" width="${size}" height="${size}" alt="${category}" style="object-fit:contain;" />`;
  },

  // ===== GET CUSTOM ICON FOR SPECIFIC EQUIPMENT NAME =====
  getCustomEquipIcon(equipName, category, size = 48) {
    // Try specific equipment icon first, fallback to category icon
    const svg = this._equipIcons[equipName] || this._icons[category] || this._equipIcons['default'];
    return `<img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${size}" height="${size}" alt="${equipName}" style="object-fit:contain;" loading="lazy" />`;
  },

  // ===== PREMIUM FEATURED EQUIPMENT CARD =====
  getFeaturedCard(equip, size = 48) {
    // Use real image if available, fallback to SVG icon
    const imgPath = this.getEquipImagePath(equip.name, equip);
    let iconHtml;
    iconHtml = `<img src="${imgPath}" alt="${equip.name}" style="width:60px;height:60px;object-fit:cover;border-radius:10px;" loading="lazy" onerror="this.onerror=null;this.outerHTML='${this.getFallbackHTML(60)}';" />`;
    const stockColor = equip.stocks <= 0 ? 'var(--danger)' : equip.stocks <= (equip.minStocks || 3) ? '#c79100' : 'var(--success)';
    const borrowDisabled = equip.stocks <= 0 ? 'disabled' : '';
    return `
      <div class="equip-card reveal featured-card" data-id="${equip.id}">
        <div class="card-icon featured-icon" style="width:60px;height:60px;border-radius:14px;background:rgba(var(--primary-rgb),0.07);display:flex;align-items:center;justify-content:center;margin:0 auto 0.8rem;">
          ${iconHtml}
        </div>
        <h3 style="font-size:0.95rem;text-align:center;">${equip.name}</h3>
        <span class="category-tag" style="display:block;text-align:center;">${equip.category}</span>
        ${equip.description ? `<p style="font-size:0.78rem;color:var(--text-secondary);margin:0.3rem 0;line-height:1.4;text-align:center;">${equip.description}</p>` : ''}
        <div class="card-details" style="margin-top:0.5rem;">
          <div class="fee" style="font-size:1rem;">₱${equip.borrowFee}</div>
          <div class="stocks" style="color:${stockColor};">${equip.stocks} left</div>
        </div>
        <span class="status-badge ${inventory.getStatusClass(equip.status)}" style="display:inline-flex;margin:0 auto;">
          <span class="status-dot"></span>${equip.status}
        </span>
        <button class="btn-add add-to-borrow" data-id="${equip.id}" ${borrowDisabled}>
          <span>+</span> ${equip.stocks <= 0 ? 'Out of Stock' : 'Add to Borrow'}
        </button>
      </div>
    `;
  },

  // Legacy methods
  getEquipIcon(category) { return 'data:image/svg+xml,' + encodeURIComponent(this._icons[category] || this._icons['Hand Tool']); },
  createEquipIcon(category, size = 28) {
    const img = document.createElement('img');
    img.src = this.getEquipIcon(category);
    img.width = size; img.height = size; img.alt = category;
    img.style.objectFit = 'contain';
    return img;
  },
  injectSVG(container, url) { /* no-op - inline SVGs used instead */ },
  getEmptyStateHTML(type, title, message) {
    return `<div style="text-align:center;padding:2rem;">
      <div style="width:80px;height:80px;margin:0 auto 1rem;opacity:0.4;">${this._equipIcons['default']}</div>
      <h3 style="margin-bottom:0.5rem;font-size:1.1rem;">${title}</h3>
      <p style="color:var(--text-secondary);font-size:0.9rem;">${message}</p>
    </div>`;
  }
};
