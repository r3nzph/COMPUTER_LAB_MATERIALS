/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Inventory Management
   ============================================ */

class InventoryManager {
  constructor() {
    this.equipments = [];
    this.borrowedItems = JSON.parse(localStorage.getItem('borrowedItems')) || [];
    this.borrowHistory = JSON.parse(localStorage.getItem('borrowHistory')) || [];
  }

  // ===== LOAD EQUIPMENTS FROM JSON =====
  async loadEquipments() {
    try {
      const response = await fetch('json/equipments.json');
      if (!response.ok) throw new Error('Failed to load equipments');
      const data = await response.json();

      // Merge with localStorage stock adjustments
      const savedStocks = JSON.parse(localStorage.getItem('equipmentStocks')) || {};
      this.equipments = data.map((item) => ({
        ...item,
        stocks: savedStocks[item.id] ?? item.stocks,
        status: this.computeStatus(savedStocks[item.id] ?? item.stocks)
      }));

      return this.equipments;
    } catch (error) {
      console.error('Error loading equipments:', error);
      // Fallback data
      this.equipments = this.getFallbackData();
      return this.equipments;
    }
  }

  getFallbackData() {
    return [
      { id: 1, name: 'Precision Screwdriver Set', category: 'Hand Tool', stocks: 8, borrowFee: 20, status: 'Available' },
      { id: 2, name: 'Long Nose Pliers', category: 'Hand Tool', stocks: 12, borrowFee: 15, status: 'Available' },
      { id: 3, name: 'Wire Cutter', category: 'Hand Tool', stocks: 10, borrowFee: 15, status: 'Available' },
      { id: 4, name: 'Soldering Iron', category: 'Hand Tool', stocks: 6, borrowFee: 35, status: 'Available' },
      { id: 5, name: 'Digital Multimeter', category: 'Testing', stocks: 10, borrowFee: 50, status: 'Available' },
      { id: 6, name: 'PSU Tester', category: 'Testing', stocks: 5, borrowFee: 30, status: 'Available' },
      { id: 7, name: 'LAN Cable Tester', category: 'Testing', stocks: 7, borrowFee: 25, status: 'Available' },
      { id: 8, name: 'Crimping Tool', category: 'Networking', stocks: 9, borrowFee: 40, status: 'Available' },
      { id: 9, name: 'Network Switch', category: 'Networking', stocks: 4, borrowFee: 75, status: 'Available' },
      { id: 10, name: 'Router', category: 'Networking', stocks: 3, borrowFee: 100, status: 'Available' },
      { id: 11, name: 'Anti Static Wrist Strap', category: 'Safety', stocks: 15, borrowFee: 10, status: 'Available' },
      { id: 12, name: 'Safety Goggles', category: 'Safety', stocks: 20, borrowFee: 10, status: 'Available' },
      { id: 13, name: 'Electric Air Blower', category: 'Cleaning', stocks: 4, borrowFee: 30, status: 'Available' },
      { id: 14, name: 'Isopropyl Alcohol', category: 'Cleaning', stocks: 10, borrowFee: 15, status: 'Available' },
      { id: 15, name: 'USB Flash Drive', category: 'Storage', stocks: 25, borrowFee: 25, status: 'Available' }
    ];
  }

  // ===== COMPUTE STATUS =====
  computeStatus(stocks) {
    if (stocks <= 0) return 'Out of Stock';
    if (stocks <= 3) return 'Low Stock';
    return 'Available';
  }

  // ===== GET EQUIPMENT BY ID =====
  getEquipment(id) {
    return this.equipments.find((e) => e.id === id);
  }

  // ===== GET EQUIPMENT BY NAME =====
  getEquipmentByName(name) {
    return this.equipments.find((e) => e.name === name);
  }

  // ===== UPDATE STOCKS =====
  updateStock(itemId, delta) {
    const item = this.equipments.find((e) => e.id === itemId);
    if (!item) return false;

    const newStock = item.stocks + delta;
    if (newStock < 0) return false;

    item.stocks = newStock;
    item.status = this.computeStatus(newStock);

    // Save to localStorage
    const savedStocks = JSON.parse(localStorage.getItem('equipmentStocks')) || {};
    savedStocks[itemId] = newStock;
    localStorage.setItem('equipmentStocks', JSON.stringify(savedStocks));

    return true;
  }

  // ===== BORROW ITEM =====
  borrowItem(studentName, officer, equipmentId, fee, pickupDate, returnDate, purpose, remarks) {
    const equipment = this.equipments.find((e) => e.id === equipmentId);
    if (!equipment || equipment.stocks <= 0) {
      return { success: false, message: 'Equipment is out of stock.' };
    }

    // Update stock
    if (!this.updateStock(equipmentId, -1)) {
      return { success: false, message: 'Failed to update stock.' };
    }

    const borrowRecord = {
      id: 'BRW-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase(),
      studentName,
      officer,
      equipment: equipment.name,
      equipmentId: equipment.id,
      fee: parseFloat(fee),
      borrowDate: pickupDate,
      returnDate: returnDate,
      purpose,
      remarks,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    this.borrowHistory.unshift(borrowRecord);
    this.saveHistory();

    return { success: true, data: borrowRecord };
  }

  // ===== RETURN ITEM =====
  returnItem(borrowId) {
    const record = this.borrowHistory.find((r) => r.id === borrowId);
    if (!record) return false;

    record.status = 'Returned';
    this.updateStock(record.equipmentId, 1);
    this.saveHistory();
    return true;
  }

  // ===== SAVE BORROW HISTORY =====
  saveHistory() {
    localStorage.setItem('borrowHistory', JSON.stringify(this.borrowHistory));
  }

  // ===== GET STATS =====
  getStats() {
    const total = this.equipments.length;
    const available = this.equipments.filter((e) => e.status === 'Available').length;
    const lowStockCount = this.equipments.filter((e) => e.status === 'Low Stock').length;
    const outOfStock = this.equipments.filter((e) => e.status === 'Out of Stock').length;
    const borrowed = this.borrowHistory.filter((r) => r.status === 'Pending').length;

    return { total, available, lowStockCount, outOfStock, borrowed };
  }

  // ===== GET CATEGORIES =====
  getCategories() {
    return [...new Set(this.equipments.map((e) => e.category))];
  }

  // ===== FILTER EQUIPMENTS =====
  filterEquipments(category, searchText) {
    let filtered = [...this.equipments];

    if (category && category !== 'All') {
      filtered = filtered.filter((e) => e.category === category);
    }

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(text) ||
          e.category.toLowerCase().includes(text)
      );
    }

    return filtered;
  }

  // ===== RENDER EQUIPMENT CARDS =====
  renderEquipments(container, equipments) {
    if (!container) return;

    if (!equipments || equipments.length === 0) {
      container.innerHTML = `
        <div class="no-results" style="text-align:center;padding:3rem;color:var(--text-secondary);">
          <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
          <h3 style="margin-bottom:0.5rem;">No Equipment Found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = equipments
      .map(
        (item) => `
        <div class="equip-card reveal" data-id="${item.id}">
          <div class="card-icon">
            <i class="${this.getIcon(item.category)}"></i>
          </div>
          <h3>${item.name}</h3>
          <span class="category-tag">${item.category}</span>
          <div class="card-details">
            <div class="fee">₱${item.borrowFee} <small>fee</small></div>
            <div class="stocks">Stocks: <span>${item.stocks}</span></div>
          </div>
          <span class="status-badge ${this.getStatusClass(item.status)}">
            <span class="status-dot"></span>
            ${item.status}
          </span>
          <button class="btn-add add-to-borrow" data-id="${item.id}">
            <span>+</span> Add to Borrow
          </button>
        </div>
      `
      )
      .join('');

    // Re-initialize scroll reveal for new elements
    if (window.revealObserver) {
      document.querySelectorAll('.reveal').forEach((el) => {
        window.revealObserver.observe(el);
      });
    }
  }

  // ===== GET ICON CLASS =====
  getIcon(category) {
    const icons = {
      'Hand Tool': 'fas fa-tools',
      'Testing': 'fas fa-microchip',
      'Networking': 'fas fa-network-wired',
      'Safety': 'fas fa-hard-hat',
      'Cleaning': 'fas fa-broom',
      'Storage': 'fas fa-database'
    };
    return icons[category] || 'fas fa-cog';
  }

  // ===== GET STATUS CLASS =====
  getStatusClass(status) {
    const classes = {
      'Available': 'available',
      'Low Stock': 'low-stock',
      'Out of Stock': 'low-stock',
      'Borrowed': 'borrowed'
    };
    return classes[status] || '';
  }
}

// ===== GLOBAL INSTANCE =====
const inventory = new InventoryManager();
