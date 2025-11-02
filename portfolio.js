// ====== SELECT ELEMENTS ======
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const navLinks = document.querySelectorAll('.nav-link');

// ====== SIDEBAR FUNCTIONALITY ======
function openSidebar() {
  sidebar.classList.add('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ====== EVENT LISTENERS ======
menuToggle.addEventListener('click', openSidebar);
closeBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// ====== NAVIGATION ======
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    // Remove active from all links
    navLinks.forEach(item => item.classList.remove('active'));
    // Add active to clicked link
    link.classList.add('active');
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  });
});

// ====== CLUB DROPDOWNS ======
const clubToggles = document.querySelectorAll('.club-toggle');

clubToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const club = toggle.parentElement;
    const isActive = club.classList.contains('active');
    
    // Close all clubs first
    clubToggles.forEach(other => {
      other.parentElement.classList.remove('active');
    });
    
    // Open clicked club if it wasn't active
    if (!isActive) {
      club.classList.add('active');
    }
  });
});

// ====== ART GALLERY TABS ======
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    
    // Remove active from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active to clicked button and corresponding content
    button.classList.add('active');
    const targetContent = document.getElementById(targetTab);
    if (targetContent) {
      targetContent.classList.add('active');
    }
  });
});

// ====== IMAGE MODAL FUNCTIONALITY ======
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const closeModal = document.querySelector('.close-modal');

// Open modal when gallery image is clicked
document.addEventListener('click', (e) => {
  if (e.target.closest('.gallery-item')) {
    const galleryItem = e.target.closest('.gallery-item');
    const img = galleryItem.querySelector('img');
    const title = galleryItem.querySelector('.image-title');
    const description = galleryItem.querySelector('.image-description');
    
    if (img && title && description) {
      modalImage.src = img.src;
      modalImage.alt = img.alt;
      modalTitle.textContent = title.textContent;
      modalDescription.textContent = description.textContent;
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }
});

// Close modal functionality
closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
  document.body.style.overflow = '';
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
});

// ====== AUTO-SCROLL TO TOP ON PAGE LOAD ======
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// ====== RESET WHEN WINDOW RESIZES ======
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});