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

function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
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
    const [pqRes, pkRes] = await Promise.all([
      fetch(prequizFile),
      fetch('pokemon.json')
    ]);

    if (!pqRes.ok) throw new Error(`HTTP ${pqRes.status}: ${pqRes.statusText}`);

    const pqData  = await pqRes.json();
    const pokemon = pkRes.ok ? await pkRes.json() : [];

    render(pqData, pokemon);

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
function render(data, pokemonList) {
  const pq       = data.prequiz || {};
  const keywords = data.keywords || [];

  document.title = `${pq.title || 'Pre-Quiz Review'} · Developer Knowledge`;
  el('header-title').textContent = pq.title || 'Pre-Quiz Review';
  el('hero-icon').textContent    = pq.icon  || '📖';
  el('hero-title').textContent   = pq.title || 'Keywords';
  el('hero-desc').textContent    = pq.description || '';

  const pokemonCount  = pokemonList.length ? Math.floor(Math.random() * 4) + 2 : 0;
  const chosenPokemon = pickRandom(pokemonList, pokemonCount);

  el('stat-keywords').textContent = keywords.length;
  el('stat-pokemon').textContent  = pokemonCount;

  const cards = [
    ...keywords.map(kw => ({ type: 'keyword', ...kw })),
    ...chosenPokemon.map(name => ({
      type: 'pokemon',
      term: name,
      definition: `${name} is a Pokémon — not a developer concept! All Pokémon names and characters are trademarks of The Pokémon Company and its affiliates.`,
      category: 'Pokémon'
    }))
  ];

  const grid = el('keywords-grid');
  grid.innerHTML = '';

  shuffle(cards).forEach((card, i) => {
    const div = document.createElement('div');
    div.className = `kw-card${card.type === 'pokemon' ? ' pokemon-card' : ''}`;
    div.style.animationDelay = `${i * 0.04}s`;

    if (card.type === 'pokemon') {
      div.innerHTML = `
        <div class="kw-category">${escHtml(card.category)}</div>
        <div class="kw-term">
          ${escHtml(card.term)}
          <span class="pokemon-badge">⚡ Pokémon</span>
        </div>
        <div class="kw-definition">${escHtml(card.definition)}</div>`;
    } else {
      div.innerHTML = `
        <div class="kw-category">${escHtml(card.category || '')}</div>
        <div class="kw-term">${escHtml(card.term)}</div>
        <div class="kw-definition">${escHtml(card.definition || '')}</div>`;
    }

    grid.appendChild(div);
  });

  showView('content');
}

/* ─────────────────────────────────────────────────────────────
   Boot
───────────────────────────────────────────────────────────── */
loadPrequiz();
