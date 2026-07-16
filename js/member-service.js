/* ============================================
   COMLAB System - Member Service v1
   Dedicated service for user management operations
   Uses centralized StorageManager for all persistence
   Every admin-only method begins with auth.requireAdmin()
   ============================================ */

class MemberServiceImpl {
  constructor() {
    this._cache = null;
  }

  // ===== GET ALL MEMBERS (read-only, no guard needed) =====
  getAllMembers() {
    return Store.getAllStudents().map(s => this._enrichMember(s, Store.getBorrowHistory()));
  }

  getRegisteredMembers() {
    return Store.getRegisteredStudents().map(s => this._enrichMember(s, Store.getBorrowHistory()));
  }

  getMember(id) {
    const s = Store.findStudent(id);
    return s ? this._enrichMember(s, Store.getBorrowHistory()) : null;
  }

  // ===== ENRICH MEMBER WITH COMPUTED FIELDS =====
  _enrichMember(s, history) {
    const borrows = history.filter(r => r.studentId === s.id);
    const active = borrows.filter(r => r.status === 'Pending' || r.status === 'Approved');
    const fullName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return {
      ...s,
      fullName: fullName || 'Unknown',
      initials: fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      borrowCount: borrows.length,
      activeCount: active.length,
      hasActiveBorrows: active.length > 0,
      status: s.accountStatus || 'Active',
      profilePic: s.profilePic || null,
      lastLogin: s.lastLogin || s.memberSince || s.registrationDate || null,
      displayStatus: active.length > 0 ? 'Borrowing' : (s.accountStatus === 'Suspended' ? 'Suspended' : 'Clear'),
      registrationDate: s.registrationDate || s.memberSince || s.dateAdded || null
    };
  }

  // ===== CHECK IF SEED STUDENT =====
  _isSeedStudent(id) {
    return (Store.get(STORAGE_KEYS.STUDENTS) || []).some(s => s.id === id);
  }

  // ===== ADMIN-ONLY: UPDATE MEMBER =====
  updateMember(id, updates) {
    if (!auth.requireAdmin()) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const result = Store.updateStudent(id, updates);
    if (result) {
      Store.logStudentActivity(id, 'Profile Updated', { admin: auth.getUserName(), message: 'Profile information was updated' });
      Store.logActivity('Member Updated', { admin: auth.getUserName(), message: `Updated profile for ${result.name || id}` });
    }
    return result;
  }

  // ===== ADMIN-ONLY: DELETE MEMBER =====
  deleteMember(id) {
    if (!auth.requireAdmin()) return { success: false, message: 'Access denied.' };
    const member = this.getMember(id);
    if (!member) return { success: false, message: 'Member not found.' };
    if (this._isSeedStudent(id)) { Notification.show('Cannot Remove', 'Demo student accounts cannot be removed.', 'error'); return { success: false, message: 'Cannot remove demo account.' }; }
    if (member.hasActiveBorrows) return { success: false, message: `${member.fullName} has active borrow requests. Complete them first.` };
    const updated = Store.getRegisteredStudents().filter(s => s.id !== id);
    Store.saveRegisteredStudents(updated);
    Store.logActivity('Member Deleted', { admin: auth.getUserName(), message: `Deleted member ${member.fullName} (${id})` });
    Store.logStudentActivity(id, 'Account Deleted', { admin: auth.getUserName(), message: 'Account was deleted by administrator' });
    return { success: true, message: `${member.fullName} has been removed.` };
  }

  // ===== ADMIN-ONLY: SUSPEND ACCOUNT =====
  suspendMember(id) {
    if (!auth.requireAdmin()) return null;
    if (!this.getMember(id)) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const result = Store.updateStudent(id, { accountStatus: 'Suspended', suspendedAt: new Date().toISOString(), suspendedBy: auth.getUserName() });
    if (result) {
      Store.logStudentActivity(id, 'Account Suspended', { admin: auth.getUserName(), message: 'Account was suspended by administrator' });
      Store.logActivity('Member Suspended', { admin: auth.getUserName(), message: `Suspended account for ${result.name || id}` });
    }
    return result;
  }

  // ===== ADMIN-ONLY: REACTIVATE ACCOUNT =====
  reactivateMember(id) {
    if (!auth.requireAdmin()) return null;
    if (!this.getMember(id)) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const result = Store.updateStudent(id, { accountStatus: 'Active', suspendedAt: null, suspendedBy: null });
    if (result) {
      Store.logStudentActivity(id, 'Account Reactivated', { admin: auth.getUserName(), message: 'Account was reactivated by administrator' });
      Store.logActivity('Member Reactivated', { admin: auth.getUserName(), message: `Reactivated account for ${result.name || id}` });
    }
    return result;
  }

  // ===== ADMIN-ONLY: RESET PASSWORD =====
  resetPassword(id) {
    if (!auth.requireAdmin()) return null;
    const member = this.getMember(id);
    if (!member) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const tempPassword = 'temp_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    Store.setPasswordOverride(id, tempPassword);
    Store.logStudentActivity(id, 'Password Reset', { admin: auth.getUserName(), message: 'Password was reset by administrator (temporary password generated)' });
    Store.logActivity('Password Reset', { admin: auth.getUserName(), message: `Reset password for ${member.fullName} (${id})` });
    return { password: tempPassword, member };
  }

  // ===== ADMIN-ONLY: PROFILE PICTURE =====
  uploadProfilePic(id, base64Data) {
    if (!auth.requireAdmin()) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const result = Store.updateStudent(id, { profilePic: base64Data });
    if (result) {
      Store.logStudentActivity(id, 'Profile Picture Changed', { admin: auth.getUserName(), message: 'Profile picture was updated' });
      Store.logActivity('Profile Picture Updated', { admin: auth.getUserName(), message: `Updated profile picture for ${result.name || id}` });
    }
    return result;
  }

  removeProfilePic(id) {
    if (!auth.requireAdmin()) return null;
    if (this._isSeedStudent(id)) { Notification.show('Cannot Modify', 'Demo accounts cannot be modified.', 'error'); return null; }
    const result = Store.updateStudent(id, { profilePic: null });
    if (result) Store.logStudentActivity(id, 'Profile Picture Removed', { admin: auth.getUserName(), message: 'Profile picture was removed' });
    return result;
  }

  // ===== GET ACTIVITY TIMELINE (read-only) =====
  getActivityTimeline(studentId) {
    return Store.getStudentActivity(studentId);
  }

  // ===== SEARCH, FILTER, SORT (read-only) =====
  searchMembers(members, query) {
    if (!query || !query.trim()) return members;
    const q = query.toLowerCase().trim();
    return members.filter(m =>
      m.fullName.toLowerCase().includes(q) ||
      (m.id && m.id.toLowerCase().includes(q)) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.section && m.section.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.contact && m.contact.toLowerCase().includes(q))
    );
  }

  filterMembers(members, filter) {
    if (!filter || filter === 'all') return members;
    switch (filter) {
      case 'active': return members.filter(m => m.status === 'Active' || !m.status);
      case 'suspended': return members.filter(m => m.status === 'Suspended' || m.status === 'Disabled');
      case 'borrowing': return members.filter(m => m.hasActiveBorrows);
      case 'no-borrows': return members.filter(m => m.borrowCount === 0);
      case 'recent': return members.filter(m => {
        if (!m.registrationDate) return false;
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(m.registrationDate) >= monthAgo;
      });
      default: return members;
    }
  }

  sortMembers(members, sortBy = 'name', asc = true) {
    const sorted = [...members].sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name': valA = a.fullName.toLowerCase(); valB = b.fullName.toLowerCase(); break;
        case 'id': valA = a.id || ''; valB = b.id || ''; break;
        case 'newest': return (asc ? -1 : 1) * (new Date(a.registrationDate || 0) - new Date(b.registrationDate || 0));
        case 'oldest': return (asc ? 1 : -1) * (new Date(a.registrationDate || 0) - new Date(b.registrationDate || 0));
        default: valA = a.fullName.toLowerCase(); valB = b.fullName.toLowerCase();
      }
      if (typeof valA === 'string') return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return asc ? valA - valB : valB - valA;
    });
    return sorted;
  }

  // ===== PROFILE PICTURE HTML HELPER =====
  getProfilePicHTML(pic, name, size = 60) {
    if (pic && pic.startsWith('data:')) {
      return `<img src="${pic}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" />`;
    }
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--gradient-1);display:flex;align-items:center;justify-content:center;color:white;font-size:${size * 0.4}px;font-weight:700;flex-shrink:0;">${initials}</div>`;
  }

  // ===== DASHBOARD STATS =====
  getMemberDashboardStats() {
    return Store.getStudentStats();
  }
}

// Global instance — rename to MemberService so other scripts see the instance, not the class
const MemberService = new MemberServiceImpl();
