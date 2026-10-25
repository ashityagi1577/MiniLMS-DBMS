# MiniLMS — Online Learning Management System

A college B.Tech CSE **DBMS PBL** project: a vanilla JS/HTML/CSS frontend plus a
Node.js + Express + MySQL backend in `backend/` (the app also still runs in a
frontend-only, `localStorage` demo mode with no server).

Three roles (Student, Instructor, Admin) work on top of a single seeded demo dataset stored in
`localStorage`, with every business rule enforced client-side and logged to an audit trail.

---

## How to run

**Easiest:** open the `minilms` folder and double-click `index.html`.

**Or serve it locally (recommended if your browser restricts `file://` storage):**

```
python -m http.server 8000
```

Then open <http://localhost:8000>.

### Full-stack mode: Node.js + Express + MySQL

The backend in `backend/` serves the same frontend plus the JSON API under
`/api`, and stores everything in MySQL. Run it from one URL:

1. **Configure credentials locally — never in Git:**

   ```powershell
   cd backend
   Copy-Item .env.example .env
   # edit .env and set DB_PASSWORD to your local MySQL password
   npm install
   npm start
   ```

   * `backend/.env` holds the real credentials and is **git-ignored** — never
     commit it, paste it into docs/screenshots, or share it.
   * `backend/.env.example` is the tracked template and contains **placeholders
     only** (`DB_PASSWORD=CHANGE_ME`). Fill in values in your local `.env`.
   * Credentials are read only by `backend/db.js` via `dotenv`; they are never
     sent to the browser, returned by the API, or written to logs.
2. Open <http://localhost:5000>. If MySQL is unreachable the UI shows an
   offline warning and falls back to the local demo dataset.

> **Development-only credentials:** the seeded demo accounts (see
> `database/03_insert_sample_data.sql`) all sign in with the password
> `demo123` (`DEMO_PASSWORD` in `.env`). That weak shared password exists only
> so the project can be evaluated without a real identity provider — it is a
> local academic-demo limitation, not production authentication. Rotate it (and
> the database password) before any real deployment.

### Authentication & session security (backend mode)

- **Passwords** are verified with bcrypt (cost 10) for API-created accounts and
  hashes are never returned by any endpoint. Seeded rows use the documented
  development-only `DEMO_PASSWORD` fallback (see above).
- **Sessions** are bearer tokens: 32 random bytes (`crypto.randomBytes`, 64 hex
  chars). The server stores only a SHA-256 hash of each token plus user id and
  expiry — never a password. Tokens expire after `TOKEN_TTL_MINUTES` (default
  480), are revoked on logout, and a password change revokes every other
  session of that user (max 5 concurrent sessions per user).
- **Login rate limiting** is an in-memory sliding window: 5 failed password
  checks per client IP + e-mail and 100 per client IP in 15 minutes, then HTTP
  `429` with `Retry-After`. Counters reset when the server restarts and are not
  shared between processes.
- **No account enumeration**: unknown e-mail, wrong password and deactivated
  account all return the same generic `401` body, and rate limiting runs before
  the database lookup. Malformed e-mails still get `400`.
- **Password change** exists and requires a valid token plus the current
  password (`POST /api/auth/change-password`); admins can also reset a user's
  password. There is **no** forgot-password / e-mail reset flow — adding one
  would require a one-time-token table, expiry handling and an e-mail provider.

Sign in with any seeded account (password `demo123`), or click a role card
(**Student / Instructor / Admin**) to enter instantly with the default account of that role.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell: login/role-selection screen, sidebar, top bar, toast + modal containers. |
| `style.css` | Design system: blue/purple palette, cards, tables, light **and dark** themes, responsive + print styles. |
| `script.js` | Seed data, `store`/`session`/`api` service layer, hash router, all role pages, forms and actions. |
| `backend/` | Express + mysql2 API (auth, validation, SQL). Credentials come from `backend/.env` (template: `backend/.env.example`). |
| `README.md` | This file. |

---

## Demo accounts — development only (password: `demo123`)

> These credentials exist purely for the local academic demo. Never reuse this
> password (or any seeded account) for anything real.

The login screen offers one demo account per role (configured locally in
`script.js` → `DEMO_ACCOUNTS`). With the backend running, every account from
`database/03_insert_sample_data.sql` works as well (e-mails end in
`@example.com`):

| Role | Email |
|------|-------|
| Admin | `priya.sharma@example.com` |
| Instructor | `ananya.iyer@example.com` |
| Student | `aarav.mehta@example.com` |

**Seeded data (MySQL backend):** 13 users · 3 courses · 6 modules · 14 lessons ·
11 enrollments · 4 quizzes · 6 attempts · 4 grades. The frontend-only mode
keeps its own simulated dataset in `localStorage`.

---

## Features by role

### Student
- Dashboard: enrollments, average progress/grade, open quizzes, announcements, latest results
- Course catalog with live search + category/level filters, enrollment (with prerequisite checks)
- My Courses (active/completed), drop enrollment
- Course detail: modules, sequential lessons, quizzes, progress, roster/grade badges
- Lesson viewer with **sequential unlocking** and "mark complete"
- Timed quiz player (countdown, auto-submit, per-question review, attempt limits)
- My Grades (course grades + full quiz-attempt history) and **printable certificates**
- Notifications centre, profile editing, password change, theme toggle

### Instructor
- Dashboard with class stats and a "needs attention" queue (draft grades)
- Create/edit/publish courses (**unique course codes**), modules, lessons with unique sequences
- Quiz manager: create, publish/unpublish, deadline windows, question builder, attempt review
- Gradebook: enter 0–100 scores, save drafts, publish, withdraw; **confirmed + history-logged
  changes to published grades**
- My Students roster with progress and grades

### Admin
- Platform dashboard (user/course/enrollment stats, enrollments-per-course chart)
- User management: create (unique email), edit, deactivate/reactivate (cannot deactivate yourself)
- Course oversight (view any course, archive/restore) and enrollment management (drop)
- **Audit log** with action filter — every mutation in the app writes an entry
- Activity & reports: 7-day event chart, event breakdown, storage stats, **Reset demo data**
- Global search (top bar) across courses, people and quizzes (role-aware)

---

## The 11 DBMS business rules (enforced in `script.js`)

1. **Unique course codes** — duplicate codes are rejected on create and edit.
2. **Unique sequences** — module and lesson sequence numbers cannot repeat inside their parent.
3. **Published-only enrollment** — students can only enroll in published courses (and must be enrolled to take lessons/quizzes).
4. **No duplicate enrollment** — one active enrollment per student per course.
5. **Sequential lesson unlock** — lesson *n* unlocks only after lesson *n−1* is complete.
6. **Quiz validity window** — a quiz is attemptable only inside its `availableFrom → availableUntil` window and when published.
7. **Attempt limits** — a student cannot exceed a quiz's `maxAttempts`.
8. **Grade range** — scores must be numeric, 0–100.
9. **Published-grade change control** — changing a released grade requires confirmation and writes a grade-history record.
10. **Weighted course completion** — completion = 100% of lessons; certificates unlock only then.
11. **Audit trail** — every create/update/delete/publish/login action appends an audit entry.

> These client-side checks are a **demonstration only**. In the real system they must be
> implemented as primary/foreign keys, `UNIQUE` constraints, `CHECK` constraints, triggers and
> stored procedures — browser validation never replaces database integrity.

---

## Architecture & backend boundary

```
index.html  →  shell (screens, containers)
style.css   →  presentation
script.js   →  1. utilities   2. seed data (COURSE_BLUEPRINTS / QUIZ_BLUEPRINTS)
               3. store (localStorage) + session     4. domain helpers
               5. audit/notifications  6. api.* (all business logic + rules)
               7. UI primitives (toast/modal)   8. nav + hash router (#/page/param)
               9–16. page renderers per role    17–20. forms, actions, delegation
               21. init
```

- **Storage keys:** `minilms_db_v1` (dataset), `minilms_session_v1` (current user id),
  `minilms_theme` (light/dark).
- **Routing:** hash-based (`#/catalog`, `#/course/c_db101`, `#/quiz/q_…`) — pages are guarded per role.
- **Backend swap:** every mutation goes through `api.*` methods that synchronously read/write the
  store. Replacing each method body with `fetch('/api/…')` turns this into a real client for a
  PHP/Node/Java backend **without touching the UI code**.

## Known limitations

**Frontend-only mode**
- Role checks are UI-level demonstrations; the backend enforces them for real.
- `localStorage` is per-browser/per-device; there is no multi-user sync.
- Assignment submissions, video hosting and e-mail notifications are out of scope (placeholders).
- Data can be restored at any time with **Reset demo data** (profile menu → danger zone).

**Backend mode**
- Sessions and login-rate-limit counters live in process memory: a restart signs
  everyone out and resets counters; multiple instances do not share them (use
  MySQL or Redis for production).
- Demo accounts share the development-only `demo123` password and seeded hashes
  are placeholders until replaced (see the dev-only note above).
- CORS reflects the request origin (Bearer tokens, no cookies) and there is no
  HTTPS termination in the local demo.
- No token refresh and no forgot-password / e-mail reset flow.

## Verification performed

- `node --check script.js` — syntax valid.
- Static contract check — no duplicate HTML IDs; every `$('#id')` resolves; all `data-act`
  handlers (36) and `data-form` handlers (11) defined.
- jsdom smoke test — **105/105 checks, 0 console errors**, covering all three logins, every page,
  enrollment + prerequisite rejection, sequential lesson locking, quiz taking/scoring, certificate
  modal, profile/password flows, theme/search/notifications, duplicate course-code rejection,
  course/module/lesson/quiz/question creation, grade publication with the Rule-9 confirmation
  path, user create/deactivate, audit filtering and activity charts.
