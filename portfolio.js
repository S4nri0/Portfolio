document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================================
  // 1. MOBILE NAVIGATION
  // ============================================================
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  const toggleSidebar = (open) => {
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  if (menuToggle) menuToggle.addEventListener('click', () => toggleSidebar(!sidebar.classList.contains('active')));
  if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
  document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => { if (window.innerWidth <= 900) toggleSidebar(false); }));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) toggleSidebar(false); });
  window.addEventListener('load', () => window.scrollTo(0, 0));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSidebar(false); });

  // ============================================================
  // 2. WORK PAGE - CONTACT FORM
  // ============================================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      const subject = encodeURIComponent(`Website Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.location.href = `mailto:divine.nkanga1@gmail.com?subject=${subject}&body=${body}`;
      contactForm.reset();
    });
  }

  // ============================================================
  // 3. ABOUT PAGE - GALLERY & SLIDESHOW
  // ============================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const artItems = document.querySelectorAll('.art-item');
  
  if (filterBtns.length > 0) {
    // Init Gallery
    artItems.forEach(item => { if (item.dataset.category === 'drawing') item.classList.add('show'); });
    
    // Filter logic
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterValue = btn.dataset.filter;
        artItems.forEach(item => {
          item.classList.remove('show');
          if (item.dataset.category === filterValue) setTimeout(() => item.classList.add('show'), 10);
        });
      });
    });
  }

  // Photobook Slideshow
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const albumPhoto = document.getElementById('albumPhoto');
  const albumTitle = document.getElementById('albumTitle');
  const albumDescription = document.getElementById('albumDescription');

  if (nextBtn && albumPhoto) {
    const slidesData = [
      { img: "media/images/CODscholar.jpg", title: "COD Foundation Scholar Award Recipient", text: "Received the COD Foundation Scholarship. This award helped support my studies in Sociology and Data Analytics." },
      { img: "media/images/AM1.jpg", title: "Student Ambassador Captain", text: "Led campus tours and recruitment events. Served as the liaison between Admissions staff and ambassadors, and represented the college at major events." },
      { img: "media/images/BSA1.jpg", title: "Black Student Alliance President", text: "Led the organization to foster community and academic support. Organized events like Black History Month celebrations and created a safe space for students." },
      { img: "media/images/SF1.jpg", title: "STEM Forward Officer", text: "Worked with peers to promote STEM education and networking. Helped create hands-on learning opportunities for diverse voices in tech." },
      { img: "media/images/OL1.jpg", title: "Orientation Leader", text: "Welcomed incoming students and helped them transition into college. Facilitated group activities and shared resources to help new students feel at home." },
      { img: "media/images/FAS1.jpg", title: "Fine Arts Studio Founder", text: "Founded the Fine Arts Studio to give students a creative outlet. Organized events and built a community for artists across all majors." }
    ];

    let currentIndex = 0;
    [albumPhoto, albumTitle, albumDescription].forEach(el => el.style.transition = 'opacity 0.3s ease');

    const updateSlide = (index) => {
      const slide = slidesData[index];
      [albumPhoto, albumTitle, albumDescription].forEach(el => el.style.opacity = '0');
      
      setTimeout(() => {
        albumPhoto.src = slide.img;
        albumTitle.textContent = slide.title;
        albumDescription.textContent = slide.text;
        [albumPhoto, albumTitle, albumDescription].forEach(el => el.style.opacity = '1');
      }, 300);
    };

    nextBtn.addEventListener('click', () => { currentIndex = (currentIndex + 1) % slidesData.length; updateSlide(currentIndex); });
    prevBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length; updateSlide(currentIndex); });
  }

  // ============================================================
  // 4. CHAT WIDGET (Firebase)
  // ============================================================
  window.addEventListener('firebase-ready', () => {
    const { db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } = window.firebaseChat;
    const messagesCollection = collection(db, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('time', 'desc'));
    
    const toggle = document.getElementById('chatToggle');
    const panel = document.getElementById('chatPanel');
    const messagesEl = document.getElementById('chatMessages');
    const form = document.getElementById('chatForm');
    const nameInput = document.getElementById('chatName');
    const textInput = document.getElementById('chatInput');
    const adminBtn = document.getElementById('chatAdmin');
    const loginModal = document.getElementById('chatLogin');
    const loginInput = document.getElementById('chatPassword');
    const loginErr = document.getElementById('chatLoginError');

    if (!toggle || !panel) return;

    const BANNED_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap', 'dick', 'piss', 'slut', 'whore','nigga','nigger','faggot','kys','kill yourself','chopped','negro','monkey','gorilla'];
    const censor = (text) => BANNED_WORDS.reduce((str, word) => str.replace(new RegExp('\\b' + word + '\\b', 'gi'), m => '*'.repeat(m.length)), text);

    const formatTime = (ts) => {
      if (!ts) return 'just now';
      const d = ts.toDate();
      return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderMessages = async () => {
      messagesEl.innerHTML = '<p class="chat-empty">Loading messages…</p>';
      try {
        const snapshot = await getDocs(messagesQuery);
        if (snapshot.empty) { messagesEl.innerHTML = '<p class="chat-empty">No messages yet — be the first to say hello!</p>'; return; }
        messagesEl.innerHTML = '';
        let count = 0;
        snapshot.forEach(docSnap => {
          if (count >= 50) return;
          const msg = docSnap.data();
          const row = document.createElement('div');
          row.className = 'chat-msg';
          row.innerHTML = `
            <div class="chat-msg-avatar"><img src="media/images/dove.png" alt=""></div>
            <div class="chat-msg-body">
              <div class="chat-msg-meta"><span class="chat-msg-name">${msg.name}</span><span class="chat-msg-time">${formatTime(msg.time)}</span></div>
              <div class="chat-msg-bubble">${msg.text}</div>
            </div>
            <button class="chat-msg-delete" title="Delete" aria-label="Delete message">×</button>`;
          
          row.querySelector('.chat-msg-delete').addEventListener('click', async () => {
            if (!document.body.classList.contains('chat-admin-mode')) return;
            await deleteDoc(doc(db, 'messages', docSnap.id));
            renderMessages();
          });
          messagesEl.appendChild(row);
          count++;
        });
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } catch (error) {
        messagesEl.innerHTML = '<p class="chat-empty">Could not load messages. Please try again later.</p>';
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim(); const text = textInput.value.trim();
      if (!name || !text) return;
      try {
        await addDoc(messagesCollection, { name: censor(name).slice(0, 30) || 'Anonymous', text: censor(text).slice(0, 280), time: serverTimestamp() });
        renderMessages();
        textInput.value = '';
        localStorage.setItem('divine_chat_name', name);
      } catch (e) { alert('Could not send message.'); }
    });

    try { const saved = localStorage.getItem('divine_chat_name'); if (saved) nameInput.value = saved; } catch (e) {}

    const openPanel = () => { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); document.body.classList.add('chat-open'); setTimeout(() => textInput.focus(), 300); };
    const closePanel = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); document.body.classList.remove('chat-open'); };
    
    toggle.addEventListener('click', () => panel.classList.contains('open') ? closePanel() : openPanel());
    document.getElementById('chatExit').addEventListener('click', closePanel);
    document.getElementById('chatOverlay').addEventListener('click', closePanel);
    
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) { loginModal.classList.contains('open') ? closeLogin() : closePanel(); } });

    const openLogin = () => { loginInput.value = ''; loginErr.textContent = ''; loginModal.classList.add('open'); setTimeout(() => loginInput.focus(), 100); };
    const closeLogin = () => loginModal.classList.remove('open');
    const attemptLogin = () => {
      if (loginInput.value === 'maggie303') {
        document.body.classList.add('chat-admin-mode');
        adminBtn.classList.add('unlocked');
        closeLogin();
      } else { loginErr.textContent = 'Incorrect password.'; loginInput.value = ''; loginInput.focus(); }
    };

    adminBtn.addEventListener('click', () => document.body.classList.contains('chat-admin-mode') ? (document.body.classList.remove('chat-admin-mode'), adminBtn.classList.remove('unlocked')) : openLogin());
    document.getElementById('chatLoginSubmit').addEventListener('click', attemptLogin);
    document.getElementById('chatLoginCancel').addEventListener('click', closeLogin);
    loginInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

    renderMessages();
  });
});