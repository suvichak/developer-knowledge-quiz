# Developer Knowledge Quiz — Developer Guide

A zero-dependency, file-based quiz platform built with vanilla HTML, CSS, and JavaScript. No build tools or package manager required. Quizzes are defined entirely in JSON files; adding a new quiz is a matter of dropping two JSON files into the `quiz/` folder and registering an entry in `quiz/_quizzes.json`.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Running Locally](#2-running-locally)
3. [Page Flow](#3-page-flow)
4. [Adding a New Quiz](#4-adding-a-new-quiz)
   - [Step 1 — Register in quiz/_quizzes.json](#step-1--register-in-quiz_quizzesjson)
   - [Step 2 — Create the quiz JSON](#step-2--create-the-quiz-json)
   - [Step 3 — Create the pre-quiz JSON](#step-3--create-the-pre-quiz-json)
5. [JSON Schema Reference](#5-json-schema-reference)
   - [quiz/_quizzes.json](#quiz_quizzesjson)
   - [quiz/\<id\>.json](#quizidJson)
   - [quiz/\<id\>-prequiz.json](#quizid-prequizjson)
6. [CSS Architecture](#6-css-architecture)
7. [JavaScript Architecture](#7-javascript-architecture)
8. [Pokémon Copyright Notice](#8-pokémon-copyright-notice)

---

## 1. Project Structure

```
developer-knowledge-quiz/
│
├── index.html              # Quiz catalogue page
├── prequiz.html            # Pre-quiz keyword review page
├── quiz.html               # Quiz engine page
│
│
├── quiz/
│   ├── _quizzes.json           # Registry of all available quizzes
├── pokemon.json            # Flat array of Pokémon names (used as impostors)
│   ├── template.json           # Quiz questions & settings
│   └── template-prequiz.json   # Pre-quiz keyword glossary
│
├── css/
│   ├── shared.css          # Design tokens, reset, global utilities
│   ├── index.css           # Styles for index.html only
│   ├── quiz.css            # Styles for quiz.html only
│   └── prequiz.css         # Styles for prequiz.html only
│
└── js/
    ├── index.js            # Quiz catalogue logic
    ├── quiz.js             # Quiz engine (load → intro → questions → results)
    └── prequiz.js          # Pre-quiz keyword + Pokémon impostor renderer
```

---

## 2. Running Locally

The pages use `fetch()` to load JSON files, so they **must be served over HTTP** — they will not work when opened directly as `file://` URLs.

The simplest option is the VS Code **Live Server** extension (right-click `index.html` → *Open with Live Server*). Any static file server works:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .

# VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

---

## 3. Page Flow

```
index.html
  └─► prequiz.html?quiz=quiz/<id>       (keyword review + Pokémon impostors)
        └─► quiz.html?quiz=quiz/<id>    (intro → questions → results)
```

| Page | URL parameter | Data loaded |
|---|---|---|
| `index.html` | — | `quiz/_quizzes.json` |
| `prequiz.html` | `?quiz=quiz/<id>` | `quiz/<id>-prequiz.json` + `pokemon.json` |
| `quiz.html` | `?quiz=quiz/<id>` | `quiz/<id>.json` |

---

## 4. Adding a New Quiz

### Step 1 — Register in `quiz/_quizzes.json`

Add an entry to the `"quizzes"` array:

```json
{
  "id": "your-quiz-id",
  "file": "quiz/your-quiz-id.json",
  "title": "Your Quiz Title",
  "subtitle": "A short subtitle shown on the card",
  "description": "Description shown on the card.",
  "category": "Category Label",
  "icon": "🧠",
  "difficulty": "medium",
  "questionCount": 10,
  "estimatedMinutes": 8,
  "tags": ["tag1", "tag2"],
  "featured": false
}
```

`difficulty` controls the colour chip on the card: `easy` | `medium` | `hard` | `mixed`.

### Step 2 — Create the quiz JSON

Create `quiz/your-quiz-id.json` following the schema in [section 5](#5-json-schema-reference). Use `quiz/template.json` as a starting point — copy it and replace the placeholder questions.

### Step 3 — Create the pre-quiz JSON

Create `quiz/your-quiz-id-prequiz.json` following the schema in [section 5](#5-json-schema-reference). Use `quiz/template-prequiz.json` as a starting point.

The file name **must** follow the pattern `<quizId>-prequiz.json` — `prequiz.js` derives the path automatically by appending `-prequiz.json` to the quiz ID.

---

## 5. JSON Schema Reference

### `quiz/_quizzes.json`

Central registry consumed by `js/index.js`.

```
{
  "quizzes": [ <QuizCard>, ... ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✓ | Unique identifier, matches the filename stem |
| `file` | string | ✓ | Relative path to the quiz JSON, e.g. `quiz/my-quiz.json` |
| `title` | string | ✓ | Displayed on the quiz card |
| `subtitle` | string | | Short subtitle |
| `description` | string | | Card body text |
| `category` | string | | Shown as a small label above the title |
| `icon` | string | | Emoji icon |
| `difficulty` | string | | `easy` \| `medium` \| `hard` \| `mixed` |
| `questionCount` | number | | Displayed on the card chip |
| `estimatedMinutes` | number | | Displayed on the card chip |
| `tags` | string[] | | Not currently displayed; reserved for filtering |
| `featured` | boolean | | Adds a persistent top border accent to the card |

---

### `quiz/<id>.json`

```
{
  "meta":      { ... },
  "quiz":      { ... },
  "settings":  { ... },
  "questions": [ <Question>, ... ]
}
```

#### `meta`

| Field | Type | Description |
|---|---|---|
| `id` | string | Should match the filename stem |
| `version` | string | Semver string, e.g. `"1.0"` |
| `createdAt` | string | ISO date |
| `updatedAt` | string | ISO date |
| `author` | string | |
| `language` | string | BCP-47 language code, e.g. `"en"` |

#### `quiz`

| Field | Type | Description |
|---|---|---|
| `title` | string | Shown on the intro screen and browser tab |
| `subtitle` | string | |
| `description` | string | Shown on the intro screen |
| `category` | string | |
| `tags` | string[] | |
| `icon` | string | Emoji |
| `difficulty` | string | `easy` \| `medium` \| `hard` \| `mixed` |
| `estimatedMinutes` | number | |

#### `settings`

| Field | Type | Default | Description |
|---|---|---|---|
| `shuffleQuestions` | boolean | `false` | Not yet implemented in engine |
| `shuffleOptions` | boolean | `false` | Not yet implemented in engine |
| `passingScore` | number | `70` | Percentage threshold for "Passed" badge |
| `showProgressBar` | boolean | `true` | Not yet read by engine (bar always shown) |
| `allowRetake` | boolean | `true` | Controls "Retake" button visibility — not yet enforced |

#### `Question`

```json
{
  "id": 1,
  "text": "Question text shown to the user",
  "options": [
    { "id": "A", "text": "First option" },
    { "id": "B", "text": "Second option" },
    { "id": "C", "text": "Third option" },
    { "id": "D", "text": "Fourth option" }
  ],
  "correctAnswer": "A",
  "explanation": "Explanation shown after any answer is selected.",
  "wrongAnswerFeedback": {
    "B": "Specific reason why B is wrong.",
    "C": "Specific reason why C is wrong.",
    "D": "Specific reason why D is wrong."
  },
  "difficulty": "easy",
  "tags": ["html"],
  "reference": "https://developer.mozilla.org/..."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | number | ✓ | Unique within the quiz |
| `text` | string | ✓ | The question |
| `options` | `{id, text}[]` | ✓ | Exactly 4 options recommended; `id` is the letter shown |
| `correctAnswer` | string | ✓ | Must match one `option.id` |
| `explanation` | string | | Shown in the feedback panel for any selection |
| `wrongAnswerFeedback` | `{[optionId]: string}` | | Per-option wrong-answer message; falls back to a generic message |
| `difficulty` | string | | `easy` \| `medium` \| `hard` |
| `tags` | string[] | | Reserved |
| `reference` | string | | URL; not currently rendered in the UI |

---

### `quiz/<id>-prequiz.json`

```
{
  "meta":     { ... },
  "prequiz":  { ... },
  "keywords": [ <Keyword>, ... ]
}
```

#### `meta`

| Field | Type | Description |
|---|---|---|
| `quizId` | string | Must match the quiz filename stem |
| `version` | string | |
| `createdAt` | string | ISO date |
| `updatedAt` | string | ISO date |

#### `prequiz`

| Field | Type | Description |
|---|---|---|
| `title` | string | Shown in the hero banner |
| `subtitle` | string | |
| `description` | string | Shown below the title |
| `icon` | string | Emoji |

#### `Keyword`

```json
{
  "term": "REST API",
  "definition": "An architectural style for building web services using standard HTTP methods.",
  "category": "APIs"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `term` | string | ✓ | The word or phrase |
| `definition` | string | ✓ | Explanation shown on the card |
| `category` | string | | Small label above the term |

At runtime, `prequiz.js` randomly selects **2–5** Pokémon names from `pokemon.json` and injects them as impostor cards, styled distinctly in yellow, before shuffling the full set.

---

## 6. CSS Architecture

| File | Scope |
|---|---|
| `css/shared.css` | Design tokens (CSS custom properties), reset, `body`, `.hidden`, `.fade-in`, `.spinner`, `.btn`, `.btn-primary`, `.btn-secondary`, `.back-btn`, `header` base, `footer` base, `.error-*` |
| `css/index.css` | Hero section, quiz grid & cards, How It Works section, index-specific footer layout |
| `css/quiz.css` | Progress bar, intro card, question card, option buttons & states, feedback panel, results & score circle, answer review |
| `css/prequiz.css` | Pre-quiz hero banner, legend, keyword grid & cards, Pokémon impostor card variant, CTA bar, prequiz-specific footer |

All design tokens are defined once in `css/shared.css` under `:root` and consumed via `var()` across all other files.

### Design Tokens

```css
--primary-blue, --primary-dark
--accent-teal, --accent-yellow, --accent-red
--light-blue, --mid-blue
--correct-bg, --correct-border, --correct-text
--wrong-bg,   --wrong-border,   --wrong-text
--bg, --surface, --surface-2
--text-primary, --text-secondary, --text-tertiary
--border, --border-light
--shadow-sm, --shadow-md, --shadow-lg, --shadow-hover
--radius, --radius-sm, --radius-lg, --radius-xl
--font
```

---

## 7. JavaScript Architecture

All JS is vanilla ES2020+. No frameworks, no bundler.

### `js/index.js`

| Function | Description |
|---|---|
| `loadQuizzes()` | Fetches `quiz/_quizzes.json`, renders quiz cards and the placeholder "Add" card |
| `buildCard(q)` | Returns an `<a>` element that links to `prequiz.html?quiz=…` |
| `buildAddCard()` | Returns the dashed "Add a New Quiz" placeholder card |
| `escHtml(str)` | HTML-escapes a string before inserting into the DOM |

### `js/quiz.js`

Exports a single IIFE `engine` with three public methods:

| Method | Description |
|---|---|
| `engine.load()` | Reads `?quiz=` from the URL, fetches the JSON, calls `init()` |
| `engine.start()` | Resets state and begins the question loop |
| `engine.retake()` | Resets the progress bar and calls `start()` |

Internal flow: `load` → `init` (intro screen) → `start` → `renderQuestion` (loop) → `answer` → `showFeedback` → `advance` → `showResults` → `buildReview`.

Global helpers: `toggleReview(headerEl)`, `showError(htmlMsg)`, `capitalise(str)`, `animateCountUp(el, from, to, duration, format)`.

### `js/prequiz.js`

| Function | Description |
|---|---|
| `loadPrequiz()` | Reads `?quiz=` from the URL, derives the `-prequiz.json` path, fetches it and `pokemon.json` in parallel |
| `render(data, pokemonList)` | Populates the hero, picks 2–5 random Pokémon impostors, shuffles all cards, builds the grid |
| `shuffle(arr)` | Fisher-Yates in-place shuffle |
| `pickRandom(arr, n)` | Returns `n` random elements from `arr` |
| `escHtml(str)` | HTML-escapes a string |

---

## 8. Pokémon Copyright Notice

Pokémon names used as quiz impostors in the pre-quiz pages are trademarks of **The Pokémon Company** and its affiliates. All Pokémon names are © Nintendo / Creatures Inc. / GAME FREAK inc. They are used here solely for educational and non-commercial entertainment purposes.
