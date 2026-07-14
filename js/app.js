/* ============================================
   COMPUTER LABORATORY BORROWING SYSTEM
   Main Application Entry
   ============================================ */

// ===== APPLICATION CONTROLLER =====
const App = {
  initialized: false,

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('🔧 COMLAB System Initializing...');

    try {
      await inventory.loadEquipments();
      console.log(`✅ Loaded ${inventory.equipments.length} equipments`);
      console.log(`📊 Stats:`, inventory.getStats());
    } catch (error) {
      console.warn('⚠️ Using fallback equipment data');
    }

    console.log('🚀 COMLAB System Ready');
  }
};

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
