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
    Store.initTheme();

    this.setupNavigation();
    this.setupSidebar();
    this.renderDashboard();
    this.renderRequests();
    this.renderEquipments();
    this.renderStocks();
    this.renderMembers();
    this.renderCharts();
    this.renderCalendar();
    this.loadSettings();
    this.setupThemeSelector();
    this.setupBackupRestore();
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

    // Today widget (replaced by calendar view - kept for reference)
    const todayEl = document.getElementById('todayWidget');
    if (todayEl) {
      todayEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
    }
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
    // Decrease equipment stock by 1 on approval
    Store.adjustStock(r.equipmentId, -1);
    Store.updateBorrowRecord(id, { status: 'Approved' });
    Store.logActivity('Borrow Approved', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `Approved borrow request by ${r.studentName} for ${r.equipment} (stock -1)`
    });
    Notification.show('Approved', `Request by ${r.studentName} has been approved.`);
    this.refreshAll();
  }

  rejectReq(id) {
    const r = Store.getBorrowHistory().find(x => x.id === id);
    if (!r) return;
    // No stock adjustment — stock was never decreased on Pending status.
    Store.updateBorrowRecord(id, { status: 'Rejected' });
    Store.logActivity('Borrow Rejected', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `Rejected borrow request by ${r.studentName} for ${r.equipment}`
    });
    Notification.show('Rejected', `Request by ${r.studentName} has been rejected.`);
    this.refreshAll();
  }

  returnReq(id) {
    const r = Store.getBorrowHistory().find(x => x.id === id);
    if (!r) return;
    // Increase stock back by 1 when equipment is returned
    Store.adjustStock(r.equipmentId, 1);
    Store.updateBorrowRecord(id, { status: 'Returned' });
    Store.logActivity('Item Returned', {
      admin: auth.getUserName(),
      equipment: r.equipment,
      message: `${r.studentName} returned ${r.equipment} (stock +1)`
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
      this._updateAboutSection();
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
        <td data-label="Student ID" style="font-size:0.75rem;font-family:monospace;">${r.studentId || 'GUEST'}</td>
        <td data-label="Equipment">${r.equipment}</td>
        <td data-label="Date">${new Date(r.borrowDate).toLocaleDateString()}</td>
        <td data-label="Return">${new Date(r.returnDate).toLocaleDateString()}</td>
        <td data-label="Fee"><strong>₱${r.fee || 0}</strong></td>
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

    body.innerHTML = filtered.map(e => {
      const imgPath = SVG.getEquipImagePath(e.name, e);
      return `
      <tr class="${e.archived ? 'archived-row' : ''}">
        <td data-label="Image">
          <img src="${imgPath}" alt="${e.name}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;display:block;" loading="lazy" onerror="this.onerror=null;this.outerHTML='${SVG.getFallbackHTML(36)}';" />
        </td>
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
    `}).join('');
  }

  setupEquipmentSearch() {
    const search = document.getElementById('adminEquipSearch');
    const cat = document.getElementById('adminEquipCategory');
    const arch = document.getElementById('showArchived');
    if (search) search.addEventListener('input', () => this.renderEquipments());
    if (cat) cat.addEventListener('change', () => this.renderEquipments());
    if (arch) arch.addEventListener('change', () => this.renderEquipments());
  }

  // ===== EQUIPMENT MODALS (with drag-and-drop image upload) =====
  setupEquipmentModals() {
    const modal = document.getElementById('equipModal');
    if (!modal) return;

    const closeBtn = document.getElementById('equipModalClose');
    const form = document.getElementById('equipForm');
    const cancelBtn = document.getElementById('equipModalCancel');
    const imageInput = document.getElementById('equipFormImage');
    const imagePreview = document.getElementById('equipImagePreview');
    const imageRemoveBtn = document.getElementById('equipImageRemove');
    const imageChangeBtn = document.getElementById('equipImageChange');
    const dropzone = document.getElementById('equipImageDropzone');
    const dropzoneActions = document.getElementById('dropzoneActions');
    const dropzoneInner = document.getElementById('dropzoneInner');
    let pendingImageData = null; // base64 data URL or null to reset
    let dragCounter = 0; // for nested dragenter/dragleave

    // Helper to sync UI after image change
    const updateDropzoneUI = (hasCustomImage) => {
      dropzone.classList.toggle('has-image', hasCustomImage);
      dropzoneActions.style.display = hasCustomImage ? 'flex' : 'none';
    };

    // Click / keyboard on dropzone opens file picker
    dropzone?.setAttribute('tabindex', '0');
    dropzone?.setAttribute('role', 'button');
    dropzone?.addEventListener('click', (e) => {
      // Don't trigger if clicking a button inside
      if (e.target.closest('button')) return;
      imageInput?.click();
    });
    dropzone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.target.closest('button')) return;
        imageInput?.click();
      }
    });

    // ===== DRAG & DROP HANDLERS =====
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    dropzone?.addEventListener('dragenter', (e) => {
      dragCounter++;
      if (dragCounter === 1) {
        dropzone.classList.add('drag-over');
      }
    });

    dropzone?.addEventListener('dragleave', (e) => {
      dragCounter--;
      if (dragCounter === 0) {
        dropzone.classList.remove('drag-over');
      }
    });

    dropzone?.addEventListener('drop', (e) => {
      dragCounter = 0;
      dropzone.classList.remove('drag-over');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleImageUpload(files[0]);
      }
    });

    // ===== IMAGE UPLOAD HANDLER (shared by file input & drop) =====
    const handleImageUpload = (file) => {
      if (!file) return;
      // Validate file type
      const validTypes = ['image/jpeg','image/png','image/webp','image/gif'];
      if (!validTypes.includes(file.type)) {
        Notification.show('Invalid file type', 'Please upload a JPG, PNG, WebP, or GIF image.', 'error');
        return;
      }
      if (file.size > 500 * 1024) {
        Notification.show('File too large', 'Image must be under 500KB.', 'error');
        return;
      }
      // Compress with canvas
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          const maxDim = 400;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w *= ratio; h *= ratio;
          }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          pendingImageData = canvas.toDataURL('image/jpeg', 0.8);
          imagePreview.innerHTML = `<img src="${pendingImageData}" alt="Preview" />`;
          updateDropzoneUI(true);
          Notification.show('Image uploaded', 'Equipment image has been updated.', 'success');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // ===== FILE INPUT CHANGE =====
    imageInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
    });

    // ===== REMOVE CUSTOM IMAGE → revert to default =====
    const resetImage = () => {
      pendingImageData = null;
      imagePreview.innerHTML = '<i class="fas fa-image"></i>';
      updateDropzoneUI(false);
      imageInput.value = '';
    };

    imageRemoveBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Reset to the default equipment image?')) resetImage();
    });

    // ===== CHANGE DIFFERENT BUTTON =====
    imageChangeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      imageInput?.click();
    });

    // ===== CLOSE MODAL =====
    const close = () => {
      modal.classList.remove('active');
      form.reset();
      pendingImageData = undefined;
      dropzone.classList.remove('drag-over');
      imagePreview.innerHTML = '<i class="fas fa-image"></i>';
      updateDropzoneUI(false);
      dragCounter = 0;
    };
    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    // ===== OPEN ADD MODAL =====
    document.getElementById('btnAddEquip')?.addEventListener('click', () => {
      form.reset();
      document.getElementById('equipModalTitle').textContent = 'Add Equipment';
      document.getElementById('equipFormId').value = '';
      pendingImageData = undefined;
      dropzone.classList.remove('has-image', 'drag-over');
      imagePreview.innerHTML = '<i class="fas fa-image"></i>';
      updateDropzoneUI(false);
      document.getElementById('equipModal').classList.add('active');
    });

    // ===== FORM SUBMIT =====
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

      // Handle image
      if (pendingImageData !== undefined) {
        data.imagePath = pendingImageData; // null = reset to default, string = custom image
      }

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

    // Show current image if custom, otherwise show default
    const preview = document.getElementById('equipImagePreview');
    const dropzone = document.getElementById('equipImageDropzone');
    const actions = document.getElementById('dropzoneActions');
    const hasCustomImage = e.imagePath && e.imagePath.startsWith('data:');
    if (hasCustomImage) {
      preview.innerHTML = `<img src="${e.imagePath}" alt="${e.name}" />`;
      dropzone?.classList.add('has-image');
      actions.style.display = 'flex';
    } else {
      const defaultImg = SVG.getEquipImagePath(e.name);
      preview.innerHTML = `<img src="${defaultImg}" alt="${e.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" onerror="this.onerror=null;this.outerHTML='${SVG.getFallbackHTML(120)}';" />`;
      dropzone?.classList.remove('has-image');
      actions.style.display = 'none';
    }
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

  // ===== MEMBERS (Registered Students) =====
  renderMembers() {
    const container = document.getElementById('adminMembersContainer');
    if (!container) return;

    const students = Store.getAllStudents();
    const borrowHistory = Store.getBorrowHistory();
    const searchText = (document.getElementById('memberStudentSearch')?.value || '').toLowerCase();

    let data = students.map(s => {
      const borrows = borrowHistory.filter(r => r.studentId === s.id);
      const active = borrows.filter(r => r.status === 'Pending' || r.status === 'Approved');
      return {
        id: s.id,
        name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        department: s.department || 'N/A',
        year: s.year || 'N/A',
        section: s.section || 'N/A',
        email: s.email || 'N/A',
        contact: s.contact || 'N/A',
        borrowCount: borrows.length,
        activeCount: active.length,
        status: active.length > 0 ? 'Active' : 'Clear'
      };
    });

    if (searchText) {
      data = data.filter(s =>
        s.name.toLowerCase().includes(searchText) ||
        s.id.toLowerCase().includes(searchText) ||
        s.department.toLowerCase().includes(searchText)
      );
    }

    // Sort: active borrowers first, then alphabetical
    data.sort((a, b) => b.activeCount - a.activeCount || a.name.localeCompare(b.name));

    if (data.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-secondary);"><div style="font-size:3rem;margin-bottom:1rem;opacity:0.3;">👥</div><h3 style="margin-bottom:0.3rem;">No Students Found</h3><p>No registered students yet.</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="admin-table"><table>
        <thead><tr>
          <th>Student</th><th>ID</th><th>Department</th><th>Year</th><th>Section</th><th>Borrows</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>${data.map(s => `
          <tr>
            <td data-label="Student"><div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:50%;background:var(--gradient-1);display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:700;flex-shrink:0;">${s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
              <strong>${s.name}</strong>
            </div></td>
            <td data-label="ID" style="font-family:monospace;font-size:0.78rem;">${s.id}</td>
            <td data-label="Department">${s.department}</td>
            <td data-label="Year">${s.year}</td>
            <td data-label="Section">${s.section}</td>
            <td data-label="Borrows"><span style="font-weight:700;">${s.borrowCount}</span> <span style="font-size:0.75rem;color:${s.activeCount > 0 ? '#c79100' : 'var(--text-light)'};">(${s.activeCount} active)</span></td>
            <td data-label="Status"><span class="status-pill ${s.status === 'Active' ? 'pending' : 'returned'}">${s.status}</span></td>
            <td data-label="Action">
              <button class="btn-sm red" onclick="admin.deleteMember('${s.id}')" title="Remove student"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table></div>
      <div style="font-size:0.82rem;color:var(--text-secondary);margin-top:0.5rem;">${data.length} student${data.length !== 1 ? 's' : ''} registered</div>
    `;
  }

  deleteMember(id) {
    const student = Store.getAllStudents().find(s => s.id === id);
    if (!student) return;

    // Check if this is a seed student (from students.json) — cannot modify
    const seedStudentIds = (Store.get(STORAGE_KEYS.STUDENTS) || []).map(s => s.id);
    if (seedStudentIds.includes(id)) {
      Notification.show('Cannot Remove', 'Demo student accounts cannot be removed. Register a new student to test deletion.', 'error');
      return;
    }

    const activeBorrows = Store.getBorrowHistory().filter(r => r.studentId === id && (r.status === 'Pending' || r.status === 'Approved'));
    if (activeBorrows.length > 0) {
      Notification.show('Cannot Delete', `${student.name} has active borrow requests.`, 'error');
      return;
    }
    if (!confirm(`Remove "${student.name}" (${id}) from the system?`)) return;
    // Remove from registered students only
    const updated = Store.getRegisteredStudents().filter(s => s.id !== id);
    Store.saveRegisteredStudents(updated);
    Store.logActivity('Student Removed', {
      admin: auth.getUserName(),
      message: `Removed student ${student.name} (${id}) from the system`
    });
    Notification.show('Removed', `${student.name} has been removed.`);
    this.refreshAll();
  }

  // ===== CHARTS =====
  renderCharts() {
    this.renderEquipStatusChart();
    this.renderBorrowTrendChart();
    this.renderRevenueChart();
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
  renderRevenueChart() {
    const history = Store.getBorrowHistory();
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        date: d,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: 0
      });
    }
    history.forEach(r => {
      const d = new Date(r.borrowDate);
      const match = months.find(m => m.date.getMonth() === d.getMonth() && m.date.getFullYear() === d.getFullYear());
      if (match && r.status === 'Approved') match.revenue += r.fee || 0;
    });

    const max = Math.max(1, ...months.map(m => m.revenue));
    const w = 280, h = 200, barW = 32, gap = 12, padL = 10, padR = 10, padT = 20, padB = 30;
    let svg = `<svg viewBox="0 0 ${w} ${h}" style="max-width:100%;">`;

    for (let i = 0; i <= 4; i++) {
      const y = padT + ((h - padT - padB) / 4) * i;
      svg += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="rgba(var(--primary-rgb),0.06)" stroke-width="1"/>`;
      svg += `<text x="${padL - 4}" y="${y + 3}" font-size="0.6rem" fill="var(--text-light)" text-anchor="end">₱${Math.round(max * (1 - i / 4))}</text>`;
    }

    months.forEach((m, i) => {
      const x = padL + i * (barW + gap);
      const barH = (m.revenue / max) * (h - padT - padB);
      const y = padT + (h - padT - padB) - barH;
      const color = m.revenue > 0 ? '#00c853' : 'rgba(var(--primary-rgb),0.12)';
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH || 2}" rx="4" fill="${color}" class="chart-bar"><title>${m.label}: ₱${m.revenue}</title></rect>`;
      if (m.revenue > 0) svg += `<text class="chart-bar-value" x="${x + barW / 2}" y="${y - 6}" fill="#00c853" font-size="0.65rem">₱${m.revenue}</text>`;
      svg += `<text class="chart-bar-label" x="${x + barW / 2}" y="${padT + (h - padT - padB) + 16}">${m.label}</text>`;
    });

    svg += `</svg>`;
    const container = document.getElementById('revenueChart');
    if (container) container.innerHTML = svg;
  }

  // ===== CALENDAR =====
  renderCalendar() {
    const calendarEl = document.getElementById('adminCalendar');
    if (!calendarEl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const events = Store.getCalendarEvents(year, month);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let html = `<div class="calendar-header"><span class="calendar-month">${monthNames[month]} ${year}</span></div>`;
    html += `<div class="calendar-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>`;
    html += `<div class="calendar-days">`;

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day cal-day-empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e =>
        e.date.getFullYear() === year &&
        e.date.getMonth() === month &&
        e.date.getDate() === day
      );
      const isToday = day === today;
      const hasEvents = dayEvents.length > 0;
      const pendingEvents = dayEvents.filter(e => e.status === 'Pending').length;
      html += `<div class="cal-day ${isToday ? 'cal-today' : ''} ${hasEvents ? 'cal-has-events' : ''}" title="${dayEvents.map(e => `${e.title} (${e.status})`).join('\n')}">
        <span class="cal-day-num">${day}</span>
        ${hasEvents ? `<span class="cal-day-dot ${pendingEvents > 0 ? 'cal-dot-pending' : 'cal-dot-done'}"></span>` : ''}
      </div>`;
    }

    html += `</div>`;

    // Event list below calendar
    if (events.length > 0) {
      html += `<div class="calendar-events">`;
      const todayEvents = events.filter(e => e.date.getDate() === today);
      const showEvents = todayEvents.length > 0 ? todayEvents : events.slice(0, 3);
      html += `<div class="cal-events-title">${todayEvents.length > 0 ? "Today's" : "This month's"} events</div>`;
      showEvents.forEach(e => {
        html += `<div class="cal-event-item">
          <span class="cal-event-dot ${e.status === 'Pending' ? 'cal-dot-pending' : e.status === 'Approved' ? 'cal-dot-approved' : 'cal-dot-done'}"></span>
          <span class="cal-event-title">${e.title}</span>
          <span class="cal-event-status status-pill ${e.status === 'Pending' ? 'pending' : e.status === 'Approved' ? 'approved' : 'returned'}" style="font-size:0.65rem;padding:0.1rem 0.4rem;">${e.status}</span>
        </div>`;
      });
      if (events.length > 3 && todayEvents.length === 0) {
        html += `<div style="font-size:0.72rem;color:var(--text-light);text-align:center;margin-top:0.3rem;">+${events.length - 3} more events</div>`;
      }
      html += `</div>`;
    }

    calendarEl.innerHTML = html;
  }

  // ===== THEME =====
  setupThemeSelector() {
    const selector = document.getElementById('themeSelector');
    if (!selector) return;
    selector.value = Store.getTheme();
    selector.addEventListener('change', (e) => {
      Store.setTheme(e.target.value);
      Notification.show('Theme Updated', `Theme changed to ${e.target.value}.`);
    });
  }

  // ===== DOWNLOAD BACKUP HELPER (reused by backup, reset, factory reset) =====
  _downloadBackup(prefix = 'COMLAB_Backup') {
    const data = Store.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    a.download = `${prefix}_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { blob, sizeKB: Math.round(blob.size / 1024) };
  }

  // ===== BACKUP / RESTORE / EXPORT / IMPORT =====
  setupBackupRestore() {
    // ===== BACKUP DATA =====
    document.getElementById('btnBackupData')?.addEventListener('click', () => {
      const result = this._downloadBackup('COMLAB_Backup');
      Store.logActivity('Backup Created', {
        admin: auth.getUserName(),
        message: `Full system backup downloaded (${result.sizeKB} KB)`
      });
      Notification.show('Backup Complete', 'System backup has been downloaded successfully.');
    });

    // ===== RESTORE FILE NAME DISPLAY =====
    document.getElementById('restoreFileInput')?.addEventListener('change', (e) => {
      const nameEl = document.getElementById('restoreFileName');
      if (nameEl && e.target.files?.[0]) {
        nameEl.textContent = '📄 ' + e.target.files[0].name + ' (' + Math.round(e.target.files[0].size / 1024) + ' KB)';
      }
    });

    // ===== RESTORE FROM BACKUP =====
    document.getElementById('btnRestoreData')?.addEventListener('click', () => {
      const input = document.getElementById('restoreFileInput');
      if (!input || !input.files || !input.files[0]) {
        Notification.show('No File', 'Please select a backup file first.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Validate
          if (!data.version) {
            Notification.show('Invalid Backup', 'The selected file is not a valid COMLAB backup. Missing version field.', 'error');
            return;
          }
          // Show preview
          const equipCount = data.equipments?.length || 0;
          const borrowCount = data.borrowHistory?.length || 0;
          const studentCount = data.registeredStudents?.length || 0;
          const msg = `This will OVERWRITE all current data with the backup.\n\n📊 Backup contains:\n• ${equipCount} equipment items\n• ${borrowCount} borrow records\n• ${studentCount} registered students\n• ${data.activityLog?.length || 0} activity log entries\n\n⚠️ This cannot be undone. Continue?`;
          if (!confirm(msg)) return;

          const result = Store.importAllData(data);
          if (result.success) {
            Store.logActivity('Backup Restored', {
              admin: auth.getUserName(),
              message: `Full system data restored from backup (${equipCount} equipments, ${borrowCount} borrows)`
            });
            Notification.show('Restore Complete', 'All data has been restored from backup.');
            input.value = '';
            const nameEl = document.getElementById('restoreFileName');
            if (nameEl) nameEl.textContent = '';
            this.refreshAll();
          } else {
            Notification.show('Restore Failed', result.message, 'error');
          }
        } catch (err) {
          Notification.show('Invalid File', 'Could not parse backup file: ' + err.message, 'error');
        }
      };
      reader.readAsText(input.files[0]);
    });

    // ===== EXPORT INDIVIDUAL SECTIONS =====
    ['exportEquipments', 'exportBorrows', 'exportStudents', 'exportActivity', 'exportSettings'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        const sectionMap = {
          exportEquipments: 'equipments',
          exportBorrows: 'borrows',
          exportStudents: 'students',
          exportActivity: 'activity',
          exportSettings: 'settings'
        };
        const section = sectionMap[id];
        const data = Store.exportSection(section);
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comlab-${section}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Store.logActivity('Export Completed', {
          admin: auth.getUserName(),
          message: `Exported ${section} section`
        });
        Notification.show('Export Complete', `${section} data has been exported.`);
      });
    });

    // ===== IMPORT FILE SELECTION & PREVIEW =====
    let _pendingImportData = null;

    document.getElementById('importFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      const nameEl = document.getElementById('importFileName');
      const previewArea = document.getElementById('importPreviewArea');
      const previewContent = document.getElementById('importPreviewContent');

      if (!file) {
        if (nameEl) nameEl.textContent = 'No file selected';
        if (previewArea) previewArea.style.display = 'none';
        _pendingImportData = null;
        return;
      }

      if (nameEl) nameEl.textContent = '📄 ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)';

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || typeof data !== 'object') {
            Notification.show('Invalid File', 'The selected file is not valid JSON.', 'error');
            if (previewArea) previewArea.style.display = 'none';
            _pendingImportData = null;
            return;
          }
          _pendingImportData = data;

          // Build preview
          const counts = [
            { label: 'Equipments', value: data.equipments?.length || 0, icon: '🛠️' },
            { label: 'Borrow Records', value: data.borrowHistory?.length || 0, icon: '📋' },
            { label: 'Students', value: data.registeredStudents?.length || 0, icon: '👥' },
            { label: 'Activity Logs', value: data.activityLog?.length || 0, icon: '📝' },
            { label: 'Settings', value: data.settings ? '✓' : '—', icon: '⚙️' },
            { label: 'Admins', value: data.admins?.length || 0, icon: '🔐' },
          ];

          if (previewContent) {
            previewContent.innerHTML = counts.map(c => `
              <div class="settings-preview-item">
                <div style="font-size:1.2rem;">${c.icon}</div>
                <div class="spi-value">${c.value}</div>
                <div class="spi-label">${c.label}</div>
              </div>
            `).join('');
          }
          if (previewArea) previewArea.style.display = 'block';
          Notification.show('File Loaded', 'JSON file parsed successfully. Review the preview and click Import.', 'success');
        } catch (err) {
          Notification.show('Invalid File', 'Could not parse JSON: ' + err.message, 'error');
          if (previewArea) previewArea.style.display = 'none';
          _pendingImportData = null;
        }
      };
      reader.readAsText(file);
    });

    // ===== EXECUTE IMPORT =====
    document.getElementById('btnImportData')?.addEventListener('click', () => {
      if (!_pendingImportData) {
        Notification.show('No Data', 'Please select a valid JSON file first.', 'error');
        return;
      }
      if (!_pendingImportData.version) {
        Notification.show('Invalid Format', 'The file is missing the version field. Is this a COMLAB backup file?', 'error');
        return;
      }

      const counts = [
        _pendingImportData.equipments?.length || 0,
        _pendingImportData.borrowHistory?.length || 0
      ];
      if (!confirm(`⚠️ This will IMPORT data into the system.\n\n📊 Contains:\n• ${counts[0]} equipment items\n• ${counts[1]} borrow records\n• ${_pendingImportData.registeredStudents?.length || 0} registered students\n\nExisting data with matching IDs will be overwritten. Continue?`)) return;

      const result = Store.importAllData(_pendingImportData);
      if (result.success) {
        Store.logActivity('Import Completed', {
          admin: auth.getUserName(),
          message: `Data import completed (${counts[0]} equipments, ${counts[1]} borrows)`
        });
        Notification.show('Import Complete', 'Data has been imported successfully. All sections synchronized.');
        // Clear import state
        _pendingImportData = null;
        const input = document.getElementById('importFileInput');
        if (input) input.value = '';
        const nameEl = document.getElementById('importFileName');
        if (nameEl) nameEl.textContent = 'No file selected';
        const previewArea = document.getElementById('importPreviewArea');
        if (previewArea) previewArea.style.display = 'none';
        this.refreshAll();
      } else {
        Notification.show('Import Failed', result.message, 'error');
      }
    });

    // ===== CLEAR IMPORT =====
    document.getElementById('btnClearImport')?.addEventListener('click', () => {
      _pendingImportData = null;
      const input = document.getElementById('importFileInput');
      if (input) input.value = '';
      const nameEl = document.getElementById('importFileName');
      if (nameEl) nameEl.textContent = 'No file selected';
      const previewArea = document.getElementById('importPreviewArea');
      if (previewArea) previewArea.style.display = 'none';
    });

    // ===== IMPORT INDIVIDUAL SECTIONS =====
    document.getElementById('btnImportEquipments')?.addEventListener('click', () => this._importSection('equipments'));
    document.getElementById('btnImportBorrows')?.addEventListener('click', () => this._importSection('borrows'));
  }

  _importSection(section) {
    const input = document.getElementById('importFileInput');
    if (!input || !input.files || !input.files[0]) {
      Notification.show('No File', 'Please select a JSON file first.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate structure before proceeding
        const validation = Store._validateSectionData(section, data);
        if (!validation.valid) {
          Notification.show('Validation Failed', validation.message, 'error');
          return;
        }

        // Show preview and confirmation
        const labelMap = {
          equipments: 'equipment items',
          borrows: 'borrow records',
          students: 'registered students',
          activity: 'activity log entries',
          settings: 'system settings'
        };
        const keyMap = { equipments: 'equipments', borrows: 'borrowHistory', students: 'registeredStudents', activity: 'activityLog', settings: 'settings' };
        const key = keyMap[section];
        const count = section === 'settings' ? 1 : (data[key]?.length || 0);
        const label = labelMap[section] || section;

        if (!confirm(`Import ${count} ${label} into the system?\n\nThis will overwrite existing ${label} in the same section. Continue?`)) return;

        const result = Store.importSection(section, data);
        if (result.success) {
          Store.logActivity('Import Completed', {
            admin: auth.getUserName(),
            message: `Imported ${count} ${label} from file`
          });
          Notification.show('Import Complete', `${count} ${label} imported successfully.`);
          // Clear the file input after successful import
          input.value = '';
          this.refreshAll();
        } else {
          Notification.show('Import Failed', result.message, 'error');
        }
      } catch (err) {
        Notification.show('Invalid File', 'Could not parse JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(input.files[0]);
  }

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

    document.getElementById('settingSchoolName').value = settings.schoolName || '';
    document.getElementById('settingLabName').value = settings.labName || '';
    document.getElementById('settingOfficer').value = settings.officerName || '';
    document.getElementById('settingItemsPerPage').value = settings.itemsPerPage || '10';
    document.getElementById('settingAutoRefresh').value = settings.autoRefresh || '60';
    document.getElementById('adminProfileId').value = auth.currentUser?.id || '';

    this.applySettingsToUI(settings);

    // ===== SAVE SETTINGS =====
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
      this.setupActivityRefresh();
      Store.logActivity('Settings Updated', {
        admin: auth.getUserName(),
        message: 'System settings were updated'
      });
      Notification.show('Settings Saved', 'Configuration has been saved successfully.');
    });

    // ===== RESET SETTINGS TO DEFAULTS =====
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
      Store.logActivity('Settings Reset', {
        admin: auth.getUserName(),
        message: 'Settings restored to factory defaults'
      });
      Notification.show('Reset Complete', 'Settings restored to factory defaults.');
    });

    // ===== RESET DEMO DATA (with typing confirmation + auto backup) =====
    const resetDemoInput = document.getElementById('resetDemoConfirmInput');
    const btnResetDemo = document.getElementById('btnResetDemoData');

    const checkResetDemoConfirm = () => {
      const isValid = resetDemoInput?.value === 'RESET DEMO';
      if (btnResetDemo) btnResetDemo.disabled = !isValid;
      if (resetDemoInput) resetDemoInput.classList.toggle('valid', isValid);
    };

    resetDemoInput?.addEventListener('input', checkResetDemoConfirm);
    resetDemoInput?.addEventListener('focus', () => {
      if (resetDemoInput.value) checkResetDemoConfirm();
    });

    btnResetDemo?.addEventListener('click', async () => {
      if (resetDemoInput?.value !== 'RESET DEMO') return;

      // Auto backup before reset
      try {
        this._downloadBackup('COMLAB_Backup_BeforeReset');
        if (!confirm('Your backup has been downloaded. Do you still want to continue with the Reset Demo Data?')) {
          Notification.show('Cancelled', 'Reset Demo Data was cancelled. Your backup is safe.', 'error');
          return;
        }
      } catch (e) {
        if (!confirm('Could not create automatic backup. Do you want to continue anyway?')) return;
      }

      await Store.resetDemoDataKeepAdmins();
      await inventory.loadEquipments();
      this.refreshAll();

      // Reset the input
      if (resetDemoInput) resetDemoInput.value = '';
      checkResetDemoConfirm();

      Store.logActivity('Demo Data Reset', {
        admin: auth.getUserName(),
        message: 'Demo transaction data was reset (kept admin accounts & settings)'
      });
      Notification.show('Reset Complete', 'Demo data has been reset successfully. Admin accounts and settings preserved.');
    });

    // ===== FACTORY RESET (with typing confirmation + auto backup) =====
    const factoryInput = document.getElementById('factoryResetConfirmInput');
    const btnFactory = document.getElementById('btnFactoryReset');

    const checkFactoryConfirm = () => {
      const isValid = factoryInput?.value === 'FACTORY RESET';
      if (btnFactory) btnFactory.disabled = !isValid;
      if (factoryInput) factoryInput.classList.toggle('valid', isValid);
    };

    factoryInput?.addEventListener('input', checkFactoryConfirm);
    factoryInput?.addEventListener('focus', () => {
      if (factoryInput.value) checkFactoryConfirm();
    });

    btnFactory?.addEventListener('click', async () => {
      if (factoryInput?.value !== 'FACTORY RESET') return;

      // Auto backup before factory reset
      try {
        this._downloadBackup('COMLAB_Backup_BeforeFactoryReset');
        if (!confirm('⚠️ Your backup has been downloaded.\n\nThis is your LAST CHANCE to cancel.\n\nFactory Reset will DELETE EVERYTHING and restore the application to its original state.\n\nDo you still want to continue?')) {
          Notification.show('Cancelled', 'Factory Reset was cancelled. Your backup is safe.', 'error');
          return;
        }
      } catch (e) {
        if (!confirm('Could not create automatic backup. Do you want to continue with Factory Reset anyway?')) return;
      }

      await Store.factoryReset();
      await inventory.loadEquipments();
      this.refreshAll();

      // Reset the input
      if (factoryInput) factoryInput.value = '';
      checkFactoryConfirm();

      Store.logActivity('Factory Reset', {
        admin: auth.getUserName(),
        message: 'System was completely reset to factory defaults'
      });
      Notification.show('Factory Reset Complete', 'The system has been restored to its original installation state.');

      // Reload settings UI
      this.loadSettings();
    });

    // ===== ABOUT SECTION STATS =====
    this._updateAboutSection();
  }

  _updateAboutSection() {
    const equipCount = document.getElementById('aboutEquipCount');
    const studentCount = document.getElementById('aboutStudentCount');
    const borrowCount = document.getElementById('aboutBorrowCount');
    if (equipCount) equipCount.textContent = Store.getEquipments().filter(e => !e.archived).length;
    if (studentCount) studentCount.textContent = Store.getAllStudents().length;
    if (borrowCount) borrowCount.textContent = Store.getBorrowHistory().length;
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
  // Member/student search
  setTimeout(() => {
    const memberSearch = document.getElementById('memberStudentSearch');
    if (memberSearch) memberSearch.addEventListener('input', () => admin.renderMembers());
  }, 100);
});
