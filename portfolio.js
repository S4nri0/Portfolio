// ============================================================
// SIDEBAR DRAWER (mobile) — toggles open/closed
// ============================================================
const menuToggle = document.getElementById('menuToggle');
const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('overlay');

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

// Hamburger toggles — press again to close
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('active')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (overlay) overlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 900) closeSidebar();
  });
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeSidebar();
});

window.addEventListener('load', () => window.scrollTo(0, 0));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
});


/* ============================================================
   CHAT WIDGET — Firebase Firestore
   ============================================================ */

window.addEventListener('firebase-ready', () => {

  // ---------- Config ----------
  const ADMIN_PASSWORD = 'maggie303';   // ← CHANGE THIS
  const COLLECTION_NAME = 'messages';
  const MAX_MESSAGES = 50;

  const BANNED_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'bastard',
    'damn', 'crap', 'dick', 'piss', 'slut', 'whore','nigga','nigger','faggot','kys','kill yourself','chopped','negro','monkey','gorilla'
  ];

  // ---------- Firebase refs ----------
  const {
    db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
  } = window.firebaseChat;

  const messagesCollection = collection(db, COLLECTION_NAME);
  const messagesQuery = query(messagesCollection, orderBy('time', 'desc'));

  // ---------- Elements ----------
  const toggle     = document.getElementById('chatToggle');
  const panel      = document.getElementById('chatPanel');
  const chatOverlay = document.getElementById('chatOverlay');
  const exitBtn    = document.getElementById('chatExit');
  const messagesEl = document.getElementById('chatMessages');
  const form       = document.getElementById('chatForm');
  const nameInput  = document.getElementById('chatName');
  const textInput  = document.getElementById('chatInput');
  const adminBtn   = document.getElementById('chatAdmin');

  const loginModal  = document.getElementById('chatLogin');
  const loginInput  = document.getElementById('chatPassword');
  const loginErr    = document.getElementById('chatLoginError');
  const loginSubmit = document.getElementById('chatLoginSubmit');
  const loginCancel = document.getElementById('chatLoginCancel');

  if (!toggle || !panel) return;

  // ---------- Censoring ----------
  function censor(text) {
    let out = text;
    BANNED_WORDS.forEach(word => {
      const re = new RegExp('\\b' + word + '\\b', 'gi');
      out = out.replace(re, m => '*'.repeat(m.length));
    });
    return out;
  }

  // ---------- Time ----------
  function formatTime(timestamp) {
    if (!timestamp) return 'just now';
    const d = timestamp.toDate();
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // ---------- Render ----------
  async function renderMessages() {
    messagesEl.innerHTML = '<p class="chat-empty">Loading messages…</p>';

    try {
      const snapshot = await getDocs(messagesQuery);

      if (snapshot.empty) {
        messagesEl.innerHTML = '<p class="chat-empty">No messages yet — be the first to say hello!</p>';
        return;
      }

      messagesEl.innerHTML = '';
      let count = 0;

      snapshot.forEach(docSnap => {
        if (count >= MAX_MESSAGES) return;
        const msg = docSnap.data();

        const row = document.createElement('div');
        row.className = 'chat-msg';
        row.dataset.id = docSnap.id;

        row.innerHTML = `
          <div class="chat-msg-avatar">
            <img src="media/images/dove.png" alt="">
          </div>
          <div class="chat-msg-body">
            <div class="chat-msg-meta">
              <span class="chat-msg-name"></span>
              <span class="chat-msg-time">${formatTime(msg.time)}</span>
            </div>
            <div class="chat-msg-bubble"></div>
          </div>
          <button class="chat-msg-delete" title="Delete" aria-label="Delete message">×</button>
        `;

        row.querySelector('.chat-msg-name').textContent = msg.name;
        row.querySelector('.chat-msg-bubble').textContent = msg.text;

        row.querySelector('.chat-msg-delete').addEventListener('click', async () => {
          if (!document.body.classList.contains('chat-admin-mode')) return;
          try {
            await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
            renderMessages();
          } catch (e) {
            console.error('Delete failed: ', e);
          }
        });

        messagesEl.appendChild(row);
        count++;
      });

      messagesEl.scrollTop = messagesEl.scrollHeight;

    } catch (error) {
      console.error('Error loading messages: ', error);
      messagesEl.innerHTML = '<p class="chat-empty">Could not load messages. Please try again later.</p>';
    }
  }

  // ---------- Add ----------
  async function addMessage(name, text) {
    try {
      await addDoc(messagesCollection, {
        name: censor(name.trim()).slice(0, 30) || 'Anonymous',
        text: censor(text.trim()).slice(0, 280),
        time: serverTimestamp()
      });
      renderMessages();
    } catch (error) {
      console.error('Error adding message: ', error);
      alert('Sorry, your message could not be sent right now. Please try again.');
    }
  }

  // ---------- Panel open/close ----------
  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('chat-open');
    setTimeout(() => textInput.focus(), 300);
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('chat-open');
  }

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('open')) closePanel();
    else openPanel();
  });

  exitBtn.addEventListener('click', closePanel);
  if (chatOverlay) chatOverlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      if (loginModal.classList.contains('open')) {
        closeLogin();
      } else {
        closePanel();
      }
    }
  });

  // ---------- Submit ----------
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;

    addMessage(name, text);
    textInput.value = '';
    textInput.focus();

    try { localStorage.setItem('divine_chat_name', name); } catch (e) {}
  });

  try {
    const saved = localStorage.getItem('divine_chat_name');
    if (saved) nameInput.value = saved;
  } catch (e) {}

  // ---------- Admin login ----------
  function openLogin() {
    loginInput.value = '';
    loginErr.textContent = '';
    loginModal.classList.add('open');
    loginModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => loginInput.focus(), 100);
  }

  function closeLogin() {
    loginModal.classList.remove('open');
    loginModal.setAttribute('aria-hidden', 'true');
  }

  function attemptLogin() {
    if (loginInput.value === ADMIN_PASSWORD) {
      document.body.classList.add('chat-admin-mode');
      adminBtn.classList.add('unlocked');
      adminBtn.title = 'Admin mode (click to log out)';
      closeLogin();
    } else {
      loginErr.textContent = 'Incorrect password.';
      loginInput.value = '';
      loginInput.focus();
    }
  }

  function logout() {
    document.body.classList.remove('chat-admin-mode');
    adminBtn.classList.remove('unlocked');
    adminBtn.title = 'Admin login';
  }

  adminBtn.addEventListener('click', () => {
    if (document.body.classList.contains('chat-admin-mode')) {
      logout();
    } else {
      openLogin();
    }
  });

  loginSubmit.addEventListener('click', attemptLogin);
  loginCancel.addEventListener('click', closeLogin);
  loginInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); }
  });
  loginModal.addEventListener('click', e => {
    if (e.target === loginModal) closeLogin();
  });

  // ---------- Init ----------
  renderMessages();
});

/* ============================================================
   CONTACT FORM LOGIC (Work Page)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      const myEmail = "divine.nkanga1@gmail.com";

      const subject = encodeURIComponent(`Website Contact from ${name}`);
      const body = encodeURIComponent(
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}`
      );

      // Open default email app
      window.location.href = `mailto:${myEmail}?subject=${subject}&body=${body}`;
      
      // Clear the form
      contactForm.reset();
    });
  }
});

/* ============================================================
   ABOUT PAGE LOGIC (Gallery Filter & Photobook)
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  
  // ----------------------------------------------------------
  // 1. ART GALLERY FILTER
  // ----------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const artItems = document.querySelectorAll('.art-item');

  if (filterBtns.length > 0) {
    // Show only "Drawings" by default on load
    artItems.forEach(item => {
      if (item.dataset.category === 'drawing') {
        item.classList.add('show');
      }
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active button styling
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.dataset.filter;

        // Filter items
        artItems.forEach(item => {
          item.classList.remove('show'); // Hide all
          
          if (item.dataset.category === filterValue) {
            // Tiny delay to allow CSS animation to restart
            setTimeout(() => {
              item.classList.add('show');
            }, 10);
          }
        });
      });
    });
  }

  // ----------------------------------------------------------
  // 2. PHOTOBOOK SLIDESHOW
  // ----------------------------------------------------------
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  
  const albumPhoto1 = document.getElementById('albumPhoto1');
  const albumPhoto2 = document.getElementById('albumPhoto2');
  
  const albumTitle = document.getElementById('albumTitle');
  const albumDescription = document.getElementById('albumDescription');

  if (nextBtn && albumPhoto1) {
    const slidesData = [
      {
        img1: "media/images/CODscholar.jpg", 
        img2: "media/images/CODScholar.jpg", // Using same image since you only have one
        title: "COD Foundation Scholar Award Recipient",
        text: "Honored to be recognized at the Scholars Award Reception. This scholarship supported my academic journey and allowed me to focus on my goals in Sociology and Data Analytics."
      },
      {
        img1: "media/images/AM1.jpg",
        img2: "media/images/AM2.jpg",
        title: "Student Ambassador Captain",
        text: "Led campus tours and recruitment events for diverse prospective student groups. Acted as the liaison between Admissions staff and ambassadors to ensure seamless communication, and represented College of DuPage at high-profile admissions activities."
      },
      {
        img1: "media/images/BSA1.jpg",
        img2: "media/images/BSA2.jpg",
        title: "Black Student Alliance President",
        text: "Spearheaded initiatives to foster community, academic support, and cultural engagement. Organized events like the Black History Month celebrations and provided a safe, empowering space for Black students on campus."
      },
      {
        img1: "media/images/SF1.jpg",
        img2: "media/images/SF2.jpg",
        title: "STEM Forward Officer",
        text: "Collaborated with peers to promote STEM education, networking, and hands-on learning opportunities. Helped bridge the gap between technical fields and social impact, encouraging diverse voices in STEM."
      },
      {
        img1: "media/images/OL1.jpg",
        img2: "media/images/OL2.jpg",
        title: "Orientation Leader (Year 1)",
        text: "Welcomed incoming students and helped them transition into college life. Facilitated group activities, answered questions, and shared resources to ensure every new student felt supported and ready to succeed."
      },
      {
        img1: "media/images/FAS1.jpg",
        img2: "media/images/FAS2.jpg",
        title: "Fine Arts Studio Founder & Event Coordinator",
        text: "Founded the Fine Arts Studio to provide a creative outlet for students across all majors. Designed promotional materials, organized collaborative events, and fostered a vibrant community of artists and creators."
      }
    ];

    let currentIndex = 0;

    // Apply transitions dynamically
    albumPhoto1.style.transition = 'opacity 0.3s ease';
    albumPhoto2.style.transition = 'opacity 0.3s ease';
    albumTitle.style.transition = 'opacity 0.3s ease';
    albumDescription.style.transition = 'opacity 0.3s ease';

    function updateSlide(index) {
      const slide = slidesData[index];
      
      // Fade out
      albumPhoto1.style.opacity = '0';
      albumPhoto2.style.opacity = '0';
      albumTitle.style.opacity = '0';
      albumDescription.style.opacity = '0';

      setTimeout(() => {
        // Update content
        albumPhoto1.src = slide.img1;
        albumPhoto2.src = slide.img2;
        albumTitle.textContent = slide.title;
        albumDescription.textContent = slide.text;

        // Fade in
        albumPhoto1.style.opacity = '1';
        albumPhoto2.style.opacity = '1';
        albumTitle.style.opacity = '1';
        albumDescription.style.opacity = '1';
      }, 300); 
    }

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slidesData.length;
      updateSlide(currentIndex);
    });

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
      updateSlide(currentIndex);
    });
  }

});