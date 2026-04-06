/* ─────────────────────────────────────────────────────────────
   Verify — Quiz Success Token verifier
   Runs entirely in the browser (Web Crypto API).
   Compatible with GitHub Pages (static hosting).
───────────────────────────────────────────────────────────── */

/* ── Utility ───────────────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Verifier ──────────────────────────────────────────────── */
const verifier = (() => {

  /**
   * Decode and integrity-check a Quiz Success Token.
   * Returns { valid, payload, error }.
   *
   * The canonical string hashed must match what buildToken() in quiz.js
   * produces:  v|quiz|name|ts|score|correct|total|passed01
   */
  async function decodeToken(token) {
    let payload;
    try {
      // Base64 → UTF-8 JSON (handles Unicode via encodeURIComponent/unescape trick)
      const json = decodeURIComponent(escape(atob(token.trim())));
      payload = JSON.parse(json);
    } catch {
      return { valid: false, payload: null, error: 'Token is not valid Base64 JSON.' };
    }

    const { v, quiz, name, ts, score, correct, total, passed, digest } = payload;

    // Structural check
    if (v !== 1 || !quiz || !name || !ts || score === undefined ||
        correct === undefined || total === undefined || passed === undefined || !digest) {
      return { valid: false, payload, error: 'Token is missing required fields.' };
    }

    // Recompute SHA-256 digest — must match quiz.js canonical format exactly
    const canonical = [v, quiz, name, ts, score, correct, total, passed ? '1' : '0'].join('|');
    const msgBuf  = new TextEncoder().encode(canonical);
    const hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);
    const computed = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (computed !== digest) {
      return { valid: false, payload, error: 'Digest mismatch — token may have been tampered with.' };
    }

    return { valid: true, payload, error: null };
  }

  /* ── Format helpers ──────────────────────────────────────── */
  function formatDate(isoString) {
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return isoString;
    }
  }

  function row(icon, label, value, extraClass = '') {
    return `
      <div class="detail-row ${extraClass}">
        <span class="detail-icon">${icon}</span>
        <div class="detail-content">
          <span class="detail-label">${escHtml(label)}</span>
          <span class="detail-value">${escHtml(value)}</span>
        </div>
      </div>`;
  }

  /* ── Public: verify ──────────────────────────────────────── */
  async function verify() {
    const token = el('verify-input').value.trim();
    if (!token) {
      el('verify-input').focus();
      return;
    }

    const btn = el('btn-verify');
    btn.disabled = true;
    btn.textContent = 'Verifying…';

    const resultEl  = el('verify-result');
    const statusEl  = el('verify-status');
    const detailsEl = el('verify-details');
    const rawEl     = el('verify-raw');

    resultEl.classList.add('hidden');

    try {
      const { valid, payload, error } = await decodeToken(token);

      if (valid) {
        const passBadge = payload.passed
          ? '<span class="score-badge passed">Passed</span>'
          : '<span class="score-badge failed">Did not pass</span>';

        statusEl.innerHTML = `
          <div class="status-valid">
            <span class="status-icon">✓</span>
            <div>
              <div class="status-title">Valid Token</div>
              <div class="status-sub">Integrity verified — this token has not been tampered with.</div>
            </div>
          </div>`;

        // Build TSA token row
        const tsaRow = payload.tsaToken
          ? `<div class="detail-row">
              <span class="detail-icon">🔏</span>
              <div class="detail-content">
                <span class="detail-label">RFC 3161 Timestamp Token</span>
                <span class="detail-value tsa-present">
                  Present — issued by FreeTSA.org
                  <span class="tsa-hint">
                    Verify offline with OpenSSL:<br>
                    <code>echo "${escHtml(payload.tsaToken)}" | base64 -d &gt; token.tsr</code><br>
                    <code>openssl ts -verify -in token.tsr -digest ${escHtml(payload.digest)} -sha256 -CAfile cacert.pem</code>
                  </span>
                </span>
              </div>
            </div>`
          : `<div class="detail-row">
              <span class="detail-icon">⚠️</span>
              <div class="detail-content">
                <span class="detail-label">RFC 3161 Timestamp Token</span>
                <span class="detail-value tsa-absent">Not present — TSA was unreachable at generation time</span>
              </div>
            </div>`;

        detailsEl.innerHTML =
          row('👤', 'Name',       payload.name) +
          row('📋', 'Quiz',       payload.quiz) +
          row('🕐', 'Timestamp',  formatDate(payload.ts)) +
          row('📊', 'Score',      `${payload.score}% (${payload.correct} / ${payload.total} correct)`) +
          `<div class="detail-row">
            <span class="detail-icon">🏅</span>
            <div class="detail-content">
              <span class="detail-label">Result</span>
              <span class="detail-value">${passBadge}</span>
            </div>
          </div>` +
          row('🔑', 'SHA-256 Digest', payload.digest, 'digest-row') +
          tsaRow;

        rawEl.textContent = JSON.stringify(payload, null, 2);
      } else {
        statusEl.innerHTML = `
          <div class="status-invalid">
            <span class="status-icon">✗</span>
            <div>
              <div class="status-title">Invalid Token</div>
              <div class="status-sub">${escHtml(error)}</div>
            </div>
          </div>`;
        detailsEl.innerHTML = '';
        rawEl.textContent = payload ? JSON.stringify(payload, null, 2) : token;
      }

      resultEl.classList.remove('hidden');
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error(err);
      statusEl.innerHTML = `
        <div class="status-invalid">
          <span class="status-icon">✗</span>
          <div>
            <div class="status-title">Verification Error</div>
            <div class="status-sub">${escHtml(err.message)}</div>
          </div>
        </div>`;
      resultEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Verify Token';
    }
  }

  /* ── Public: clear ───────────────────────────────────────── */
  function clear() {
    el('verify-input').value = '';
    el('verify-result').classList.add('hidden');
    el('verify-input').focus();
  }

  return { verify, clear };
})();

/* ── Auto-fill token from URL param ────────────────────────── */
(function autoFill() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');
  if (token) {
    el('verify-input').value = token;
    // Auto-verify after brief paint delay
    setTimeout(() => verifier.verify(), 120);
  }
})();
