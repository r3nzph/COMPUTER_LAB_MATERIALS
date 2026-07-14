/* ============================================
   COMLAB System - Admin Dashboard v1
   Full admin functionality with CRUD, stock management,
   borrow approval workflow, activity log, and charts
   ============================================ */

class AdminDashboard {
  constructor() {
    this.pendingRefresh = null;
    this.init();
  }

  async init() {
    if (!auth.isLoggedIn() || !auth.isAdmin()) {
      window.location.href = 'index.html';
      return;
    }

    await Store.init();
    await inventory.loadEquipments();

    this.setupNavigation();
    this.setupSidebar();
    this.renderDashboard();
    this.renderRequests();
    this.renderEquipments();
    this.renderStocks();
    this.renderMembers();
    this.renderCharts();
    this.loadSettings();
    this.setupActivityRefresh();
    this.setupEquipmentModals();
    this.setupStockActions();
  }

  // ===== NAVIGATION =====
  setupNavigation() {
    document.querySelectorAll('.admin-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.admin-content-area').forEach(a => a.classList.remove('active'));
        const section = document.getElementById('section-' + link.dataset.section);
        if (section) section.classList.add('active');
        this.closeSidebar();
      });
    });
  }

  // ===== SIDEBAR TOGGLE =====
  setupSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');

    window._closeSidebar = () => {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
      const icon = toggle?.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle?.addEventListener('click', () => {
      const isOpen = sidebar?.classList.toggle('open');
      overlay?.classList.toggle('open', isOpen);
      const icon = toggle?.querySelector('i');
      if (icon) icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
      if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    overlay?.addEventListener('click', window._closeSidebar);
  }

  closeSidebar() {
    if (window._closeSidebar) window._closeSidebar();
  }

  // ===== DASHBOARD CARDS & TIMELINE =====
  renderDashboard() {
    const stats = Store.getStatistics();
    const history = Store.getBorrowHistory();
    const pending = Store.getPendingRequests();

    // Stats cards
    document.getElementById('adminStatCards').innerHTML = `
      <div class="admin-card"><div class="ac-label">Available</div><div class="ac-value green"><span class="counter" data-target="${stats.available}">0</span></div></div>
      <div class="admin-card"><div class="ac-label">Borrowed Today</div><div class="ac-value blue"><span class="counter" data-target="${stats.borrowedToday}">0</span></div></div>
      <div class="admin-card"><div class="ac-label">Pending</div><div class="ac-value yellow"><span class="counter" data-target="${stats.pending}">0</span></div></div>
      <div class="admin-card"><div class="ac-label">Low Stocks</div><div class="ac-value red"><span class="counter" data-target="${stats.lowStock}">0</span></div></div>
      <div class="admin-card"><div class="ac-label">Revenue</div><div class="ac-value blue"><span class="counter" data-target="${stats.revenue}">₱0</span></div></div>
      <div class="admin-card"><div class="ac-label">Students</div><div class="ac-value"><span class="counter" data-target="${stats.registeredStudents}">0</span></div></div>
    `;

    // Animate counters
    document.querySelectorAll('#adminStatCards .counter').forEach(c => {
      const target = parseInt(c.dataset.target) || 0;
      const isRevenue = c.closest('.admin-card')?.querySelector('.ac-label')?.textContent === 'Revenue';
      let current = 0, duration = 1500, start = performance.now();
      const animate = (now) => {
        const p = Math.min((now - start) / duration, 1);
        current = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        if (isRevenue) c.innerHTML = '₱' + current;
        else c.textContent = current;
        if (p < 1) requestAnimationFrame(animate);
        else { if (isRevenue) c.innerHTML = '₱' + target; else c.textContent = target; }
      };
      requestAnimationFrame(animate);
    });

    // Timeline
    const tl = document.getElementById('adminTimeline');
    if (history.length > 0) {
      tl.innerHTML = history.slice(0, 5).map(r => `
        <div class="timeline-item">
          <div class="tl-title">${r.studentName} borrowed ${r.equipment}</div>
          <div class="tl-sub">Officer: ${r.officer} • ${r.purpose || 'N/A'}</div>
          <div class="tl-time">${new Date(r.borrowDate).toLocaleDateString()} • ${r.status}</div>
        </div>
      `).join('');
    } else {
      tl.innerHTML = '<div style="color:var(--text-light);padding:0.5rem 0;">No activity yet.</div>';
    }

    // Pending requests (dashboard)
    const pendingBody = document.getElementById('adminPendingRequests');
    if (pending.length === 0) {
      pendingBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--text-light);">✓ No pending requests.</td></tr>';
    } else {
      pendingBody.innerHTML = pending.slice(0, 5).map(r => `
        <tr>
          <td data-label="Student">${r.studentName}</td>
          <td data-label="Equipment">${r.equipment}</td>
          <td data-label="Date">${new Date(r.borrowDate).toLocaleDateString()}</td>
          <td data-label="Action">
            <button class="btn-sm green" onclick="admin.approveReq('${r.id}')"><i class="fas fa-check"></i></button>
            <button class="btn-sm red" onclick="admin.rejectReq('${r.id}')"><i class="fas fa-times"></i></button>
          </td>
        </tr>
      `).join('');
    }

    // Low stock alerts
    const alerts = document.getElementById('lowStockAlerts');
    const low = inventory.equipments.filter(e => e.status === 'Low Stock' || e.status === 'Out of Stock');
    if (low.length > 0) {
      alerts.innerHTML = low.map(e => `
        <div class="warning-item">
          <div class="wi-icon" style="background:rgba(255,23,68,0.1);color:var(--danger);"><i class="fas fa-exclamation"></i></div>
          <div style="flex:1;"><strong>${e.name}</strong> — ${e.stocks} left (min: ${e.minStocks || 3})</div>
        </div>
      `).join('');
    } else {
      alerts.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;">✓ All equipment adequately stocked.</p>';
    }

    // Today widget
    const today = new Date();
    document.getElementById('todayWidget').textContent = today.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  // ===== CUSTOM EVENT LISTENERS =====
  setupActivityRefresh() {
    const autoSec = parseInt(Store.getSettings().autoRefresh) || 0;
    if (window._adminRefreshTimer) clearInterval(window._adminRefreshTimer);
    if (autoSec > 0) {
      window._adminRefreshTimer = setInterval(() => {
        inventory.loadEquipments().then(() => {
          this.renderDashboard();
          this.renderCharts();
        });
      }, autoSec * 1000);
    }

    // Listen for Store custom events — auto-update without manual refresh
    this._handleStoreEvent = () => {
      if (this._refreshTimeout) clearTimeout(this._refreshTimeout);
      this._refreshTimeout = setTimeout(() => this.refreshAll(), 150);
    };

    document.addEventListener(StoreEvents.INVENTORY_CHANGED, this._handleStoreEvent);
    document.addEventListener(StoreEvents.BORROW_CHANGED, this._handleStoreEvent);
    document.addEventListener(StoreEvents.STUDENTS_CHANGED, this._handleStoreEvent);

    // Activity log and settings get their own specific handlers
    document.addEventListener(StoreEvents.ACTIVITY_LOGGED, () => {
      if (this._logTimeout) clearTimeout(this._logTimeout);
      this._logTimeout = setTimeout(() => this.renderActivityLog(), 200);
    });
    document.addEventListener(StoreEvents.SETTINGS_CHANGED, () => {
      this.loadSettings();
    });

    // Also listen for storage events (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('comlab_')) {
        if (this._refreshTimeout) clearTimeout(this._refreshTimeout);
        this._refreshTimeout = setTimeout(() => {
          inventory.loadEquipments().then(() => this.refreshAll());
        }, 300);
      }
    });
  }

  // ===== BORROW APPROVAL ACTIONS =====
  approveReq(id) {
    const r = Store.getBorrowHistory().find(x => x.id === id);
    if (!r) return;
    Store.updateBorrowRecord(id, { status: 'Approved' });
    Store.logActivity('Borrow Approved', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `Approved borrow request by ${r.studentName} for ${r.equipment}`
    });
    Notification.show('Approved', `Request by ${r.studentName} has been approved.`);
    this.refreshAll();
  }

  rejectReq(id) {
    const r = Store.getBorrowHistory().find(x => x.id === id);
    if (!r) return;
    Store.updateBorrowRecord(id, { status: 'Rejected' });
    Store.adjustStock(r.equipmentId, 1);
    Store.logActivity('Borrow Rejected', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `Rejected borrow request by ${r.studentName} for ${r.equipment} (stock returned)`
    });
    Notification.show('Rejected', `Request by ${r.studentName} has been rejected.`);
    this.refreshAll();
  }

  returnReq(id) {
    const r = Store.getBorrowHistory().find(x => x.id === id);
    if (!r) return;
    Store.updateBorrowRecord(id, { status: 'Returned' });
    Store.adjustStock(r.equipmentId, 1);
    Store.logActivity('Item Returned', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `${r.studentName} returned ${r.equipment} (stock updated to ${(Store.getEquipment(r.equipmentId)?.stocks || 0)})`
    });
    Notification.show('Returned', `${r.equipment} has been marked as returned.`);
    this.refreshAll();
  }

  refreshAll() {
    inventory.loadEquipments().then(() => {
      this.renderDashboard();
      this.renderRequests();
      this.renderEquipments();
      this.renderStocks();
      this.renderMembers();
      this.renderCharts();
      this.renderActivityLog();
    });
  }

  // ===== REQUESTS TABLE =====
  renderRequests() {
    const history = Store.getBorrowHistory();
    const body = document.getElementById('adminRequestsBody');
    const search = this._requestSearchText || '';
    const filter = this._requestFilter || 'all';

    let data = history;
    if (search) {
      const t = search.toLowerCase();
      data = data.filter(r => r.studentName.toLowerCase().includes(t) || r.equipment.toLowerCase().includes(t) || r.id.toLowerCase().includes(t));
    }
    if (filter !== 'all') data = data.filter(r => r.status.toLowerCase() === filter);

    if (data.length === 0) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary);">No requests found.</td></tr>';
      return;
    }

    body.innerHTML = data.map(r => {
      const actionHtml = r.status === 'Pending'
        ? `<button class="btn-sm green" onclick="admin.approveReq('${r.id}')"><i class="fas fa-check"></i></button><button class="btn-sm red" onclick="admin.rejectReq('${r.id}')"><i class="fas fa-times"></i></button>`
        : r.status === 'Approved'
          ? `<button class="btn-sm blue" onclick="admin.returnReq('${r.id}')"><i class="fas fa-undo"></i> Return</button>`
          : '<span style="color:var(--text-light);font-size:0.75rem;">Done</span>';

      return `<tr>
        <td data-label="ID" style="font-size:0.75rem;font-family:monospace;">${r.id}</td>
        <td data-label="Student">${r.studentName}</td>
        <td data-label="Equipment">${r.equipment}</td>
        <td data-label="Date">${new Date(r.borrowDate).toLocaleDateString()}</td>
        <td data-label="Return">${new Date(r.returnDate).toLocaleDateString()}</td>
        <td data-label="Status"><span class="status-pill ${r.status === 'Pending' ? 'pending' : r.status === 'Returned' ? 'returned' : 'approved'}">${r.status}</span></td>
        <td data-label="Action" style="display:flex;gap:4px;">${actionHtml}</td>
      </tr>`;
    }).join('');
  }

  setupRequestSearch() {
    const search = document.getElementById('requestSearch');
    const filter = document.getElementById('requestStatusFilter');
    if (search) search.addEventListener('input', (e) => { this._requestSearchText = e.target.value; this.renderRequests(); });
    if (filter) filter.addEventListener('change', (e) => { this._requestFilter = e.target.value; this.renderRequests(); });
  }

  // ===== EQUIPMENT CRUD =====
  renderEquipments(data) {
    if (!data) data = Store.getEquipments().filter(e => !e.archived);
    const searchText = (document.getElementById('adminEquipSearch')?.value || '').toLowerCase();
    const cat = document.getElementById('adminEquipCategory')?.value || 'All';

    let filtered = data;
    if (cat !== 'All') filtered = filtered.filter(e => e.category === cat);
    if (searchText) filtered = filtered.filter(e => e.name.toLowerCase().includes(searchText));

    const showArchived = document.getElementById('showArchived')?.checked;
    if (showArchived) {
      const archived = Store.getEquipments().filter(e => e.archived);
      filtered = [...filtered, ...archived];
    }

    const body = document.getElementById('adminEquipBody');
    if (filtered.length === 0) {
      body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary);">No equipment found.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map(e => `
      <tr class="${e.archived ? 'archived-row' : ''}">
        <td data-label="ID">${String(e.id).padStart(2, '0')}</td>
        <td data-label="Name"><strong>${e.name}</strong>${e.archived ? ' <span style="font-size:0.7rem;color:var(--text-light);">(Archived)</span>' : ''}</td>
        <td data-label="Category">${e.category}</td>
        <td data-label="Stocks" style="font-weight:700;color:${e.stocks <= (e.minStocks || 3) ? 'var(--danger)' : e.stocks <= 5 ? '#c79100' : 'var(--success)'};">${e.stocks}${e.minStocks ? `<span style="font-weight:400;font-size:0.7rem;color:var(--text-light);"> / min ${e.minStocks}</span>` : ''}</td>
        <td data-label="Fee">₱${e.borrowFee}</td>
        <td data-label="Status"><span class="status-badge ${inventory.getStatusClass(e.status)}"><span class="status-dot"></span>${e.status}</span></td>
        <td data-label="Actions" style="display:flex;gap:3px;flex-wrap:wrap;">
          <button class="btn-sm blue" onclick="admin.openEditEquip(${e.id})" title="Edit"><i class="fas fa-edit"></i></button>
          ${e.archived
            ? `<button class="btn-sm green" onclick="admin.restoreEquip(${e.id})" title="Restore"><i class="fas fa-undo"></i></button>`
            : `<button class="btn-sm" style="background:rgba(255,193,7,0.1);color:#c79100;" onclick="admin.archiveEquip(${e.id})" title="Archive"><i class="fas fa-archive"></i></button>`
          }
          <button class="btn-sm blue" onclick="admin.duplicateEquip(${e.id})" title="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="btn-sm red" onclick="admin.deleteEquip(${e.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  setupEquipmentSearch() {
    const search = document.getElementById('adminEquipSearch');
    const cat = document.getElementById('adminEquipCategory');
    const arch = document.getElementById('showArchived');
    if (search) search.addEventListener('input', () => this.renderEquipments());
    if (cat) cat.addEventListener('change', () => this.renderEquipments());
    if (arch) arch.addEventListener('change', () => this.renderEquipments());
  }

  // ===== EQUIPMENT MODALS =====
  setupEquipmentModals() {
    const modal = document.getElementById('equipModal');
    if (!modal) return;

    const closeBtn = document.getElementById('equipModalClose');
    const form = document.getElementById('equipForm');
    const cancelBtn = document.getElementById('equipModalCancel');

    const close = () => { modal.classList.remove('active'); form.reset(); };
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    document.getElementById('btnAddEquip')?.addEventListener('click', () => {
      form.reset();
      document.getElementById('equipModalTitle').textContent = 'Add Equipment';
      document.getElementById('equipFormId').value = '';
      document.getElementById('equipModal').classList.add('active');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('equipFormId').value;
      const data = {
        name: document.getElementById('equipFormName').value.trim(),
        category: document.getElementById('equipFormCategory').value,
        stocks: parseInt(document.getElementById('equipFormStocks').value) || 0,
        minStocks: parseInt(document.getElementById('equipFormMinStocks').value) || 3,
        borrowFee: parseFloat(document.getElementById('equipFormFee').value) || 0,
        description: document.getElementById('equipFormDesc').value.trim(),
        condition: document.getElementById('equipFormCondition').value || 'Good'
      };

      if (!data.name) { Notification.show('Error', 'Equipment name is required.', 'error'); return; }
      if (data.stocks < 0) { Notification.show('Error', 'Stocks cannot be negative.', 'error'); return; }

      if (id) {
        // Edit
        Store.updateEquipment(parseInt(id), data);
        Store.logActivity('Equipment Updated', {
          admin: auth.getUserName(),
          equipment: data.name,
          message: `Updated ${data.name}`
        });
        Notification.show('Updated', `${data.name} has been updated.`);
      } else {
        // Check duplicate name
        if (Store.getEquipments().find(e => e.name.toLowerCase() === data.name.toLowerCase())) {
          Notification.show('Error', 'An equipment with this name already exists.', 'error');
          return;
        }
        Store.addEquipment(data);
        Store.logActivity('Equipment Added', {
          admin: auth.getUserName(),
          equipment: data.name,
          message: `Added new equipment: ${data.name}`
        });
        Notification.show('Added', `${data.name} has been added.`);
      }

      close();
      this.refreshAll();
    });
  }

  openEditEquip(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    document.getElementById('equipModalTitle').textContent = 'Edit Equipment';
    document.getElementById('equipFormId').value = e.id;
    document.getElementById('equipFormName').value = e.name;
    document.getElementById('equipFormCategory').value = e.category;
    document.getElementById('equipFormStocks').value = e.stocks;
    document.getElementById('equipFormMinStocks').value = e.minStocks || 3;
    document.getElementById('equipFormFee').value = e.borrowFee;
    document.getElementById('equipFormDesc').value = e.description || '';
    document.getElementById('equipFormCondition').value = e.condition || 'Good';
    document.getElementById('equipModal').classList.add('active');
  }

  deleteEquip(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    // Check if equipment is currently borrowed
    const active = Store.getActiveBorrows().find(r => r.equipmentId === id);
    if (active) {
      Notification.show('Cannot Delete', `${e.name} is currently borrowed. Mark it as returned first.`, 'error');
      return;
    }
    if (!confirm(`Delete "${e.name}"? This action cannot be undone.`)) return;
    Store.deleteEquipment(id);
    Store.logActivity('Equipment Deleted', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Deleted equipment: ${e.name}`
    });
    Notification.show('Deleted', `${e.name} has been deleted.`);
    this.refreshAll();
  }

  archiveEquip(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    Store.archiveEquipment(id);
    Store.logActivity('Equipment Archived', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Archived ${e.name}`
    });
    Notification.show('Archived', `${e.name} has been archived.`);
    this.refreshAll();
  }

  restoreEquip(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    Store.restoreEquipment(id);
    Store.logActivity('Equipment Restored', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Restored ${e.name} from archive`
    });
    Notification.show('Restored', `${e.name} has been restored.`);
    this.refreshAll();
  }

  duplicateEquip(id) {
    const copy = Store.duplicateEquipment(id);
    if (copy) {
      Store.logActivity('Equipment Duplicated', {
        admin: auth.getUserName(),
        equipment: copy.name,
        message: `Duplicated ${Store.getEquipment(id)?.name} as ${copy.name}`
      });
      Notification.show('Duplicated', `${copy.name} has been created.`);
      this.refreshAll();
    }
  }

  // ===== STOCK MANAGEMENT =====
  renderStocks() {
    const equipments = Store.getEquipments().filter(e => !e.archived);
    const container = document.getElementById('adminStockCards');
    if (!container) return;

    container.innerHTML = equipments.map(e => {
      const pct = Math.min(100, ((e.stocks || 0) / Math.max(1, (e.minStocks || 3) * 3)) * 100);
      const color = e.stocks <= 0 ? 'var(--danger)' : e.stocks <= (e.minStocks || 3) ? 'var(--danger)' : e.stocks <= 5 ? '#c79100' : 'var(--success)';
      return `
        <div class="admin-card stock-card" data-id="${e.id}">
          <div class="ac-label" style="display:flex;justify-content:space-between;align-items:center;">
            <span>${e.name}</span>
            <span class="status-badge ${inventory.getStatusClass(e.status)}" style="font-size:0.6rem;padding:0.1rem 0.4rem;"><span class="status-dot"></span>${e.status}</span>
          </div>
          <div class="ac-value" style="font-size:1.2rem;color:${color};">${e.stocks} units</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color};"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-light);margin-top:0.3rem;">
            <span>₱${e.borrowFee}/item</span>
            <span>Min: ${e.minStocks || 3}</span>
          </div>
          <div style="display:flex;gap:4px;margin-top:0.5rem;">
            <button class="btn-sm green" onclick="admin.stockAdjust(${e.id}, 1)" title="Increase"><i class="fas fa-plus"></i></button>
            <button class="btn-sm red" onclick="admin.stockAdjust(${e.id}, -1)" title="Decrease"><i class="fas fa-minus"></i></button>
            <button class="btn-sm blue" onclick="admin.stockRestock(${e.id})" title="Restock to min"><i class="fas fa-undo-alt"></i></button>
            <button class="btn-sm" style="background:rgba(255,193,7,0.1);color:#c79100;" onclick="admin.markMaintenance(${e.id})" title="Mark Maintenance"><i class="fas fa-wrench"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  stockAdjust(id, delta) {
    const e = Store.getEquipment(id);
    if (!e) return;
    if (e.stocks + delta < 0) {
      Notification.show('Error', 'Stocks cannot go below zero.', 'error');
      return;
    }
    Store.adjustStock(id, delta);
    Store.logActivity('Stock Adjusted', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Adjusted stock by ${delta > 0 ? '+' : ''}${delta} (now ${(Store.getEquipment(id)?.stocks || 0)})`
    });
    Notification.show('Stock Updated', `${e.name} stock ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}.`);
    this.refreshAll();
  }

  stockRestock(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    const min = e.minStocks || 3;
    if (e.stocks >= min) {
      Notification.show('Info', `${e.name} already has sufficient stock.`);
      return;
    }
    const diff = min - e.stocks;
    Store.adjustStock(id, diff);
    Store.logActivity('Stock Restocked', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Restocked ${e.name} by ${diff} to meet minimum (now ${min})`
    });
    Notification.show('Restocked', `${e.name} restocked to minimum (${min} units).`);
    this.refreshAll();
  }

  markMaintenance(id) {
    const e = Store.getEquipment(id);
    if (!e) return;
    const newStatus = e.status === 'Under Maintenance' ? 'Available' : 'Under Maintenance';
    Store.updateEquipment(id, { status: newStatus });
    Store.logActivity('Status Changed', {
      admin: auth.getUserName(),
      equipment: e.name,
      message: `Changed ${e.name} status to ${newStatus}`
    });
    Notification.show('Status Updated', `${e.name} is now ${newStatus}.`);
    this.refreshAll();
  }

  setupStockActions() {
    // Stock search
    const search = document.getElementById('adminStockSearch');
    if (search) search.addEventListener('input', () => this.renderStocks());
  }

  // ===== MEMBERS =====
  renderMembers() {
    const grid = document.getElementById('adminMembersGrid');
    if (!grid) return;
    const members = [
      { i: 'JS', n: 'John Santos', r: 'Laboratory Officer', desc: 'Oversees all laboratory operations and equipment borrowing.' },
      { i: 'MC', n: 'Maria Cruz', r: 'Student Assistant', desc: 'Assists students during borrowing and maintains records.' },
      { i: 'AR', n: 'Alex Reyes', r: 'System Developer', desc: 'Designed and developed the COMLAB system.' },
      { i: 'SL', n: 'Sarah Lim', r: 'Secretary', desc: 'Handles documentation and administrative tasks.' },
      { i: 'DT', n: 'David Tan', r: 'Treasurer', desc: 'Monitors borrowing fees and financial records.' },
      { i: 'AG', n: 'Anna Garcia', r: 'Laboratory Officer', desc: 'Oversees safety protocols and equipment maintenance.' }
    ];
    grid.innerHTML = members.map(m => `
      <div class="member-card reveal">
        <div class="member-avatar" style="background:var(--gradient-1);"><span>${m.i}</span><div class="avatar-ring"></div></div>
        <h3>${m.n}</h3>
        <div class="role">${m.r}</div>
        <p style="font-size:0.82rem;color:var(--text-secondary);margin:0.5rem 0;">${m.desc}</p>
      </div>
    `).join('');
  }

  // ===== CHARTS =====
  renderCharts() {
    this.renderEquipStatusChart();
    this.renderBorrowTrendChart();
  }

  renderEquipStatusChart() {
    const equip = Store.getEquipments().filter(e => !e.archived);
    const byStatus = { Available: 0, 'Low Stock': 0, 'Out of Stock': 0, 'Under Maintenance': 0 };
    equip.forEach(e => { if (byStatus.hasOwnProperty(e.status)) byStatus[e.status]++; });

    const COLORS = { Available: '#00c853', 'Low Stock': '#c79100', 'Out of Stock': '#d32f2f', 'Under Maintenance': '#1e88e5' };
    const data = Object.entries(byStatus).filter(([_, v]) => v > 0).map(([label, value]) => ({ label, value, color: COLORS[label] }));

    const container = document.getElementById('equipStatusChart');
    const legendContainer = document.getElementById('equipChartLegend');

    if (data.length === 0) {
      container.innerHTML = '<div class="chart-placeholder" style="padding:2rem;">No equipment data</div>';
      if (legendContainer) legendContainer.innerHTML = '';
      return;
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    const cx = 130, cy = 110, r = 85, thick = 28;
    let svg = `<svg viewBox="0 0 260 220"><g transform="translate(${cx},${cy})">`;
    let startAngle = -Math.PI / 2;

    data.forEach((d) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = Math.cos(startAngle) * (r + thick / 2), y1 = Math.sin(startAngle) * (r + thick / 2);
      const x2 = Math.cos(endAngle) * (r + thick / 2), y2 = Math.sin(endAngle) * (r + thick / 2);
      const large = angle > Math.PI ? 1 : 0;
      svg += `<path d="M ${x1} ${y1} A ${r + thick / 2} ${r + thick / 2} 0 ${large} 1 ${x2} ${y2} L ${Math.cos(endAngle) * (r - thick / 2)} ${Math.sin(endAngle) * (r - thick / 2)} A ${r - thick / 2} ${r - thick / 2} 0 ${large} 0 ${Math.cos(startAngle) * (r - thick / 2)} ${Math.sin(startAngle) * (r - thick / 2)} Z" fill="${d.color}" class="chart-donut-segment"><title>${d.label}: ${d.value}</title></path>`;
      const midAngle = startAngle + angle / 2;
      const lx = Math.cos(midAngle) * (r + thick + 16), ly = Math.sin(midAngle) * (r + thick + 16);
      svg += `<text x="${lx}" y="${ly}" font-size="0.7rem" fill="${d.color}" text-anchor="middle" dominant-baseline="middle" font-weight="700">${Math.round((d.value / total) * 100)}%</text>`;
      startAngle = endAngle;
    });

    svg += `<text class="chart-center-text" y="-4">${total}</text><text class="chart-center-label" y="16">Total</text></g></svg>`;
    container.innerHTML = svg;

    if (legendContainer) {
      legendContainer.innerHTML = data.map(d =>
        `<span class="legend-item"><span class="legend-dot" style="background:${d.color}"></span>${d.label} (${d.value})</span>`
      ).join('');
    }
  }

  renderBorrowTrendChart() {
    const history = Store.getBorrowHistory();
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 });
    }
    history.forEach(r => {
      const d = new Date(r.borrowDate);
      const match = days.find(x => x.date.toDateString() === d.toDateString());
      if (match) match.count++;
    });

    const max = Math.max(1, ...days.map(d => d.count));
    const w = 280, h = 200, barW = 28, gap = 8, padL = 10, padR = 10, padT = 20, padB = 30;
    const startX = padL;
    let svg = `<svg viewBox="0 0 ${w} ${h}" style="max-width:100%;">`;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + ((h - padT - padB) / 4) * i;
      svg += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(var(--primary-rgb),0.06)" stroke-width="1"/>`;
      svg += `<text x="${padL - 4}" y="${y + 3}" font-size="0.6rem" fill="var(--text-light)" text-anchor="end">${Math.round(max * (1 - i / 4))}</text>`;
    }

    // Bars
    days.forEach((d, i) => {
      const x = startX + i * (barW + gap);
      const barH = (d.count / max) * (h - padT - padB);
      const y = padT + (h - padT - padB) - barH;
      const color = d.count > 0 ? '#990000' : 'rgba(var(--primary-rgb),0.12)';
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH || 2}" rx="4" fill="${color}" class="chart-bar"><title>${d.label}: ${d.count} borrows</title></rect>`;
      if (d.count > 0) svg += `<text class="chart-bar-value" x="${x + barW / 2}" y="${y - 6}" fill="#990000">${d.count}</text>`;
      svg += `<text class="chart-bar-label" x="${x + barW / 2}" y="${padT + (h - padT - padB) + 16}">${d.label}</text>`;
    });

    svg += `<line x1="${padL}" y1="${padT + (h - padT - padB)}" x2="${w - padR}" y2="${padT + (h - padT - padB)}" stroke="rgba(var(--primary-rgb),0.08)" stroke-width="1"/>`;
    svg += '</svg>';
    document.getElementById('borrowTrendChart').innerHTML = svg;
  }

  // ===== SETTINGS =====
  renderActivityLog() {
    const log = Store.getActivityLog();
    const body = document.getElementById('activityLogBody');
    if (!body) return;
    if (log.length === 0) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--text-light);">No activity recorded yet.</td></tr>';
      return;
    }
    body.innerHTML = log.slice(0, 50).map(item => `
      <tr>
        <td data-label="Date/Time" style="font-size:0.75rem;white-space:nowrap;">${new Date(item.date).toLocaleString()}</td>
        <td data-label="Action"><span class="status-pill ${item.action.includes('Approved') ? 'approved' : item.action.includes('Rejected') ? 'pending' : 'returned'}">${item.action}</span></td>
        <td data-label="Equipment">${item.equipment || '—'}</td>
        <td data-label="Admin">${item.admin || 'System'}</td>
        <td data-label="Details" style="font-size:0.78rem;color:var(--text-secondary);">${item.details || ''}</td>
      </tr>
    `).join('');
  }

  loadSettings() {
    const settings = Store.getSettings();
    const s = n => { const el = document.getElementById(n); if (el) el.value = settings[n.replace('setting', '').replace(/^./, c => c.toLowerCase())] || ''; };

    document.getElementById('settingSchoolName').value = settings.schoolName;
    document.getElementById('settingLabName').value = settings.labName;
    document.getElementById('settingOfficer').value = settings.officerName;
    document.getElementById('settingItemsPerPage').value = settings.itemsPerPage || '10';
    document.getElementById('settingAutoRefresh').value = settings.autoRefresh || '60';
    document.getElementById('adminProfileId').value = auth.currentUser?.id || '';

    this.applySettingsToUI(settings);

    document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
      const data = {
        schoolName: document.getElementById('settingSchoolName').value.trim() || 'TUPT',
        labName: document.getElementById('settingLabName').value.trim() || 'Computer Laboratory',
        officerName: document.getElementById('settingOfficer').value.trim() || 'Laboratory Officer',
        itemsPerPage: document.getElementById('settingItemsPerPage').value,
        autoRefresh: document.getElementById('settingAutoRefresh').value
      };
      Store.saveSettings(data);
      this.applySettingsToUI(data);
      // Update auto-refresh
      this.setupActivityRefresh();
      Notification.show('Settings Saved', 'Configuration has been saved successfully.');
    });

    document.getElementById('btnResetSettings')?.addEventListener('click', () => {
      if (!confirm('Reset all settings to factory defaults?')) return;
      Store.saveSettings({
        schoolName: 'Technological University of the Philippines',
        labName: 'Computer Laboratory - Main',
        officerName: 'Laboratory Officer',
        itemsPerPage: '10',
        autoRefresh: '60'
      });
      this.loadSettings();
      Notification.show('Reset Complete', 'Settings restored to factory defaults.');
    });

    document.getElementById('btnResetData')?.addEventListener('click', async () => {
      if (!confirm('⚠️ This will delete ALL data and restore demo defaults. Continue?')) return;
      await Store.resetDemoData();
      await inventory.loadEquipments();
      this.refreshAll();
      Notification.show('Data Reset', 'All demo data has been restored to factory defaults.');
    });
  }

  applySettingsToUI(settings) {
    const header = document.querySelector('.admin-header h1');
    if (header) {
      const spans = header.querySelectorAll('span');
      if (spans.length > 0) spans[0].textContent = settings.labName || 'Overview';
    }
    document.title = `${settings.schoolName} — ${settings.labName}`;
  }
}

// ===== INITIALIZE =====
let admin;
document.addEventListener('DOMContentLoaded', async () => {
  admin = new AdminDashboard();
  window.admin = admin;

  // Setup search/filter for requests table
  setTimeout(() => admin.setupRequestSearch(), 100);
  setTimeout(() => admin.setupEquipmentSearch(), 100);
  setTimeout(() => admin.setupStockActions(), 100);
});
