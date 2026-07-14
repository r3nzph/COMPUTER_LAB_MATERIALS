/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Authentication Module - v3
   ============================================ */

class AuthSystem {
  constructor() {
    this.students = [];        // from JSON seed
    this.registered = [];      // from localStorage
    this.admins = [];
    this.currentUser = JSON.parse(localStorage.getItem('comlabUser')) || null;
    this.init();
  }

  async init() {
    await this.loadAccounts();
    this.mergeUsers();
    this.setupLoginModal();
    this.setupRegisterModal();
    this.updateUI();
    this.applyRoleRedirects();
  }

  // ===== LOAD ACCOUNTS =====
  async loadAccounts() {
    try {
      const [studRes, adminRes] = await Promise.all([
        fetch('json/students.json'),
        fetch('json/admins.json')
      ]);
      this.students = await studRes.json();
      this.admins = await adminRes.json();
    } catch (e) {
      console.warn('Auth: Using fallback accounts');
      this.students = [
        { id: 'TUP-23-1001', name: 'Juan Dela Cruz', course: 'BSIT', year: '2nd Year', password: 'student123' },
        { id: 'TUP-23-1002', name: 'Maria Santos', course: 'BSCS', year: '3rd Year', password: 'student123' }
      ];
      this.admins = [{ id: 'ADMIN001', name: 'Laboratory Officer', password: 'admin123' }];
    }
  }

  // ===== MERGE JSON + LOCALSTORAGE USERS =====
  mergeUsers() {
    const saved = JSON.parse(localStorage.getItem('registeredStudents')) || [];
    this.registered = saved;
  }

  getAllStudents() {
    return [...this.students, ...this.registered];
  }

  saveRegisteredStudents() {
    localStorage.setItem('registeredStudents', JSON.stringify(this.registered));
  }

  // ===== REGISTER =====
  register(data) {
    // Validate unique ID
    const allStudents = this.getAllStudents();
    if (allStudents.find(s => s.id === data.id)) {
      return { success: false, message: 'TUP Student ID already exists.' };
    }

    const newStudent = {
      id: data.id,
      firstName: data.firstName,
      middleName: data.middleName || '',
      lastName: data.lastName,
      name: `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`,
      course: data.course,
      year: data.year,
      section: data.section,
      email: data.email,
      contact: data.contact,
      password: data.password,
      registeredAt: new Date().toISOString(),
      borrowCount: 0,
      memberSince: new Date().toISOString()
    };

    this.registered.unshift(newStudent);
    this.saveRegisteredStudents();
    return { success: true, message: 'Registration Successful!' };
  }

  // ===== LOGIN STUDENT =====
  loginStudent(studentId, password) {
    const allStudents = this.getAllStudents();
    const student = allStudents.find(s => s.id === studentId && s.password === password);
    if (!student) return { success: false, message: 'Invalid Student ID or password.' };

    // Sync borrow count with actual records
    const actualBorrows = inventory.borrowHistory.filter(r => r.studentId === studentId).length;
    this.currentUser = {
      type: 'student',
      id: student.id,
      name: student.name || `${student.firstName} ${student.lastName}`,
      course: student.course,
      year: student.year,
      section: student.section || '',
      email: student.email || '',
      contact: student.contact || '',
      memberSince: student.memberSince || student.registeredAt || new Date().toISOString(),
      borrowCount: actualBorrows || student.borrowCount || 0
    };
    this.saveSession();
    this.updateUI();
    return { success: true };
  }

  // ===== LOGIN ADMIN =====
  loginAdmin(adminId, password) {
    const admin = this.admins.find(a => a.id === adminId && a.password === password);
    if (!admin) return { success: false, message: 'Invalid Admin ID or password.' };

    this.currentUser = {
      type: 'admin',
      id: admin.id,
      name: admin.name
    };
    this.saveSession();
    this.updateUI();
    setTimeout(() => { window.location.href = 'admin.html'; }, 300);
    return { success: true };
  }

  // ===== LOGOUT =====
  logout() {
    this.currentUser = null;
    localStorage.removeItem('comlabUser');
    this.updateUI();
    Notification.show('Logged Out', 'You have been logged out successfully.', 'success');
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html') || window.location.pathname.includes('stocks.html')) {
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    }
  }

  saveSession() {
    localStorage.setItem('comlabUser', JSON.stringify(this.currentUser));
  }

  // ===== UPDATE PROFILE =====
  updateStudentProfile(data) {
    if (!this.isLoggedIn() || !this.isStudent()) {
      return { success: false, message: 'Please log in first.' };
    }

    // Update currentUser (session)
    this.currentUser.name = data.name || this.currentUser.name;
    this.currentUser.email = data.email || '';
    this.currentUser.contact = data.contact || '';
    this.currentUser.section = data.section || '';
    this.currentUser.course = data.course || this.currentUser.course;
    this.currentUser.year = data.year || this.currentUser.year;
    if (data.avatar) this.currentUser.avatar = data.avatar;
    this.saveSession();

    // Also update in registeredStudents if they registered via the system
    const idx = this.registered.findIndex(r => r.id === this.currentUser.id);
    if (idx !== -1) {
      this.registered[idx].name = this.currentUser.name;
      this.registered[idx].email = this.currentUser.email;
      this.registered[idx].contact = this.currentUser.contact;
      this.registered[idx].section = this.currentUser.section;
      this.registered[idx].course = this.currentUser.course;
      this.registered[idx].year = this.currentUser.year;
      this.saveRegisteredStudents();
    }

    return { success: true, message: 'Profile updated successfully!' };
  }

  isLoggedIn() { return this.currentUser !== null; }
  isAdmin() { return this.currentUser?.type === 'admin'; }
  isStudent() { return this.currentUser?.type === 'student'; }
  getUserName() { return this.currentUser?.name || 'Guest'; }

  getUserInitials() {
    const name = this.getUserName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatar() {
    return this.currentUser?.avatar || null;
  }

  setAvatarImage(element) {
    const avatar = this.getAvatar();
    if (!element) return;
    if (avatar) {
      element.style.backgroundImage = `url(${avatar})`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
      element.textContent = '';
    } else {
      element.style.backgroundImage = '';
      element.textContent = this.getUserInitials();
    }
  }

  getCurrentStudentId() {
    return this.currentUser?.id || null;
  }

  // ===== APPLY ROLE-BASED REDIRECTS =====
  applyRoleRedirects() {
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // Stocks: admin only
    if (path === 'stocks.html' || path === 'stocks') {
      if (!this.isLoggedIn() || !this.isAdmin()) {
        Notification.show('Access Denied', 'Administrator access only.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      }
    }

    // History: must be logged in (student or admin can see history.html)
    if (path === 'history.html' || path === 'history') {
      if (!this.isLoggedIn()) {
        Notification.show('Access Denied', 'Please log in to view history.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      }
    }

    // Profile: must be logged in student
    if (path === 'profile.html' || path === 'profile') {
      if (!this.isLoggedIn() || !this.isStudent()) {
        Notification.show('Access Denied', 'Please log in as a student.', 'error');
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      }
    }
  }

  // ===== ROLE-BASED NAV =====
  getNavLinks() {
    const path = window.location.pathname.split('/').pop() || 'index.html';

    if (!this.isLoggedIn()) {
      // Guest nav
      const links = [
        { href: 'index.html', label: 'Home', icon: 'fas fa-home' },
        { href: 'equipments.html', label: 'Equipments', icon: 'fas fa-tools' },
        { href: 'members.html', label: 'Contact', icon: 'fas fa-envelope' }
      ];
      return links.map(l => ({ ...l, active: l.href === path }));
    }

    if (this.isAdmin()) {
      // Admin nav
      const links = [
        { href: 'admin.html', label: 'Dashboard', icon: 'fas fa-chart-pie' },
        { href: 'equipments.html', label: 'Equipments', icon: 'fas fa-tools' },
        { href: 'stocks.html', label: 'Stocks', icon: 'fas fa-boxes' },
        { href: 'members.html', label: 'Members', icon: 'fas fa-users' },
        { href: 'history.html', label: 'History', icon: 'fas fa-history' }
      ];
      return links.map(l => ({ ...l, active: (l.href === path) }));
    }

    // Student nav
    const links = [
      { href: 'index.html', label: 'Home', icon: 'fas fa-home' },
      { href: 'equipments.html', label: 'Equipments', icon: 'fas fa-tools' },
      { href: 'borrow.html', label: 'Borrow', icon: 'fas fa-clipboard-list' },
      { href: 'history.html', label: 'My History', icon: 'fas fa-history' },
      { href: 'profile.html', label: 'Profile', icon: 'fas fa-user' }
    ];
    return links.map(l => ({ ...l, active: l.href === path }));
  }

  // ===== SETUP REGISTER MODAL =====
  setupRegisterModal() {
    const registerBtn = document.getElementById('registerBtn');
    const registerModal = document.getElementById('registerModal');
    const registerClose = document.getElementById('registerClose');
    const registerForm = document.getElementById('registerForm');
    const loginModal = document.getElementById('loginModal');

    if (!registerModal) return;

    registerBtn?.addEventListener('click', () => {
      if (loginModal) loginModal.classList.remove('active');
      registerModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeReg = () => {
      registerModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    registerClose?.addEventListener('click', closeReg);
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) closeReg();
    });

    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);

      const firstName = fd.get('firstName')?.trim();
      const lastName = fd.get('lastName')?.trim();
      const studentId = fd.get('regStudentId')?.trim();
      const course = fd.get('course')?.trim();
      const year = fd.get('year')?.trim();
      const section = fd.get('section')?.trim();
      const email = fd.get('email')?.trim();
      const contact = fd.get('contact')?.trim();
      const password = fd.get('regPassword');
      const confirmPass = fd.get('regConfirmPassword');
      const middleName = fd.get('middleName')?.trim();

      // Validations
      if (!firstName || !lastName || !studentId || !course || !year || !section || !email || !contact || !password || !confirmPass) {
        this.showRegError('Please fill in all required fields.');
        return;
      }

      if (password !== confirmPass) {
        this.showRegError('Passwords do not match.');
        return;
      }

      if (!/^TUP-\d{2}-\d{4}$/i.test(studentId)) {
        this.showRegError('Student ID must be in format: TUP-XX-XXXX');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showRegError('Please enter a valid email address.');
        return;
      }

      if (!/^\+?[\d\s-]{10,15}$/.test(contact)) {
        this.showRegError('Please enter a valid contact number.');
        return;
      }

      const result = this.register({
        id: studentId.toUpperCase(),
        firstName,
        middleName,
        lastName,
        course,
        year,
        section,
        email,
        contact,
        password
      });

      if (result.success) {
        this.showModal('Registration Successful! 🎉', 'You can now log in with your Student ID.', 'success');
        registerForm.reset();
        closeReg();
        // Open login modal after a delay
        setTimeout(() => {
          const loginM = document.getElementById('loginModal');
          if (loginM) loginM.classList.add('active');
        }, 1000);
      } else {
        this.showRegError(result.message);
      }
    });
  }

  showRegError(message) {
    const el = document.getElementById('registerError');
    if (el) { el.textContent = message; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 3000); }
  }

  // ===== SETUP LOGIN MODAL =====
  setupLoginModal() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const loginClose = document.getElementById('loginClose');
    const loginTabs = document.querySelectorAll('.login-tab');
    const loginForms = document.querySelectorAll('.login-form');
    const studentLoginForm = document.getElementById('studentLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');

    if (!loginModal) return;

    loginBtn?.addEventListener('click', () => {
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    loginClose?.addEventListener('click', closeModal);
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) closeModal();
    });

    loginTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        loginTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loginForms.forEach(f => f.classList.remove('active'));
        const form = document.getElementById(tab.dataset.tab + 'LoginForm');
        if (form) form.classList.add('active');
      });
    });

    studentLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('studentId')?.value.trim();
      const password = document.getElementById('studentPassword')?.value;
      if (!id || !password) { this.showLoginError('Please fill in all fields.'); return; }

      const result = this.loginStudent(id, password);
      if (result.success) {
        closeModal();
        studentLoginForm.reset();
        Notification.show('Welcome!', `Logged in as ${this.currentUser.name}`, 'success');
      } else {
        this.showLoginError(result.message);
      }
    });

    adminLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('adminId')?.value.trim();
      const password = document.getElementById('adminPassword')?.value;
      if (!id || !password) { this.showLoginError('Please fill in all fields.'); return; }

      const result = this.loginAdmin(id, password);
      if (result.success) {
        closeModal();
        adminLoginForm.reset();
      } else {
        this.showLoginError(result.message);
      }
    });
  }

  showLoginError(message) {
    const el = document.querySelector('.login-form.active .login-error');
    if (el) { el.textContent = message; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 3000); }
    else { Notification.show('Login Failed', message, 'error'); }
  }

  showModal(title, message, type = 'success') {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.querySelector('.modal-icon').className = `modal-icon ${type === 'error' ? 'error' : ''}`;
    overlay.querySelector('.modal-icon').innerHTML = type === 'error' ? '✕' : '✓';
    overlay.querySelector('.modal-title').textContent = title;
    overlay.querySelector('.modal-message').innerHTML = message;
    overlay.classList.add('active');
    overlay.querySelector('.modal-btn').onclick = () => overlay.classList.remove('active');
  }

  // ===== UPDATE NAV UI =====
  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    const userLogout = document.getElementById('userLogout');

    if (this.isLoggedIn()) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (navUser) {
        navUser.style.display = 'flex';
        if (userName) userName.textContent = this.getUserName();
        this.setAvatarImage(userInitials);
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      if (navUser) navUser.style.display = 'none';
    }

    // Re-render nav links based on role
    this.renderRoleNav();
    userLogout?.addEventListener('click', () => this.logout());
  }

  renderRoleNav() {
    const container = document.getElementById('roleNav');
    if (!container) return;
    const links = this.getNavLinks();
    container.innerHTML = links.map(l =>
      `<li><a href="${l.href}" class="${l.active ? 'active' : ''}"><i class="${l.icon}" style="margin-right:4px;font-size:0.75rem;"></i> ${l.label}</a></li>`
    ).join('');
  }
}

// ===== GLOBAL INSTANCE =====
const auth = new AuthSystem();
