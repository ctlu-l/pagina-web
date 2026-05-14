/* ================================
   VETNEX — app.js
   ================================ */

// ---- SUPABASE CONFIG ----
const SUPABASE_URL  = 'https://hcjomenskigcvkolooaz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjam9tZW5za2lnY3Zrb2xvb2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjY3NDksImV4cCI6MjA5NDM0Mjc0OX0.3PFpS1N0Et1Nmvl_glxaON-Z6RpuRKAS9OiNUj30xp8';

// Cliente Supabase usando la REST API directamente (sin npm)
const sbHeaders = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
  'Prefer':        'return=representation',
};

async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: sbHeaders,
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.error || 'Error al insertar');
  return json;
}

// ---- LIVE CLOCK ----
function updateClock() {
  const el = document.getElementById('statusTime');
  if (!el) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  el.textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateClock, 1000);
updateClock();


// ---- ANIMATED COUNTERS ----
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Intersection Observer to trigger when in view
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-value[data-target]').forEach(el => {
  counterObserver.observe(el);
});


// ---- HEADER SCROLL EFFECT ----
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.style.borderBottomColor = 'rgba(0, 245, 255, 0.4)';
  } else {
    header.style.borderBottomColor = 'rgba(0, 245, 255, 0.2)';
  }
});


// ---- MODAL SYSTEM ----
function openModal(type) {
  const overlay = document.getElementById(`modal-${type}`);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Glitch flash on open
  overlay.querySelector('.modal').style.animation = 'modalFlash 0.3s ease';
  setTimeout(() => {
    if (overlay.querySelector('.modal'))
      overlay.querySelector('.modal').style.animation = '';
  }, 300);
}

function closeModal(type) {
  const overlay = document.getElementById(`modal-${type}`);
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOutside(event, type) {
  if (event.target === event.currentTarget) closeModal(type);
}

// ESC closes any open modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['tutor', 'empleado'].forEach(closeModal);
  }
});


// ---- EMPLEADO TIPO SELECTOR ----
let currentTipo = 'veterinario';

function selectTipo(tipo, btn) {
  currentTipo = tipo;

  // Update button states
  document.querySelectorAll('.tipo-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show/hide fields
  const vetFields = document.querySelectorAll('.vet-field');
  const recFields = document.querySelectorAll('.rec-field');

  if (tipo === 'veterinario') {
    vetFields.forEach(f => { f.style.display = 'flex'; });
    recFields.forEach(f => { f.style.display = 'none'; });
  } else {
    vetFields.forEach(f => { f.style.display = 'none'; });
    recFields.forEach(f => { f.style.display = 'flex'; });
  }
}


// ---- FORM SUBMISSION ----
async function handleSubmit(event, type) {
  event.preventDefault();
  const form = event.target;
  const btn  = form.querySelector('.form-submit');
  const originalText = btn.querySelector('span').textContent;

  btn.querySelector('span').textContent = 'PROCESANDO...';
  btn.disabled = true;

  try {
    if (type === 'tutor') {
      await registrarTutor(form);
      closeModal('tutor');
      form.reset();
      showToast('TUTOR REGISTRADO EXITOSAMENTE');

    } else if (type === 'empleado') {
      await registrarEmpleado(form);
      closeModal('empleado');
      form.reset();
      showToast(`${currentTipo.toUpperCase()} REGISTRADO EXITOSAMENTE`);
      selectTipo('veterinario', document.querySelector('.tipo-btn'));
    }

  } catch (err) {
    showToast('ERROR: ' + err.message, true);
    console.error(err);
  } finally {
    btn.querySelector('span').textContent = originalText;
    btn.disabled = false;
  }
}

async function registrarTutor(form) {
  const inputs = form.querySelectorAll('input');
  // Primero generamos un id_cliente autoincremental leyendo el máximo actual
  const maxRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tutor?select=id_cliente&order=id_cliente.desc&limit=1`,
    { headers: sbHeaders }
  );
  const maxData = await maxRes.json();
  const nextId  = maxData.length > 0 ? maxData[0].id_cliente + 1 : 1;

  await sbInsert('tutor', {
    id_cliente:           nextId,
    nombre:               inputs[0].value.trim(),
    correo_electronico:   inputs[1].value.trim(),
    telefono:             inputs[2].value.trim(),
    direccion:            inputs[3].value.trim(),
    fecha_de_registo:     inputs[4].value,   // formato YYYY-MM-DD
  });
}

async function registrarEmpleado(form) {
  const inputs = form.querySelectorAll('input, select');

  // Obtener próximo id_empleado
  const maxRes = await fetch(
    `${SUPABASE_URL}/rest/v1/empleado?select=id_empleado&order=id_empleado.desc&limit=1`,
    { headers: sbHeaders }
  );
  const maxData = await maxRes.json();
  const nextId  = maxData.length > 0 ? maxData[0].id_empleado + 1 : 1;

  // 1. Insertar en tabla base "empleado"
  await sbInsert('empleado', {
    id_empleado: nextId,
    nombre:      inputs[0].value.trim(),
    telefono:    inputs[1].value.trim(),
    rfc:         inputs[2].value.trim(),
  });

  // 2. Insertar en subtabla según tipo
  if (currentTipo === 'veterinario') {
    await sbInsert('veterinario', {
      id_empleado:        nextId,
      cedula_profesional: inputs[3].value.trim(),
      especialidad:       inputs[4].value,
    });
  } else {
    // Obtener próximo id_caja
    const cajaRes  = await fetch(
      `${SUPABASE_URL}/rest/v1/recepcionista?select=id_caja&order=id_caja.desc&limit=1`,
      { headers: sbHeaders }
    );
    const cajaData = await cajaRes.json();
    const nextCaja = cajaData.length > 0 ? cajaData[0].id_caja + 1 : 1;

    await sbInsert('recepcionista', {
      id_empleado: nextId,
      id_caja:     inputs[3].value ? parseInt(inputs[3].value) : nextCaja,
    });
  }
}


// ---- TOAST NOTIFICATION ----
function showToast(msg, isError = false) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toast.style.borderColor = isError ? 'var(--red)'   : 'var(--green)';
  toast.style.color       = isError ? 'var(--red)'   : 'var(--green)';
  toast.style.boxShadow   = isError
    ? '0 0 20px rgba(255,34,68,0.3)'
    : '0 0 20px rgba(57,255,20,0.3)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}


// ---- SCROLL TO SERVICES ----
function scrollToServices() {
  document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
}


// ---- TERMINAL TYPEWRITER EFFECT ----
(function initTerminal() {
  const lines = document.querySelectorAll('.terminal-body .t-line');
  lines.forEach((line, i) => {
    line.style.opacity = '0';
    line.style.animationDelay = `${i * 0.18 + 0.5}s`;
    line.style.animationFillMode = 'both';
  });
})();


// ---- GLITCH RANDOM EFFECT on header ----
(function randomGlitch() {
  const logo = document.querySelector('.logo-text');
  if (!logo) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  const original = logo.textContent;

  function glitchFor(ms) {
    const interval = setInterval(() => {
      const arr = original.split('');
      const idx = Math.floor(Math.random() * arr.length);
      arr[idx] = chars[Math.floor(Math.random() * chars.length)];
      logo.textContent = arr.join('');
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      logo.textContent = original;
    }, ms);
  }

  // Random glitch bursts
  function schedule() {
    const delay = 4000 + Math.random() * 8000;
    setTimeout(() => {
      glitchFor(200 + Math.random() * 300);
      schedule();
    }, delay);
  }

  schedule();
})();


// ---- CURSOR TRAIL EFFECT ----
(function cursorTrail() {
  const trail = [];
  const N = 8;

  for (let i = 0; i < N; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: fixed;
      width: ${4 - i * 0.4}px;
      height: ${4 - i * 0.4}px;
      border-radius: 50%;
      background: rgba(0, 245, 255, ${0.6 - i * 0.07});
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.1s ease;
      box-shadow: 0 0 6px rgba(0,245,255,0.8);
    `;
    document.body.appendChild(dot);
    trail.push({ el: dot, x: 0, y: 0 });
  }

  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateTrail() {
    let x = mouseX, y = mouseY;
    trail.forEach((dot, i) => {
      dot.el.style.left = (x - 2) + 'px';
      dot.el.style.top  = (y - 2) + 'px';
      const prev = trail[i - 1];
      if (prev) {
        x += (prev.x - x) * 0.4;
        y += (prev.y - y) * 0.4;
      }
      dot.x = x; dot.y = y;
    });
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
})();


// ---- SERVICE CARD HOVER PARALLAX ----
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});


// ---- STATUS TEXT ROTATION ----
const statusMessages = [
  'SISTEMA EN LÍNEA',
  'BASE DE DATOS ACTIVA',
  'MÓDULOS CARGADOS',
  'SEGURIDAD ACTIVA',
  'SINCRONIZANDO...',
];
let statusIdx = 0;
setInterval(() => {
  statusIdx = (statusIdx + 1) % statusMessages.length;
  const el = document.getElementById('statusText');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = statusMessages[statusIdx];
      el.style.opacity = '1';
    }, 300);
  }
}, 4000);
