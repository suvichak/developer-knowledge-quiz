/* ─────────────────────────────────────────────────────────────
   Utility
───────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function el(id) { return document.getElementById(id); }

function showView(name) {
  ['loading', 'error', 'content'].forEach(v => {
    el(`view-${v}`).classList.toggle('hidden', v !== name);
  });
}

function showError(htmlMsg) {
  el('error-msg').innerHTML = htmlMsg;
  showView('error');
}

/* ─────────────────────────────────────────────────────────────
   Shuffle helpers
───────────────────────────────────────────────────────────── */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─────────────────────────────────────────────────────────────
   Main loader
───────────────────────────────────────────────────────────── */
async function loadPrequiz() {
  const params     = new URLSearchParams(window.location.search);
  const quizParam  = params.get('quiz');

  if (!quizParam) {
    showError('No quiz specified. Add <code>?quiz=quiz/template</code> to the URL.');
    return;
  }

  const base        = quizParam.replace(/\.json$/, '');
  const prequizFile = base + '-prequiz.json';
  const quizUrl     = `quiz.html?quiz=${encodeURIComponent(quizParam)}`;

  el('btn-start').href = quizUrl;

  try {
    const pqRes = await fetch(prequizFile);

    if (!pqRes.ok) throw new Error(`HTTP ${pqRes.status}: ${pqRes.statusText}`);

    const pqData = await pqRes.json();

    render(pqData);

  } catch (err) {
    console.error(err);
    showError(
      `Could not load <code>${escHtml(prequizFile)}</code>.<br>
      <small>${escHtml(err.message)}</small><br><br>
      Make sure the file exists and the page is served over HTTP (not via <code>file://</code>).`
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   Render
───────────────────────────────────────────────────────────── */
function render(data) {
  const pq       = data.prequiz || {};
  const keywords = data.keywords || [];

  document.title = `${pq.title || 'Pre-Quiz Review'} · Developer Knowledge`;
  el('header-title').textContent = pq.title || 'Pre-Quiz Review';
  el('hero-icon').textContent    = pq.icon  || '📖';
  el('hero-title').textContent   = pq.title || 'Keywords';
  el('hero-desc').textContent    = pq.description || '';

  // Build card list from the prequiz JSON (pokemon:"yes" marks the impostors)
  const cards = shuffle(
    keywords.map(kw => ({ term: kw.term, isPokemon: kw.pokemon === 'yes' }))
  );

  el('stat-total').textContent = cards.length;

  const selected = new Set();   // indices of cards the user clicked
  let revealed   = false;

  /* ── Build grid ── */
  const grid = el('keywords-grid');
  grid.innerHTML = '';

  cards.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'kw-card';
    div.style.animationDelay = `${i * 0.04}s`;
    div.innerHTML = `<div class="kw-term">${escHtml(card.term)}</div>`;

    div.addEventListener('click', () => {
      if (revealed) return;
      div.classList.toggle('selected');
      if (selected.has(i)) selected.delete(i);
      else selected.add(i);
    });

    grid.appendChild(div);
  });

  /* ── Submit / reveal ── */
  el('btn-submit').addEventListener('click', () => {
    if (revealed) return;
    revealed = true;

    el('btn-submit').classList.add('hidden');

    const cardEls = Array.from(grid.querySelectorAll('.kw-card'));
    cardEls.forEach((div, i) => {
      const card        = cards[i];
      const wasSelected = selected.has(i);
      const termEl      = div.querySelector('.kw-term');

      div.classList.remove('selected');

      if (card.isPokemon && wasSelected) {
        // ✓ Correctly identified a Pokémon
        div.classList.add('result-correct');
        termEl.insertAdjacentHTML('beforeend',
          '<span class="result-badge correct-badge">✓ Pokémon</span>');

      } else if (card.isPokemon && !wasSelected) {
        // ✗ Missed this Pokémon
        div.classList.add('result-missed');
        termEl.insertAdjacentHTML('beforeend',
          '<span class="result-badge missed-badge">✗ Missed</span>');

      } else if (!card.isPokemon && wasSelected) {
        // ~ Wrongly marked a real term
        div.classList.add('result-wrong');
        termEl.insertAdjacentHTML('beforeend',
          '<span class="result-badge wrong-badge">Real term</span>');
      }
    });

    el('result-legend').classList.remove('hidden');
    el('cta-bar').classList.remove('hidden');
    setTimeout(() => {
      el('cta-bar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  });

  showView('content');
}

/* ─────────────────────────────────────────────────────────────
   Boot
───────────────────────────────────────────────────────────── */
loadPrequiz();
