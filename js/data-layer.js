/* ============================================
   COMLAB System - Central Data Layer v2
   Single source of truth + Custom Event Bus
   ============================================ */

// ===== EVENT BUS =====
// All Store mutation methods dispatch custom events so every page
// can auto-update without manual refresh or async coordination.
const StoreEvents = {
  INVENTORY_CHANGED: 'comlab:inventoryChanged',
  BORROW_CHANGED: 'comlab:borrowChanged',
  STUDENTS_CHANGED: 'comlab:studentsChanged',
  ACTIVITY_LOGGED: 'comlab:activityLogged',
  SETTINGS_CHANGED: 'comlab:settingsChanged',
  AUTH_CHANGED: 'comlab:authChanged',
  DATA_CHANGED: 'comlab:dataChanged'  // generic — fires on every change
};

const STORAGE_KEYS = {
  EQUIPMENTS: 'comlab_equipments',
  EQUIPMENT_ID: 'comlab_equip_nextId',
  BORROW_HISTORY: 'comlab_borrowHistory',
  BORROW_IDS: 'comlab_borrow_idCounter',
  STUDENTS: 'comlab_students',
  REGISTERED: 'registeredStudents',
  ADMINS: 'comlab_admins',
  ACTIVITY_LOG: 'comlab_activityLog',
  SETTINGS: 'comlab_admin_settings',
  PASSWORDS: 'comlab_passwords',
  USER_SESSION: 'comlabUser'
};

class StorageManager {
  constructor() {
    this._cache = {};
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    this._initialized = true;
    await this._seedInitialData();
    return this;
  }

  async _seedInitialData() {
    // Only seed if this is a fresh localStorage
    if (localStorage.getItem(STORAGE_KEYS.EQUIPMENTS)) return;

    const FALLBACK_EQUIPMENTS = [
      { name: 'Precision Screwdriver Set', category: 'Hand Tool', stocks: 8, borrowFee: 20, status: 'Available' },
      { name: 'Long Nose Pliers', category: 'Hand Tool', stocks: 6, borrowFee: 15, status: 'Available' },
      { name: 'Wire Cutter', category: 'Hand Tool', stocks: 7, borrowFee: 15, status: 'Available' },
      { name: 'Soldering Iron', category: 'Hand Tool', stocks: 5, borrowFee: 25, status: 'Available' },
      { name: 'Digital Multimeter', category: 'Testing', stocks: 10, borrowFee: 50, status: 'Available' },
      { name: 'PSU Tester', category: 'Testing', stocks: 4, borrowFee: 40, status: 'Available' },
      { name: 'LAN Cable Tester', category: 'Testing', stocks: 6, borrowFee: 30, status: 'Available' },
      { name: 'Crimping Tool', category: 'Networking', stocks: 5, borrowFee: 35, status: 'Available' },
      { name: 'Network Switch', category: 'Networking', stocks: 3, borrowFee: 60, status: 'Available' },
      { name: 'Router', category: 'Networking', stocks: 2, borrowFee: 80, status: 'Available' },
      { name: 'Anti-Static Wrist Strap', category: 'Safety', stocks: 10, borrowFee: 10, status: 'Available' },
      { name: 'Safety Goggles', category: 'Safety', stocks: 12, borrowFee: 15, status: 'Available' },
      { name: 'Electric Air Blower', category: 'Cleaning', stocks: 4, borrowFee: 30, status: 'Available' },
      { name: 'Isopropyl Alcohol', category: 'Cleaning', stocks: 8, borrowFee: 10, status: 'Available' },
      { name: 'USB Flash Drive', category: 'Storage', stocks: 15, borrowFee: 20, status: 'Available' }
    ];

    try {
      const resp = await fetch('json/equipments.json');
      const equipData = await resp.json();
      this.setEquipments(equipData.map(e => ({
        ...e,
        minStocks: 3,
        condition: 'Good',
        description: '',
        archived: false,
        dateAdded: new Date().toISOString()
      })));
    } catch (e) {
      console.warn('DataLayer: Fetch failed, using inline fallback equipments');
      this.setEquipments(FALLBACK_EQUIPMENTS.map(e => ({
        ...e,
        id: this.getNextEquipId(),
        minStocks: 3,
        condition: 'Good',
        description: '',
        archived: false,
        dateAdded: new Date().toISOString()
      })));
    }

    try {
      const resp = await fetch('json/students.json');
      this.set(STORAGE_KEYS.STUDENTS, await resp.json());
    } catch (e) {
      this.set(STORAGE_KEYS.STUDENTS, []);
    }

    try {
      const resp = await fetch('json/admins.json');
      this.set(STORAGE_KEYS.ADMINS, await resp.json());
    } catch (e) {
      this.set(STORAGE_KEYS.ADMINS, [{ id: 'ADMIN001', name: 'Laboratory Officer', password: 'admin123' }]);
    }

    // Initialize empty arrays
    if (!this.get(STORAGE_KEYS.BORROW_HISTORY)) this.set(STORAGE_KEYS.BORROW_HISTORY, []);
    if (!this.get(STORAGE_KEYS.ACTIVITY_LOG)) this.set(STORAGE_KEYS.ACTIVITY_LOG, []);
    if (!this.get(STORAGE_KEYS.BORROW_IDS)) this.set(STORAGE_KEYS.BORROW_IDS, 0);
    if (!this.get(STORAGE_KEYS.EQUIPMENT_ID)) this.set(STORAGE_KEYS.EQUIPMENT_ID, 100);
  }

  // ===== GENERIC GET/SET =====
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    this._cache[key] = data;
  }

  // ===== EVENTS =====
  // Only emit from high-level methods (addEquipment, updateEquipment, etc.).
  // setEquipments / setBorrowHistory / setActivityLog are pure persistence methods
  // called internally — they do NOT emit events to avoid double-firing.
  _emit(eventName, detail = {}) {
    try {
      document.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail }));
    } catch (e) {
      // Silent fail — events are non-critical
    }
  }

  // ===== EQUIPMENTS =====
  getEquipments() {
    return this.get(STORAGE_KEYS.EQUIPMENTS) || [];
  }

  // Pure persistence — no event emission (callers emit)
  setEquipments(list) {
    this.set(STORAGE_KEYS.EQUIPMENTS, list);
  }

  getNextEquipId() {
    let id = this.get(STORAGE_KEYS.EQUIPMENT_ID) || 100;
    id++;
    this.set(STORAGE_KEYS.EQUIPMENT_ID, id);
    return id;
  }

  getEquipment(id) {
    return this.getEquipments().find(e => e.id === id);
  }

  addEquipment(data) {
    const list = this.getEquipments();
    data.id = this.getNextEquipId();
    data.archived = false;
    data.dateAdded = new Date().toISOString();
    data.minStocks = data.minStocks || 3;
    data.condition = data.condition || 'Good';
    data.description = data.description || '';
    data.status = data.stocks > 0 ? (data.stocks <= data.minStocks ? 'Low Stock' : 'Available') : 'Out of Stock';
    list.push(data);
    this.setEquipments(list);
    this._emit(StoreEvents.INVENTORY_CHANGED, { action: 'add', equipment: data });
    return data;
  }

  updateEquipment(id, updates) {
    const list = this.getEquipments();
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;
    Object.assign(list[idx], updates);
    // Recalculate status
    const e = list[idx];
    if (e.archived) e.status = 'Archived';
    else if (e.stocks <= 0) e.status = 'Out of Stock';
    else if (e.stocks <= (e.minStocks || 3)) e.status = 'Low Stock';
    else e.status = 'Available';
    this.setEquipments(list);
    this._emit(StoreEvents.INVENTORY_CHANGED, { action: 'update', equipment: list[idx] });
    return list[idx];
  }

  deleteEquipment(id) {
    const deleted = this.getEquipment(id);
    const list = this.getEquipments().filter(e => e.id !== id);
    this.setEquipments(list);
    this._emit(StoreEvents.INVENTORY_CHANGED, { action: 'delete', equipmentId: id, name: deleted?.name });
  }

  archiveEquipment(id) {
    return this.updateEquipment(id, { archived: true, status: 'Archived' });
  }

  restoreEquipment(id) {
    return this.updateEquipment(id, { archived: false });
  }

  duplicateEquipment(id) {
    const original = this.getEquipment(id);
    if (!original) return null;
    const copy = { ...original };
    delete copy.id;
    copy.name = original.name + ' (Copy)';
    copy.dateAdded = new Date().toISOString();
    return this.addEquipment(copy);
  }

  adjustStock(id, delta) {
    const equip = this.getEquipment(id);
    if (!equip) return false;
    const newStock = (equip.stocks || 0) + delta;
    if (newStock < 0) return false;
    this.updateEquipment(id, { stocks: newStock });
    this._emit(StoreEvents.INVENTORY_CHANGED, { action: 'stockAdjust', equipmentId: id, delta, newStock });
    return true;
  }

  markEquipmentStatus(id, newStatus) {
    return this.updateEquipment(id, { status: newStatus });
  }

  // ===== BORROW HISTORY =====
  getBorrowHistory() {
    return this.get(STORAGE_KEYS.BORROW_HISTORY) || [];
  }

  // Pure persistence — no event emission (callers emit)
  setBorrowHistory(list) {
    this.set(STORAGE_KEYS.BORROW_HISTORY, list);
  }

  generateBorrowId() {
    let counter = this.get(STORAGE_KEYS.BORROW_IDS) || 0;
    counter++;
    this.set(STORAGE_KEYS.BORROW_IDS, counter);
    return 'BRW-' + String(counter).padStart(4, '0');
  }

  addBorrowRecord(record) {
    const list = this.getBorrowHistory();
    record.id = record.id || this.generateBorrowId();
    record.createdAt = new Date().toISOString();
    list.unshift(record);
    this.setBorrowHistory(list);
    this._emit(StoreEvents.BORROW_CHANGED, { action: 'add', record });
    return record;
  }

  updateBorrowRecord(id, updates) {
    const list = this.getBorrowHistory();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    Object.assign(list[idx], updates);
    this.setBorrowHistory(list);
    this._emit(StoreEvents.BORROW_CHANGED, { action: 'update', record: list[idx] });
    return list[idx];
  }

  getStudentBorrows(studentId) {
    return this.getBorrowHistory().filter(r => r.studentId === studentId);
  }

  getPendingRequests() {
    return this.getBorrowHistory().filter(r => r.status === 'Pending');
  }

  getActiveBorrows() {
    return this.getBorrowHistory().filter(r => r.status === 'Pending' || r.status === 'Approved');
  }

  // ===== ACTIVITY LOG =====
  getActivityLog() {
    return this.get(STORAGE_KEYS.ACTIVITY_LOG) || [];
  }

  // Pure persistence — no event emission (callers emit)
  setActivityLog(list) {
    this.set(STORAGE_KEYS.ACTIVITY_LOG, list);
  }

  logActivity(action, details = {}) {
    const list = this.getActivityLog();
    const entry = {
      date: new Date().toISOString(),
      action,
      admin: details.admin || 'System',
      equipment: details.equipment || '',
      details: details.message || '',
      id: Date.now().toString(36)
    };
    list.unshift(entry);
    // Keep last 200 entries
    if (list.length > 200) list.length = 200;
    this.setActivityLog(list);
    this._emit(StoreEvents.ACTIVITY_LOGGED, { entry });
  }

  // ===== STATISTICS =====
  getStatistics() {
    const equipments = this.getEquipments().filter(e => !e.archived);
    const history = this.getBorrowHistory();
    const students = this.getAllStudents();

    const total = equipments.length;
    const available = equipments.filter(e => e.status === 'Available').length;
    const lowStock = equipments.filter(e => e.status === 'Low Stock').length;
    const outOfStock = equipments.filter(e => e.status === 'Out of Stock').length;
    const pending = history.filter(r => r.status === 'Pending').length;
    const approved = history.filter(r => r.status === 'Approved').length;
    const returned = history.filter(r => r.status === 'Returned').length;
    const rejected = history.filter(r => r.status === 'Rejected').length;

    const today = new Date().toDateString();
    const borrowedToday = history.filter(r => new Date(r.borrowDate).toDateString() === today).length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const borrowedThisWeek = history.filter(r => new Date(r.borrowDate) >= thisWeek).length;

    const approvedToday = history.filter(r => r.status === 'Approved' && new Date(r.createdAt).toDateString() === today).length;
    const rejectedToday = history.filter(r => r.status === 'Rejected' && new Date(r.createdAt).toDateString() === today).length;

    const revenue = history.reduce((sum, r) => sum + (r.fee || 0), 0);

    return {
      total, available, lowStock, outOfStock,
      pending, approved, returned, rejected,
      borrowedToday, borrowedThisWeek,
      approvedToday, rejectedToday,
      registeredStudents: students.length,
      revenue
    };
  }

  // ===== STUDENTS =====
  getAllStudents() {
    const seed = this.get(STORAGE_KEYS.STUDENTS) || [];
    const registered = this.get(STORAGE_KEYS.REGISTERED) || [];
    return [...seed, ...registered];
  }

  getRegisteredStudents() {
    return this.get(STORAGE_KEYS.REGISTERED) || [];
  }

  saveRegisteredStudents(list) {
    this.set(STORAGE_KEYS.REGISTERED, list);
    this._emit(StoreEvents.STUDENTS_CHANGED, { count: list.length });
  }

  findStudent(id) {
    return this.getAllStudents().find(s => s.id === id);
  }

  isStudentIdUnique(id) {
    return !this.findStudent(id);
  }

  // ===== ADMINS =====
  getAdmins() {
    return this.get(STORAGE_KEYS.ADMINS) || [];
  }

  findAdmin(id, password) {
    return this.getAdmins().find(a => a.id === id && a.password === password);
  }

  // ===== SETTINGS =====
  getSettings() {
    const defaults = {
      schoolName: 'Technological University of the Philippines',
      labName: 'Computer Laboratory - Main',
      officerName: 'Laboratory Officer',
      itemsPerPage: '10',
      autoRefresh: '60'
    };
    const saved = this.get(STORAGE_KEYS.SETTINGS);
    return saved ? { ...defaults, ...saved } : defaults;
  }

  saveSettings(settings) {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this._emit(StoreEvents.SETTINGS_CHANGED, { settings });
  }

  // ===== PASSWORD OVERRIDES =====
  getPasswordOverrides() {
    return this.get(STORAGE_KEYS.PASSWORDS) || {};
  }

  setPasswordOverride(studentId, password) {
    const overrides = this.getPasswordOverrides();
    overrides[studentId] = password;
    this.set(STORAGE_KEYS.PASSWORDS, overrides);
    this._emit(StoreEvents.STUDENTS_CHANGED, { action: 'passwordChanged' });
  }

  removePasswordOverride(studentId) {
    const overrides = this.getPasswordOverrides();
    delete overrides[studentId];
    this.set(STORAGE_KEYS.PASSWORDS, overrides);
  }

  // ===== RESET DEMO DATA =====
  async resetDemoData() {
    const keys = Object.values(STORAGE_KEYS);
    keys.forEach(k => localStorage.removeItem(k));
    this._cache = {};
    this._initialized = false;
    await this._seedInitialData();
    this._emit(StoreEvents.DATA_CHANGED, { action: 'reset' });
    this._emit(StoreEvents.INVENTORY_CHANGED, { action: 'reset' });
    this._emit(StoreEvents.BORROW_CHANGED, { action: 'reset' });
    this._emit(StoreEvents.STUDENTS_CHANGED, { action: 'reset' });
  }

  // ===== CATEGORIES =====
  getCategories() {
    return ['Hand Tool', 'Testing', 'Networking', 'Safety', 'Cleaning', 'Storage'];
  }

  computeStatus(stocks, minStocks = 3) {
    if (stocks <= 0) return 'Out of Stock';
    if (stocks <= minStocks) return 'Low Stock';
    return 'Available';
  }
}

// Global instance
const Store = new StorageManager();
