const DIFFICULTY_LABELS = {
  easy: 'Beginner', medium: 'Intermediate',
  hard: 'Advanced', mixed: 'Mixed Levels'
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadQuizzes() {
  const grid    = document.getElementById('quiz-grid');
  const countEl = document.getElementById('quiz-count');

  try {
    const res = await fetch('quiz/0-quizzes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data   = await res.json();
    const quizzes = data.quizzes || [];

    grid.innerHTML = '';
    countEl.textContent = `${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''}`;

    quizzes.forEach(q => {
      grid.appendChild(buildCard(q));
    });

    grid.appendChild(buildAddCard());

  } catch (err) {
    console.error('Failed to load quizzes:', err);
    grid.innerHTML = `
      <div class="state-container">
        <span class="state-icon">⚠️</span>
        <p class="state-title">Could not load quizzes</p>
        <p class="state-sub">Ensure <code>quiz/0-quizzes.json</code> is present and the page is served over HTTP(S).</p>
      </div>`;
    countEl.textContent = '—';
  }
}

function buildCard(q) {
  const diffClass = q.difficulty || 'mixed';
  const diffLabel = DIFFICULTY_LABELS[diffClass] || diffClass;
  const quizParam = (q.file || '').replace(/\.json$/, '');

  const a = document.createElement('a');
  a.href = `prequiz.html?quiz=${encodeURIComponent(quizParam)}`;
  a.className = `quiz-card${q.featured ? ' featured' : ''}`;
  a.setAttribute('aria-label', `Start quiz: ${q.title}`);

  a.innerHTML = `
    <div class="card-icon">${q.icon || '📋'}</div>
    <div class="card-category">${escHtml(q.category || 'Quiz')}</div>
    <div class="card-title">${escHtml(q.title)}</div>
    <p class="card-desc">${escHtml(q.description || '')}</p>
    <div class="card-meta">
      <span class="meta-chip">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
          <path d="M6 3.5V6.5L7.5 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        ${escHtml(String(q.estimatedMinutes || '?'))} min
      </span>
      <span class="meta-chip">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.2"/>
          <path d="M4 6h4M4 8h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        ${escHtml(String(q.questionCount || '?'))} questions
      </span>
      <span class="difficulty-chip ${escHtml(diffClass)}">${escHtml(diffLabel)}</span>
    </div>
    <div class="card-cta">
      Start Quiz
      <span class="card-cta-arrow">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="white" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>`;

  return a;
}

function buildAddCard() {
  const div = document.createElement('div');
  div.className = 'add-quiz-card';
  div.innerHTML = `
    <div class="add-icon">+</div>
    <div class="add-title">Add a New Quiz</div>
    <div class="add-sub">Drop a JSON file in the <code>quiz/</code> folder<br>and register it in <code>quiz/0-quizzes.json</code></div>`;
  return div;
}

loadQuizzes();
