// ============================================================
// SIDEBAR DRAWER (mobile)
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

if (menuToggle) menuToggle.addEventListener('click', openSidebar);
if (overlay)    overlay.addEventListener('click', closeSidebar);

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
   CHAT WIDGET — Firebase Firestore Version
   ============================================================ */

// Wait for the Firebase module to be ready
window.addEventListener('firebase-ready', () => {

  // ---------- Config ----------
  const ADMIN_PASSWORD = 'dove-admin';   // ← CHANGE THIS
  const COLLECTION_NAME = 'messages';
  const MAX_MESSAGES = 50;

  // Profanity filter
  const BANNED_WORDS = [
    'fuck', 'shit', 'bitch', 'asshole', 'bastard',
    'damn', 'crap', 'dick', 'piss', 'slut', 'whore'
  ];

  // ---------- Firebase References ----------
  const {
    db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp
  } = window.firebaseChat;

  const messagesCollection = collection(db, COLLECTION_NAME);
  const messagesQuery = query(messagesCollection, orderBy('time', 'desc'));

  // ---------- Elements ----------
  const toggle    = document.getElementById('chatToggle');
  const panel     = document.getElementById('chatPanel');
  const overlay   = document.getElementById('chatOverlay');
  const exitBtn   = document.getElementById('chatExit');
  const messagesEl = document.getElementById('chatMessages');
  const form      = document.getElementById('chatForm');
  const nameInput = document.getElementById('chatName');
  const textInput = document.getElementById('chatInput');
  const adminBtn  = document.getElementById('chatAdmin');

  const loginModal  = document.getElementById('chatLogin');
  const loginInput  = document.getElementById('chatPassword');
  const loginErr    = document.getElementById('chatLoginError');
  const loginSubmit = document.getElementById('chatLoginSubmit');
  const loginCancel = document.getElementById('chatLoginCancel');

  if (!toggle || !panel) return; // Widget not on this page

  // ---------- Censoring & Sanitizing ----------
  function censor(text) {
    let out = text;
    BANNED_WORDS.forEach(word => {
      const re = new RegExp('\\b' + word + '\\b', 'gi');
      out = out.replace(re, m => '*'.repeat(m.length));
    });
    return out;
  }

  // ---------- Time Formatting ----------
  function formatTime(timestamp) {
    if (!timestamp) return 'just now';
    const d = timestamp.toDate(); // Firestore Timestamp -> JS Date
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // ---------- Render Messages ----------
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

        // Build structure
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

        // Insert text safely with textContent
        row.querySelector('.chat-msg-name').textContent = msg.name;
        row.querySelector('.chat-msg-bubble').textContent = msg.text;

        // Delete handler
        row.querySelector('.chat-msg-delete').addEventListener('click', async () => {
          if (!document.body.classList.contains('chat-admin-mode')) return;
          try {
            await deleteDoc(doc(db, COLLECTION_NAME, docSnap.id));
            renderMessages(); // Re-fetch after delete
          } catch (e) {
            console.error('Delete failed: ', e);
          }
        });

        messagesEl.appendChild(row);
        count++;
      });

      // Scroll to newest
      messagesEl.scrollTop = messagesEl.scrollHeight;

    } catch (error) {
      console.error('Error loading messages: ', error);
      messagesEl.innerHTML = '<p class="chat-empty">Could not load messages. Please try again later.</p>';
    }
  }

  // ---------- Add Message ----------
  async function addMessage(name, text) {
    try {
      await addDoc(messagesCollection, {
        name: censor(name.trim()).slice(0, 30) || 'Anonymous',
        text: censor(text.trim()).slice(0, 280),
        time: serverTimestamp()  // Firebase server timestamp
      });
      renderMessages(); // Re-fetch to show new message
    } catch (error) {
      console.error('Error adding message: ', error);
      alert('Sorry, your message could not be sent right now. Please try again.');
    }
  }

  // ---------- Panel Open / Close ----------
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
  overlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      if (loginModal.classList.contains('open')) {
        closeLogin();
      } else {
        closePanel();
      }
    }
  });

  // ---------- Form Submit ----------
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;

    addMessage(name, text);
    textInput.value = '';
    textInput.focus();

    // Remember name for next time
    try { localStorage.setItem('divine_chat_name', name); } catch (e) {}
  });

  // Prefill name if saved
  try {
    const saved = localStorage.getItem('divine_chat_name');
    if (saved) nameInput.value = saved;
  } catch (e) {}

  // ---------- Admin Login ----------
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