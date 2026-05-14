const DEFAULT_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    title: 'La Danza de la Luz',
    desc: 'Oro y sombra confluyen en este misterioso homenaje a la luz divina que todo lo transforma.'
  },
  {
    url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&q=80',
    title: 'Jardines del Edén',
    desc: 'Exuberante naturaleza capturada en el instante en que la eternidad roza lo efímero.'
  },
  {
    url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&q=80',
    title: 'El Susurro del Tiempo',
    desc: 'Ruinas que narran glorias pasadas, testigos silenciosos del paso inexorable de los siglos.'
  },
  {
    url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
    title: 'Cielos en Llamas',
    desc: 'Crepúsculo ardiente que anuncia el fin de los tiempos con toda su magnificencia.'
  },
  {
    url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80',
    title: 'Corona de Mármol',
    desc: 'La perfección esculpida en piedra, emblema del poder eterno de la belleza clásica.'
  },
  {
    url: 'https://images.unsplash.com/photo-1531488624357-1f1e90da8d2a?w=800&q=80',
    title: 'Velum Noctis',
    desc: 'El velo de la noche descorre sus cortinas para revelar el esplendor de lo oculto.'
  }
];

let galleryData = JSON.parse(localStorage.getItem('baroqueGallery')) || DEFAULT_IMAGES.map(d => ({ ...d }));
let isAdmin = false;
// store file blobs temporarily
let pendingFiles = Array(6).fill(null);

// ── RENDER GALLERY ──
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  galleryData.forEach((item, i) => {
    grid.innerHTML += `
      <article class="card">
        <span class="card-inner-tl">✦</span>
        <span class="card-inner-br">✦</span>
        <div class="card-img-wrap">
          <img class="card-img" src="${item.url}" alt="${item.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=60'">
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-desc">${item.desc}</p>
        </div>
      </article>`;
  });
}

// ── LOGIN ──
function openLogin() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  setTimeout(() => document.getElementById('username').focus(), 100);
}
function closeLogin() {
  document.getElementById('loginModal').classList.remove('open');
}
function attemptLogin() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  if (u === 'admin' && p === '1234') {
    isAdmin = true;
    closeLogin();
    document.getElementById('adminBar').classList.add('visible');
    document.getElementById('loginBtn').style.display = 'none';
    showToast('✦ Bienvenido, Administrador ✦');
    openAdmin();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

// ── ADMIN ──
function openAdmin() {
  pendingFiles = Array(6).fill(null);
  const slots = document.getElementById('adminSlots');
  slots.innerHTML = '';
  galleryData.forEach((item, i) => {
    slots.innerHTML += `
      <div class="slot-card">
        <div class="slot-num">OBRA ${i + 1}</div>
        <img class="slot-img-preview" id="preview-${i}" src="${item.url}" alt="">
        <input class="slot-input" type="text" id="title-${i}" value="${item.title}" placeholder="Título">
        <input class="slot-input" type="text" id="url-${i}" value="${item.url}" placeholder="URL de imagen">
        <textarea class="slot-input" id="desc-${i}" rows="2" placeholder="Descripción...">${item.desc}</textarea>
        <label class="slot-file-label">
          ↑ Subir imagen
          <input type="file" accept="image/*" onchange="previewFile(${i}, this)">
        </label>
      </div>`;
  });
  // sync url inputs to previews
  document.querySelectorAll('.slot-input[id^="url-"]').forEach((inp, i) => {
    inp.addEventListener('input', () => {
      document.getElementById('preview-' + i).src = inp.value;
    });
  });
  document.getElementById('adminModal').classList.add('open');
}
function closeAdmin() {
  document.getElementById('adminModal').classList.remove('open');
}
function previewFile(idx, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    pendingFiles[idx] = e.target.result;
    document.getElementById('preview-' + idx).src = e.target.result;
    document.getElementById('url-' + idx).value = '';
  };
  reader.readAsDataURL(file);
}
function saveGallery() {
  galleryData = galleryData.map((_, i) => ({
    url: pendingFiles[i] || document.getElementById('url-' + i).value || galleryData[i].url,
    title: document.getElementById('title-' + i).value || galleryData[i].title,
    desc: document.getElementById('desc-' + i).value || galleryData[i].desc
  }));
  localStorage.setItem('baroqueGallery', JSON.stringify(galleryData));
  closeAdmin();
  renderGallery();
  showToast('✦ Cambios guardados con éxito ✦');
}
function logout() {
  isAdmin = false;
  document.getElementById('adminBar').classList.remove('visible');
  document.getElementById('loginBtn').style.display = '';
  showToast('Sesión cerrada');
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLogin(); closeAdmin(); }
  if (e.key === 'Enter' && document.getElementById('loginModal').classList.contains('open')) attemptLogin();
});

// ── INIT ──
renderGallery();
