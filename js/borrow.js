/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Borrow Form Handling
   ============================================ */

class BorrowManager {
  constructor() {
    this.currentEquipment = null;
    this.init();
  }

  init() {
    this.setupEquipmentSelect();
    this.setupFormSubmission();
    this.setupAutoFee();
    this.setupAddToBorrowButtons();
    this.setupEquipDetails();
  }

  // ===== SETUP EQUIPMENT SELECT =====
  async setupEquipmentSelect() {
    const select = document.getElementById('equipment');
    if (!select) return;

    await inventory.loadEquipments();

    select.innerHTML = '<option value="">Select Equipment</option>' +
      inventory.equipments
        .filter((e) => e.stocks > 0)
        .map(
          (e) =>
            `<option value="${e.id}" data-fee="${e.borrowFee}" data-stocks="${e.stocks}">
              ${e.name} - ₱${e.borrowFee} (${e.stocks} left)
            </option>`
        )
        .join('');
  }

  // ===== SETUP AUTO FEE COMPUTATION =====
  setupAutoFee() {
    const select = document.getElementById('equipment');
    const feeDisplay = document.getElementById('borrowFee');
    const equipmentName = document.getElementById('equipmentName');

    if (!select || !feeDisplay) return;

    select.addEventListener('change', () => {
      const selectedOption = select.options[select.selectedIndex];
      if (selectedOption && selectedOption.value) {
        const fee = selectedOption.dataset.fee;
        const name = selectedOption.text.split(' - ')[0];
        if (feeDisplay) feeDisplay.textContent = `₱${fee}`;
        if (equipmentName) equipmentName.value = name;
      } else {
        if (feeDisplay) feeDisplay.textContent = '₱0';
        if (equipmentName) equipmentName.value = '';
      }
    });
  }

  // ===== SETUP ADD TO BORROW BUTTONS =====
  setupAddToBorrowButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-borrow');
      if (!btn) return;

      // Require login before borrowing
      if (!auth.isLoggedIn() || !auth.isStudent()) {
        const modal = document.getElementById('loginRequiredModal');
        if (modal) modal.classList.add('active');
        return;
      }

      const equipmentId = parseInt(btn.dataset.id);
      const equipment = inventory.getEquipment(equipmentId);
      if (!equipment) return;

      if (equipment.stocks <= 0) {
        Notification.show('Out of Stock', `${equipment.name} is currently out of stock.`, 'error');
        return;
      }

      // Redirect to borrow page with equipment pre-selected
      window.location.href = `borrow.html?equipment=${equipmentId}`;
    });
  }

  // ===== SETUP FORM SUBMISSION =====
  setupFormSubmission() {
    const form = document.getElementById('borrowForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Require login before borrowing
      if (!auth.isLoggedIn() || !auth.isStudent()) {
        const modal = document.getElementById('loginRequiredModal');
        if (modal) modal.classList.add('active');
        else Notification.show('Login Required', 'You must sign in as a student to borrow equipment.', 'error');
        return;
      }

      const formData = new FormData(form);
      const studentName = formData.get('studentName')?.trim();
      const officer = formData.get('officer')?.trim();
      const equipmentId = parseInt(formData.get('equipment'));
      const pickupDate = formData.get('pickupDate');
      const returnDate = formData.get('returnDate');
      const purpose = formData.get('purpose')?.trim();
      const remarks = formData.get('remarks')?.trim();

      // Validation
      if (!studentName || !officer || !equipmentId || !pickupDate || !returnDate || !purpose) {
        this.showModal('Error', 'Please fill in all required fields.', 'error');
        return;
      }

      if (new Date(returnDate) <= new Date(pickupDate)) {
        this.showModal('Invalid Dates', 'Return date must be after pickup date.', 'error');
        return;
      }

      const equipment = inventory.getEquipment(equipmentId);
      if (!equipment) {
        this.showModal('Error', 'Selected equipment not found.', 'error');
        return;
      }

      const fee = equipment.borrowFee;

      // Confirm borrowing - include studentId if logged in
      const studentId = auth.isLoggedIn() && auth.isStudent() ? auth.getCurrentStudentId() : null;
      const result = inventory.borrowItem(
        studentName, studentId, officer, equipmentId, fee,
        pickupDate, returnDate, purpose, remarks
      );

      if (result.success) {
        this.showModal(
          'Borrow Successful! 🎉',
          `You have successfully borrowed <strong>${equipment.name}</strong>.<br>
           Borrow ID: <strong>${result.data.id}</strong><br>
           Fee: <strong>₱${fee}</strong>`,
          'success'
        );
        form.reset();
        const feeDisplay = document.getElementById('borrowFee');
        if (feeDisplay) feeDisplay.textContent = '₱0';
        this.setupEquipmentSelect(); // Refresh stock options
      } else {
        this.showModal('Error', result.message, 'error');
      }
    });
  }

  // ===== EQUIPMENT DETAILS PANEL =====
  setupEquipDetails() {
    const select = document.getElementById('equipment');
    const panel = document.getElementById('equipDetailsPanel');
    const stockDisplay = document.getElementById('availableStock');
    if (!select || !panel) return;

    select.addEventListener('change', () => {
      const id = parseInt(select.value);
      if (!id) {
        panel.innerHTML = `<div style="text-align:center;padding:2rem 0;color:var(--text-light);">
          <i class="fas fa-tools" style="font-size:3rem;margin-bottom:1rem;opacity:0.3;"></i>
          <p>Select an equipment to see details here.</p></div>`;
        if (stockDisplay) stockDisplay.textContent = '—';
        return;
      }
      const equip = inventory.getEquipment(id);
      if (!equip) return;

      if (stockDisplay) stockDisplay.textContent = equip.stocks + ' available';

      const isCustomImg = equip.imagePath && equip.imagePath.startsWith('data:');
      const fallbackSvg = SVG.getEquipIconHTML(equip.category, 30);
      const defaultImg = SVG.getEquipImagePath(equip.name, equip);
      const equipImgHtml = isCustomImg
        ? `<img src="${SVG.getEquipImagePath(equip.name, equip)}" alt="${equip.name}" style="width:60px;height:60px;object-fit:cover;border-radius:14px;" onerror="this.onerror=null;this.parentNode.innerHTML='${SVG._getFallbackHTML(equip.name, 60).replace(/"/g, "'").replace(/'/g, "\\'")}';" />`
        : `<div style="width:60px;height:60px;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;background:rgba(var(--primary-rgb),0.07);">
            <img src="${defaultImg}" alt="${equip.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.style.display='none';this.parentNode.innerHTML='${SVG.getEquipIconHTML(equip.category, 30)}';this.parentNode.style.background='rgba(var(--primary-rgb),0.07)';" />
          </div>`;
      panel.innerHTML = `
        <div style="text-align:center;">
          ${equipImgHtml}
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.3rem;">${equip.name}</h3>
          <span class="category-tag" style="margin-bottom:0.8rem;display:inline-block;">${equip.category}</span>
          <div style="display:flex;justify-content:center;gap:2rem;margin:1rem 0;">
            <div><div style="font-size:1.5rem;font-weight:800;color:var(--primary);">₱${equip.borrowFee}</div><div style="font-size:0.75rem;color:var(--text-light);">Borrow Fee</div></div>
            <div><div style="font-size:1.5rem;font-weight:800;color:${equip.stocks <= 3 ? 'var(--danger)' : 'var(--success)'};">${equip.stocks}</div><div style="font-size:0.75rem;color:var(--text-light);">In Stock</div></div>
          </div>
          <span class="status-badge ${inventory.getStatusClass(equip.status)}">
            <span class="status-dot"></span> ${equip.status}
          </span>
        </div>
      `;
    });
  }

  // ===== SHOW MODAL =====
  showModal(title, message, type = 'success') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    const modalIcon = overlay.querySelector('.modal-icon');
    const modalTitle = overlay.querySelector('.modal-title');
    const modalMessage = overlay.querySelector('.modal-message');
    const modalBtn = overlay.querySelector('.modal-btn');

    modalIcon.className = `modal-icon ${type === 'error' ? 'error' : ''}`;
    modalIcon.innerHTML = type === 'error' ? '✕' : '✓';
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    overlay.classList.add('active');

    modalBtn.onclick = () => {
      overlay.classList.remove('active');
    };
  }

  // ===== PARSE URL PARAMS =====
  getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // ===== PRE-SELECT EQUIPMENT FROM URL =====
  async preselectEquipment() {
    const equipmentId = this.getUrlParam('equipment');
    if (!equipmentId) return;

    const select = document.getElementById('equipment');
    if (!select) return;

    // Wait for options to load
    await this.setupEquipmentSelect();

    select.value = equipmentId;
    // Trigger change event
    select.dispatchEvent(new Event('change'));
  }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async () => {
  const borrowManager = new BorrowManager();

  // Handle equipment pre-selection on borrow page
  if (window.location.pathname.includes('borrow.html') || window.location.pathname.endsWith('borrow')) {
    await inventory.loadEquipments();
    await borrowManager.preselectEquipment();
  }

  // Handle stocks page
  if (window.location.pathname.includes('stocks') || window.location.pathname.endsWith('stock')) {
    await inventory.loadEquipments();
    const stats = inventory.getStats();

    const updateStat = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value.toLocaleString();
      // Also update counters
      const counter = document.querySelector(`#${id} .counter`);
      if (counter) {
        counter.setAttribute('data-target', value);
        counter.textContent = '0';
      }
    };

    updateStat('totalEquipments', stats.total);
    updateStat('availableCount', stats.available);
    updateStat('borrowedCount', stats.borrowed);
    updateStat('lowStockCount', stats.lowStockCount);

    // Re-init counter animations
    if (window.CounterAnimation) {
      new CounterAnimation();
    }
  }

  // Handle members page
  if (window.location.pathname.includes('members') || window.location.pathname.endsWith('member')) {
    // Members are rendered directly in HTML, no action needed
  }

  // Handle history page
  if (window.location.pathname.includes('history')) {
    const historyTable = document.getElementById('historyTable');
    if (historyTable) {
      const tbody = historyTable.querySelector('tbody');
      const history = inventory.borrowHistory;

      if (history.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="text-align:center;padding:3rem;color:var(--text-secondary);">
              No borrowing history yet.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = history.map((record) => `
          <tr>
            <td><strong>${record.id}</strong></td>
            <td>${record.studentName}</td>
            <td>${record.officer}</td>
            <td>${record.equipment}</td>
            <td>₱${record.fee}</td>
            <td>${new Date(record.borrowDate).toLocaleDateString()}</td>
            <td>${new Date(record.returnDate).toLocaleDateString()}</td>
            <td>
              <span class="status-pill ${record.status === 'Pending' ? 'pending' : record.status === 'Returned' ? 'returned' : 'approved'}">
                ${record.status}
              </span>
            </td>
            <td>
              ${record.status === 'Pending'
                ? `<button class="btn-return" data-id="${record.id}" style="padding:0.3rem 0.8rem;background:var(--success);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">Return</button>`
                : '<span style="color:var(--text-light);font-size:0.8rem;">Completed</span>'
              }
            </td>
          </tr>
        `).join('');

        // Return button handler
        tbody.querySelectorAll('.btn-return').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (confirm('Mark this item as returned?')) {
              inventory.returnItem(btn.dataset.id);
              btn.closest('tr').querySelector('.status-pill').className = 'status-pill returned';
              btn.closest('td').innerHTML = '<span style="color:var(--text-light);font-size:0.8rem;">Returned</span>';
              Notification.show('Item Returned', 'Equipment stock has been updated.', 'success');
            }
          });
        });
      }
    }

    // Table search
    const historySearch = document.getElementById('historySearch');
    historySearch?.addEventListener('input', (e) => {
      const text = e.target.value.toLowerCase();
      const rows = historyTable?.querySelectorAll('tbody tr');
      rows?.forEach((row) => {
        const match = row.textContent.toLowerCase().includes(text);
        row.style.display = match ? '' : 'none';
      });
    });

    // Table status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter?.addEventListener('change', (e) => {
      const value = e.target.value;
      const rows = historyTable?.querySelectorAll('tbody tr');
      rows?.forEach((row) => {
        if (!value || value === 'all') {
          row.style.display = '';
          return;
        }
        const statusCell = row.querySelector('.status-pill');
        const match = statusCell?.textContent.toLowerCase() === value;
        row.style.display = match ? '' : 'none';
      });
    });
  }
});
