/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Inventory Management - v4 (Data Layer)
   ============================================ */

class InventoryManager {
  constructor() {
    this.equipments = [];
    this.borrowHistory = [];
  }

  // ===== LOAD FROM STORE =====
  async loadEquipments() {
    await Store.init();
    this.equipments = Store.getEquipments();
    this.borrowHistory = Store.getBorrowHistory();
    return this.equipments;
  }

  getEquipment(id) { return this.equipments.find(e => e.id === id); }
  getEquipmentByName(name) { return this.equipments.find(e => e.name.toLowerCase() === name.toLowerCase()); }

  updateStock(itemId, delta) {
    const success = Store.adjustStock(itemId, delta);
    if (success) this.loadEquipments();
    return success;
  }

  // ===== BORROW WORKFLOW =====
  // Stock is decreased on APPROVAL, not on creation of Pending request.
  borrowItem(studentName, studentId, officer, equipmentId, fee, pickupDate, returnDate, purpose, remarks) {
    const equipment = this.getEquipment(equipmentId);
    if (!equipment || equipment.stocks <= 0) {
      return { success: false, message: 'Equipment is out of stock.' };
    }

    const borrowRecord = {
      id: Store.generateBorrowId(),
      studentName,
      studentId: studentId || 'GUEST',
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

    Store.addBorrowRecord(borrowRecord);
    Store.logActivity('Borrow Request', {
      admin: studentName,
      equipment: equipment.name,
      message: `Student ${studentName} requested to borrow ${equipment.name}`
    });
    this.loadEquipments();
    return { success: true, data: borrowRecord };
  }

  returnItem(borrowId) {
    const record = this.borrowHistory.find(r => r.id === borrowId);
    if (!record) return false;
    Store.updateBorrowRecord(borrowId, { status: 'Returned' });
    this.updateStock(record.equipmentId, 1);
    Store.logActivity('Item Returned', {
      equipment: record.equipment,
      message: `${record.studentName} returned ${record.equipment}`
    });
    this.loadEquipments();
    return true;
  }

  approveItem(borrowId) {
    // Stock decrease happens here — on admin approval
    const record = this.borrowHistory.find(r => r.id === borrowId);
    if (!record) return false;
    // Decrease stock by 1
    this.updateStock(record.equipmentId, -1);
    Store.updateBorrowRecord(borrowId, { status: 'Approved' });
    Store.logActivity('Borrow Approved', {
      equipment: record.equipment,
      message: `Borrow request by ${record.studentName} for ${record.equipment} was approved (stock -1)`
    });
    this.loadEquipments();
    return true;
  }

  rejectItem(borrowId) {
    // Stock is never decreased on Pending, so no stock adjustment needed on rejection.
    const record = this.borrowHistory.find(r => r.id === borrowId);
    if (!record) return false;
    Store.updateBorrowRecord(borrowId, { status: 'Rejected' });
    Store.logActivity('Borrow Rejected', {
      equipment: record.equipment,
      message: `Borrow request by ${record.studentName} for ${record.equipment} was rejected`
    });
    this.loadEquipments();
    return true;
  }

  saveHistory() {
    Store.setBorrowHistory(this.borrowHistory);
  }

  // ===== STATS =====
  getStats() {
    return Store.getStatistics();
  }

  getCategories() { return Store.getCategories(); }

  getStudentBorrows(studentId) {
    return Store.getStudentBorrows(studentId);
  }

  // ===== FILTER & SORT =====
  filterEquipments(category, searchText, { archived = false } = {}) {
    let filtered = this.equipments.filter(e => !!e.archived === !!archived);
    if (category && category !== 'All') filtered = filtered.filter(e => e.category === category);
    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(text) ||
        e.category.toLowerCase().includes(text)
      );
    }
    return filtered;
  }

  sortEquipments(list, sortBy = 'name', asc = true) {
    const sorted = [...list].sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'stocks': valA = a.stocks; valB = b.stocks; break;
        case 'fee': valA = a.borrowFee; valB = b.borrowFee; break;
        case 'newest': valA = new Date(a.dateAdded || 0); valB = new Date(b.dateAdded || 0); break;
        case 'oldest': valA = new Date(a.dateAdded || 0); valB = new Date(b.dateAdded || 0); return asc ? valA - valB : valB - valA;
        default: valA = a.name; valB = b.name;
      }
      if (typeof valA === 'string') return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return asc ? valA - valB : valB - valA;
    });
    return sorted;
  }

  // ===== RENDER EQUIPMENT CARDS =====
  renderEquipments(container, equipments) {
    if (!container) return;
    if (!equipments || equipments.length === 0) {
      container.innerHTML = SVG.getEmptyStateHTML('search', 'No Equipment Found', 'Try adjusting your search or filter.');
      return;
    }
    container.innerHTML = equipments.map(item => {
      const imgPath = SVG.getEquipImagePath(item.name, item);
      const isCustomImg = item.imagePath && item.imagePath.startsWith('data:');
      const fallbackSvg = SVG.getEquipIconHTML(item.category, 28);
      return `
      <div class="equip-card reveal" data-id="${item.id}">
        <div class="card-image-wrap">
          <img src="${imgPath}" alt="${item.name}" class="equip-card-img" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div class="card-icon" style="display:none;">${fallbackSvg}</div>
        </div>
        <h3>${item.name}</h3>
        <span class="category-tag">${item.category}</span>
        <div class="card-details">
          <div class="fee">₱${item.borrowFee} <small>fee</small></div>
          <div class="stocks">Stocks: <span>${item.stocks}</span></div>
        </div>
        <span class="status-badge ${this.getStatusClass(item.status)}"><span class="status-dot"></span>${item.status}</span>
        <button class="btn-add add-to-borrow" data-id="${item.id}"><span>+</span> Add to Borrow</button>
      </div>
    `}).join('');
    if (window.revealObserver) {
      document.querySelectorAll('.reveal').forEach(el => { window.revealObserver.observe(el); });
    }
  }

  getIcon(category) { return SVG.getEquipIconHTML(category, 28); }

  getStatusClass(status) {
    const classes = {
      'Available': 'available',
      'Low Stock': 'low-stock',
      'Out of Stock': 'low-stock',
      'Borrowed': 'borrowed',
      'Archived': 'low-stock',
      'Under Maintenance': 'low-stock'
    };
    return classes[status] || '';
  }

  getFallbackData() {
    return [];
  }
}

// ===== GLOBAL INSTANCE =====
const inventory = new InventoryManager();
