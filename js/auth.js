/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Authentication Module
   ============================================ */

class AuthSystem {
  constructor() {
    this.students = [];
    this.admins = [];
    this.currentUser = JSON.parse(localStorage.getItem('comlabUser')) || null;
    this.init();
  }

  async init() {
    await this.loadAccounts();
    this.setupLoginModal();
    this.updateUI();
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
      this.admins = [
        { id: 'ADMIN001', name: 'Laboratory Officer', password: 'admin123' }
      ];
    }
  }

  // ===== LOGIN STUDENT =====
  loginStudent(studentId, password) {
    const student = this.students.find(s => s.id === studentId && s.password === password);
    if (!student) return { success: false, message: 'Invalid Student ID or password.' };

    this.currentUser = {
      type: 'student',
      id: student.id,
      name: student.name,
      course: student.course,
      year: student.year
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

    // Redirect to admin dashboard
    window.location.href = 'admin.html';
    return { success: true };
  }

  // ===== LOGOUT =====
  logout() {
    this.currentUser = null;
    localStorage.removeItem('comlabUser');
    this.updateUI();
    Notification.show('Logged Out', 'You have been logged out successfully.', 'success');
  }

  // ===== SAVE SESSION =====
  saveSession() {
    localStorage.setItem('comlabUser', JSON.stringify(this.currentUser));
  }

  // ===== IS LOGGED IN =====
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // ===== IS ADMIN =====
  isAdmin() {
    return this.currentUser?.type === 'admin';
  }

  // ===== GET USER NAME =====
  getUserName() {
    return this.currentUser?.name || 'Guest';
  }

  // ===== GET USER INITIALS =====
  getUserInitials() {
    const name = this.getUserName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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

    // Open modal
    loginBtn?.addEventListener('click', () => {
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Close modal
    const closeModal = () => {
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    loginClose?.addEventListener('click', closeModal);
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) closeModal();
    });

    // Tab switching
    loginTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        loginTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loginForms.forEach(f => f.classList.remove('active'));
        const form = document.getElementById(tab.dataset.tab + 'Form');
        if (form) form.classList.add('active');
      });
    });

    // Student login
    studentLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('studentId')?.value.trim();
      const password = document.getElementById('studentPassword')?.value;

      if (!id || !password) {
        this.showLoginError('Please fill in all fields.');
        return;
      }

      const result = this.loginStudent(id, password);
      if (result.success) {
        closeModal();
        studentLoginForm.reset();
        Notification.show('Welcome!', `Logged in as ${this.currentUser.name}`, 'success');
      } else {
        this.showLoginError(result.message);
      }
    });

    // Admin login
    adminLoginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('adminId')?.value.trim();
      const password = document.getElementById('adminPassword')?.value;

      if (!id || !password) {
        this.showLoginError('Please fill in all fields.');
        return;
      }

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
    const errorEl = document.querySelector('.login-form.active .login-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      setTimeout(() => { errorEl.style.display = 'none'; }, 3000);
    } else {
      Notification.show('Login Failed', message, 'error');
    }
  }

  // ===== UPDATE UI =====
  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    const userLogout = document.getElementById('userLogout');

    if (this.isLoggedIn()) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (navUser) {
        navUser.style.display = 'flex';
        if (userName) userName.textContent = this.getUserName();
        if (userInitials) userInitials.textContent = this.getUserInitials();
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (navUser) navUser.style.display = 'none';
    }

    // Logout handler
    userLogout?.addEventListener('click', () => this.logout());
  }
}

// ===== GLOBAL INSTANCE =====
const auth = new AuthSystem();
