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
  ['loading', 'error', 'intro', 'question', 'results'].forEach(v => {
    el(`view-${v}`).classList.toggle('hidden', v !== name);
  });
}

/* ─────────────────────────────────────────────────────────────
   Quiz Engine
───────────────────────────────────────────────────────────── */
const engine = (() => {
  let quiz = null;
  let questions = [];
  let currentIdx = 0;
  let answers = [];
  let answered = false;

  // ── Load ─────────────────────────────────────────────────
  async function load() {
    const params = new URLSearchParams(window.location.search);
    const quizParam = params.get('quiz');

    if (!quizParam) {
      showError('No quiz specified. Add <code>?quiz=quiz/template</code> to the URL.');
      return;
    }

    const quizFile = quizParam.endsWith('.json') ? quizParam : quizParam + '.json';

    try {
      const res = await fetch(quizFile);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      quiz = data;
      questions = data.questions || [];
      if (!questions.length) throw new Error('Quiz has no questions.');
      init();
    } catch (err) {
      console.error(err);
      showError(`Could not load <code>${escHtml(quizFile)}</code>.<br>
        <small>${escHtml(err.message)}</small><br><br>
        Make sure the file exists and the page is served over HTTP (not via <code>file://</code>).`);
    }
  }

  // ── Init (populate intro screen) ─────────────────────────
  function init() {
    const q = quiz.quiz || {};
    const s = quiz.settings || {};
    document.title = `${q.title || 'Quiz'} · Developer Knowledge`;
    el('header-title').textContent = q.title || 'Quiz';
    el('intro-icon').textContent = q.icon || '📋';
    el('intro-category').textContent = q.category || '';
    el('intro-title').textContent = q.title || '';
    el('intro-desc').textContent = q.description || '';
    el('intro-q-count').textContent = questions.length;
    el('intro-time').textContent = q.estimatedMinutes || '?';
    el('intro-pass').textContent = (s.passingScore || 70) + '%';
    showView('intro');
  }

  // ── Start quiz ────────────────────────────────────────────
  function start() {
    currentIdx = 0;
    answers = [];
    answered = false;
    el('progress-bar-wrap').style.display = 'block';
    el('header-title').style.opacity = '1';
    showView('question');
    renderQuestion();
  }

  // ── Render current question ───────────────────────────────
  function renderQuestion() {
    const q = questions[currentIdx];
    answered = false;

    el('q-num').textContent = currentIdx + 1;
    el('q-total').textContent = questions.length;
    el('q-text').textContent = q.text;

    const dEl = el('q-difficulty');
    dEl.textContent = capitalise(q.difficulty || '');
    dEl.className = `q-difficulty ${q.difficulty || ''}`;
    dEl.style.display = q.difficulty ? '' : 'none';

    const pct = (currentIdx / questions.length) * 100;
    el('progress-bar').style.width = pct + '%';

    const card = el('q-card');
    card.classList.remove('fade-in');
    void card.offsetWidth;
    card.classList.add('fade-in');

    const list = el('options-list');
    list.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.id = opt.id;
      btn.setAttribute('aria-label', `Option ${opt.id}: ${opt.text}`);
      btn.innerHTML = `
        <span class="option-letter">${escHtml(opt.id)}</span>
        <span class="option-text">${escHtml(opt.text)}</span>
        <span class="option-icon" aria-hidden="true"></span>`;
      btn.addEventListener('click', () => answer(opt.id));
      list.appendChild(btn);
    });

    const fb = el('feedback-panel');
    fb.className = 'feedback-panel';
    fb.style.display = 'none';
    el('next-wrap').classList.remove('visible');
    el('btn-next').onclick = advance;
    el('next-label').textContent = currentIdx < questions.length - 1 ? 'Next Question' : 'See Results';
  }

  // ── Process answer ────────────────────────────────────────
  function answer(selectedId) {
    if (answered) return;
    answered = true;

    const q = questions[currentIdx];
    const isCorrect = selectedId === q.correctAnswer;

    answers.push({
      questionId:   q.id,
      questionText: q.text,
      selectedId,
      correctId:    q.correctAnswer,
      isCorrect,
      explanation:  q.explanation || '',
      wrongFeedback: q.wrongAnswerFeedback?.[selectedId] || null,
      options:      q.options,
      reference:    q.reference || null,
      difficulty:   q.difficulty || null
    });

    const buttons = el('options-list').querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      const id = btn.dataset.id;
      const iconEl = btn.querySelector('.option-icon');
      if (id === q.correctAnswer) {
        btn.classList.add('state-correct');
        iconEl.textContent = '✓';
      } else if (id === selectedId && !isCorrect) {
        btn.classList.add('state-wrong');
        iconEl.textContent = '✗';
      } else {
        btn.classList.add('state-dimmed');
      }
    });

    showFeedback(isCorrect, selectedId, q);
    el('next-wrap').classList.add('visible');
  }

  // ── Show feedback ─────────────────────────────────────────
  function showFeedback(isCorrect, selectedId, q) {
    const panel  = el('feedback-panel');
    const header = el('feedback-header');
    const body   = el('feedback-body');
    const reveal = el('feedback-reveal');

    if (isCorrect) {
      panel.className = 'feedback-panel visible panel-correct';
      header.innerHTML = `<span>✓</span> That's correct!`;
      body.textContent = q.explanation || '';
      reveal.classList.add('hidden');
    } else {
      panel.className = 'feedback-panel visible panel-wrong';
      header.innerHTML = `<span>✗</span> Not quite right`;

      const reason = q.wrongAnswerFeedback?.[selectedId] || 'That option is incorrect.';
      body.textContent = reason;

      const correctOpt = q.options.find(o => o.id === q.correctAnswer);
      if (correctOpt) {
        reveal.innerHTML = `
          <strong>Correct answer — ${escHtml(correctOpt.id)}:</strong>
          ${escHtml(correctOpt.text)}<br>
          <span style="font-weight:400;color:var(--text-secondary)">${escHtml(q.explanation || '')}</span>`;
        reveal.classList.remove('hidden');
      } else {
        reveal.classList.add('hidden');
      }
    }

    panel.style.display = 'block';
  }

  // ── Advance ───────────────────────────────────────────────
  function advance() {
    currentIdx++;
    if (currentIdx >= questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  // ── Results ───────────────────────────────────────────────
  function showResults() {
    const total       = questions.length;
    const correct     = answers.filter(a => a.isCorrect).length;
    const pct         = Math.round((correct / total) * 100);
    const passingScore = (quiz.settings?.passingScore) ?? 70;
    const passed      = pct >= passingScore;

    el('progress-bar').style.width = '100%';
    showView('results');

    const circumference = 376.99;
    const offset  = circumference * (1 - pct / 100);
    const fillEl  = el('score-fill');
    fillEl.style.stroke = passed ? 'var(--accent-teal)' : 'var(--accent-red)';
    fillEl.style.transition = 'none';
    fillEl.style.strokeDashoffset = circumference;
    void fillEl.getBoundingClientRect();
    fillEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    fillEl.style.strokeDashoffset = offset;

    animateCountUp(el('score-pct-text'), 0, pct, 1200, v => v + '%');
    el('score-raw-text').textContent = `${correct} / ${total}`;
    el('results-score-line').textContent = `You got ${correct} out of ${total} correct`;

    const badge = el('results-badge');
    badge.textContent = passed ? '🎉 Passed' : '📚 Keep Practising';
    badge.className   = `results-badge ${passed ? 'passed' : 'failed'}`;

    const messages = {
      high: 'Excellent work! You have a strong understanding of these concepts.',
      mid:  'Good effort! Review the questions you missed to reinforce your knowledge.',
      low:  'No worries — every quiz is a learning opportunity. Review the answers below and try again!'
    };
    el('results-message').textContent =
      pct >= 80 ? messages.high : pct >= 50 ? messages.mid : messages.low;

    buildReview();
  }

  // ── Build answer review list ──────────────────────────────
  function buildReview() {
    const list = el('review-list');
    list.innerHTML = '';

    answers.forEach((a, i) => {
      const item = document.createElement('div');
      item.className = 'review-item';

      const optionsHtml = a.options.map(opt => {
        const isCorrect   = opt.id === a.correctId;
        const wasSelected = opt.id === a.selectedId;
        let cls = 'review-option';
        if (isCorrect)              cls += ' is-correct';
        if (wasSelected && !a.isCorrect) cls += ' was-selected is-wrong';
        const tag = isCorrect ? '✓' : (wasSelected && !a.isCorrect) ? '✗' : '';
        return `<div class="${cls}">
          <span class="review-letter">${escHtml(opt.id)}</span>
          <span>${escHtml(opt.text)}</span>
          ${tag ? `<span style="margin-left:auto;font-weight:700">${tag}</span>` : ''}
        </div>`;
      }).join('');

      item.innerHTML = `
        <div class="review-item-header" onclick="toggleReview(this)">
          <span class="review-status ${a.isCorrect ? 'correct' : 'wrong'}">
            ${a.isCorrect ? '✓' : '✗'}
          </span>
          <div style="flex:1">
            <span class="review-q-num">Q${i + 1}</span>
            <span class="review-q-text">${escHtml(a.questionText)}</span>
          </div>
          <svg class="review-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="review-body">
          <div class="review-answers">${optionsHtml}</div>
          <div class="review-explanation">${escHtml(a.explanation)}</div>
        </div>`;

      list.appendChild(item);
    });
  }

  // ── Retake ────────────────────────────────────────────────
  function retake() {
    el('progress-bar').style.width = '0%';
    start();
  }

  return { load, start, retake };
})();

/* ─────────────────────────────────────────────────────────────
   Review Toggle
───────────────────────────────────────────────────────────── */
function toggleReview(headerEl) {
  headerEl.closest('.review-item').classList.toggle('open');
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function showError(htmlMsg) {
  el('error-msg').innerHTML = htmlMsg;
  showView('error');
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function animateCountUp(el, from, to, duration, format) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ─────────────────────────────────────────────────────────────
   Boot
───────────────────────────────────────────────────────────── */
engine.load();
