document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. NAVIGATION
  // ============================================================
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const toggleMenu = (open) => {
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  document.getElementById('menuToggle')?.addEventListener('click', () => toggleMenu(!sidebar.classList.contains('active')));
  overlay?.addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleMenu(false);
  });
  document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => {
    if (window.innerWidth <= 900) toggleMenu(false);
  }));

  // ============================================================
  // 2. CHAT WIDGET UI
  // ============================================================
  const chatPanel = document.getElementById('chatPanel');
  const chatToggle = document.getElementById('chatToggle');
  const chatExit = document.getElementById('chatExit');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatAdmin = document.getElementById('chatAdmin');
  const chatLogin = document.getElementById('chatLogin');
  const chatPassword = document.getElementById('chatPassword');
  const chatLoginError = document.getElementById('chatLoginError');

  if (chatToggle && chatPanel) {
    chatToggle.addEventListener('click', () => {
      chatPanel.classList.toggle('open');
      if (chatPanel.classList.contains('open') && chatInput) {
        setTimeout(() => chatInput.focus(), 300);
      }
    });
  }

  if (chatExit && chatPanel) {
    chatExit.addEventListener('click', () => chatPanel.classList.remove('open'));
  }

  // Admin Login UI Logic
  if (chatAdmin) {
    chatAdmin.addEventListener('click', () => {
      if (document.body.classList.contains('chat-admin-mode')) {
        document.body.classList.remove('chat-admin-mode');
        chatAdmin.classList.remove('unlocked');
        chatAdmin.title = "Admin login";
      } else {
        chatLogin.classList.add('open');
        chatLoginError.textContent = "";
        chatPassword.value = "";
        chatPassword.focus();
      }
    });
  }

  document.getElementById('chatLoginCancel')?.addEventListener('click', () => chatLogin.classList.remove('open'));
  document.getElementById('chatLoginSubmit')?.addEventListener('click', () => {
    if (chatPassword.value === 'maggie303') {
      document.body.classList.add('chat-admin-mode');
      chatAdmin.classList.add('unlocked');
      chatAdmin.title = "Admin mode (click to log out)";
      chatLogin.classList.remove('open');
    } else {
      chatLoginError.textContent = "Incorrect password.";
    }
  });

  // ============================================================
  // 3. CHAT WIDGET LOGIC (Race Condition Fixed)
  // ============================================================
  const initChat = () => {
    if (!window.firebaseChat) {
      if (chatMessages) chatMessages.innerHTML = '<p style="text-align:center;color:gray;">Chat is offline.</p>';
      return;
    }

    const {
      db,
      collection,
      addDoc,
      getDocs,
      deleteDoc,
      doc,
      query,
      orderBy,
      serverTimestamp
    } = window.firebaseChat;
    const messagesCollection = collection(db, 'messages');
    const messagesQuery = query(messagesCollection, orderBy('time', 'desc'));
    const nameInput = document.getElementById('chatName');

    if (!chatForm) return;

    const BANNED = ['fuck', 'shit', 'bitch', 'asshole'];
    const censor = (text) => BANNED.reduce((str, word) => str.replace(new RegExp('\\b' + word + '\\b', 'gi'), m => '*'.repeat(m.length)), text);
    const formatTime = (ts) => ts ? (ts.toDate().toDateString() === new Date().toDateString() ? ts.toDate().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    }) : ts.toDate().toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    })) : 'just now';

    const renderMessages = async () => {
      chatMessages.innerHTML = '<p>Loading...</p>';
      try {
        const snapshot = await getDocs(messagesQuery);
        if (snapshot.empty) {
          chatMessages.innerHTML = '<p>No messages yet.</p>';
          return;
        }
        chatMessages.innerHTML = '';
        let count = 0;
        snapshot.forEach(docSnap => {
          if (count >= 50) return;
          const msg = docSnap.data();
          const row = document.createElement('div');
          row.className = 'chat-msg';
          row.innerHTML = `
            <div style="font-size:0.8rem; color:var(--ink-soft); margin-bottom:4px; display:flex; justify-content:space-between;">
              <strong>${msg.name}</strong> <span>${formatTime(msg.time)}</span>
            </div>
            <div class="chat-msg-bubble">${msg.text}</div>
            <button class="chat-msg-delete" style="display:none; background:none; border:none; color:#b14c5c; cursor:pointer; font-size:1.1rem;" title="Delete">×</button>`;

          row.querySelector('.chat-msg-delete').addEventListener('click', async () => {
            if (!document.body.classList.contains('chat-admin-mode')) return;
            await deleteDoc(doc(db, 'messages', docSnap.id));
            renderMessages();
          });
          chatMessages.appendChild(row);
          count++;
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (e) {
        chatMessages.innerHTML = 'Error loading messages.';
      }
    };

    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!nameInput.value.trim() || !chatInput.value.trim()) return;
      try {
        await addDoc(messagesCollection, {
          name: censor(nameInput.value).slice(0, 30),
          text: censor(chatInput.value).slice(0, 280),
          time: serverTimestamp()
        });
        renderMessages();
        chatInput.value = '';
      } catch (err) {
        alert("Could not send message.");
      }
    });

    renderMessages();
  };

  // Run immediately if Firebase is loaded, otherwise wait for the event
  if (window.firebaseChat) {
    initChat();
  } else {
    window.addEventListener('firebase-ready', initChat);
  }

  // ============================================================
  // 4. GENERIC CAROUSEL FUNCTION
  // ============================================================
  const createCarousel = (trackId, prevId, nextId, getItemsCallback) => {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    if (!track || !prevBtn || !nextBtn) return;

    let currentIndex = 0;

    const updateCarousel = () => {
      const items = getItemsCallback(track);
      if (items.length === 0) return;

      if (currentIndex >= items.length) currentIndex = items.length - 1;
      if (currentIndex < 0) currentIndex = 0;

      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    prevBtn.addEventListener('click', () => {
      currentIndex--;
      updateCarousel();
    });
    nextBtn.addEventListener('click', () => {
      currentIndex++;
      updateCarousel();
    });

    return {
      reset: () => {
        currentIndex = 0;
        updateCarousel();
      },
      update: updateCarousel
    };
  };

  // ============================================================
  // 5. PROJECTS CAROUSEL
  // ============================================================
  createCarousel('projTrack', 'projPrev', 'projNext', (track) => {
    return Array.from(track.querySelectorAll('.carousel-slide'));
  });

  // ============================================================
  // 6. ART GALLERY FILTER & CAROUSEL
  // ============================================================
  const artTrack = document.getElementById('artTrack');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (artTrack) {
    let currentCategory = 'drawing';

    const getFilteredArt = (track) => {
      return Array.from(track.querySelectorAll('.art-item')).filter(el => el.dataset.category === currentCategory);
    };

    const artCarousel = createCarousel('artTrack', 'artPrev', 'artNext', getFilteredArt);

    const updateGallery = () => {
      const allItems = artTrack.querySelectorAll('.art-item');
      allItems.forEach(el => {
        if (el.dataset.category === currentCategory) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'none';
        }
      });
      artCarousel.reset();
    };

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        updateGallery();
      });
    });

    updateGallery();
  }

  // ============================================================
  // 7. BACKGROUND & HOBBIES SLIDESHOW
  // ============================================================
  const slideshow = document.getElementById('hobbiesSlideshow');
  if (slideshow) {
    const images = slideshow.querySelectorAll('img');
    let currentImg = 0;
    setInterval(() => {
      images[currentImg].classList.remove('active');
      currentImg = (currentImg + 1) % images.length;
      images[currentImg].classList.add('active');
    }, 3000);
  }

  // ============================================================
  // 8. PHOTOBOOK SLIDESHOW
  // ============================================================
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const albumPhoto = document.getElementById('albumPhoto');
  const albumTitle = document.getElementById('albumTitle');
  const albumDescription = document.getElementById('albumDescription');

  if (nextBtn && albumPhoto) {
    const slidesData = [{
        img: "media/images/CODscholar.jpg",
        title: "COD Foundation Scholar",
        text: "Received the COD Foundation Scholarship."
      },
      {
        img: "media/images/AM1.jpg",
        title: "Student Ambassador Captain",
        text: "Led campus tours and recruitment events."
      },
      {
        img: "media/images/BSA1.jpg",
        title: "Black Student Alliance President",
        text: "Fostered community and academic support."
      },
      {
        img: "media/images/FAS1.jpg",
        title: "Fine Arts Studio Founder",
        text: "Built a community for artists across all majors."
      }
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

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slidesData.length;
      updateSlide(currentIndex);
    });
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
      updateSlide(currentIndex);
    });
  }

  // ============================================================
  // 9. WORK PAGE CONTACT FORM
  // ============================================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
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
});