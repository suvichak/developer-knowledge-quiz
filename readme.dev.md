# Developer Knowledge Quiz — Dev Reference

Vanilla HTML/CSS/JS, zero dependencies. Quizzes are pure JSON files.  
**Live:** https://suvichak.github.io/developer-knowledge-quiz/  
**Local:** must use HTTP (`python3 -m http.server 8080` or VS Code Live Server) — `fetch()` blocks `file://`.

---

## File Map

```
index.html          # catalogue page
prequiz.html        # keyword review (prequiz.html?quiz=quiz/<id>)
quiz.html           # quiz engine  (quiz.html?quiz=quiz/<id>)
quiz/0-quizzes.json  # registry of all quizzes (loaded by index.js)
quiz/<id>.json      # quiz questions + settings
quiz/<id>-prequiz.json  # keyword glossary for pre-quiz
pokemon.json        # flat array of Pokémon names (impostor cards)
css/shared.css      # design tokens (:root), reset, shared components
css/index.css       # index.html only
css/quiz.css        # quiz.html only
css/prequiz.css     # prequiz.html only
js/index.js         # loadQuizzes(), buildCard(), buildAddCard(), escHtml()
js/quiz.js          # IIFE engine: load()→init()→start()→renderQuestion()→answer()→showFeedback()→advance()→showResults()→buildReview()
js/prequiz.js       # loadPrequiz(), render(), shuffle(), pickRandom(), escHtml()
```

---

## Page Flow

`index.html` → `prequiz.html?quiz=quiz/<id>` → `quiz.html?quiz=quiz/<id>`

| Page | Fetches |
|---|---|
| index.html | `quiz/0-quizzes.json` |
| prequiz.html | `quiz/<id>-prequiz.json` + `pokemon.json` |
| quiz.html | `quiz/<id>.json` |

---

## Adding a Quiz (3 steps)

**1. Register in `quiz/0-quizzes.json`:**
```json
{ "id":"your-id", "file":"quiz/your-id.json", "title":"...", "subtitle":"...",
  "description":"...", "category":"...", "icon":"🧠", "difficulty":"medium",
  "questionCount":10, "estimatedMinutes":8, "tags":[], "featured":false }
```
`difficulty`: `easy` | `medium` | `hard` | `mixed`

**2. Create `quiz/your-id.json`** (copy `quiz/0-template.json`):
```json
{
  "meta": { "id":"", "version":"1.0", "createdAt":"", "updatedAt":"", "author":"", "language":"en" },
  "quiz": { "title":"", "subtitle":"", "description":"", "category":"", "tags":[], "icon":"", "difficulty":"", "estimatedMinutes":0 },
  "settings": { "shuffleQuestions":false, "shuffleOptions":false, "passingScore":70, "showProgressBar":true, "allowRetake":true },
  "questions": [
    { "id":1, "text":"", "options":[{"id":"A","text":""},{"id":"B","text":""},{"id":"C","text":""},{"id":"D","text":""}],
      "correctAnswer":"A", "explanation":"", "wrongAnswerFeedback":{"B":"","C":"","D":""}, "difficulty":"easy", "tags":[], "reference":"" }
  ]
}
```

**3. Create `quiz/your-id-prequiz.json`** (copy `quiz/0-template-prequiz.json`):
```json
{
  "meta": { "quizId":"", "version":"1.0", "createdAt":"", "updatedAt":"" },
  "prequiz": { "title":"", "subtitle":"", "description":"", "icon":"" },
  "keywords": [{ "term":"", "definition":"", "category":"" }]
}
```
File name **must** be `<quizId>-prequiz.json` — `prequiz.js` derives it automatically.

At runtime `prequiz.js` injects **2–5** random Pokémon from `pokemon.json` as yellow impostor cards.

---

## CSS Tokens (all in `css/shared.css` `:root`)

```
--primary-blue  --primary-dark  --accent-teal  --accent-yellow  --accent-red
--light-blue  --mid-blue
--correct-bg/border/text   --wrong-bg/border/text
--bg  --surface  --surface-2
--text-primary/secondary/tertiary  --border  --border-light
--shadow-sm/md/lg/hover  --radius/-sm/-lg/-xl  --font
```

---

## Error: "Could not load quizzes"

Causes: opened as `file://` URL, or `quiz/0-quizzes.json` missing. Use the live URL or a local HTTP server.

# Pokemon name for pre-quiz impostor cards is at pokemon.json,
pokemon name for quiz is at pokemon.json, 