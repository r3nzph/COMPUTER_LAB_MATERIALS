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
      // Load equipment data
      await inventory.loadEquipments();
      console.log(`✅ Loaded ${inventory.equipments.length} equipments`);
      console.log(`📊 Stats:`, inventory.getStats());
    } catch (error) {
      console.warn('⚠️ Using fallback equipment data');
    }

    // Initialize typing effect on homepage
    this.initTypingEffect();

    console.log('🚀 COMLAB System Ready');
  },

  initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;

    const texts = [
      'Borrowing System',
      'Equipment Tracker',
      'Lab Management',
      'Inventory System'
    ];

    new TypeWriter(typingElement, texts, {
      speed: 80,
      deleteSpeed: 40,
      pauseEnd: 2000,
      pauseStart: 800
    });
  }
};

// ===== START APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
