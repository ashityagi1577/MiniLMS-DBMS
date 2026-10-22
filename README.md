# MiniLMS — Online Learning Management System

A complete **frontend-only** demonstration built for a college B.Tech CSE **DBMS PBL** assignment.
It uses only **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no libraries, no build tools,
no server and no internet connection required.

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

Sign in with any seeded account (password `demo123`), or click a role card
(**Student / Instructor / Admin**) to enter instantly with the default account of that role.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell: login/role-selection screen, sidebar, top bar, toast + modal containers. |
| `style.css` | Design system: blue/purple palette, cards, tables, light **and dark** themes, responsive + print styles. |
| `script.js` | Seed data, `store`/`session`/`api` service layer, hash router, all role pages, forms and actions. |
| `README.md` | This file. |

---

## Demo accounts (password: `demo123`)

| Role | Email | Notes |
|------|-------|-------|
| Admin | `admin@minilms.demo` | Priya Sharma — user management, oversight, audit log |
| Instructor | `ananya@minilms.demo` | DB-101 + CN-260, seeded grades (published & draft) |
| Instructor | `ravi@minilms.demo` | WD-204, PY-110 |
| Instructor | `sneha@minilms.demo` | DS-230, OS-150 |
| Student | `aarav@student.minilms.demo` | 3 enrollments, partial progress, released + draft grades |
| Student | `diya@student.minilms.demo` | Completed DB-101 → **earns a certificate** |
| … | `rohan/`, `kavya/`, `arjun/`, `meera/`, `vikram/`, `isha@student.minilms.demo` | 8 students in total |

**Seeded dataset:** 12 users · 6 courses (DB-101, WD-204, PY-110, DS-230, OS-150, CN-260) ·
12 modules · 36 lessons · 7 quizzes (5 published, 1 draft, 1 upcoming) · enrollments, lesson
progress, quiz attempts, grades, grade history, notifications, notices, activity events and audit
entries.

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

## Known limitations (frontend-only)

- No real authentication, authorization or security — role checks are UI-level demonstrations.
- `localStorage` is per-browser/per-device; there is no multi-user sync or server validation.
- Assignment submissions, video hosting and email notifications are out of scope (placeholders).
- Data can be restored at any time with **Reset demo data** (profile menu → danger zone).

## Verification performed

- `node --check script.js` — syntax valid.
- Static contract check — no duplicate HTML IDs; every `$('#id')` resolves; all `data-act`
  handlers (36) and `data-form` handlers (11) defined.
- jsdom smoke test — **105/105 checks, 0 console errors**, covering all three logins, every page,
  enrollment + prerequisite rejection, sequential lesson locking, quiz taking/scoring, certificate
  modal, profile/password flows, theme/search/notifications, duplicate course-code rejection,
  course/module/lesson/quiz/question creation, grade publication with the Rule-9 confirmation
  path, user create/deactivate, audit filtering and activity charts.
