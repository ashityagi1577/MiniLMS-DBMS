
'use strict';

/* ============================ 1. Utilities ============================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const nowISO = () => new Date().toISOString();
const shiftDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d)
    ? '—'
    : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return fmtDate(iso);
};

const initials = (name = '?') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const pctOf = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0);

const letterFor = (p) =>
  (p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F');

const byEmail = (email) => (db.users.find((u) => u.email === email) || null);
const byId = (list, id) => (list.find((x) => x.id === id) || null);

const STATUS_BADGE = {
  active: 'success', published: 'success', completed: 'success', released: 'success', passed: 'success',
  inactive: 'danger', archived: 'danger', dropped: 'danger', failed: 'danger',
  draft: 'neutral', locked: 'neutral',
  upcoming: 'warning', pending: 'warning', enrolled: 'info', in_progress: 'info',
};

const badge = (status, label) =>
  `<span class="badge badge-${STATUS_BADGE[status] || 'neutral'}">${esc(label || status)}</span>`;

const progressBar = (p) =>
  `<div class="progress"><div class="progress-bar" style="width:${clamp(p, 0, 100)}%"></div></div>`;

/* ========================== 2. Demo seed data =========================== */
const DB_KEY = 'minilms_db_v1';
const SESSION_KEY = 'minilms_session_v1';
const THEME_KEY = 'minilms_theme';
const DEMO_PASSWORD = 'demo123';

/**
 * Local demo-account configuration for the login screen (one per role).
 *
 * The backend no longer publishes its user list: GET /api/auth/accounts is
 * admin-only, so unauthenticated visitors can never enumerate real accounts.
 * This static list ships with the frontend instead - it contains only the
 * same demo credentials a login form would show (name/label + e-mail of the
 * seeded accounts in database/03_insert_sample_data.sql) and no private
 * data. It is NOT trusted for authentication: the server verifies the
 * e-mail + password and issues the token; the role always comes from the
 * server-side user row, never from the client.
 */
const DEMO_ACCOUNTS = [
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'admin' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', role: 'instructor' },
  { name: 'Aarav Mehta', email: 'aarav.mehta@example.com', role: 'student' },
];

const COURSE_BLUEPRINTS = [
  {
    code: 'DB-101', title: 'Database Management Systems', category: 'Computer Science',
    level: 'Beginner', credits: 4, instructorEmail: 'ananya@minilms.demo',
    desc: 'Relational modelling, SQL, normalisation and transactions — the core skills behind every data-driven application.',
    modules: [
      {
        title: 'Relational Foundations', lessons: [
          { title: 'What is a Database?', type: 'video', minutes: 12, content: 'Databases store structured data so it can be queried reliably. This lesson contrasts flat files with database systems and introduces the relational model proposed by E. F. Codd.' },
          { title: 'ER Diagrams & Relations', type: 'reading', minutes: 15, content: 'Entities, attributes and relationships are drawn as ER diagrams, then translated into tables. You will practise identifying cardinality and mapping it to foreign keys.' },
          { title: 'Keys & Integrity Rules', type: 'reading', minutes: 18, content: 'Primary, candidate and foreign keys keep data unique and consistent. Domain, entity and referential integrity rules are the guardrails of a healthy schema.' },
        ],
      },
      {
        title: 'SQL & Normalisation', lessons: [
          { title: 'SELECT, JOIN, GROUP BY', type: 'video', minutes: 22, content: 'The workhorse queries of SQL: filtering rows, joining tables and aggregating results with GROUP BY and HAVING.' },
          { title: 'Normal Forms 1NF–3NF', type: 'reading', minutes: 20, content: 'Eliminating repeating groups, partial dependencies and transitive dependencies to reach third normal form.' },
          { title: 'Transactions & ACID', type: 'assignment', minutes: 30, content: 'Atomicity, consistency, isolation and durability explained through bank-transfer examples. Submit the short worksheet after watching.' },
        ],
      },
    ],
  },
  {
    code: 'WD-204', title: 'Web Development Fundamentals', category: 'Computer Science',
    level: 'Beginner', credits: 3, instructorEmail: 'ravi@minilms.demo',
    desc: 'Build and style responsive web pages with semantic HTML, modern CSS and the DOM APIs of vanilla JavaScript.',
    modules: [
      {
        title: 'Markup & Structure', lessons: [
          { title: 'Semantic HTML5', type: 'video', minutes: 14, content: 'Header, nav, main, article and footer give meaning to your pages for browsers, screen readers and search engines alike.' },
          { title: 'Forms & Validation', type: 'reading', minutes: 16, content: 'Input types, required fields and constraint validation attributes let the browser check data before JavaScript ever runs.' },
          { title: 'Accessibility Basics', type: 'reading', minutes: 15, content: 'Labels, alt text, focus order and ARIA roles make interfaces usable by everyone. We fix an inaccessible page together.' },
        ],
      },
      {
        title: 'Styling & Layout', lessons: [
          { title: 'The CSS Box Model', type: 'video', minutes: 18, content: 'Margin, border, padding and content — how every element is sized, and why box-sizing changes the maths.' },
          { title: 'Flexbox & Grid', type: 'video', minutes: 24, content: 'One-dimensional flex layouts versus two-dimensional grids, with practical patterns for toolbars, cards and dashboards.' },
          { title: 'Responsive Design Project', type: 'assignment', minutes: 40, content: 'Deliver a mobile-first landing page that adapts from 360px to 1440px using media queries and fluid type.' },
        ],
      },
    ],
  },
  {
    code: 'PY-110', title: 'Programming with Python', category: 'Computer Science',
    level: 'Beginner', credits: 4, instructorEmail: 'ravi@minilms.demo',
    desc: 'From variables to file handling — learn readable, pythonic code through short exercises and one mini project.',
    modules: [
      {
        title: 'Language Basics', lessons: [
          { title: 'Variables & Data Types', type: 'video', minutes: 13, content: 'Ints, floats, strings, booleans and the dynamic typing model of Python, plus immutable versus mutable objects.' },
          { title: 'Conditionals & Loops', type: 'reading', minutes: 17, content: 'if/elif/else, while and for loops, range() and comprehensions for concise iteration.' },
          { title: 'Functions & Scope', type: 'reading', minutes: 16, content: 'Defining functions, default arguments, return values and how LEGB scope rules affect your code.' },
        ],
      },
      {
        title: 'Working with Data', lessons: [
          { title: 'Lists, Tuples & Dictionaries', type: 'video', minutes: 19, content: 'Choosing the right built-in container, slicing, and dictionary patterns for grouping and counting data.' },
          { title: 'Files & Exceptions', type: 'reading', minutes: 18, content: 'Reading and writing text files safely with context managers, and handling errors with try/except.' },
          { title: 'Mini Project: Expense Tracker', type: 'assignment', minutes: 45, content: 'Build a console app that stores expenses in a file, categorises them and prints a monthly summary.' },
        ],
      },
    ],
  },
  {
    code: 'DS-230', title: 'Data Structures & Algorithms', category: 'Computer Science',
    level: 'Intermediate', credits: 4, instructorEmail: 'sneha@minilms.demo',
    desc: 'Lists, stacks, queues, trees, hash tables and the Big-O reasoning needed to choose between them.',
    modules: [
      {
        title: 'Linear Structures', lessons: [
          { title: 'Arrays & Linked Lists', type: 'video', minutes: 20, content: 'Contiguous versus scattered memory, insertion costs, and implementing a singly linked list from scratch.' },
          { title: 'Stacks & Queues', type: 'reading', minutes: 15, content: 'LIFO and FIFO discipline, call stacks, undo history and breadth-first traversal patterns.' },
          { title: 'Sorting & Searching', type: 'reading', minutes: 22, content: 'Bubble, merge and quick sort compared by Big-O, plus binary search on sorted data.' },
        ],
      },
      {
        title: 'Trees & Hashing', lessons: [
          { title: 'Binary Trees & Traversals', type: 'video', minutes: 21, content: 'Pre-order, in-order and post-order traversal, and why balanced trees keep operations logarithmic.' },
          { title: 'Hash Tables', type: 'reading', minutes: 18, content: 'Hash functions, collision handling with chaining, and amortised O(1) dictionary lookups.' },
          { title: 'Complexity Analysis Lab', type: 'assignment', minutes: 35, content: 'Measure and graph the running time of three algorithms, then justify each curve with Big-O notation.' },
        ],
      },
    ],
  },
  {
    code: 'OS-150', title: 'Operating Systems', category: 'Computer Science',
    level: 'Intermediate', credits: 3, instructorEmail: 'sneha@minilms.demo',
    desc: 'Processes, scheduling, memory management and file systems — how a computer shares itself fairly.',
    modules: [
      {
        title: 'Processes & Scheduling', lessons: [
          { title: 'Processes & Threads', type: 'video', minutes: 17, content: 'Address spaces, process control blocks, and the difference between a process and a lightweight thread.' },
          { title: 'CPU Scheduling Algorithms', type: 'reading', minutes: 19, content: 'FCFS, SJF, round robin and priority scheduling compared through worked Gantt-chart examples.' },
          { title: 'Synchronisation & Deadlock', type: 'reading', minutes: 23, content: 'Critical sections, semaphores, and the four conditions that cause deadlock — plus avoidance strategies.' },
        ],
      },
      {
        title: 'Memory & Storage', lessons: [
          { title: 'Virtual Memory & Paging', type: 'video', minutes: 20, content: 'Page tables, TLBs and page faults let each process believe it owns the whole address space.' },
          { title: 'File Systems', type: 'reading', minutes: 16, content: 'Inodes, directory structures and allocation strategies used by FAT and ext-style file systems.' },
          { title: 'OS Case Study Report', type: 'assignment', minutes: 40, content: 'Compare memory management in Windows and Linux in a two-page report with cited sources.' },
        ],
      },
    ],
  },
  {
    code: 'CN-260', title: 'Computer Networks', category: 'Computer Science',
    level: 'Intermediate', credits: 3, instructorEmail: 'ananya@minilms.demo',
    desc: 'The layered journey of a packet: Ethernet to TCP/IP, routing, DNS and secure transport with TLS.',
    modules: [
      {
        title: 'Layers & Routing', lessons: [
          { title: 'The OSI & TCP/IP Models', type: 'video', minutes: 16, content: 'Seven layers versus four, encapsulation, and what actually happens when you press Enter in a browser.' },
          { title: 'IP Addressing & Subnets', type: 'reading', minutes: 21, content: 'IPv4 classes, CIDR notation and working subnet calculations with worked examples.' },
          { title: 'Routing Protocols', type: 'reading', minutes: 18, content: 'Distance-vector versus link-state routing, and how OSPF and BGP move packets between networks.' },
        ],
      },
      {
        title: 'Transport & Security', lessons: [
          { title: 'TCP vs UDP', type: 'video', minutes: 15, content: 'Handshakes, flow control, retransmission and when a lossy-but-fast protocol is the right choice.' },
          { title: 'DNS & HTTPS', type: 'reading', minutes: 17, content: 'Name resolution from recursive resolvers to authoritative servers, then TLS handshakes that protect HTTPS.' },
          { title: 'Packet Capture Exercise', type: 'assignment', minutes: 35, content: 'Capture a short browsing session, identify the handshake packets and annotate them in a diagram.' },
        ],
      },
    ],
  },
];

const QUIZ_BLUEPRINTS = [
  {
    code: 'DB-101', title: 'RDBMS Fundamentals', status: 'published', minutes: 15, maxAttempts: 3, passMark: 60,
    from: shiftDays(-14), until: shiftDays(28),
    desc: 'Core relational concepts, keys and basic SQL.',
    questions: [
      { prompt: 'Which key uniquely identifies each row of a table?', options: ['Foreign key', 'Primary key', 'Candidate only', 'Composite index'], correct: 1, marks: 25 },
      { prompt: 'ACID in transactions stands for Atomicity, Consistency, Isolation and…', options: ['Durability', 'Dependency', 'Density', 'Distribution'], correct: 0, marks: 25 },
      { prompt: 'A table in 2NF must be in 1NF and have…', options: ['No nulls', 'No repeating groups', 'No partial dependencies on the key', 'Only one column'], correct: 2, marks: 25 },
      { prompt: 'Which SQL clause filters groups after aggregation?', options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], correct: 1, marks: 25 },
    ],
  },
  {
    code: 'DB-101', title: 'Normalisation Deep Dive', status: 'draft', minutes: 20, maxAttempts: 2, passMark: 70,
    from: shiftDays(3), until: shiftDays(30),
    desc: 'Advanced 3NF/BCNF scenarios — still being drafted.',
    questions: [
      { prompt: 'A relation in BCNF must have every determinant be a…', options: ['Foreign key', 'Candidate key', 'Composite key', 'Surrogate key'], correct: 1, marks: 50 },
      { prompt: 'Multi-valued dependency leads to which normal form?', options: ['1NF', '2NF', '3NF', '4NF'], correct: 3, marks: 50 },
    ],
  },
  {
    code: 'WD-204', title: 'HTML & CSS Basics', status: 'published', minutes: 10, maxAttempts: 3, passMark: 60,
    from: shiftDays(-10), until: shiftDays(21),
    desc: 'Semantic markup, box model and layout fundamentals.',
    questions: [
      { prompt: 'Which element represents the main navigation links?', options: ['<div>', '<nav>', '<aside>', '<section>'], correct: 1, marks: 25 },
      { prompt: 'box-sizing: border-box makes width include…', options: ['Margin only', 'Border and padding', 'Content only', 'Scrollbars'], correct: 1, marks: 25 },
      { prompt: 'Which layout is one-dimensional?', options: ['Grid', 'Flexbox', 'Table', 'Position absolute'], correct: 1, marks: 25 },
      { prompt: 'Media queries are used to build…', options: ['Server APIs', 'Responsive designs', 'Databases', 'Compilers'], correct: 1, marks: 25 },
    ],
  },
  {
    code: 'PY-110', title: 'Python Essentials', status: 'published', minutes: 12, maxAttempts: 3, passMark: 60,
    from: shiftDays(-8), until: shiftDays(25),
    desc: 'Syntax, containers, functions and files.',
    questions: [
      { prompt: 'Which of these is immutable?', options: ['list', 'dict', 'tuple', 'set'], correct: 2, marks: 25 },
      { prompt: 'What does len([1,2,3]) return?', options: ['2', '3', '4', 'Error'], correct: 1, marks: 25 },
      { prompt: 'Which keyword defines a function?', options: ['func', 'def', 'function', 'lambda def'], correct: 1, marks: 25 },
      { prompt: 'Exceptions are handled with…', options: ['catch/throw', 'try/except', 'do/catch', 'handle/error'], correct: 1, marks: 25 },
    ],
  },
  {
    code: 'DS-230', title: 'Data Structures Quiz', status: 'published', minutes: 15, maxAttempts: 2, passMark: 65,
    from: shiftDays(-6), until: shiftDays(18),
    desc: 'Complexity, linear structures, trees and hashing.',
    questions: [
      { prompt: 'Average-case lookup in a hash table is…', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correct: 0, marks: 25 },
      { prompt: 'Which traversal of a BST yields sorted order?', options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'], correct: 1, marks: 25 },
      { prompt: 'A stack operates on which discipline?', options: ['FIFO', 'LIFO', 'Priority', 'Random'], correct: 1, marks: 25 },
      { prompt: 'Merge sort worst-case complexity is…', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correct: 1, marks: 25 },
    ],
  },
  {
    code: 'OS-150', title: 'Processes & Memory', status: 'published', minutes: 12, maxAttempts: 3, passMark: 60,
    from: shiftDays(-9), until: shiftDays(20),
    desc: 'Scheduling, synchronisation and virtual memory.',
    questions: [
      { prompt: 'Round-robin scheduling primarily improves…', options: ['Throughput only', 'Fairness/turnaround', 'Memory use', 'Disk speed'], correct: 1, marks: 25 },
      { prompt: 'A page fault occurs when…', options: ['CPU overheats', 'Needed page is not in RAM', 'Disk is full', 'Thread ends'], correct: 1, marks: 25 },
      { prompt: 'Deadlock requires all four conditions except…', options: ['Mutual exclusion', 'Hold and wait', 'Preemption', 'Circular wait'], correct: 2, marks: 25 },
      { prompt: 'A process differs from a thread mainly by…', options: ['Own address space', 'Own file name', 'Own CPU core', 'Own keyboard'], correct: 0, marks: 25 },
    ],
  },
  {
    code: 'CN-260', title: 'Networking Basics', status: 'upcoming', minutes: 15, maxAttempts: 2, passMark: 65,
    from: shiftDays(7), until: shiftDays(35),
    desc: 'Opens in one week — layers, IP addressing and transport.',
    questions: [
      { prompt: 'Which layer handles routing?', options: ['Application', 'Transport', 'Network', 'Data link'], correct: 2, marks: 34 },
      { prompt: 'TCP is connection-oriented. UDP is…', options: ['Reliable', 'Connectionless', 'Encrypted', 'Ordered'], correct: 1, marks: 33 },
      { prompt: 'HTTPS traffic normally uses port…', options: ['21', '80', '443', '8080'], correct: 2, marks: 33 },
    ],
  },
];

const SEED_STUDENTS = [
  { name: 'Aarav Mehta', email: 'aarav@student.minilms.demo', courses: ['DB-101', 'WD-204', 'PY-110'] },
  { name: 'Diya Nair', email: 'diya@student.minilms.demo', courses: ['DB-101', 'DS-230'] },
  { name: 'Rohan Verma', email: 'rohan@student.minilms.demo', courses: ['WD-204', 'OS-150'] },
  { name: 'Kavya Singh', email: 'kavya@student.minilms.demo', courses: ['PY-110', 'CN-260'] },
  { name: 'Arjun Patel', email: 'arjun@student.minilms.demo', courses: ['DB-101', 'OS-150'] },
  { name: 'Meera Joshi', email: 'meera@student.minilms.demo', courses: ['DS-230', 'WD-204'] },
  { name: 'Vikram Reddy', email: 'vikram@student.minilms.demo', courses: ['PY-110', 'DB-101'] },
  { name: 'Isha Kapoor', email: 'isha@student.minilms.demo', courses: ['CN-260', 'DS-230'] },
];

const SEED_COMPLETION = {
  'diya@student.minilms.demo': { 'DB-101': 6, 'DS-230': 3 },
  'aarav@student.minilms.demo': { 'DB-101': 4, 'WD-204': 2, 'PY-110': 1 },
  'rohan@student.minilms.demo': { 'WD-204': 6, 'OS-150': 2 },
  'meera@student.minilms.demo': { 'DS-230': 3, 'WD-204': 1 },
  'arjun@student.minilms.demo': { 'DB-101': 2, 'OS-150': 0 },
  'vikram@student.minilms.demo': { 'PY-110': 3, 'DB-101': 1 },
  'kavya@student.minilms.demo': { 'PY-110': 2, 'CN-260': 0 },
  'isha@student.minilms.demo': { 'CN-260': 1, 'DS-230': 0 },
};

function buildSeed() {
  const users = [
    { id: 'u_admin', name: 'Priya Sharma', email: 'admin@minilms.demo', password: DEMO_PASSWORD, role: 'admin', status: 'active', dept: 'Administration', phone: '+91 90000 11111', bio: 'Portal administrator responsible for accounts and oversight.', createdAt: shiftDays(-120) },
    { id: 'u_ananya', name: 'Ananya Iyer', email: 'ananya@minilms.demo', password: DEMO_PASSWORD, role: 'instructor', status: 'active', dept: 'Computer Science', phone: '+91 90000 22222', bio: 'Teaches databases and networking; loves normalisation diagrams.', createdAt: shiftDays(-110) },
    { id: 'u_ravi', name: 'Ravi Kumar', email: 'ravi@minilms.demo', password: DEMO_PASSWORD, role: 'instructor', status: 'active', dept: 'Computer Science', phone: '+91 90000 33333', bio: 'Web and Python courses, project-based teaching.', createdAt: shiftDays(-105) },
    { id: 'u_sneha', name: 'Sneha Rao', email: 'sneha@minilms.demo', password: DEMO_PASSWORD, role: 'instructor', status: 'active', dept: 'Computer Science', phone: '+91 90000 44444', bio: 'Algorithms and operating systems.', createdAt: shiftDays(-98) },
  ];

  SEED_STUDENTS.forEach((s, i) => {
    users.push({
      id: `u_stud_${i + 1}`, name: s.name, email: s.email, password: DEMO_PASSWORD, role: 'student',
      status: 'active', dept: 'B.Tech CSE', phone: `+91 91${String(10000000 + i * 123456).slice(0, 8)}`,
      bio: '', createdAt: shiftDays(-60 - i * 3),
    });
  });

  const courses = [], modules = [], lessons = [], quizzes = [];
  const instructorByEmail = (email) => users.find((u) => u.email === email).id;

  COURSE_BLUEPRINTS.forEach((bp, ci) => {
    const course = {
      id: `c_${bp.code.replace('-', '').toLowerCase()}`, code: bp.code, title: bp.title,
      desc: bp.desc, category: bp.category, level: bp.level, credits: bp.credits,
      instructorId: instructorByEmail(bp.instructorEmail),
      status: ci === 5 ? 'published' : 'published',
      releaseDate: shiftDays(-30), prereqIds: ci >= 3 ? [COURSE_BLUEPRINTS[ci - 3].code.replace('-', '').toLowerCase()] : [],
      createdAt: shiftDays(-45 + ci * 2),
    };
    course.prereqIds = course.prereqIds.map((c) => `c_${c}`);
    courses.push(course);

    bp.modules.forEach((m, mi) => {
      const mod = { id: uid('m'), courseId: course.id, title: m.title, seq: mi + 1, description: `${m.title} module of ${bp.code}.` };
      modules.push(mod);
      m.lessons.forEach((l, li) => {
        lessons.push({
          id: uid('l'), courseId: course.id, moduleId: mod.id, title: l.title, seq: li + 1,
          globalSeq: mi * 3 + li + 1, type: l.type, content: l.content,
          durationMin: l.minutes, videoUrl: l.type === 'video' ? `https://videos.minilms.demo/${course.id}/${mi + 1}-${li + 1}.mp4` : '',
          createdAt: shiftDays(-40 + ci),
        });
      });
    });
  });

  QUIZ_BLUEPRINTS.forEach((q) => {
    const course = courses.find((c) => c.code === q.code);
    quizzes.push({
      id: uid('q'), courseId: course.id, title: q.title, desc: q.desc, status: q.status,
      timeLimitMin: q.minutes, maxAttempts: q.maxAttempts, passMark: q.passMark,
      availableFrom: q.from, availableUntil: q.until, createdAt: shiftDays(-15),
      questions: q.questions.map((qq, qi) => ({ id: `qq_${qi + 1}_${Math.random().toString(36).slice(2, 6)}`, prompt: qq.prompt, options: qq.options, correct: qq.correct, marks: qq.marks })),
    });
  });

  const enrollments = [], progress = [];
  SEED_STUDENTS.forEach((s, si) => {
    const student = users.find((u) => u.email === s.email);
    s.courses.forEach((code) => {
      const course = courses.find((c) => c.code === code);
      const doneCount = (SEED_COMPLETION[s.email] || {})[code] || 0;
      const total = 6;
      const enrolledAt = shiftDays(-25 + si * 2);
      enrollments.push({
        id: uid('e'), studentId: student.id, courseId: course.id,
        status: doneCount >= total ? 'completed' : 'active',
        enrolledAt, completedAt: doneCount >= total ? shiftDays(-3) : null,
      });
      const courseLessons = lessons.filter((l) => l.courseId === course.id).sort((a, b) => a.globalSeq - b.globalSeq);
      courseLessons.slice(0, doneCount).forEach((l) => {
        progress.push({ id: uid('p'), studentId: student.id, courseId: course.id, lessonId: l.id, completedAt: shiftDays(-(20 - si)), score: null });
      });
    });
  });

  const attempts = [];
  const attemptSeed = [
    { email: 'aarav@student.minilms.demo', title: 'RDBMS Fundamentals', correct: 3, at: shiftDays(-5) },
    { email: 'diya@student.minilms.demo', title: 'RDBMS Fundamentals', correct: 4, at: shiftDays(-7) },
    { email: 'rohan@student.minilms.demo', title: 'HTML & CSS Basics', correct: 3, at: shiftDays(-4) },
    { email: 'kavya@student.minilms.demo', title: 'Python Essentials', correct: 2, at: shiftDays(-2) },
    { email: 'vikram@student.minilms.demo', title: 'Python Essentials', correct: 4, at: shiftDays(-1) },
  ];
  attemptSeed.forEach((a) => {
    const quiz = quizzes.find((q) => q.title === a.title);
    const student = users.find((u) => u.email === a.email);
    if (!quiz || !student) return;
    const answers = {};
    quiz.questions.forEach((qq, i) => { answers[qq.id] = i < a.correct ? qq.correct : (qq.correct + 1) % qq.options.length; });
    const total = quiz.questions.reduce((s, qq) => s + qq.marks, 0);
    const score = quiz.questions.reduce((s, qq, i) => s + (answers[qq.id] === qq.correct ? qq.marks : 0), 0);
    const pctScore = pctOf(score, total);
    attempts.push({
      id: uid('a'), quizId: quiz.id, courseId: quiz.courseId, studentId: student.id,
      startedAt: a.at, submittedAt: a.at, answers, score, percentage: pctScore,
      passed: pctScore >= quiz.passMark, status: 'submitted',
    });
  });

  const grades = [], gradeHistory = [];
  const gradeSeed = [
    { email: 'diya@student.minilms.demo', code: 'DB-101', score: 92, status: 'released', feedback: 'Excellent grasp of normalisation.' },
    { email: 'aarav@student.minilms.demo', code: 'DB-101', score: 85, status: 'released', feedback: 'Strong work; revisit ACID edge cases.' },
    { email: 'rohan@student.minilms.demo', code: 'WD-204', score: 74, status: 'released', feedback: 'Good structure, polish responsiveness.' },
    { email: 'aarav@student.minilms.demo', code: 'WD-204', score: 71, status: 'draft', feedback: 'Pending final project review.' },
    { email: 'meera@student.minilms.demo', code: 'DS-230', score: 88, status: 'draft', feedback: 'Lab scores look promising.' },
  ];
  gradeSeed.forEach((g) => {
    const student = users.find((u) => u.email === g.email);
    const course = courses.find((c) => c.code === g.code);
    if (!student || !course) return;
    const grade = {
      id: uid('g'), studentId: student.id, courseId: course.id, score: g.score,
      letter: letterFor(g.score), feedback: g.feedback, status: g.status,
      createdAt: shiftDays(-9), publishedAt: g.status === 'released' ? shiftDays(-6) : null,
      adjustedAt: null,
    };
    grades.push(grade);
    if (g.email === 'aarav@student.minilms.demo' && g.code === 'DB-101') {
      gradeHistory.push({ id: uid('h'), gradeId: grade.id, prev: 80, next: 85, note: 'Re-marked after re-check of question 4.', changedBy: 'u_ananya', changedAt: shiftDays(-6) });
      grade.score = 85; grade.letter = letterFor(85);
    }
  });

  const notifications = [
    { id: uid('n'), userId: 'u_admin', title: 'Welcome to MiniLMS', body: 'Demo data has been seeded in localStorage. Use "Reset demo data" to restore it anytime.', createdAt: shiftDays(-2), read: false },
    { id: uid('n'), userId: 'u_admin', title: 'New enrollment activity', body: '8 students are enrolled across 6 courses in the current demo cycle.', createdAt: shiftDays(-1), read: false },
    { id: uid('n'), userId: 'u_ananya', title: 'Grades awaiting release', body: 'You have draft grades pending in your courses.', createdAt: shiftDays(-1), read: false },
    { id: uid('n'), userId: 'u_stud_1', title: 'Grade published — DB-101', body: 'Your final grade for Database Management Systems has been published.', createdAt: shiftDays(-5), read: false },
    { id: uid('n'), userId: 'u_stud_1', title: 'New quiz available', body: 'RDBMS Fundamentals quiz is open for attempts.', createdAt: shiftDays(-10), read: true },
    { id: uid('n'), userId: 'u_stud_2', title: 'Certificate earned', body: 'You completed DB-101 with 100% progress — download your certificate.', createdAt: shiftDays(-3), read: false },
  ];

  const audit = [
    { id: uid('log'), actorId: 'u_admin', actorName: 'Priya Sharma', action: 'seed', entity: 'system', entityId: 'demo', detail: 'Initial demo dataset created.', at: shiftDays(-60) },
    { id: uid('log'), actorId: 'u_ananya', actorName: 'Ananya Iyer', action: 'publish_grade', entity: 'grade', entityId: 'DB-101', detail: 'Published grade for Diya Nair in DB-101 (92).', at: shiftDays(-6) },
    { id: uid('log'), actorId: 'u_ananya', actorName: 'Ananya Iyer', action: 'adjust_grade', entity: 'grade', entityId: 'DB-101', detail: 'Adjusted Aarav Mehta DB-101 grade 80 → 85 after re-check.', at: shiftDays(-6) },
    { id: uid('log'), actorId: 'u_admin', actorName: 'Priya Sharma', action: 'create_user', entity: 'user', entityId: 'u_stud_8', detail: 'Created student account isha@student.minilms.demo.', at: shiftDays(-27) },
    { id: uid('log'), actorId: 'u_ravi', actorName: 'Ravi Kumar', action: 'create_course', entity: 'course', entityId: 'wd204', detail: 'Created course WD-204 Web Development Fundamentals.', at: shiftDays(-43) },
  ];

  const activity = [];
  const types = ['lesson_complete', 'quiz_attempt', 'login', 'enrollment', 'grade_view'];
  for (let d = 6; d >= 0; d--) {
    const count = 3 + ((d * 5) % 6);
    for (let i = 0; i < count; i++) {
      activity.push({
        id: uid('act'), type: types[(d + i) % types.length],
        userId: users[(d + i * 3) % users.length].id, at: shiftDays(-d),
      });
    }
  }

  const notices = [
    { id: uid('notice'), title: 'Mid-semester quiz window', body: 'Published quizzes are open until their listed end date. Attempt limits apply.', audience: 'all', createdAt: shiftDays(-4), author: 'Priya Sharma' },
    { id: uid('notice'), title: 'Certificate policy', body: 'Certificates unlock automatically at 100% lesson completion for enrolled courses.', audience: 'student', createdAt: shiftDays(-3), author: 'Priya Sharma' },
    { id: uid('notice'), title: 'Grade moderation week', body: 'Instructors: publish grades only after moderation; published changes are audited.', audience: 'instructor', createdAt: shiftDays(-2), author: 'Priya Sharma' },
  ];

  return {
    version: 1, seededAt: nowISO(),
    users, courses, modules, lessons, quizzes,
    enrollments, progress, attempts, grades, gradeHistory,
    notifications, audit, activity, notices,
  };
}

/* ==================== 3. Backend transport & overlays ==================== */
const TOKEN_KEY = 'minilms_token_v1';   // bearer token from POST /api/auth/login
const EXT_KEY = 'minilms_ext_v1';       // shared course-content overlay (not user data)
let AUTH_NOTICE = '';                   // friendly session message shown over the login form

/** Cache the authenticated snapshot under the user it belongs to. */
function dbCacheKey(owner = localStorage.getItem(SESSION_KEY) || '') {
  return owner ? `${DB_KEY}:${owner}` : '';
}

/** Remove every user-specific MiniLMS cache entry; theme and shared content stay. */
function clearUserCacheStorage() {
  try {
    const keep = new Set([THEME_KEY, EXT_KEY]);
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && !keep.has(key) && (key === DB_KEY || key === TOKEN_KEY || key === SESSION_KEY
        || key.startsWith(`${DB_KEY}:`))) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('minilms_')) sessionStorage.removeItem(key);
    }
  } catch (err) { /* storage can be unavailable */ }
}

/** Clear all in-memory user state plus its persisted caches. */
function clearUserCache() {
  clearUserCacheStorage();
  db = null;
  AUTH_NOTICE = '';
}
// Backend base URL: empty when the page is served BY the backend (same origin),
// http://localhost:5000 for file:// or any other port. Override by setting
// window.MINILMS_API_BASE before this script loads.
const API_BASE = (typeof window !== 'undefined' && window.MINILMS_API_BASE)
  || ((typeof location !== 'undefined' && (location.protocol === 'file:' || (location.port && location.port !== '5000')))
    ? 'http://localhost:5000' : '');
let OFFLINE = false;

/**
 * fetch() wrapper: adds the bearer token, parses JSON, and normalises
 * every response to { ok: true, ... } or { ok: false, error, status } so
 * callers keep using the same res.ok / res.error shape as before.
 */
async function apiFetch(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    return {
      ok: false, status: 0,
      error: `Cannot reach the backend at ${API_BASE || location.origin}. Start it: cd backend && npm start`,
    };
  }
  let data = null;
  try { data = await res.json(); } catch (err) { /* empty/non-JSON body */ }
  if (!res.ok || !data || data.ok === false) {
    return { ok: false, status: res.status, error: (data && data.error) || `Request failed (HTTP ${res.status}).` };
  }
  return data;
}

/* ---- browser overlay for fields that are not in the MySQL schema -------- */
const overlays = { data: {} };

function loadOverlays() {
  try { overlays.data = JSON.parse(localStorage.getItem(EXT_KEY)) || {}; } catch (err) { overlays.data = {}; }
  ['profile', 'course', 'lesson', 'quiz', 'attempt', 'grade'].forEach((k) => {
    if (!overlays.data[k] || typeof overlays.data[k] !== 'object') overlays.data[k] = {};
  });
}
function saveOverlays() {
  try { localStorage.setItem(EXT_KEY, JSON.stringify(overlays.data)); } catch (err) { console.warn('overlay save failed', err); }
}
function saveOverlay(kind, id, value) {
  overlays.data[kind][String(id)] = { ...(overlays.data[kind][String(id)] || {}), ...value };
  saveOverlays();
}
function dropOverlay(kind, id) { delete overlays.data[kind][String(id)]; saveOverlays(); }

/*
 * Demo questions for the four quizzes seeded in MySQL.
 * The schema has NO Questions table, so quiz questions exist only in the
 * browser: each client grades its own submissions (documented limitation).
 * Totals equal each quiz's MaxScore (10/5/8/10) so percentages line up.
 */
const DEFAULT_QUESTIONS = {
  '1': [
    { id: 'q1_1', prompt: 'Which key uniquely identifies a row in a relational table?', options: ['Foreign key', 'Primary key', 'Candidate key', 'Composite index'], correct: 1, marks: 2 },
    { id: 'q1_2', prompt: 'Which normal form removes partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1, marks: 2 },
    { id: 'q1_3', prompt: 'What does the "I" in ACID stand for?', options: ['Indexing', 'Isolation', 'Integrity', 'Iteration'], correct: 1, marks: 2 },
    { id: 'q1_4', prompt: 'A foreign key enforces which rule?', options: ['Entity integrity', 'Referential integrity', 'Domain integrity', 'Key integrity'], correct: 1, marks: 2 },
    { id: 'q1_5', prompt: 'Which SQL clause filters grouped rows?', options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], correct: 1, marks: 2 },
  ],
  '2': [
    { id: 'q2_1', prompt: '1NF primarily removes...', options: ['Repeating groups', 'Transitive dependencies', 'Multi-valued attributes', 'Partial dependencies'], correct: 0, marks: 1 },
    { id: 'q2_2', prompt: 'A transitive dependency violates which normal form?', options: ['1NF', '2NF', '3NF', 'None'], correct: 2, marks: 1 },
    { id: 'q2_3', prompt: 'Every relation in 2NF must first be in...', options: ['3NF', '1NF', 'BCNF', '4NF'], correct: 1, marks: 1 },
    { id: 'q2_4', prompt: 'A composite primary key can carry partial dependencies when...', options: ['All attributes are atomic', 'A non-key attribute depends on only part of the key', 'The table has NULLs', 'The table is partitioned'], correct: 1, marks: 1 },
    { id: 'q2_5', prompt: 'Decomposing a table mainly reduces...', options: ['Redundancy', 'Indexes', 'Rows', 'Constraints'], correct: 0, marks: 1 },
  ],
  '3': [
    { id: 'q3_1', prompt: 'Which element describes the main content of a page?', options: ['<div>', '<main>', '<span>', '<section id="main">'], correct: 1, marks: 2 },
    { id: 'q3_2', prompt: 'box-sizing: border-box makes width include...', options: ['Margin only', 'Border and padding', 'Outline only', 'Nothing'], correct: 1, marks: 2 },
    { id: 'q3_3', prompt: 'Which layout is one-dimensional?', options: ['Grid', 'Flexbox', 'Table', 'Position absolute'], correct: 1, marks: 2 },
    { id: 'q3_4', prompt: 'Which input type is best for an email field?', options: ['text', 'email', 'textbox', 'letter'], correct: 1, marks: 2 },
  ],
  '4': [
    { id: 'q4_1', prompt: 'Which type is immutable in Python?', options: ['list', 'dict', 'tuple', 'set'], correct: 2, marks: 2 },
    { id: 'q4_2', prompt: 'What does len([1, 2, 3]) return?', options: ['2', '3', '4', 'Error'], correct: 1, marks: 2 },
    { id: 'q4_3', prompt: 'Which keyword defines a function?', options: ['func', 'def', 'function', 'define'], correct: 1, marks: 2 },
    { id: 'q4_4', prompt: 'Which structure keeps key-value pairs?', options: ['tuple', 'list', 'dictionary', 'str'], correct: 2, marks: 2 },
    { id: 'q4_5', prompt: 'A context manager is opened with...', options: ['open()', 'with', 'using', 'try'], correct: 1, marks: 2 },
  ],
};

function questionsFor(quiz) {
  const stored = overlays.data.quiz[quiz.id];
  if (stored && Array.isArray(stored.questions)) return stored.questions;
  const fallback = DEFAULT_QUESTIONS[quiz.id];
  if (fallback) {
    saveOverlay('quiz', quiz.id, { ...(stored || {}), questions: JSON.parse(JSON.stringify(fallback)) });
    return overlays.data.quiz[quiz.id].questions;
  }
  return [];
}

/**
 * Replace the server-backed collections of `db` with fresh backend data,
 * keeping the localStorage-only collections (progress, notifications,
 * audit, activity, notices, gradeHistory) and re-applying overlays.
 */
function applyServerData(payload) {
  const keep = (db && typeof db === 'object') ? db : null;
  const local = ['progress', 'notifications', 'audit', 'activity', 'notices', 'gradeHistory'];
  const localParts = {};
  local.forEach((k) => { localParts[k] = keep && Array.isArray(keep[k]) ? keep[k] : []; });

  db = {
    version: 1,
    seededAt: (keep && keep.seededAt) || nowISO(),
    users: payload.users || [],
    courses: payload.courses || [],
    modules: payload.modules || [],
    lessons: payload.lessons || [],
    enrollments: payload.enrollments || [],
    quizzes: payload.quizzes || [],
    attempts: payload.attempts || [],
    grades: payload.grades || [],
    ...localParts,
  };

  db.users.forEach((u) => {
    const o = overlays.data.profile[u.id] || {};
    u.dept = o.dept || ''; u.phone = o.phone || ''; u.bio = o.bio || '';
  });
  db.courses.forEach((c) => {
    const o = overlays.data.course[c.id] || {};
    c.category = o.category || 'Computer Science';
    c.level = o.level || 'Beginner';
    c.credits = o.credits || 3;
    c.prereqIds = o.prereqIds || [];
    c.releaseDate = o.releaseDate || c.createdAt;
  });
  db.lessons.forEach((l) => {
    const o = overlays.data.lesson[l.id] || {};
    l.type = o.type || 'reading';
    l.durationMin = o.durationMin ?? 10;
    l.videoUrl = o.videoUrl || '';
  });
  db.quizzes.forEach((q) => {
    const o = overlays.data.quiz[q.id] || {};
    q.desc = o.desc || '';
    q.timeLimitMin = o.timeLimitMin || 10;
    q.passMark = o.passMark ?? 60;
    q.questions = questionsFor(q);
  });
  db.attempts.forEach((a) => {
    const o = overlays.data.attempt[a.id] || {};
    a.answers = o.answers || {};
    a.startedAt = o.startedAt || a.submittedAt;
    const quiz = db.quizzes.find((q) => q.id === a.quizId);
    const max = (quiz && quiz.maxScore) || 1;
    if (a.score === null || a.score === undefined) {
      a.percentage = 0;
      a.passed = false;
    } else {
      a.percentage = Math.round((a.score / max) * 100);
      a.passed = a.percentage >= ((quiz && quiz.passMark) ?? 60);
    }
  });
  db.grades.forEach((g) => {
    const o = overlays.data.grade[g.id] || {};
    g.feedback = o.feedback || '';
    g.letter = letterFor(g.score);
    if (o.adjustedAt) g.adjustedAt = o.adjustedAt;
  });
}

/** Reload all server-backed collections from MySQL (throws on failure). */
async function syncFromServer() {
  const res = await apiFetch('/api/bootstrap');
  if (!res.ok) {
    const err = new Error(res.error || 'Could not reload data from the backend.');
    err.status = res.status;
    throw err;
  }
  applyServerData(res);
  store.save();
}

/* ------------------------------ store ----------------------------------- */
let db = null;

const store = {
  /**
   * Boot order:
   *  1. read the localStorage snapshot (keeps MySQL-less collections)
   *  2. valid token  -> GET /api/bootstrap (full MySQL dataset)
   *     no token     -> GET /api/health (public reachability check only;
   *                     the login-screen account choices come from the
   *                     local DEMO_ACCOUNTS config, never from the server)
   *  3. backend down -> cached snapshot, else the original demo seed
   */
  async load() {
    loadOverlays();
    const token = localStorage.getItem(TOKEN_KEY);
    const owner = localStorage.getItem(SESSION_KEY) || '';
    db = null;

    if (token && owner) {
      const res = await apiFetch('/api/bootstrap');
      if (res.ok) {
        OFFLINE = false;
        applyServerData(res);
        store.save();
        return;
      }
      if (res.status === 401 || res.status === 403) {
        clearUserCacheStorage();
        AUTH_NOTICE = 'Your session expired or is no longer valid. Please sign in again.';
        return;
      }
      // Network/server failure: only restore the snapshot belonging to this user.
      try {
        const raw = localStorage.getItem(dbCacheKey(owner));
        const cached = raw ? JSON.parse(raw) : null;
        if (cached && typeof cached === 'object' && Array.isArray(cached.users)) {
          db = cached;
          ['progress', 'notifications', 'audit', 'activity', 'notices', 'gradeHistory'].forEach((k) => {
            if (!Array.isArray(db[k])) db[k] = [];
          });
          OFFLINE = true;
          return;
        }
      } catch (err) { db = null; }
      AUTH_NOTICE = 'Could not load your account data. Check the backend connection and try again.';
      return;
    }

    if (owner || token) clearUserCacheStorage(); // orphaned/incomplete session
    const health = await apiFetch('/api/health');
    OFFLINE = !health.ok;
  },

  save() {
    const key = dbCacheKey();
    if (!db || !key) return;
    try { localStorage.setItem(key, JSON.stringify(db)); } catch (err) { console.warn('localStorage save failed', err); }
  },

  reset() {
    clearUserCacheStorage();
    try { localStorage.removeItem(EXT_KEY); } catch (err) { /* ignore */ }
    session.clear();
    db = null;
  },
};

const session = {
  get user() {
    if (!db || !Array.isArray(db.users)) return null;
    const id = localStorage.getItem(SESSION_KEY);
    return id ? byId(db.users, id) : null;
  },
  set(userId) { localStorage.setItem(SESSION_KEY, String(userId)); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

/* ======================== 4. Domain helpers ============================= */
const modulesOf = (courseId) => db.modules.filter((m) => m.courseId === courseId).sort((a, b) => a.seq - b.seq);
const lessonsOfCourse = (courseId) => db.lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.globalSeq - b.globalSeq);
const lessonsOfModule = (moduleId) => db.lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.seq - b.seq);
const quizzesOfCourse = (courseId) => db.quizzes.filter((q) => q.courseId === courseId);
const enrollmentsOfCourse = (courseId) => db.enrollments.filter((e) => e.courseId === courseId);
const enrollmentsOfStudent = (studentId) => db.enrollments.filter((e) => e.studentId === studentId);
const isEnrolled = (studentId, courseId) =>
  db.enrollments.some((e) => e.studentId === studentId && e.courseId === courseId && e.status !== 'dropped');

const lessonDone = (studentId, lessonId) =>
  db.progress.some((p) => p.studentId === studentId && p.lessonId === lessonId);

const courseProgress = (studentId, courseId) => {
  const total = lessonsOfCourse(courseId).length;
  const done = lessonsOfCourse(courseId).filter((l) => lessonDone(studentId, l.id)).length;
  return { done, total, pct: pctOf(done, total) };
};

const enrollmentFor = (studentId, courseId) =>
  db.enrollments.find((e) => e.studentId === studentId && e.courseId === courseId && e.status !== 'dropped') || null;

const gradeFor = (studentId, courseId) =>
  db.grades.find((g) => g.studentId === studentId && g.courseId === courseId) || null;

const attemptsFor = (studentId, quizId) =>
  db.attempts.filter((a) => a.studentId === studentId && a.quizId === quizId);

const quizWindow = (quiz) => {
  const t = Date.now();
  if (quiz.status === 'draft') return { open: false, reason: 'This quiz is still a draft.' };
  if (quiz.status === 'closed') return { open: false, reason: 'This quiz is closed.' };
  const open = quiz.availableFrom ? new Date(quiz.availableFrom).getTime() : -Infinity;
  const close = quiz.availableUntil ? new Date(quiz.availableUntil).getTime() : Infinity;
  if (t < open) return { open: false, reason: `Opens ${fmtDate(quiz.availableFrom)}.` };
  if (t > close) return { open: false, reason: `Closed since ${fmtDate(quiz.availableUntil)}.` };
  return { open: true, reason: '' };
};

const lessonUnlocked = (studentId, courseId, lesson) => {
  const courseLessons = lessonsOfCourse(courseId);
  const idx = courseLessons.findIndex((l) => l.id === lesson.id);
  if (idx <= 0) return true;
  return lessonDone(studentId, courseLessons[idx - 1].id);
};

const enrollmentsForCourse = (courseId) => db.enrollments.filter((e) => e.courseId === courseId);

const certIdFor = (studentId, courseId) =>
  `ML-${byId(db.courses, courseId)?.code || 'XX'}-${String(studentId).slice(-4).toUpperCase()}-${courseId.slice(-4).toUpperCase()}`;

const courseEligibleCert = (studentId, courseId) => {
  const p = courseProgress(studentId, courseId);
  return p.total > 0 && p.done === p.total;
};

/* ======================= 5. Audit & notifications ======================= */
function logAudit(action, entity, entityId, detail, actor) {
  const who = actor || session.user;
  db.audit.unshift({
    id: uid('log'), actorId: who ? who.id : 'system', actorName: who ? who.name : 'System',
    action, entity, entityId: String(entityId || ''), detail, at: nowISO(),
  });
  if (db.audit.length > 300) db.audit.length = 300;
}

function pushNotification(userId, title, body) {
  db.notifications.unshift({ id: uid('n'), userId, title, body, createdAt: nowISO(), read: false });
}

function pushActivity(type) {
  const u = session.user;
  db.activity.unshift({ id: uid('act'), type, userId: u ? u.id : 'system', at: nowISO() });
  if (db.activity.length > 400) db.activity.length = 400;
}

/** Re-read the server-backed collections after a mutation (never throws). */
async function syncQuiet() {
  try {
    await syncFromServer();
  } catch (err) {
    toast(`Saved to MySQL, but refreshing from the backend failed: ${err.message}`, 'warning');
  }
}

/* ============================ 6. API service ============================ */
const api = {
  /* ---- auth: the server verifies the password and issues the token ---- */
  async login(email, password) {
    clearUserCache();
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
    if (!res.ok) return res;
    localStorage.setItem(TOKEN_KEY, res.token);
    session.set(String(res.user.id));
    try {
      await syncFromServer();
    } catch (err) {
      clearUserCache();
      if (err.status === 401 || err.status === 403) {
        AUTH_NOTICE = 'You do not have access to that account. Please sign in again.';
      }
      return { ok: false, error: err.message };
    }
    logAudit('login', 'user', res.user.id, `${res.user.name} signed in.`);
    pushActivity('login');
    store.save();
    return { ok: true, user: session.user };
  },

  async loginAsRole(role) {
    // Pick a demo account from the LOCAL config; the server still validates
    // the e-mail, the password and the account status before issuing a token.
    const user = DEMO_ACCOUNTS.find((u) => u.role === role);
    if (!user) return { ok: false, error: 'No demo account configured for that role.' };
    return api.login(user.email, DEMO_PASSWORD);
  },

  async logout() {
    const u = session.user;
    if (u) logAudit('logout', 'user', u.id, `${u.name} signed out.`);
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch (err) { /* best effort */ }
    clearUserCache();
  },

  async resetDemo() {
    // No server-side reset endpoint exists, so this clears the local session,
    // overlay and cache only - MySQL records are untouched (shown in the toast).
    store.reset();
    toast('Signed out and cleared local browser data. MySQL records are kept — the backend has no reset endpoint.', 'info');
    setTimeout(() => location.reload(), 900);
  },

  /* ---- enrollment (rules 3 + 4; the server re-checks both) ---- */
  async enroll(studentId, courseId) {
    const course = byId(db.courses, courseId);
    if (!course) return { ok: false, error: 'Course not found.' };
    if (course.status !== 'published') return { ok: false, error: 'You can only enroll in published courses. (Rule 3)' };
    if (isEnrolled(studentId, courseId)) return { ok: false, error: 'Already enrolled in this course. (Rule 4)' };
    // Prerequisites exist only in the browser overlay (no MySQL column), so
    // this rule can only be checked here - the server cannot see it.
    const unmet = (course.prereqIds || []).filter((pid) => courseProgress(studentId, pid).pct < 50);
    if (unmet.length) {
      const names = unmet.map((pid) => byId(db.courses, pid)?.code || pid).join(', ');
      return { ok: false, error: `Prerequisite not met: complete at least 50% of ${names} first.` };
    }
    const res = await apiFetch('/api/enrollments', { method: 'POST', body: { CourseID: Number(courseId) } });
    if (!res.ok) return res;
    logAudit('enroll', 'enrollment', courseId, `Enrolled in ${course.code} ${course.title}.`);
    pushNotification(course.instructorId, 'New enrollment', `${byId(db.users, studentId)?.name} enrolled in ${course.code}.`);
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  async unenroll(studentId, courseId) {
    const e = enrollmentFor(studentId, courseId);
    if (!e) return { ok: false, error: 'No enrollment found.' };
    const res = await apiFetch(`/api/enrollments/${e.id}/status`, { method: 'PUT', body: { status: 'dropped' } });
    if (!res.ok) return res;
    logAudit('unenroll', 'enrollment', courseId, `Dropped enrollment in ${byId(db.courses, courseId)?.code}.`);
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  /* ---- lessons (rules 5 + 10 + 11; progress lives in localStorage only) ---- */
  async completeLesson(studentId, lessonId) {
    const lesson = byId(db.lessons, lessonId);
    if (!lesson) return { ok: false, error: 'Lesson not found.' };
    if (!isEnrolled(studentId, lesson.courseId)) return { ok: false, error: 'Enroll in the course first. (Rule 3)' };
    if (!lessonUnlocked(studentId, lesson.courseId, lesson)) {
      return { ok: false, error: 'Complete the previous lesson first — lessons unlock in order. (Rule 5)' };
    }
    if (lessonDone(studentId, lessonId)) return { ok: false, error: 'Lesson already completed.' };
    db.progress.push({ id: uid('p'), studentId, courseId: lesson.courseId, lessonId, completedAt: nowISO(), score: null });
    pushActivity('lesson_complete');

    const p = courseProgress(studentId, lesson.courseId);
    const course = byId(db.courses, lesson.courseId);
    let warn;
    if (p.done === p.total) {
      const e = enrollmentFor(studentId, lesson.courseId);
      if (e && e.status !== 'completed') {
        const res = await apiFetch(`/api/enrollments/${e.id}/status`, { method: 'PUT', body: { status: 'completed' } });
        if (!res.ok) {
          warn = res.error; // progress is still saved locally; enrollment stays active
        } else {
          logAudit('complete_course', 'enrollment', lesson.courseId, `${byId(db.users, studentId)?.name} completed ${course.code} (${p.pct}%).`);
          pushNotification(studentId, 'Course completed 🎓', `${course.code} is 100% complete — your certificate is ready.`);
          await syncQuiet();
        }
      }
    }
    store.save();
    return { ok: true, pct: p.pct, done: p.done, total: p.total, warn };
  },

  /* ---- quizzes (rules 6 + 7 + 8; answers are graded in the browser) ---- */
  async submitQuiz(studentId, quizId, answers) {
    const quiz = byId(db.quizzes, quizId);
    if (!quiz) return { ok: false, error: 'Quiz not found.' };
    const win = quizWindow(quiz);
    if (!win.open) return { ok: false, error: win.reason };
    const used = attemptsFor(studentId, quizId).length;
    if (used >= quiz.maxAttempts) {
      return { ok: false, error: `Attempt limit reached (${quiz.maxAttempts}). (Rule 7)` };
    }
    if (!isEnrolled(studentId, quiz.courseId)) return { ok: false, error: 'Enroll in the course before attempting quizzes. (Rule 3)' };

    // MySQL has no Questions table, so the browser grades the answers and the
    // server validates the Score against Quizzes.MaxScore (rule 8 backstop).
    const total = quiz.questions.reduce((s, q) => s + (q.marks || 0), 0) || 1;
    const raw = quiz.questions.reduce((s, q) => s + ((answers[q.id] !== undefined && answers[q.id] === q.correct) ? (q.marks || 0) : 0), 0);
    const percentage = clamp(Math.round((raw / total) * 100), 0, 100);
    const maxScore = Number(quiz.maxScore) || 10;
    const serverScore = total === maxScore
      ? raw // seeded quizzes match MaxScore exactly
      : clamp(Math.round((raw / total) * maxScore * 100) / 100, 0, maxScore);

    const res = await apiFetch('/api/attempts', { method: 'POST', body: { QuizID: Number(quizId), Score: serverScore } });
    if (!res.ok) return res;
    saveOverlay('attempt', res.attempt.id, { answers, startedAt: nowISO() });
    logAudit('quiz_attempt', 'quiz', quizId, `Attempt ${res.attempt.attemptNo} on "${quiz.title}" scored ${percentage}%.`);
    pushActivity('quiz_attempt');
    await syncQuiet();
    store.save();
    const attempt = byId(db.attempts, res.attempt.id) || res.attempt;
    return { ok: true, attempt, total, score: raw };
  },

  /* ---- courses / modules / lessons (rules 1 + 2 + 11) ---- */
  async createCourse(data) {
    const code = String(data.code || '').trim().toUpperCase();
    if (!code) return { ok: false, error: 'Course code is required.' };
    if (db.courses.some((c) => c.code.toUpperCase() === code)) {
      return { ok: false, error: `Course code "${code}" already exists — codes must be unique. (Rule 1)` };
    }
    const body = {
      code,
      title: String(data.title || '').trim(),
      desc: data.desc || '',
      status: data.status || 'draft',
    };
    if (data.instructorId) body.instructorId = Number(data.instructorId);
    const res = await apiFetch('/api/courses', { method: 'POST', body });
    if (!res.ok) return res;
    // category/level/credits/prereqs/releaseDate have no MySQL columns -> overlay
    saveOverlay('course', res.course.id, {
      category: data.category || 'General',
      level: data.level || 'Beginner',
      credits: Number(data.credits) || 3,
      prereqIds: data.prereqIds || [],
      releaseDate: data.releaseDate || nowISO(),
    });
    logAudit('create_course', 'course', res.course.id, `Created course ${code} — ${res.course.title}.`);
    await syncQuiet();
    store.save();
    return { ok: true, course: byId(db.courses, res.course.id) || res.course };
  },

  async updateCourse(courseId, data) {
    const course = byId(db.courses, courseId);
    if (!course) return { ok: false, error: 'Course not found.' };
    if (data.code) {
      const code = data.code.trim().toUpperCase();
      if (db.courses.some((c) => c.id !== courseId && c.code.toUpperCase() === code)) {
        return { ok: false, error: `Course code "${code}" already exists. (Rule 1)` };
      }
    }
    const body = {};
    if (data.code) body.code = data.code.trim().toUpperCase();
    if (data.title !== undefined && data.title !== null) body.title = String(data.title).trim();
    if (data.desc !== undefined && data.desc !== null) body.desc = data.desc;
    if (data.status !== undefined && data.status !== null && data.status !== '') body.status = data.status;
    if (data.instructorId) body.instructorId = Number(data.instructorId);
    const ov = {};
    if (data.category !== undefined && data.category !== null && data.category !== '') ov.category = data.category;
    if (data.level !== undefined && data.level !== null && data.level !== '') ov.level = data.level;
    if (data.credits !== undefined && data.credits !== null && data.credits !== '') ov.credits = Number(data.credits) || 3;
    if (data.prereqIds !== undefined) ov.prereqIds = data.prereqIds || [];
    if (data.releaseDate !== undefined && data.releaseDate !== null && data.releaseDate !== '') ov.releaseDate = data.releaseDate;
    if (!Object.keys(body).length && !Object.keys(ov).length) return { ok: false, error: 'Nothing to update.' };
    if (Object.keys(body).length) {
      const res = await apiFetch(`/api/courses/${courseId}`, { method: 'PUT', body });
      if (!res.ok) return res;
    }
    if (Object.keys(ov).length) saveOverlay('course', courseId, ov);
    logAudit('update_course', 'course', courseId, `Updated course ${course.code}.`);
    await syncQuiet();
    store.save();
    return { ok: true, course: byId(db.courses, courseId) || course };
  },

  async archiveCourse(courseId) {
    const course = byId(db.courses, courseId);
    if (!course) return { ok: false, error: 'Course not found.' };
    const next = course.status === 'archived' ? 'draft' : 'archived';
    const res = await apiFetch(`/api/courses/${courseId}`, { method: 'PUT', body: { status: next } });
    if (!res.ok) return res;
    logAudit('archive_course', 'course', courseId, `Course ${course.code} set to ${next}.`);
    await syncQuiet();
    store.save();
    return { ok: true, course: byId(db.courses, courseId) || res.course };
  },

  async createModule(courseId, data) {
    const siblings = modulesOf(courseId);
    const explicit = data.seq !== undefined && data.seq !== null && data.seq !== '';
    const seq = explicit ? Number(data.seq) : (siblings.length ? Math.max(...siblings.map((m) => m.seq)) + 1 : 1);
    if (explicit && siblings.some((m) => m.seq === seq)) return { ok: false, error: `Module sequence ${seq} already used. (Rule 2)` };
    const body = { title: String(data.title || '').trim(), description: data.description || '' };
    if (explicit) body.seq = seq;
    const res = await apiFetch(`/api/courses/${courseId}/modules`, { method: 'POST', body });
    if (!res.ok) return res;
    logAudit('create_module', 'module', res.module.id, `Added module ${res.module.seq}: ${res.module.title}.`);
    await syncQuiet();
    store.save();
    return { ok: true, module: byId(db.modules, res.module.id) || res.module };
  },

  async updateModule(moduleId, data) {
    const mod = byId(db.modules, moduleId);
    if (!mod) return { ok: false, error: 'Module not found.' };
    const explicit = data.seq !== undefined && data.seq !== null && data.seq !== '';
    if (explicit) {
      const target = Number(data.seq);
      const clash = db.modules.find((m) => m.courseId === mod.courseId && m.id !== moduleId && m.seq === target);
      if (clash) return { ok: false, error: `Module sequence ${target} already used. (Rule 2)` };
    }
    const body = {};
    if (data.title) body.title = String(data.title).trim();
    if (data.description !== undefined && data.description !== null) body.description = data.description;
    if (explicit) body.seq = Number(data.seq);
    if (!Object.keys(body).length) return { ok: false, error: 'Nothing to update.' };
    const res = await apiFetch(`/api/modules/${moduleId}`, { method: 'PUT', body });
    if (!res.ok) return res;
    logAudit('update_module', 'module', moduleId, `Updated module "${data.title || mod.title}".`);
    await syncQuiet();
    store.save();
    return { ok: true, module: byId(db.modules, moduleId) || res.module };
  },

  async deleteModule(moduleId) {
    const mod = byId(db.modules, moduleId);
    if (!mod) return { ok: false, error: 'Module not found.' };
    const res = await apiFetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
    if (!res.ok) return res; // server rejects modules that still hold lessons
    logAudit('delete_module', 'module', moduleId, `Deleted empty module "${mod.title}".`);
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  async createLesson(moduleId, data) {
    const mod = byId(db.modules, moduleId);
    if (!mod) return { ok: false, error: 'Module not found.' };
    const siblings = lessonsOfModule(moduleId);
    const explicit = data.seq !== undefined && data.seq !== null && data.seq !== '';
    const seq = explicit ? Number(data.seq) : (siblings.length ? Math.max(...siblings.map((l) => l.seq)) + 1 : 1);
    if (explicit && siblings.some((l) => l.seq === seq)) return { ok: false, error: `Lesson sequence ${seq} already used in this module. (Rule 2)` };
    const body = { title: String(data.title || '').trim(), content: data.content || '' };
    if (explicit) body.seq = seq;
    const res = await apiFetch(`/api/modules/${moduleId}/lessons`, { method: 'POST', body });
    if (!res.ok) return res;
    // type/durationMin/videoUrl have no MySQL columns -> browser overlay
    saveOverlay('lesson', res.lesson.id, {
      type: data.type || 'reading',
      durationMin: Number(data.durationMin) || 10,
      videoUrl: data.videoUrl || '',
    });
    logAudit('create_lesson', 'lesson', res.lesson.id, `Added lesson "${res.lesson.title}" to ${mod.title}.`);
    await syncQuiet();
    store.save();
    return { ok: true, lesson: byId(db.lessons, res.lesson.id) || res.lesson };
  },

  async updateLesson(lessonId, data) {
    const lesson = byId(db.lessons, lessonId);
    if (!lesson) return { ok: false, error: 'Lesson not found.' };
    const explicit = data.seq !== undefined && data.seq !== null && data.seq !== '';
    if (explicit) {
      const target = Number(data.seq);
      const clash = db.lessons.find((l) => l.moduleId === lesson.moduleId && l.id !== lessonId && l.seq === target);
      if (clash) return { ok: false, error: `Lesson sequence ${target} already used in this module. (Rule 2)` };
    }
    const body = {};
    if (data.title) body.title = String(data.title).trim();
    if (data.content !== undefined && data.content !== null) body.content = data.content;
    if (explicit) body.seq = Number(data.seq);
    const ov = {};
    if (data.type !== undefined && data.type !== null && data.type !== '') ov.type = data.type;
    if (data.durationMin !== undefined && data.durationMin !== null && data.durationMin !== '') ov.durationMin = Number(data.durationMin) || lesson.durationMin;
    if (data.videoUrl !== undefined && data.videoUrl !== null) ov.videoUrl = data.videoUrl;
    if (!Object.keys(body).length && !Object.keys(ov).length) return { ok: false, error: 'Nothing to update.' };
    if (Object.keys(body).length) {
      const res = await apiFetch(`/api/lessons/${lessonId}`, { method: 'PUT', body });
      if (!res.ok) return res;
    }
    if (Object.keys(ov).length) saveOverlay('lesson', lessonId, ov);
    logAudit('update_lesson', 'lesson', lessonId, `Updated lesson "${data.title || lesson.title}".`);
    await syncQuiet();
    store.save();
    return { ok: true, lesson: byId(db.lessons, lessonId) || lesson };
  },

  async deleteLesson(lessonId) {
    const lesson = byId(db.lessons, lessonId);
    if (!lesson) return { ok: false, error: 'Lesson not found.' };
    const res = await apiFetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
    if (!res.ok) return res;
    db.progress = db.progress.filter((p) => p.lessonId !== lessonId); // progress is local-only
    dropOverlay('lesson', lessonId);
    logAudit('delete_lesson', 'lesson', lessonId, `Deleted lesson "${lesson.title}".`);
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  /* ---- quizzes (rule 11; questions live in the browser overlay) ---- */
  async createQuiz(courseId, data) {
    const body = {
      title: (data.title || 'Untitled quiz').trim(),
      maxAttempts: Number(data.maxAttempts) || 1,
    };
    if (data.status) body.status = data.status;
    if (data.availableFrom) body.availableFrom = data.availableFrom;
    if (data.availableUntil) body.availableUntil = data.availableUntil;
    const res = await apiFetch(`/api/courses/${courseId}/quizzes`, { method: 'POST', body });
    if (!res.ok) return res;
    saveOverlay('quiz', res.quiz.id, {
      desc: data.desc || '',
      timeLimitMin: Number(data.timeLimitMin) || 10,
      passMark: clamp(Number(data.passMark) || 60, 0, 100),
      questions: [],
    });
    logAudit('create_quiz', 'quiz', res.quiz.id, `Created quiz "${res.quiz.title}" in ${byId(db.courses, courseId)?.code}.`);
    await syncQuiet();
    store.save();
    return { ok: true, quiz: byId(db.quizzes, res.quiz.id) || res.quiz };
  },

  async updateQuiz(quizId, data) {
    const quiz = byId(db.quizzes, quizId);
    if (!quiz) return { ok: false, error: 'Quiz not found.' };
    const body = {};
    if (data.title !== undefined && data.title !== null) body.title = String(data.title).trim();
    if (data.status !== undefined && data.status !== null && data.status !== '') body.status = data.status;
    if (data.maxAttempts !== undefined && data.maxAttempts !== null && data.maxAttempts !== '') body.maxAttempts = Number(data.maxAttempts);
    if (data.availableFrom) body.availableFrom = data.availableFrom;
    if (data.availableUntil) body.availableUntil = data.availableUntil;
    const ov = {};
    if (data.desc !== undefined && data.desc !== null) ov.desc = data.desc;
    if (data.timeLimitMin !== undefined && data.timeLimitMin !== null && data.timeLimitMin !== '') ov.timeLimitMin = Number(data.timeLimitMin) || quiz.timeLimitMin;
    if (data.passMark !== undefined && data.passMark !== null && data.passMark !== '') ov.passMark = clamp(Number(data.passMark) || quiz.passMark, 0, 100);
    if (!Object.keys(body).length && !Object.keys(ov).length) return { ok: false, error: 'Nothing to update.' };
    if (Object.keys(body).length) {
      const res = await apiFetch(`/api/quizzes/${quizId}`, { method: 'PUT', body });
      if (!res.ok) return res;
    }
    if (Object.keys(ov).length) saveOverlay('quiz', quizId, ov);
    logAudit('update_quiz', 'quiz', quizId, `Updated quiz "${data.title || quiz.title}"${data.status ? ` (status: ${data.status})` : ''}.`);
    await syncQuiet();
    store.save();
    return { ok: true, quiz: byId(db.quizzes, quizId) || quiz };
  },

  async deleteQuiz(quizId) {
    const quiz = byId(db.quizzes, quizId);
    if (!quiz) return { ok: false, error: 'Quiz not found.' };
    const res = await apiFetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    if (!res.ok) return res; // attempts + grades cascade away in MySQL
    db.attempts.filter((a) => a.quizId === quizId).forEach((a) => dropOverlay('attempt', a.id));
    dropOverlay('quiz', quizId);
    logAudit('delete_quiz', 'quiz', quizId, `Deleted quiz "${quiz.title}".`);
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  async addQuestion(quizId, data) {
    const quiz = byId(db.quizzes, quizId);
    if (!quiz) return { ok: false, error: 'Quiz not found.' };
    const options = (data.options || []).map((o) => String(o).trim()).filter(Boolean);
    if (options.length < 2) return { ok: false, error: 'Provide at least two answer options.' };
    const correct = Number(data.correct);
    if (!(correct >= 0 && correct < options.length)) return { ok: false, error: 'Choose the correct option index.' };
    quiz.questions.push({
      id: uid('qq'), prompt: String(data.prompt || '').trim(), options, correct,
      marks: Number(data.marks) || 1,
    });
    // No Questions table in MySQL: the question list stays in the overlay.
    saveOverlay('quiz', quizId, { questions: quiz.questions });
    logAudit('add_question', 'quiz', quizId, `Added a question to "${quiz.title}" (${quiz.questions.length} total).`);
    store.save();
    return { ok: true, quiz };
  },

  async deleteQuestion(quizId, qid) {
    const quiz = byId(db.quizzes, quizId);
    if (!quiz) return { ok: false, error: 'Quiz not found.' };
    quiz.questions = quiz.questions.filter((q) => q.id !== qid);
    saveOverlay('quiz', quizId, { questions: quiz.questions });
    logAudit('delete_question', 'quiz', quizId, `Removed a question from "${quiz.title}".`);
    store.save();
    return { ok: true };
  },

  /* ---- grades (rules 8 + 9; feedback is browser-overlay only) ---- */
  async saveGrade(studentId, courseId, score, feedback, publish) {
    const n = Number(score);
    if (isNaN(n) || n < 0 || n > 100) return { ok: false, error: 'Score must be a number between 0 and 100. (Rule 8)' };
    const grade = gradeFor(studentId, courseId);
    const student = byId(db.users, studentId);
    const course = byId(db.courses, courseId);
    const wasReleased = !!(grade && grade.status === 'released');
    const changed = wasReleased && grade.score !== n;

    if (wasReleased && changed) {
      const proceed = window.confirm(
        `This grade was already published (${grade.score}). Changing it to ${n} will be recorded in grade history and the audit log. Continue?`
      );
      if (!proceed) return { ok: false, error: 'Published-grade change cancelled. (Rule 9)' };
    }

    // The schema grades quiz attempts, so a student who has never attempted a
    // quiz in this course cannot be graded yet (server returns that message).
    const res = await apiFetch('/api/grades', {
      method: 'POST',
      body: {
        CourseID: Number(courseId),
        StudentID: Number(studentId),
        Score: n,
        status: (publish === true || wasReleased) ? 'released' : 'draft',
      },
    });
    if (!res.ok) return res;

    if (changed) {
      db.gradeHistory.push({
        id: uid('h'), gradeId: grade.id, prev: grade.score, next: n,
        note: feedback || 'Published grade adjusted.', changedBy: session.user.id, changedAt: nowISO(),
      });
      saveOverlay('grade', res.grade.id, { adjustedAt: nowISO() });
    }
    saveOverlay('grade', res.grade.id, {
      feedback: feedback !== undefined && feedback !== null ? String(feedback) : (grade ? grade.feedback : ''),
    });

    if (publish === true) {
      pushNotification(studentId, `Grade published — ${course.code}`, `Your grade for ${course.title} is now available (${n}, ${letterFor(n)}).`);
      pushActivity('grade_view');
    }
    logAudit(
      publish ? 'publish_grade' : (grade ? 'adjust_grade' : 'save_grade'),
      'grade', res.grade.id,
      `${publish ? 'Published' : (grade ? 'Adjusted' : 'Saved draft')} ${course.code} grade for ${student.name}: ${n} (${res.grade.status}).`
    );
    await syncQuiet();
    store.save();
    return { ok: true, grade: byId(db.grades, res.grade.id) || res.grade };
  },

  async withdrawGrade(gradeId) {
    const grade = byId(db.grades, gradeId);
    if (!grade) return { ok: false, error: 'Grade not found.' };
    const res = await apiFetch(`/api/grades/${gradeId}/status`, { method: 'PUT', body: { status: 'draft' } });
    if (!res.ok) return res;
    logAudit('withdraw_grade', 'grade', gradeId, 'Moved a published grade back to draft.');
    await syncQuiet();
    store.save();
    return { ok: true };
  },

  /* ---- users (rule 11; role/status/email changes are admin-only server-side) ---- */
  async createUser(data) {
    const email = String(data.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' };
    if (byEmail(email)) return { ok: false, error: 'That email is already registered.' };
    if (!String(data.name || '').trim()) return { ok: false, error: 'Name is required.' };
    if (String(data.password || '').length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const role = ['student', 'instructor', 'admin'].includes(data.role) ? data.role : 'student';
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: {
        name: String(data.name).trim(),
        email,
        role,
        status: data.status || 'active',
        password: String(data.password),
      },
    });
    if (!res.ok) return res;
    // dept/phone have no MySQL columns -> browser overlay
    saveOverlay('profile', res.user.id, { dept: data.dept || '', phone: data.phone || '', bio: '' });
    logAudit('create_user', 'user', res.user.id, `Created ${role} account ${email}.`);
    await syncQuiet();
    store.save();
    return { ok: true, user: byId(db.users, res.user.id) || res.user };
  },

  async updateUser(userId, data) {
    const user = byId(db.users, userId);
    if (!user) return { ok: false, error: 'User not found.' };
    if (data.status !== undefined && data.status !== null && data.status !== '') {
      const me = session.user;
      if (user.id === me?.id && data.status !== 'active') return { ok: false, error: 'You cannot deactivate your own account.' };
    }
    const body = {};
    if (data.name !== undefined && data.name !== null) body.name = String(data.name).trim();
    if (data.email) body.email = String(data.email).trim().toLowerCase();
    if (data.role !== undefined && data.role !== null && data.role !== '') body.role = data.role;
    if (data.status !== undefined && data.status !== null && data.status !== '') body.status = data.status;
    if (data.password) body.password = String(data.password);
    const ov = {};
    if (data.dept !== undefined) ov.dept = data.dept;
    if (data.phone !== undefined) ov.phone = data.phone;
    if (data.bio !== undefined) ov.bio = data.bio;
    if (!Object.keys(body).length && !Object.keys(ov).length) return { ok: false, error: 'Nothing to update.' };
    if (Object.keys(body).length) {
      const res = await apiFetch(`/api/users/${userId}`, { method: 'PUT', body });
      if (!res.ok) return res; // server: admin-only for role/status/email, self-or-admin for name
    }
    if (Object.keys(ov).length) saveOverlay('profile', userId, ov);
    if (data.status !== undefined && data.status !== null && data.status !== '') {
      logAudit('set_user_status', 'user', userId, `Set ${user.email} status to ${data.status}.`);
    } else {
      logAudit('update_user', 'user', userId, `Updated profile for ${user.email}.`);
    }
    await syncQuiet();
    store.save();
    return { ok: true, user: byId(db.users, userId) || user };
  },

  async changePassword(userId, current, next) {
    if (String(next || '').length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
    // The browser never sees password hashes, so the current password is
    // verified by the server (POST /api/auth/change-password).
    const res = await apiFetch('/api/auth/change-password', { method: 'POST', body: { current, next } });
    if (!res.ok) return res;
    logAudit('change_password', 'user', userId, 'Password changed.');
    store.save();
    return { ok: true };
  },

  /* ---- notifications ---- */
  markNotificationsRead(userId) {
    db.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
    store.save();
    return { ok: true };
  },
}

/* ======================= 7. UI primitives ============================== */
function toast(message, type = 'info') {
  const box = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '!' : 'i';
  el.innerHTML = `<strong aria-hidden="true">${icon}</strong><span>${esc(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss">×</button>`;
  const remove = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 230); };
  el.querySelector('.toast-close').addEventListener('click', remove);
  box.appendChild(el);
  setTimeout(remove, 4200);
}

function openModal({ title, body = '', footer = '', large = false }) {
  const root = $('#modal-root');
  root.innerHTML = `
    <div class="modal${large ? ' modal-lg' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-header">
        <h3>${esc(title)}</h3>
        <button type="button" class="icon-btn" data-act="close-modal" aria-label="Close dialog">×</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>`;
  root.hidden = false;
  document.body.style.overflow = 'hidden';
  const first = root.querySelector('input, select, textarea, button.btn');
  if (first) setTimeout(() => first.focus(), 40);
}

function closeModal() {
  const root = $('#modal-root');
  root.hidden = true;
  root.innerHTML = '';
  document.body.style.overflow = '';
}

const confirmDialog = (message) => window.confirm(message);

/* ======================= 8. Navigation & router ========================= */
const NAV = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'catalog', label: 'Course Catalog', icon: '▤' },
    { id: 'my-courses', label: 'My Courses', icon: '▣' },
    { id: 'grades', label: 'My Grades', icon: '▥' },
    { id: 'certificates', label: 'Certificates', icon: '◎' },
    { id: 'notifications', label: 'Notifications', icon: '✉' },
    { id: 'profile', label: 'Profile', icon: '◐' },
  ],
  instructor: [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'teach-courses', label: 'My Courses', icon: '▣' },
    { id: 'quiz-manager', label: 'Quiz Manager', icon: '✎' },
    { id: 'gradebook', label: 'Gradebook', icon: '▥' },
    { id: 'students', label: 'My Students', icon: '✿' },
    { id: 'notifications', label: 'Notifications', icon: '✉' },
    { id: 'profile', label: 'Profile', icon: '◐' },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'users', label: 'User Management', icon: '♟' },
    { id: 'courses', label: 'Course Oversight', icon: '▤' },
    { id: 'enrollments', label: 'Enrollments', icon: '▣' },
    { id: 'audit', label: 'Audit Log', icon: '☰' },
    { id: 'activity', label: 'Activity & Reports', icon: '◔' },
    { id: 'notifications', label: 'Notifications', icon: '✉' },
    { id: 'profile', label: 'Profile', icon: '◐' },
  ],
};

const PAGE_TITLES = {
  dashboard: 'Dashboard', catalog: 'Course Catalog', 'my-courses': 'My Courses',
  'teach-courses': 'My Courses', course: 'Course Details', lesson: 'Lesson', take: 'Quiz',
  grades: 'My Grades', certificates: 'Certificates', 'quiz-manager': 'Quiz Manager',
  quiz: 'Edit Quiz', gradebook: 'Gradebook', students: 'My Students', users: 'User Management',
  courses: 'Course Oversight', enrollments: 'Enrollments', audit: 'Audit Log',
  activity: 'Activity & Reports', notifications: 'Notifications', profile: 'Profile', search: 'Search Results',
};

const ROLE_HOME = { student: 'dashboard', instructor: 'dashboard', admin: 'dashboard' };

const state = {
  page: 'dashboard', params: [], query: {},
  quiz: null,
};

let afterHooks = [];
const afterRender = (fn) => afterHooks.push(fn);

function navigate(page, params = [], query = {}) {
  const q = Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  location.hash = `#/${[page, ...params].join('/')}${q ? `?${q}` : ''}`;
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  if (!raw) return { page: null, params: [], query: {} };
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const query = {};
  if (queryPart) {
    queryPart.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) query[k] = decodeURIComponent(v || '');
    });
  }
  return { page: parts[0] || null, params: parts.slice(1), query };
}

function allowedPage(role, page) {
  const navIds = NAV[role].map((n) => n.id);
  const extras = { student: ['course', 'lesson', 'take', 'search'], instructor: ['course', 'quiz', 'search'], admin: ['course', 'search'] };
  return navIds.includes(page) || (extras[role] || []).includes(page);
}

function renderNav() {
  const user = session.user;
  const html = NAV[user.role].map((item) => `
    <button type="button" class="sidebar-link${state.page === item.id ? ' active' : ''}" data-nav="${item.id}" title="${esc(item.label)}">
      <span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${esc(item.label)}</span>
    </button>`).join('');
  $('#sidebar-nav').innerHTML = html;
}

function renderShellChrome() {
  const user = session.user;
  if (!user) return;
  $('#profile-name').textContent = user.name;
  $('#profile-avatar').textContent = initials(user.name);
  $('#sidebar-name').textContent = user.name;
  $('#sidebar-avatar').textContent = initials(user.name);
  $('#sidebar-role').textContent = user.role;
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const dot = $('#notif-badge');
  dot.hidden = unread === 0;
}

const PAGES = {
  student: {},
  instructor: {},
  admin: {},
};

function render() {
  const user = session.user;
  if (!user) {
    if ($('#auth-screen').hidden) renderLanding();
    else renderAuth();
    return;
  }

  const route = parseHash();
  if (!route.page) { navigate(ROLE_HOME[user.role]); return; }
  state.page = route.page;
  state.params = route.params;
  state.query = route.query;

  if (!allowedPage(user.role, state.page)) {
    toast('That page is not available for your role.', 'warning');
    navigate(ROLE_HOME[user.role]);
    return;
  }

  $('#auth-screen').hidden = true;
  $('#app').hidden = false;

  const fn = PAGES[user.role][state.page];
  afterHooks = [];
  $('#page-title').textContent = PAGE_TITLES[state.page] || 'Page';
  renderNav();
  renderShellChrome();

  const content = $('#page-content');
  if (fn) {
    content.innerHTML = fn();
  } else {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">🚧</div>
      <h3>Page not found</h3><p>This page has not been implemented yet.</p>
      <button type="button" class="btn btn-primary" data-nav="dashboard">Back to dashboard</button></div>`;
  }
  afterHooks.forEach((hook) => { try { hook(); } catch (err) { console.error(err); } });
  content.scrollTop = 0;
  window.scrollTo({ top: 0 });
}

/* ======================= 9. Landing & auth screens ====================== */
function renderLanding() {
  $('#app').hidden = true;
  $('#auth-screen').hidden = true;
  $('#landing').hidden = false;
  $('#landing-mobile-menu').hidden = true;
  AUTH_NOTICE = '';
  document.body.classList.add('is-public');
  window.scrollTo({ top: 0 });
}

function renderAuth() {
  $('#app').hidden = true;
  $('#landing').hidden = true;
  $('#auth-screen').hidden = false;
  document.body.classList.remove('is-public');
  const notice = $('#auth-notice');
  if (notice) {
    notice.textContent = AUTH_NOTICE;
    notice.hidden = !AUTH_NOTICE;
  }
  const select = $('#login-email');
  if (select.options.length <= 1) {
    const groups = [
      ['Admin', 'admin'], ['Instructor', 'instructor'], ['Student', 'student'],
    ];
    let html = '<option value="">Choose a demo account…</option>';
    groups.forEach(([label, role]) => {
      const members = DEMO_ACCOUNTS.filter((u) => u.role === role);
      if (!members.length) return;
      html += `<optgroup label="${label}s">`;
      members.forEach((u) => { html += `<option value="${esc(u.email)}">${esc(u.name)} — ${esc(u.email)}</option>`; });
      html += '</optgroup>';
    });
    select.innerHTML = html;
  }
}

function openLogin(notice = '') {
  if (notice) AUTH_NOTICE = notice;
  renderAuth();
  setTimeout(() => {
    const el = $('#login-email');
    if (el) el.focus();
  }, 60);
}

let PENDING_CATALOG = null;

function routeAfterLogin(user) {
  const pending = PENDING_CATALOG;
  PENDING_CATALOG = null;
  if (pending && (pending.q || pending.cat)) {
    if (user.role === 'student') navigate('catalog', [], { q: pending.q || '', cat: pending.cat || '' });
    else navigate('search', [], { q: pending.q || pending.cat || '' });
    return;
  }
  navigate(ROLE_HOME[user.role]);
}

function wireLanding() {
  const menuBtn = $('#landing-menu-btn');
  const mobileMenu = $('#landing-mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.hidden = !mobileMenu.hidden;
      menuBtn.setAttribute('aria-expanded', String(!mobileMenu.hidden));
    });
    mobileMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        mobileMenu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  const search = $('#landing-search-form');
  if (search) {
    search.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = ($('#landing-search')?.value || '').trim();
      PENDING_CATALOG = { q, cat: '' };
      openLogin(q ? `Sign in to search the live catalog for “${q}”.` : 'Sign in to browse the live course catalog.');
    });
  }
}

function wireAuth() {
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form._busy) return;
    const email = $('#login-email').value;
    const password = $('#login-password').value;
    if (!email) { toast('Choose a demo account first.', 'warning'); return; }
    form._busy = true;
    try {
      clearUserCache(); // never carry a previous user's snapshot into this login
      const res = await api.login(email, password);
      if (!res.ok) {
        clearUserCache();
        toast(res.error || 'Login failed', 'error');
        renderAuth();
        return;
      }
      if (!session.user) {
        clearUserCache();
        AUTH_NOTICE = 'Your account data could not be loaded. Please try again.';
        renderAuth();
        return;
      }
      toast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
      routeAfterLogin(res.user);
      render();
    } catch (err) {
      clearUserCache();
      toast('Login failed. Please try again.', 'error');
      renderAuth();
    } finally {
      form._busy = false;
    }
  });

  $$('#role-cards .role-card').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (btn._busy) return;
      btn._busy = true;
      try {
        const res = await api.loginAsRole(btn.dataset.role);
        if (!res.ok) { toast(res.error, 'error'); return; }
        toast(`Signed in as ${res.user.name} (${btn.dataset.role}).`, 'success');
        routeAfterLogin(res.user);
        render();
      } finally {
        btn._busy = false;
      }
    });
  });
}

/* ======================= 10. Shell chrome wiring ======================== */
function wireShell() {
  $('#logout-btn').addEventListener('click', async () => {
    try {
      await api.logout();
    } catch (e) {
      clearUserCache();
    }
    closeModal();
    clearUserCache();
    toast('Signed out.', 'info');
    renderLanding();
  });

  $('#sidebar-toggle').addEventListener('click', () => {
    const app = $('#app');
    if (window.matchMedia('(max-width: 768px)').matches) {
      const open = app.classList.toggle('mobile-nav-open');
      $('#sidebar-overlay').hidden = !open;
    } else {
      app.classList.toggle('sidebar-collapsed');
    }
  });

  $('#sidebar-overlay').addEventListener('click', () => {
    $('#app').classList.remove('mobile-nav-open');
    $('#sidebar-overlay').hidden = true;
  });

  $('#theme-toggle').addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    $('#theme-toggle').innerHTML = next === 'dark' ? '&#9728;' : '&#9789;';
    toast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled.`, 'info');
  });

  $('#notif-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('#notif-menu');
    const open = menu.hidden;
    $('#profile-menu').hidden = true;
    if (open) {
      const user = session.user;
      const items = db.notifications.filter((n) => n.userId === user.id).slice(0, 8);
      menu.innerHTML = `
        <div class="dropdown-head">Notifications</div>
        ${items.length ? items.map((n) => `
          <div class="dropdown-item" style="cursor:default">
            <strong style="display:block;color:var(--text)">${esc(n.title)}</strong>
            <span class="text-small">${esc(n.body)}</span><br>
            <small>${timeAgo(n.createdAt)}${n.read ? '' : ' • new'}</small>
          </div>`).join('') : '<div class="dropdown-item" style="cursor:default">No notifications yet.</div>'}
        <div class="dropdown-divider"></div>
        <button type="button" class="dropdown-item" data-act="mark-notifs-read">Mark all as read</button>
        <button type="button" class="dropdown-item" data-nav="notifications">Open notification centre</button>`;
    }
    menu.hidden = !open;
    $('#notif-btn').setAttribute('aria-expanded', String(open));
  });

  $('#profile-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('#profile-menu');
    const open = menu.hidden;
    $('#notif-menu').hidden = true;
    if (open) {
      const user = session.user;
      menu.innerHTML = `
        <div class="dropdown-head">${esc(user.name)} · ${esc(user.role)}</div>
        <button type="button" class="dropdown-item" data-nav="profile">Edit profile</button>
        <button type="button" class="dropdown-item" data-act="request-password">Change password</button>
        <div class="dropdown-divider"></div>
        <button type="button" class="dropdown-item" data-act="reset-demo">Reset demo data</button>
        <button type="button" class="dropdown-item" data-act="logout">Sign out</button>`;
    }
    menu.hidden = !open;
    $('#profile-btn').setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-wrap')) $('#notif-menu').hidden = true;
    if (!e.target.closest('.profile-wrap')) $('#profile-menu').hidden = true;
  });

  const searchInput = $('#global-search');
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q.length < 2) { toast('Type at least 2 characters to search.', 'warning'); return; }
      navigate('search', [], { q });
    }
  });
}

/* ======================= 11. Shared HTML helpers ======================== */
function courseCard(course, ctx = {}) {
  const instructor = byId(db.users, course.instructorId);
  const enrolled = ctx.studentId ? isEnrolled(ctx.studentId, course.id) : false;
  const p = ctx.studentId ? courseProgress(ctx.studentId, course.id) : { pct: 0 };
  const enrolledCount = enrollmentsOfCourse(course.id).filter((e) => e.status !== 'dropped').length;

  let foot;
  if (ctx.mode === 'instructor') {
    foot = `<span class="text-small text-muted">${enrolledCount} enrolled</span>
      <span class="btn-group">
        <button type="button" class="btn btn-sm btn-outline" data-act="edit-course" data-id="${course.id}">Edit</button>
        <button type="button" class="btn btn-sm" data-nav="course" data-id="${course.id}">Open</button>
      </span>`;
  } else if (ctx.mode === 'admin') {
    foot = `${badge(course.status)}
      <span class="btn-group">
        <button type="button" class="btn btn-sm" data-nav="course" data-id="${course.id}">View</button>
        <button type="button" class="btn btn-sm btn-warning" data-act="archive-course" data-id="${course.id}">${course.status === 'archived' ? 'Restore' : 'Archive'}</button>
      </span>`;
  } else if (enrolled) {
    foot = `<span class="badge badge-info">Enrolled · ${p.pct}%</span>
      <button type="button" class="btn btn-sm btn-primary" data-nav="course" data-id="${course.id}">Continue</button>`;
  } else if (course.status === 'published') {
    foot = `<span class="text-small text-muted">${enrolledCount} enrolled</span>
      <button type="button" class="btn btn-sm btn-primary" data-act="enroll-course" data-id="${course.id}">Enroll</button>`;
  } else {
    foot = `${badge(course.status)}<span class="text-small text-muted">Not open</span>`;
  }

  return `
  <article class="card course-card" data-search="${esc(`${course.code} ${course.title} ${course.desc} ${course.category} ${course.level} ${instructor?.name || ''}`.toLowerCase())}"
    data-cat="${esc(course.category)}" data-level="${esc(course.level)}" data-course="${course.id}">
    <div class="course-card-body">
      <div class="flex items-center justify-between gap-1">
        <span class="course-code">${esc(course.code)}</span>
        ${badge(course.status)}
      </div>
      <h3>${esc(course.title)}</h3>
      <p class="course-desc">${esc(course.desc)}</p>
      ${enrolled && p.pct > 0 ? progressBar(p.pct) : ''}
      <div class="course-meta">
        <span>${esc(course.level)}</span><span>•</span><span>${course.credits} credits</span>
        <span>•</span><span>${esc(instructor ? instructor.name : 'Unassigned')}</span>
      </div>
    </div>
    <div class="course-card-foot">${foot}</div>
  </article>`;
}

function lessonRowHtml(lesson, studentId, opts = {}) {
  const done = studentId ? lessonDone(studentId, lesson.id) : false;
  const unlocked = studentId ? lessonUnlocked(studentId, lesson.courseId, lesson) : true;
  const icon = done ? '✅' : unlocked ? '📄' : '🔒';
  const status = done ? badge('completed', 'Completed') : unlocked ? badge('active', 'Available') : badge('locked', 'Locked');
  let actions = '';
  if (opts.instructorView) {
    actions = `
      <button type="button" class="btn btn-sm" data-act="edit-lesson" data-id="${lesson.id}">Edit</button>
      <button type="button" class="btn btn-sm btn-danger" data-act="delete-lesson" data-id="${lesson.id}">Delete</button>`;
  } else if (studentId) {
    actions = `
      <button type="button" class="btn btn-sm btn-outline" data-nav="lesson" data-id="${lesson.id}">Open</button>
      ${done ? '' : `<button type="button" class="btn btn-sm btn-primary" data-act="complete-lesson" data-id="${lesson.id}" ${unlocked ? '' : 'disabled'}>Mark complete</button>`}`;
  }
  return `
    <div class="lesson-row${!done && !unlocked ? ' locked' : ''}">
      <span class="lesson-status-icon" aria-hidden="true">${icon}</span>
      <div class="lesson-main">
        <h4>${lesson.seq}. ${esc(lesson.title)}</h4>
        <p>${esc(lesson.type)} · ${lesson.durationMin} min ${opts.showModule ? `· ${esc(opts.showModule)}` : ''}</p>
      </div>
      ${status}
      <div class="lesson-actions">${actions}</div>
    </div>`;
}

/* ======================= 12. Student pages ============================== */
PAGES.student.dashboard = function studentDashboard() {
  const user = session.user;
  const enrollments = enrollmentsOfStudent(user.id).filter((e) => e.status !== 'dropped');
  const active = enrollments.filter((e) => e.status === 'active');
  const completed = enrollments.filter((e) => e.status === 'completed');
  const avgPct = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + courseProgress(user.id, e.courseId).pct, 0) / enrollments.length)
    : 0;
  const grades = db.grades.filter((g) => g.studentId === user.id && g.status === 'released');
  const avgGrade = grades.length ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length) : null;
  const lessonsDone = enrollments.reduce((sum, e) => sum + courseProgress(user.id, e.courseId).done, 0);
  const attempts = db.attempts.filter((a) => a.studentId === user.id);
  const certificates = enrollments.filter((e) => courseEligibleCert(user.id, e.courseId)).length;

  const courseTile = (e) => {
    const c = byId(db.courses, e.courseId);
    if (!c) return '';
    const p = courseProgress(user.id, c.id);
    const nextLesson = lessonsOfCourse(c.id).find((l) => !lessonDone(user.id, l.id) && lessonUnlocked(user.id, c.id, l));
    return `
      <article class="card course-card">
        <div class="course-card-body">
          <div class="flex items-center justify-between gap-1">
            <span class="course-code">${esc(c.code)}</span>
            ${badge(e.status || 'active', e.status === 'completed' ? 'Completed' : 'In progress')}
          </div>
          <h3>${esc(c.title)}</h3>
          <p class="course-desc">${esc(c.desc)}</p>
          <div class="flex items-center justify-between text-small text-muted">
            <span>${p.done}/${p.total} lessons complete</span><strong>${p.pct}%</strong>
          </div>
          ${progressBar(p.pct)}
          <p class="text-small text-muted mt-2 mb-0">${nextLesson ? `Next: ${esc(nextLesson.title)}` : 'All lessons complete — review anytime.'}</p>
        </div>
        <div class="course-card-foot">
          <span class="text-small text-muted">${esc(byId(db.users, c.instructorId)?.name || 'Instructor')}</span>
          <button type="button" class="btn btn-sm btn-primary" data-nav="${nextLesson ? 'lesson' : 'course'}" data-id="${nextLesson ? nextLesson.id : c.id}">
            ${nextLesson ? 'Continue' : 'Review course'}
          </button>
        </div>
      </article>`;
  };

  const quizItems = [];
  enrollments.forEach((e) => {
    const course = byId(db.courses, e.courseId);
    if (!course) return;
    quizzesOfCourse(e.courseId).forEach((q) => {
      if (q.status === 'draft') return;
      const win = quizWindow(q);
      const used = attemptsFor(user.id, q.id).length;
      if (used >= q.maxAttempts || !win.open) return;
      quizItems.push({ q, win, used, course });
    });
  });

  const notices = db.notices.filter((n) => n.audience === 'all' || n.audience === 'student').slice(0, 3);

  return `
    <section class="hero-banner">
      <span class="landing-eyebrow">Student workspace</span>
      <h2>Welcome back, ${esc(user.name.split(' ')[0])}</h2>
      <p>${active.length ? `You have ${active.length} course${active.length > 1 ? 's' : ''} in progress. Pick up where you left off.` : 'Your learning journey starts with your first enrollment.'}</p>
      <div class="hero-stats">
        <div class="hero-stat"><b>${enrollments.length}</b><span>Enrolled</span></div>
        <div class="hero-stat"><b>${completed.length}</b><span>Completed</span></div>
        <div class="hero-stat"><b>${avgPct}%</b><span>Avg progress</span></div>
        <div class="hero-stat"><b>${avgGrade === null ? '—' : avgGrade}</b><span>Avg grade</span></div>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div>
          <div class="dashboard-panel-title">
            <h3 class="section-title" style="margin:0">Continue learning</h3>
            <button type="button" class="btn btn-sm btn-ghost" data-nav="my-courses">View all courses</button>
          </div>
          <div class="dashboard-course-grid">
            ${active.length ? active.map(courseTile).join('') : `<div class="card empty-state"><div class="empty-icon">▤</div>
              <h3>No active courses</h3><p>Browse the catalog and enroll to start learning.</p>
              <button type="button" class="btn btn-primary" data-nav="catalog">Open catalog</button></div>`}
          </div>
        </div>

        <div class="card">
          <div class="dashboard-panel-title"><h3>Available quizzes</h3><span class="text-small text-muted">${quizItems.length} ready</span></div>
          ${quizItems.length ? quizItems.map(({ q, used, course }) => `
            <div class="list-item">
              <span class="stat-icon">✎</span>
              <div style="flex:1;min-width:0">
                <strong>${esc(q.title)}</strong>
                <div class="text-small text-muted">${esc(course.code)} · ${q.questions.length} questions · ${q.timeLimitMin} min · attempts ${used}/${q.maxAttempts}</div>
              </div>
              ${badge('active', 'Open')}
              <button type="button" class="btn btn-sm btn-primary" data-nav="take" data-id="${q.id}">Attempt</button>
            </div>`).join('') : '<p class="text-muted mb-0">No quizzes are open right now. Enroll in more courses to see quizzes here.</p>'}
        </div>
      </div>

      <aside class="dashboard-side">
        <div class="card">
          <div class="dashboard-panel-title"><h3>Learning summary</h3></div>
          <div class="kv-row"><span>Lessons completed</span><strong>${lessonsDone}</strong></div>
          <div class="kv-row"><span>Quiz attempts</span><strong>${attempts.length}</strong></div>
          <div class="kv-row"><span>Released grades</span><strong>${grades.length}</strong></div>
          <div class="kv-row"><span>Certificates earned</span><strong>${certificates}</strong></div>
          <button type="button" class="btn btn-outline btn-block mt-2" data-nav="catalog">Browse catalog</button>
        </div>

        <div class="card">
          <div class="dashboard-panel-title"><h3>Released grades</h3><button type="button" class="link-button" data-nav="grades">View all</button></div>
          ${grades.length ? grades.slice(0, 4).map((g) => {
            const c = byId(db.courses, g.courseId);
            return `<div class="list-item"><div style="flex:1"><strong>${esc(c ? c.code : 'Course')}</strong>
              <div class="text-small text-muted">${fmtDate(g.publishedAt)}</div></div>
              <span class="badge badge-success">${g.score} · ${g.letter}</span></div>`;
          }).join('') : '<p class="text-muted mb-0">No published grades yet.</p>'}
        </div>

        <div class="card">
          <div class="dashboard-panel-title"><h3>Announcements</h3><button type="button" class="link-button" data-nav="notifications">Inbox</button></div>
          ${notices.length ? notices.map((n) => `
            <div class="list-item" style="align-items:flex-start">
              <span class="stat-icon">▤</span>
              <div><strong>${esc(n.title)}</strong>
                <div class="text-small text-muted">${esc(n.body)}</div>
                <small>${fmtDate(n.createdAt)} · ${esc(n.author)}</small></div>
            </div>`).join('') : '<p class="text-muted mb-0">No announcements right now.</p>'}
        </div>
      </aside>
    </div>`;
};

PAGES.student.catalog = function studentCatalog() {
  const user = session.user;
  const cats = [...new Set(db.courses.map((c) => c.category))];
  const levels = [...new Set(db.courses.map((c) => c.level))];
  const visible = db.courses.filter((c) => c.status === 'published' || isEnrolled(user.id, c.id));
  afterRender(() => {
    const qEl = $('#catalog-q');
    const catEl = $('#catalog-cat');
    if (qEl && state.query.q) qEl.value = state.query.q;
    if (catEl && state.query.cat) catEl.value = state.query.cat;
    applyCatalogFilter();
  });
  return `
    <div class="page-head">
      <div><h2>Course Catalog</h2><p>${visible.length} courses available · enroll to unlock lessons and quizzes.</p></div>
    </div>
    <div class="filter-bar">
      <input type="search" class="form-control" id="catalog-q" placeholder="Search title, code, instructor…" data-catalog-filter>
      <select class="form-control" id="catalog-cat" data-catalog-filter>
        <option value="">All categories</option>
        ${cats.map((c) => `<option>${esc(c)}</option>`).join('')}
      </select>
      <select class="form-control" id="catalog-level" data-catalog-filter>
        <option value="">All levels</option>
        ${levels.map((l) => `<option>${esc(l)}</option>`).join('')}
      </select>
      <span class="text-small text-muted" id="catalog-count">${visible.length} shown</span>
    </div>
    <div class="course-grid" id="catalog-grid">
      ${visible.map((c) => courseCard(c, { studentId: user.id })).join('')}
    </div>
    <div id="catalog-empty" class="empty-state" hidden>
      <div class="empty-icon">🔍</div><h3>No courses match</h3><p>Try different keywords or clear the filters.</p>
    </div>`;
};

PAGES.student['my-courses'] = function studentMyCourses() {
  const user = session.user;
  const list = enrollmentsOfStudent(user.id).filter((e) => e.status !== 'dropped');
  const active = list.filter((e) => e.status === 'active');
  const done = list.filter((e) => e.status === 'completed');
  const cardFor = (e) => {
    const c = byId(db.courses, e.courseId);
    const p = courseProgress(user.id, c.id);
    const g = gradeFor(user.id, c.id);
    return `
      <div class="list-item" style="align-items:flex-start">
        <span class="stat-icon">▣</span>
        <div style="flex:1;min-width:0">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="course-code">${esc(c.code)}</span>
            <strong>${esc(c.title)}</strong>${badge(e.status, e.status === 'completed' ? 'Completed' : 'Active')}
          </div>
          <div class="text-small text-muted mt-1">${p.done}/${p.total} lessons · enrolled ${fmtDate(e.enrolledAt)}${g ? ` · grade ${g.score} (${g.letter}) ${g.status === 'released' ? 'released' : 'draft'}` : ' · no grade yet'}</div>
          <div class="mt-1">${progressBar(p.pct)}</div>
        </div>
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-primary" data-nav="course" data-id="${c.id}">Open</button>
          ${e.status === 'active' ? `<button type="button" class="btn btn-sm btn-ghost" data-act="unenroll-course" data-id="${c.id}">Drop</button>` : ''}
        </div>
      </div>`;
  };
  return `
    <div class="page-head">
      <div><h2>My Courses</h2><p>${active.length} active · ${done.length} completed.</p></div>
      <button type="button" class="btn btn-outline" data-nav="catalog">Browse catalog</button>
    </div>
    <div class="card mb-3">
      <div class="card-header"><h3>Active</h3><span class="card-title-sub">${active.length} course(s)</span></div>
      ${active.length ? active.map(cardFor).join('') : '<p class="text-muted mb-0">No active enrollments — visit the catalog.</p>'}
    </div>
    <div class="card">
      <div class="card-header"><h3>Completed</h3><span class="card-title-sub">${done.length} course(s)</span></div>
      ${done.length ? done.map(cardFor).join('') : '<p class="text-muted mb-0">Completed courses appear here.</p>'}
    </div>`;
};

PAGES.course = function courseDetail() {
  const user = session.user;
  const course = byId(db.courses, state.params[0]);
  if (!course) return `<div class="empty-state"><div class="empty-icon">❓</div><h3>Course not found</h3>
    <button type="button" class="btn btn-primary" data-nav="catalog">Back to catalog</button></div>`;

  const instructor = byId(db.users, course.instructorId);
  const enrolled = isEnrolled(user.id, course.id);
  const p = courseProgress(user.id, course.id);
  const grade = gradeFor(user.id, course.id);
  const isOwner = user.role === 'instructor' && course.instructorId === user.id;
  const modules = modulesOf(course.id);
  const quizzes = quizzesOfCourse(course.id).filter((q) => user.role !== 'student' || q.status !== 'draft');
  const prereqs = (course.prereqIds || []).map((id) => byId(db.courses, id)).filter(Boolean);
  const studentCount = enrollmentsForCourse(course.id).filter((e) => e.status !== 'dropped').length;

  const overview = `
    <div class="card mb-3">
      <div class="flex items-center gap-1 flex-wrap mb-1">
        <span class="course-code">${esc(course.code)}</span>${badge(course.status)}
        ${badge('enrolled', course.level)}<span class="chip">${course.credits} credits</span>
        <span class="chip">${esc(course.category)}</span>
      </div>
      <h2>${esc(course.title)}</h2>
      <p>${esc(course.desc)}</p>
      <div class="course-meta mb-2">
        <span>👤 ${esc(instructor ? instructor.name : 'Unassigned')}</span><span>•</span>
        <span>📅 released ${fmtDate(course.releaseDate)}</span><span>•</span>
        <span>👥 ${studentCount} enrolled</span>
      </div>
      ${prereqs.length ? `<div class="warn-banner"><span>⚠</span><div><strong>Prerequisites:</strong>
        ${prereqs.map((c2) => `${esc(c2.code)} (${courseProgress(user.id, c2.id).pct}% done)`).join(', ')} — you need 50% in each before enrolling.</div></div>` : ''}
      ${user.role === 'student' ? (enrolled
        ? `<div class="flex items-center gap-2 flex-wrap">
            <div style="flex:1;min-width:180px">${progressBar(p.pct)}<small>${p.done}/${p.total} lessons · ${p.pct}% complete</small></div>
            ${grade ? badge(grade.status, `Grade ${grade.score} · ${grade.letter} (${grade.status})`) : '<span class="badge badge-neutral">No grade</span>'}
           </div>`
        : `<button type="button" class="btn btn-primary" data-act="enroll-course" data-id="${course.id}" ${course.status !== 'published' ? 'disabled' : ''}>
            ${course.status === 'published' ? 'Enroll now' : 'Enrollment closed'}</button>`) : ''}
      ${user.role === 'instructor' && isOwner ? `
        <div class="btn-group mt-1">
          <button type="button" class="btn btn-sm btn-outline" data-act="edit-course" data-id="${course.id}">Edit course</button>
          <button type="button" class="btn btn-sm btn-primary" data-act="open-create-module" data-id="${course.id}">Add module</button>
          <button type="button" class="btn btn-sm" data-act="toggle-publish-course" data-id="${course.id}">${course.status === 'published' ? 'Unpublish' : 'Publish'}</button>
        </div>` : ''}
      ${user.role === 'admin' ? `<div class="btn-group mt-1">
        <button type="button" class="btn btn-sm btn-warning" data-act="archive-course" data-id="${course.id}">${course.status === 'archived' ? 'Restore' : 'Archive'}</button>
      </div>` : ''}
    </div>`;

  const modulesHtml = modules.length ? modules.map((m) => {
    const lessons = lessonsOfModule(m.id);
    return `
      <section class="module-block">
        <div class="module-head">
          <span class="seq-badge">${m.seq}</span>
          <div style="flex:1"><strong>${esc(m.title)}</strong>
            <div class="text-small text-muted">${esc(m.description || '')}</div></div>
          ${user.role === 'instructor' && isOwner ? `
            <button type="button" class="btn btn-sm btn-primary" data-act="open-create-lesson" data-id="${m.id}">Add lesson</button>
            <button type="button" class="btn btn-sm" data-act="edit-module" data-id="${m.id}">Rename</button>
            <button type="button" class="btn btn-sm btn-danger" data-act="delete-module" data-id="${m.id}">Delete</button>` : ''}
        </div>
        ${lessons.length ? lessons.map((l) => lessonRowHtml(l, user.role === 'student' && enrolled ? user.id : null, {
          instructorView: user.role === 'instructor' && isOwner,
        })).join('') : '<div class="lesson-row"><p class="text-muted mb-0">No lessons yet.</p></div>'}
      </section>`;
  }).join('') : `<div class="empty-state"><div class="empty-icon">📭</div><h3>No modules yet</h3>
      <p>${user.role === 'instructor' ? 'Add the first module to start building this course.' : 'The instructor has not added modules yet.'}</p></div>`;

  const quizzesHtml = `
    <div class="card">
      <div class="card-header"><h3>Quizzes</h3>
        ${user.role === 'instructor' && isOwner ? `<button type="button" class="btn btn-sm btn-primary" data-act="open-create-quiz" data-id="${course.id}">New quiz</button>` : ''}
      </div>
      ${quizzes.length ? quizzes.map((q) => {
        const win = quizWindow(q);
        const used = enrolled ? attemptsFor(user.id, q.id).length : 0;
        return `
        <div class="list-item">
          <span class="stat-icon">✎</span>
          <div style="flex:1;min-width:0">
            <strong>${esc(q.title)}</strong>
            <div class="text-small text-muted">${q.questions.length} questions · ${q.timeLimitMin} min · pass ${q.passMark}% · attempts ${used}/${q.maxAttempts} · ${fmtDate(q.availableFrom)} → ${fmtDate(q.availableUntil)}</div>
          </div>
          ${badge(q.status)}
          ${user.role === 'student' && enrolled ? (win.open && used < q.maxAttempts
            ? `<button type="button" class="btn btn-sm btn-primary" data-nav="take" data-id="${q.id}">Attempt</button>`
            : `<span class="text-small text-muted">${esc(win.reason || 'Limit reached')}</span>`) : ''}
          ${user.role === 'instructor' && isOwner ? `<button type="button" class="btn btn-sm" data-nav="quiz" data-id="${q.id}">Manage</button>` : ''}
        </div>`;
      }).join('') : '<p class="text-muted mb-0">No quizzes yet.</p>'}
    </div>`;

  const rosterHtml = (user.role === 'instructor' && isOwner) || user.role === 'admin' ? `
    <div class="card">
      <div class="card-header"><h3>Roster</h3><span class="card-title-sub">${studentCount} students</span></div>
      ${enrollmentsForCourse(course.id).filter((e) => e.status !== 'dropped').slice(0, 12).map((e) => {
        const s = byId(db.users, e.studentId);
        const sp = courseProgress(e.studentId, course.id);
        const sg = gradeFor(e.studentId, course.id);
        return `<div class="list-item"><span class="avatar">${initials(s.name)}</span>
          <div style="flex:1"><strong>${esc(s.name)}</strong>
            <div class="text-small text-muted">${sp.pct}% complete${sg ? ` · grade ${sg.score} ${sg.status}` : ''}</div></div>
          ${badge(e.status)}</div>`;
      }).join('') || '<p class="text-muted mb-0">No enrollments yet.</p>'}
    </div>` : '';

  return `
    <div class="page-head">
      <div>
        <button type="button" class="btn btn-sm btn-ghost mb-1" data-act="back">← Back</button>
        <h2>${esc(course.code)} · ${esc(course.title)}</h2>
      </div>
    </div>
    ${overview}
    <div class="detail-grid">
      <div>${modulesHtml}<div class="mt-1">${quizzesHtml}</div></div>
      <div>${rosterHtml || `
        <div class="card">
          <div class="card-header"><h3>Course info</h3></div>
          <div class="kv-row"><span>Code</span><span>${esc(course.code)}</span></div>
          <div class="kv-row"><span>Level</span><span>${esc(course.level)}</span></div>
          <div class="kv-row"><span>Credits</span><span>${course.credits}</span></div>
          <div class="kv-row"><span>Category</span><span>${esc(course.category)}</span></div>
          <div class="kv-row"><span>Instructor</span><span>${esc(instructor ? instructor.name : '—')}</span></div>
          <div class="kv-row"><span>Modules</span><span>${modules.length}</span></div>
          <div class="kv-row"><span>Lessons</span><span>${lessonsOfCourse(course.id).length}</span></div>
          <div class="kv-row"><span>Created</span><span>${fmtDate(course.createdAt)}</span></div>
        </div>`}</div>
    </div>`;
};

PAGES.lesson = function lessonPage() {
  const user = session.user;
  const lesson = byId(db.lessons, state.params[0]);
  if (!lesson) return `<div class="empty-state"><div class="empty-icon">❓</div><h3>Lesson not found</h3>
    <button type="button" class="btn btn-primary" data-act="back">Go back</button></div>`;
  const course = byId(db.courses, lesson.courseId);
  const mod = byId(db.modules, lesson.moduleId);
  const enrolled = isEnrolled(user.id, course.id);
  const done = lessonDone(user.id, lesson.id);
  const unlocked = lessonUnlocked(user.id, course.id, lesson);
  const siblings = lessonsOfCourse(course.id);
  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const prev = siblings[idx - 1], next = siblings[idx + 1];

  if (user.role === 'student' && !enrolled) {
    return `<div class="empty-state"><div class="empty-icon">🔒</div><h3>You are not enrolled</h3>
      <p>Enroll in ${esc(course.code)} to access its lessons.</p>
      <button type="button" class="btn btn-primary" data-nav="course" data-id="${course.id}">View course</button></div>`;
  }

  return `
    <div class="page-head">
      <div>
        <button type="button" class="btn btn-sm btn-ghost mb-1" data-nav="course" data-id="${course.id}">← ${esc(course.code)}</button>
        <h2>${esc(lesson.title)}</h2>
        <p>Module ${mod ? mod.seq : '?'}: ${esc(mod ? mod.title : '')} · lesson ${lesson.seq} · ${esc(lesson.type)} · ${lesson.durationMin} min</p>
      </div>
      <div class="btn-group">
        ${done ? badge('completed', 'Completed') : unlocked ? badge('active', 'Unlocked') : badge('locked', 'Locked')}
        ${user.role === 'student' ? (done
          ? '<span class="btn btn-success" disabled>Completed ✓</span>'
          : `<button type="button" class="btn btn-primary" data-act="complete-lesson" data-id="${lesson.id}" ${unlocked ? '' : 'disabled'}>Mark as complete</button>`) : ''}
      </div>
    </div>

    ${!unlocked && !done ? `<div class="warn-banner"><span>🔒</span><div>Complete <strong>${esc(siblings[idx - 1].title)}</strong> first — lessons unlock in sequence (Rule 5).</div></div>` : ''}

    <div class="detail-grid">
      <div class="card">
        ${lesson.type === 'video' ? `
          <div class="info-banner"><span>🎬</span><div>
            <strong>Video lesson</strong><br>${esc(lesson.videoUrl || 'Video resource attached to this lesson.')}
          </div></div>` : ''}
        <h3>${esc(lesson.title)}</h3>
        <p style="white-space:pre-wrap">${esc(lesson.content)}</p>
        ${lesson.type === 'assignment' ? `<div class="warn-banner mb-0"><span>📤</span><div>
          Assignment submission is out of scope for this frontend demo — mark complete once you finish the work.</div></div>` : ''}
      </div>
      <div class="card">
        <div class="card-header"><h3>Course progress</h3></div>
        ${(() => {
          const p = courseProgress(user.id, course.id);
          return `<div class="stat-value">${p.pct}%</div>${progressBar(p.pct)}
            <small>${p.done} of ${p.total} lessons complete</small>`;
        })()}
        <div class="dropdown-divider"></div>
        <div class="btn-group">
          ${prev ? `<button type="button" class="btn btn-sm" data-nav="lesson" data-id="${prev.id}">← Previous</button>` : ''}
          ${next ? `<button type="button" class="btn btn-sm" data-nav="lesson" data-id="${next.id}">Next →</button>` : ''}
        </div>
      </div>
    </div>`;
};

PAGES.take = function takeQuizPage() {
  const user = session.user;
  const quiz = byId(db.quizzes, state.params[0]);
  if (!quiz) return `<div class="empty-state"><div class="empty-icon">❓</div><h3>Quiz not found</h3>
    <button type="button" class="btn btn-primary" data-act="back">Go back</button></div>`;
  const course = byId(db.courses, quiz.courseId);
  const win = quizWindow(quiz);
  const used = attemptsFor(user.id, quiz.id).length;
  const canAttempt = win.open && used < quiz.maxAttempts && isEnrolled(user.id, quiz.courseId);
  const best = attemptsFor(user.id, quiz.id).reduce((m, a) => Math.max(m, a.percentage), null);

  return `
    <div class="page-head">
      <div>
        <button type="button" class="btn btn-sm btn-ghost mb-1" data-nav="course" data-id="${course.id}">← ${esc(course.code)}</button>
        <h2>${esc(quiz.title)}</h2><p>${esc(quiz.desc)}</p>
      </div>
      ${badge(quiz.status)}
    </div>

    <div class="detail-grid">
      <div class="card">
        <h3>Before you start</h3>
        <ul>
          <li><strong>${quiz.questions.length} questions</strong>, total marks ${quiz.questions.reduce((s, q) => s + q.marks, 0)}.</li>
          <li>Time limit <strong>${quiz.timeLimitMin} minutes</strong> — the timer submits automatically when it ends.</li>
          <li>Maximum <strong>${quiz.maxAttempts} attempts</strong>; you have used ${used}.</li>
          <li>Pass mark is <strong>${quiz.passMark}%</strong>.</li>
          <li>Window: ${fmtDateTime(quiz.availableFrom)} → ${fmtDateTime(quiz.availableUntil)}.</li>
        </ul>
        ${!canAttempt ? `<div class="warn-banner mb-0"><span>⚠</span><div>${
          !isEnrolled(user.id, quiz.courseId) ? 'Enroll in the course first.'
          : !win.open ? esc(win.reason)
          : 'No attempts remaining for this quiz.'}</div></div>` : ''}
        <div class="mt-1">
          ${canAttempt ? `<button type="button" class="btn btn-primary" data-act="start-quiz" data-id="${quiz.id}">Start attempt</button>` : ''}
          ${best !== null ? `<span class="chip">Best score: ${best}%</span>` : ''}
          ${attemptsFor(user.id, quiz.id).length ? `<span class="chip">Attempts: ${used}/${quiz.maxAttempts}</span>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Previous attempts</h3></div>
        ${attemptsFor(user.id, quiz.id).length ? attemptsFor(user.id, quiz.id).map((a, i) => `
          <div class="list-item"><div style="flex:1"><strong>Attempt ${i + 1}</strong>
            <div class="text-small text-muted">${fmtDateTime(a.submittedAt)}</div></div>
            <span class="badge badge-${a.passed ? 'success' : 'danger'}">${a.percentage}%</span></div>`).join('')
          : '<p class="text-muted mb-0">No attempts yet.</p>'}
      </div>
    </div>`;
};

PAGES.student.grades = function studentGrades() {
  const user = session.user;
  const grades = db.grades.filter((g) => g.studentId === user.id && g.status === 'released');
  const attempts = db.attempts.filter((a) => a.studentId === user.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  const released = grades.filter((g) => g.status === 'released');
  const avg = released.length ? Math.round(released.reduce((s, g) => s + g.score, 0) / released.length) : null;

  return `
    <div class="page-head"><div><h2>My Grades</h2><p>Only released grades are shown.</p></div></div>
    <div class="grid-3 mb-3">
      <div class="card stat-card"><span class="stat-icon">▥</span><div><div class="stat-value">${released.length}</div><div class="stat-label">Released</div></div></div>
      <div class="card stat-card"><span class="stat-icon">★</span><div><div class="stat-value">${avg === null ? '—' : avg}</div><div class="stat-label">Average (released)</div></div></div>
      <div class="card stat-card"><span class="stat-icon">✎</span><div><div class="stat-value">${attempts.length}</div><div class="stat-label">Attempts</div></div></div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><h3>Course grades</h3></div>
      ${grades.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Course</th><th>Score</th><th>Letter</th><th>Status</th><th>Published</th><th>Feedback</th></tr></thead>
        <tbody>${grades.map((g) => {
          const c = byId(db.courses, g.courseId);
          return `<tr>
            <td><strong>${esc(c ? c.code : '')}</strong> ${esc(c ? c.title : '')}</td>
            <td>${g.score}</td><td><strong>${g.letter || ''}</strong></td>
            <td>${badge('released', 'Released')}</td>
            <td>${fmtDate(g.publishedAt) || fmtDate(g.createdAt) || '—'}</td>
            <td>${esc(g.feedback || '—')}</td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="text-muted mb-0">No released grades yet.</p>'}
    </div>

    <div class="card">
      <div class="card-header"><h3>Quiz attempt history</h3></div>
      ${attempts.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>Quiz</th><th>Course</th><th>Attempt</th><th>Score</th><th>%</th><th>Result</th><th>Date</th></tr></thead>
        <tbody>${attempts.map((a) => {
          const q = byId(db.quizzes, a.quizId);
          const c = byId(db.courses, a.courseId);
          return `<tr>
            <td><strong>${esc(q ? q.title : 'deleted quiz')}</strong></td>
            <td>${esc(c ? c.code : '—')}</td>
            <td>#${a.attemptNo || attempts.filter((x) => x.quizId === a.quizId).indexOf(a) + 1}</td>
            <td>${a.score}</td><td>${a.percentage}%</td>
            <td>${badge(a.passed ? 'passed' : 'failed', a.passed ? 'Passed' : 'Failed')}</td>
            <td>${fmtDateTime(a.submittedAt)}</td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="text-muted mb-0">No quiz attempts yet.</p>'}
    </div>`;
};

PAGES.student.certificates = function studentCertificates() {
  const user = session.user;
  const enrolled = enrollmentsOfStudent(user.id).filter((e) => e.status !== 'dropped');
  const eligible = enrolled.filter((e) => courseEligibleCert(user.id, e.courseId));
  const inProgress = enrolled.filter((e) => !courseEligibleCert(user.id, e.courseId));

  return `
    <div class="page-head"><div><h2>Certificates</h2>
      <p>Certificates unlock at 100% lesson completion (weighted course-completion rule, Rule 10).</p></div></div>
    ${eligible.length ? `<div class="course-grid mb-3">
      ${eligible.map((e) => {
        const c = byId(db.courses, e.courseId);
        const g = gradeFor(user.id, c.id);
        return `<div class="card" style="text-align:center">
          <div class="cert-seal">🏅</div>
          <h3>${esc(c.code)}</h3>
          <p>${esc(c.title)}</p>
          <div class="kv-row"><span>Completed</span><span>${fmtDate(e.completedAt)}</span></div>
          ${g && g.status === 'released' ? `<div class="kv-row"><span>Final grade</span><span>${g.score} (${g.letter})</span></div>` : ''}
          <div class="kv-row"><span>Certificate ID</span><span><code>${esc(certIdFor(user.id, c.id))}</code></span></div>
          <button type="button" class="btn btn-primary btn-block mt-1" data-act="view-certificate" data-id="${c.id}">View certificate</button>
        </div>`;
      }).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">🎗️</div><h3>No certificates yet</h3>
        <p>Finish every lesson in an enrolled course to earn a verifiable certificate.</p>
        <button type="button" class="btn btn-primary" data-nav="my-courses">Go to my courses</button></div>`}

    ${inProgress.length ? `<h3 class="section-title">In progress</h3><div class="card">
      ${inProgress.map((e) => {
        const c = byId(db.courses, e.courseId);
        const p = courseProgress(user.id, c.id);
        return `<div class="list-item"><div style="flex:1"><strong>${esc(c.code)} — ${esc(c.title)}</strong>
          <div class="text-small text-muted">${p.pct}% complete (${p.done}/${p.total})</div>${progressBar(p.pct)}</div>
          <button type="button" class="btn btn-sm" data-nav="course" data-id="${c.id}">Continue</button></div>`;
      }).join('')}</div>` : ''}`;
};

/* ======================= 13. Instructor pages =========================== */
function myCourses() {
  const user = session.user;
  return db.courses.filter((c) => c.instructorId === user.id);
}

PAGES.instructor.dashboard = function instructorDashboard() {
  const user = session.user;
  const courses = myCourses();
  const courseIds = courses.map((c) => c.id);
  const roster = db.enrollments.filter((e) => courseIds.includes(e.courseId) && e.status !== 'dropped');
  const draftGrades = db.grades.filter((g) => courseIds.includes(g.courseId) && g.status === 'draft');
  const quizzes = db.quizzes.filter((q) => courseIds.includes(q.courseId));
  const attempts = db.attempts.filter((a) => courseIds.includes(a.courseId));
  const avgProgress = roster.length
    ? Math.round(roster.reduce((s, e) => s + courseProgress(e.studentId, e.courseId).pct, 0) / roster.length)
    : 0;
  const myAudit = db.audit.filter((a) => a.actorId === user.id).slice(0, 6);

  return `
    <section class="hero-banner">
      <h2>Instructor workspace</h2>
      <p>${courses.length} course(s) under you, ${roster.length} active enrollment(s), ${draftGrades.length} draft grade(s) awaiting release.</p>
      <div class="hero-stats">
        <div class="hero-stat"><b>${courses.length}</b><span>Courses</span></div>
        <div class="hero-stat"><b>${roster.length}</b><span>Students</span></div>
        <div class="hero-stat"><b>${avgProgress}%</b><span>Avg progress</span></div>
        <div class="hero-stat"><b>${quizzes.length}</b><span>Quizzes</span></div>
      </div>
    </section>

    <div class="quick-stat-grid mb-3">
      <div class="card stat-card"><span class="stat-icon">▤</span><div><div class="stat-value">${courses.filter((c) => c.status === 'published').length}</div><div class="stat-label">Published</div></div></div>
      <div class="card stat-card"><span class="stat-icon">✎</span><div><div class="stat-value">${attempts.length}</div><div class="stat-label">Quiz attempts</div></div></div>
      <div class="card stat-card"><span class="stat-icon">▥</span><div><div class="stat-value">${draftGrades.length}</div><div class="stat-label">Draft grades</div></div></div>
      <div class="card stat-card"><span class="stat-icon">◔</span><div><div class="stat-value">${avgProgress}%</div><div class="stat-label">Class progress</div></div></div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div>
          <div class="dashboard-panel-title">
            <h3 class="section-title" style="margin:0">My courses</h3>
            <button type="button" class="btn btn-sm btn-ghost" data-nav="teach-courses">Manage courses</button>
          </div>
          <div class="course-grid">
            ${courses.map((c) => courseCard(c, { mode: 'instructor' })).join('') || '<p class="text-muted">No courses yet — create one.</p>'}
          </div>
        </div>
        <div class="card">
          <div class="dashboard-panel-title"><h3>Recent actions</h3></div>
          ${myAudit.length ? myAudit.map((a) => `
            <div class="list-item"><div style="flex:1"><strong>${esc(a.action)}</strong>
              <div class="text-small text-muted">${esc(a.detail)}</div></div>
              <small>${timeAgo(a.at)}</small></div>`).join('')
            : '<p class="text-muted mb-0">Actions you take will be logged here.</p>'}
        </div>
      </div>
      <aside class="dashboard-side">
        <div class="card">
          <div class="dashboard-panel-title"><h3>Needs attention</h3><span class="badge badge-warning">${draftGrades.length} draft</span></div>
          ${draftGrades.length ? draftGrades.map((g) => {
            const s = byId(db.users, g.studentId), c = byId(db.courses, g.courseId);
            return `<div class="list-item"><div style="flex:1"><strong>${esc(s ? s.name : 'Student')}</strong>
              <div class="text-small text-muted">${esc(c ? c.code : 'Course')} · draft ${g.score}</div></div>
              <button type="button" class="btn btn-sm btn-outline" data-act="open-grade" data-student="${g.studentId}" data-course="${g.courseId}">Publish</button></div>`;
          }).join('') : '<p class="text-muted mb-0">No draft grades waiting.</p>'}
          <div class="dropdown-divider"></div>
          <button type="button" class="btn btn-sm btn-primary btn-block" data-nav="gradebook">Open gradebook</button>
        </div>
      </aside>
    </div>`;
};

PAGES.instructor['teach-courses'] = function instructorCourses() {
  const courses = myCourses();
  const drafts = courses.filter((c) => c.status !== 'published');
  return `
    <div class="page-head">
      <div><h2>My Courses</h2><p>${courses.length} course(s) · ${drafts.length} not yet published.</p></div>
      <button type="button" class="btn btn-primary" data-act="open-create-course">+ Create course</button>
    </div>
    ${courses.length ? `<div class="course-grid">
        ${courses.map((c) => courseCard(c, { mode: 'instructor' })).join('')}
      </div>`
      : `<div class="empty-state"><div class="empty-icon">📭</div><h3>No courses yet</h3>
        <p>Create your first course, then add modules, lessons and quizzes.</p>
        <button type="button" class="btn btn-primary" data-act="open-create-course">Create course</button></div>`}`;
};

PAGES.instructor['quiz-manager'] = function quizManager() {
  const user = session.user;
  const ids = myCourses().map((c) => c.id);
  const quizzes = db.quizzes.filter((q) => ids.includes(q.courseId));
  return `
    <div class="page-head">
      <div><h2>Quiz Manager</h2><p>${quizzes.length} quiz(zes) across your courses.</p></div>
      <button type="button" class="btn btn-primary" data-act="open-create-quiz-pick">+ New quiz</button>
    </div>
    ${quizzes.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Quiz</th><th>Course</th><th>Status</th><th>Questions</th><th>Window</th><th>Attempts</th><th></th></tr></thead>
      <tbody>${quizzes.map((q) => {
        const c = byId(db.courses, q.courseId);
        const att = db.attempts.filter((a) => a.quizId === q.id);
        return `<tr>
          <td><strong>${esc(q.title)}</strong><br><small>${esc(q.desc)}</small></td>
          <td><span class="course-code">${esc(c.code)}</span></td>
          <td>${badge(q.status)}</td>
          <td>${q.questions.length}</td>
          <td><small>${fmtDate(q.availableFrom)} → ${fmtDate(q.availableUntil)}</small></td>
          <td>${att.length}</td>
          <td><div class="btn-group">
            <button type="button" class="btn btn-sm" data-nav="quiz" data-id="${q.id}">Edit</button>
            <button type="button" class="btn btn-sm btn-warning" data-act="toggle-quiz-status" data-id="${q.id}">${q.status === 'published' ? 'Unpublish' : 'Publish'}</button>
            <button type="button" class="btn btn-sm btn-danger" data-act="delete-quiz" data-id="${q.id}">Delete</button>
          </div></td></tr>`;
      }).join('')}</tbody></table></div>`
      : `<div class="empty-state"><div class="empty-icon">✎</div><h3>No quizzes yet</h3>
        <p>Create a quiz from a course page or the button above.</p></div>`}`;
};

PAGES.instructor.quiz = function quizEditor() {
  const user = session.user;
  const quiz = byId(db.quizzes, state.params[0]);
  if (!quiz) return `<div class="empty-state"><div class="empty-icon">❓</div><h3>Quiz not found</h3>
    <button type="button" class="btn btn-primary" data-nav="quiz-manager">Back to quiz manager</button></div>`;
  const course = byId(db.courses, quiz.courseId);
  const attempts = db.attempts.filter((a) => a.quizId === quiz.id);

  return `
    <div class="page-head">
      <div>
        <button type="button" class="btn btn-sm btn-ghost mb-1" data-nav="quiz-manager">← Quiz manager</button>
        <h2>${esc(quiz.title)}</h2>
        <p>${esc(course.code)} · ${badge(quiz.status)} · created ${fmtDate(quiz.createdAt)}</p>
      </div>
      <div class="btn-group">
        <button type="button" class="btn btn-warning" data-act="toggle-quiz-status" data-id="${quiz.id}">${quiz.status === 'published' ? 'Unpublish' : 'Publish'}</button>
        <button type="button" class="btn btn-danger" data-act="delete-quiz" data-id="${quiz.id}">Delete</button>
      </div>
    </div>

    <div class="detail-grid">
      <div>
        <div class="card mb-3">
          <div class="card-header"><h3>Questions (${quiz.questions.length})</h3>
            <button type="button" class="btn btn-sm btn-primary" data-act="open-add-question" data-id="${quiz.id}">+ Add question</button>
          </div>
          ${quiz.questions.length ? quiz.questions.map((q, i) => `
            <div class="quiz-question">
              <div class="flex justify-between items-center gap-1">
                <h4>Q${i + 1}. ${esc(q.prompt)}</h4>
                <button type="button" class="btn btn-sm btn-danger" data-act="delete-question" data-id="${quiz.id}" data-qid="${q.id}">Remove</button>
              </div>
              ${q.options.map((o, oi) => `<div class="quiz-option${oi === q.correct ? ' selected' : ''}" style="cursor:default">
                <input type="radio" disabled ${oi === q.correct ? 'checked' : ''}>
                <span>${esc(o)}</span>${oi === q.correct ? '<span class="badge badge-success" style="margin-left:auto">Correct</span>' : ''}
              </div>`).join('')}
              <small>${q.marks} mark(s)</small>
            </div>`).join('')
            : '<p class="text-muted mb-0">No questions yet — a quiz needs at least one to publish meaningfully.</p>'}
        </div>
      </div>

      <div>
        <div class="card mb-3">
          <div class="card-header"><h3>Settings</h3></div>
          <form id="quiz-settings-form" data-form="quiz-settings" data-id="${quiz.id}">
            <div class="form-group"><label for="qs-title">Title</label>
              <input class="form-control" id="qs-title" name="title" value="${esc(quiz.title)}" required></div>
            <div class="form-group"><label for="qs-desc">Description</label>
              <textarea class="form-control" id="qs-desc" name="desc">${esc(quiz.desc)}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label for="qs-time">Time limit (min)</label>
                <input class="form-control" type="number" min="1" id="qs-time" name="timeLimitMin" value="${quiz.timeLimitMin}"></div>
              <div class="form-group"><label for="qs-attempts">Max attempts</label>
                <input class="form-control" type="number" min="1" id="qs-attempts" name="maxAttempts" value="${quiz.maxAttempts}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label for="qs-pass">Pass mark (%)</label>
                <input class="form-control" type="number" min="0" max="100" id="qs-pass" name="passMark" value="${quiz.passMark}"></div>
              <div class="form-group"><label for="qs-status">Status</label>
                <select class="form-control" id="qs-status" name="status">
                  ${['draft', 'published', 'upcoming'].map((s) => `<option value="${s}" ${quiz.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label for="qs-from">Available from</label>
                <input class="form-control" type="date" id="qs-from" name="availableFrom" value="${(quiz.availableFrom || '').slice(0, 10)}"></div>
              <div class="form-group"><label for="qs-until">Available until</label>
                <input class="form-control" type="date" id="qs-until" name="availableUntil" value="${(quiz.availableUntil || '').slice(0, 10)}"></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Save settings</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header"><h3>Attempts (${attempts.length})</h3></div>
          ${attempts.slice(0, 8).map((a) => {
            const s = byId(db.users, a.studentId);
            return `<div class="list-item"><span class="avatar">${initials(s.name)}</span>
              <div style="flex:1"><strong>${esc(s.name)}</strong>
                <div class="text-small text-muted">${fmtDateTime(a.submittedAt)} · attempt ${a.attemptNo || 1}</div></div>
              <span class="badge badge-${a.passed ? 'success' : 'danger'}">${a.percentage}%</span></div>`;
          }).join('') || '<p class="text-muted mb-0">No attempts yet.</p>'}
        </div>
      </div>
    </div>`;
};

PAGES.instructor.gradebook = function instructorGradebook() {
  const user = session.user;
  const courses = myCourses();
  if (!courses.length) return `<div class="empty-state"><div class="empty-icon">▥</div><h3>No courses</h3>
    <p>Create a course first — the gradebook works per course.</p>
    <button type="button" class="btn btn-primary" data-nav="teach-courses">My courses</button></div>`;

  return `
    <div class="page-head"><div><h2>Gradebook</h2>
      <p>Scores must be 0–100 (Rule 8); changing a released grade asks for confirmation and is recorded in history (Rule 9).</p></div></div>
    ${courses.map((c) => {
      const roster = enrollmentsOfCourse(c.id).filter((e) => e.status !== 'dropped');
      return `
      <div class="card mb-3">
        <div class="card-header">
          <h3><span class="course-code">${esc(c.code)}</span> ${esc(c.title)}</h3>
          <span class="card-title-sub">${roster.length} students</span>
        </div>
        ${roster.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Student</th><th>Progress</th><th>Quiz avg</th><th>Grade</th><th>Status</th><th></th></tr></thead>
          <tbody>${roster.map((e) => {
            const s = byId(db.users, e.studentId);
            const p = courseProgress(e.studentId, c.id);
            const atts = db.attempts.filter((a) => a.studentId === e.studentId && a.courseId === c.id);
            const quizAvg = atts.length ? Math.round(atts.reduce((sum, a) => sum + a.percentage, 0) / atts.length) : '—';
            const g = gradeFor(e.studentId, c.id);
            return `<tr>
              <td><strong>${esc(s.name)}</strong><br><small>${esc(s.email)}</small></td>
              <td style="min-width:120px">${progressBar(p.pct)}<small>${p.pct}%</small></td>
              <td>${quizAvg}${typeof quizAvg === 'number' ? '%' : ''}</td>
              <td>${g ? `<strong>${g.score}</strong> ${g.letter}` : '—'}</td>
              <td>${g ? badge(g.status, g.status === 'released' ? 'Released' : 'Draft') : badge('pending', 'No grade')}</td>
              <td><div class="btn-group">
                <button type="button" class="btn btn-sm btn-primary" data-act="open-grade" data-student="${e.studentId}" data-course="${c.id}">${g ? 'Edit / publish' : 'Grade'}</button>
                ${g && g.status === 'released' ? `<button type="button" class="btn btn-sm" data-act="withdraw-grade" data-id="${g.id}">Withdraw</button>` : ''}
              </div></td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="text-muted mb-0">No students enrolled yet.</p>'}
      </div>`;
    }).join('')}`;
};

PAGES.instructor.students = function instructorStudents() {
  const ids = myCourses().map((c) => c.id);
  const rows = db.enrollments.filter((e) => ids.includes(e.courseId) && e.status !== 'dropped')
    .map((e) => ({ e, s: byId(db.users, e.studentId), c: byId(db.courses, e.courseId) }))
    .filter((r) => r.s);

  return `
    <div class="page-head"><div><h2>My Students</h2><p>${rows.length} enrollment record(s) across your courses.</p></div></div>
    ${rows.length ? `<div class="table-wrap"><table class="table">
      <thead><tr><th>Student</th><th>Course</th><th>Enrolled</th><th>Progress</th><th>Grade</th><th>Status</th></tr></thead>
      <tbody>${rows.map(({ e, s, c }) => {
        const p = courseProgress(s.id, c.id);
        const g = gradeFor(s.id, c.id);
        return `<tr>
          <td><div class="flex items-center gap-1"><span class="avatar">${initials(s.name)}</span>
            <div><strong>${esc(s.name)}</strong><br><small>${esc(s.dept || '')}</small></div></div></td>
          <td><span class="course-code">${esc(c.code)}</span></td>
          <td>${fmtDate(e.enrolledAt)}</td>
          <td style="min-width:120px">${progressBar(p.pct)}<small>${p.pct}%</small></td>
          <td>${g ? `${g.score} ${g.letter} ${g.status === 'released' ? '🔓' : '🔒'}` : '—'}</td>
          <td>${badge(e.status, e.status === 'completed' ? 'Completed' : 'Active')}</td></tr>`;
      }).join('')}</tbody></table></div>`
      : `<div class="empty-state"><div class="empty-icon">✿</div><h3>No students yet</h3>
        <p>Students appear here once they enroll in your courses.</p></div>`}`;
};

/* ======================= 14. Admin pages ================================ */
function barChart(items) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return `<div class="bar-chart">${items.map((i) => `
    <div class="bar-col" title="${esc(i.label)}: ${i.value}">
      <span class="bar-value">${i.value}</span>
      <div class="bar" style="height:${Math.max(4, Math.round((i.value / max) * 100))}%"></div>
      <span class="bar-label">${esc(i.label)}</span>
    </div>`).join('')}</div>`;
}

PAGES.admin.dashboard = function adminDashboard() {
  const students = db.users.filter((u) => u.role === 'student');
  const instructors = db.users.filter((u) => u.role === 'instructor');
  const admins = db.users.filter((u) => u.role === 'admin');
  const activeEnr = db.enrollments.filter((e) => e.status !== 'dropped');
  const released = db.grades.filter((g) => g.status === 'released');
  const draftGrades = db.grades.filter((g) => g.status === 'draft');
  const avgGrade = released.length ? Math.round(released.reduce((s, g) => s + g.score, 0) / released.length) : null;
  const perCourse = db.courses.slice(0, 6).map((c) => ({
    label: c.code, value: enrollmentsOfCourse(c.id).filter((e) => e.status !== 'dropped').length,
  }));

  return `
    <section class="hero-banner">
      <span class="landing-eyebrow">Administrator workspace</span>
      <h2>Platform overview</h2>
      <p>Live, role-scoped oversight of the MiniLMS users, courses, enrollments and grades stored in MySQL.</p>
      <div class="hero-stats">
        <div class="hero-stat"><b>${db.users.length}</b><span>Users</span></div>
        <div class="hero-stat"><b>${db.courses.length}</b><span>Courses</span></div>
        <div class="hero-stat"><b>${activeEnr.length}</b><span>Enrollments</span></div>
        <div class="hero-stat"><b>${avgGrade === null ? '—' : avgGrade}</b><span>Avg grade</span></div>
      </div>
    </section>

    <div class="quick-stat-grid mb-3">
      <div class="card stat-card"><span class="stat-icon">✿</span><div><div class="stat-value">${students.filter((s) => s.status === 'active').length}</div><div class="stat-label">Active students</div></div></div>
      <div class="card stat-card"><span class="stat-icon">★</span><div><div class="stat-value">${instructors.length}</div><div class="stat-label">Instructors</div></div></div>
      <div class="card stat-card"><span class="stat-icon">▥</span><div><div class="stat-value">${draftGrades.length}</div><div class="stat-label">Draft grades</div></div></div>
      <div class="card stat-card"><span class="stat-icon">☰</span><div><div class="stat-value">${db.audit.length}</div><div class="stat-label">Audit entries</div></div></div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div class="card">
          <div class="dashboard-panel-title"><h3>Enrollments per course</h3><span class="text-small text-muted">live counts</span></div>
          ${barChart(perCourse)}
        </div>
        <div class="card">
          <div class="dashboard-panel-title"><h3>Latest audit entries</h3><button type="button" class="link-button" data-nav="audit">Full log</button></div>
          ${db.audit.slice(0, 6).map((a) => `
            <div class="list-item"><div style="flex:1">
              <strong>${esc(a.actorName)}</strong> <span class="text-muted">${esc(a.action)}</span>
              <div class="text-small text-muted">${esc(a.detail)}</div></div>
              <small>${timeAgo(a.at)}</small></div>`).join('') || '<p class="text-muted mb-0">No audit entries.</p>'}
        </div>
      </div>
      <aside class="dashboard-side">
        <div class="card">
          <div class="dashboard-panel-title"><h3>Course status</h3></div>
          ${['published', 'draft', 'archived'].map((s) => {
            const n = db.courses.filter((c) => c.status === s).length;
            return `<div class="kv-row"><span>${badge(s, s)}</span><span>${n}</span></div>`;
          }).join('')}
        </div>
        <div class="card">
          <div class="dashboard-panel-title"><h3>User mix</h3></div>
          <div class="kv-row"><span>Students</span><strong>${students.length}</strong></div>
          <div class="kv-row"><span>Instructors</span><strong>${instructors.length}</strong></div>
          <div class="kv-row"><span>Administrators</span><strong>${admins.length}</strong></div>
          <button type="button" class="btn btn-outline btn-block mt-2" data-nav="users">Manage users</button>
        </div>
        <div class="card">
          <div class="dashboard-panel-title"><h3>Quick actions</h3></div>
          <div class="btn-group vertical">
            <button type="button" class="btn btn-sm btn-primary" data-act="open-create-user">+ Add user</button>
            <button type="button" class="btn btn-sm" data-nav="courses">Course oversight</button>
            <button type="button" class="btn btn-sm" data-nav="enrollments">Enrollments</button>
          </div>
        </div>
      </aside>
    </div>`;
};

PAGES.admin.users = function adminUsers() {
  const q = (state.query.q || '').toLowerCase();
  const roleF = state.query.role || '';
  const users = db.users.filter((u) =>
    (!roleF || u.role === roleF) &&
    (!q || `${u.name} ${u.email} ${u.dept}`.toLowerCase().includes(q)));

  return `
    <div class="page-head">
      <div><h2>User Management</h2><p>${db.users.length} accounts · ${db.users.filter((u) => u.status === 'active').length} active.</p></div>
      <button type="button" class="btn btn-primary" data-act="open-create-user">+ Create user</button>
    </div>
    <div class="filter-bar">
      <input class="form-control" id="users-q" placeholder="Search name, email…" value="${esc(state.query.q || '')}" data-users-filter>
      <select class="form-control" id="users-role" data-users-filter>
        <option value="">All roles</option>
        ${['student', 'instructor', 'admin'].map((r) => `<option value="${r}" ${roleF === r ? 'selected' : ''}>${r}</option>`).join('')}
      </select>
      <span class="text-small text-muted">${users.length} shown</span>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>${users.map((u) => `
          <tr>
            <td><div class="flex items-center gap-1"><span class="avatar">${initials(u.name)}</span>
              <div><strong>${esc(u.name)}</strong><br><small>${esc(u.email)}</small></div></div></td>
            <td>${badge(u.role === 'admin' ? 'published' : u.role === 'instructor' ? 'upcoming' : 'enrolled', u.role)}</td>
            <td>${esc(u.dept || '—')}</td>
            <td>${badge(u.status)}</td>
            <td>${fmtDate(u.createdAt)}</td>
            <td><div class="btn-group">
              <button type="button" class="btn btn-sm" data-act="edit-user" data-id="${u.id}">Edit</button>
              <button type="button" class="btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}"
                data-act="toggle-user-status" data-id="${u.id}">${u.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
            </div></td></tr>`).join('') || '<tr><td colspan="6">No users match.</td></tr>'}
        </tbody>
      </table>
    </div>`;
};

PAGES.admin.courses = function adminCourses() {
  return `
    <div class="page-head"><div><h2>Course Oversight</h2>
      <p>${db.courses.length} courses · ${db.courses.filter((c) => c.status === 'published').length} published.</p></div></div>
    <div class="course-grid">
      ${db.courses.map((c) => courseCard(c, { mode: 'admin' })).join('')}
    </div>`;
};

PAGES.admin.enrollments = function adminEnrollments() {
  const q = (state.query.q || '').toLowerCase();
  const rows = db.enrollments
    .map((e) => ({ e, s: byId(db.users, e.studentId), c: byId(db.courses, e.courseId) }))
    .filter((r) => r.s && r.c)
    .filter((r) => !q || `${r.s.name} ${r.s.email} ${r.c.code} ${r.c.title}`.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.e.enrolledAt) - new Date(a.e.enrolledAt));

  const active = db.enrollments.filter((e) => e.status === 'active').length;
  const completed = db.enrollments.filter((e) => e.status === 'completed').length;
  const dropped = db.enrollments.filter((e) => e.status === 'dropped').length;

  return `
    <div class="page-head"><div><h2>Enrollments</h2><p>${active} active · ${completed} completed · ${dropped} dropped.</p></div></div>
    <div class="filter-bar">
      <input class="form-control" placeholder="Search student or course…" value="${esc(state.query.q || '')}" data-enroll-filter>
      <span class="text-small text-muted">${rows.length} shown</span>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Student</th><th>Course</th><th>Enrolled</th><th>Progress</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(({ e, s, c }) => {
          const p = courseProgress(s.id, c.id);
          return `<tr>
            <td><strong>${esc(s.name)}</strong><br><small>${esc(s.email)}</small></td>
            <td><span class="course-code">${esc(c.code)}</span> ${esc(c.title)}</td>
            <td>${fmtDate(e.enrolledAt)}</td>
            <td style="min-width:110px">${progressBar(p.pct)}<small>${p.pct}%</small></td>
            <td>${badge(e.status, e.status === 'in_progress' ? 'Active' : e.status)}</td>
            <td>${e.status !== 'dropped' ? `<button type="button" class="btn btn-sm btn-danger" data-act="admin-drop-enrollment" data-id="${e.id}">Drop</button>` : ''}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="6">No enrollments match.</td></tr>'}
        </tbody>
      </table>
    </div>`;
};

PAGES.admin.audit = function adminAudit() {
  const action = state.query.action || '';
  const rows = db.audit.filter((a) => !action || a.action === action);
  const actions = [...new Set(db.audit.map((a) => a.action))];
  return `
    <div class="page-head"><div><h2>Audit Log</h2>
      <p>Every mutation writes an entry here (Rule 11) — this stands in for a database audit table.</p></div>
      <span class="badge badge-purple">${db.audit.length} entries</span></div>
    <div class="filter-bar">
      <select class="form-control" data-audit-filter>
        <option value="">All actions</option>
        ${actions.map((a) => `<option value="${esc(a)}" ${action === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}
      </select>
      <span class="text-small text-muted">${rows.length} shown</span>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead>
        <tbody>${rows.slice(0, 100).map((a) => `
          <tr>
            <td><small>${fmtDateTime(a.at)}</small></td>
            <td><strong>${esc(a.actorName)}</strong></td>
            <td>${badge(a.action.includes('delete') || a.action.includes('archive') ? 'danger' : a.action.includes('create') ? 'success' : 'info', a.action)}</td>
            <td><small>${esc(a.entity)}#${esc(String(a.entityId).slice(0, 12))}</small></td>
            <td>${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan="5">No entries.</td></tr>'}
        </tbody>
      </table>
    </div>`;
};

PAGES.admin.activity = function adminActivity() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toDateString();
    const count = db.activity.filter((a) => new Date(a.at).toDateString() === key).length;
    days.push({ label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: count });
  }
  const byType = {};
  db.activity.forEach((a) => { byType[a.type] = (byType[a.type] || 0) + 1; });
  const storageBytes = new Blob([localStorage.getItem(DB_KEY) || '']).size;

  return `
    <div class="page-head"><div><h2>Activity &amp; Reports</h2>
      <p>Seven-day activity overview generated from the seeded event log.</p></div>
      <button type="button" class="btn btn-warning" data-act="reset-demo">Reset demo data</button></div>
    <div class="grid-2 mb-3">
      <div class="card">
        <div class="card-header"><h3>Events · last 7 days</h3><span class="card-title-sub">${db.activity.length} total</span></div>
        ${barChart(days)}
      </div>
      <div class="card">
        <div class="card-header"><h3>By type</h3></div>
        ${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => `
          <div class="kv-row"><span>${esc(t.replace('_', ' '))}</span><span>${n}</span></div>`).join('') || '<p class="text-muted mb-0">No events.</p>'}
        <div class="dropdown-divider"></div>
        <div class="kv-row"><span>Storage used</span><span>${(storageBytes / 1024).toFixed(1)} KB</span></div>
        <div class="kv-row"><span>Seed version</span><span>v${db.version}</span></div>
        <div class="kv-row"><span>Seeded at</span><span>${fmtDateTime(db.seededAt)}</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent events</h3></div>
      ${db.activity.slice(0, 12).map((a) => {
        const u = byId(db.users, a.userId);
        return `<div class="list-item"><span class="stat-icon">◔</span>
          <div style="flex:1"><strong>${esc(a.type.replace('_', ' '))}</strong>
            <div class="text-small text-muted">${esc(u ? u.name : 'system')}</div></div>
          <small>${timeAgo(a.at)}</small></div>`;
      }).join('') || '<p class="text-muted mb-0">No events.</p>'}
    </div>`;
};

/* ======================= 15. Shared pages =============================== */
const SHARED_PAGES = {
  notifications() {
    const user = session.user;
    const mine = db.notifications.filter((n) => n.userId === user.id);
    const notices = db.notices.filter((n) => n.audience === 'all' || n.audience === user.role);
    return `
      <div class="page-head">
        <div><h2>Notifications</h2><p>${mine.filter((n) => !n.read).length} unread of ${mine.length}.</p></div>
        <button type="button" class="btn btn-outline" data-act="mark-notifs-read">Mark all as read</button>
      </div>
      <div class="detail-grid">
        <div class="card">
          <div class="card-header"><h3>Your notifications</h3></div>
          ${mine.length ? mine.map((n) => `
            <div class="list-item" style="align-items:flex-start">
              <span class="stat-icon">${n.read ? '📭' : '📬'}</span>
              <div style="flex:1"><strong>${esc(n.title)}</strong>
                <div class="text-small text-muted">${esc(n.body)}</div>
                <small>${fmtDateTime(n.createdAt)}${n.read ? '' : ' · unread'}</small></div>
              ${n.read ? '' : badge('upcoming', 'New')}
            </div>`).join('') : '<p class="text-muted mb-0">No notifications yet.</p>'}
        </div>
        <div class="card">
          <div class="card-header"><h3>Notice board</h3></div>
          ${notices.length ? notices.map((n) => `
            <div class="list-item" style="align-items:flex-start">
              <span class="stat-icon">📢</span>
              <div><strong>${esc(n.title)}</strong>
                <div class="text-small text-muted">${esc(n.body)}</div>
                <small>${fmtDate(n.createdAt)} · ${esc(n.author)}</small></div>
            </div>`).join('') : '<p class="text-muted mb-0">No notices.</p>'}
        </div>
      </div>`;
  },

  profile() {
    const user = session.user;
    return `
      <div class="page-head"><div><h2>Profile</h2><p>Account details, preferences and security.</p></div></div>
      <div class="grid-2">
        <div class="card">
          <div class="flex items-center gap-2 mb-2">
            <span class="avatar" style="width:56px;height:56px;font-size:1.2rem">${initials(user.name)}</span>
            <div>
              <h3 style="margin:0">${esc(user.name)}</h3>
              <span class="text-small text-muted">${esc(user.email)}</span><br>
              ${badge(user.role === 'admin' ? 'published' : user.role === 'instructor' ? 'upcoming' : 'enrolled', user.role)}
              ${badge(user.status)}
            </div>
          </div>
          <div class="kv-row"><span>User ID</span><span><code>${esc(user.id)}</code></span></div>
          <div class="kv-row"><span>Department</span><span>${esc(user.dept || '—')}</span></div>
          <div class="kv-row"><span>Phone</span><span>${esc(user.phone || '—')}</span></div>
          <div class="kv-row"><span>Member since</span><span>${fmtDate(user.createdAt)}</span></div>
          <div class="kv-row"><span>Bio</span><span>${esc(user.bio || '—')}</span></div>

          <h3 class="section-title">Edit details</h3>
          <form data-form="profile">
            <div class="form-group"><label for="pf-name">Full name</label>
              <input class="form-control" id="pf-name" name="name" value="${esc(user.name)}" required></div>
            <div class="form-row">
              <div class="form-group"><label for="pf-dept">Department</label>
                <input class="form-control" id="pf-dept" name="dept" value="${esc(user.dept || '')}"></div>
              <div class="form-group"><label for="pf-phone">Phone</label>
                <input class="form-control" id="pf-phone" name="phone" value="${esc(user.phone || '')}"></div>
            </div>
            <div class="form-group"><label for="pf-bio">Bio</label>
              <textarea class="form-control" id="pf-bio" name="bio">${esc(user.bio || '')}</textarea></div>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </form>
        </div>

        <div>
          <div class="card mb-3">
            <div class="card-header"><h3>Change password</h3></div>
            <form data-form="password">
              <div class="form-group"><label for="pw-current">Current password</label>
                <input class="form-control" type="password" id="pw-current" name="current" required></div>
              <div class="form-group"><label for="pw-new">New password</label>
                <input class="form-control" type="password" id="pw-new" name="next" minlength="6" required>
                <small class="form-hint">Minimum 6 characters (DBMS validation rule).</small></div>
              <div class="form-group"><label for="pw-confirm">Confirm new password</label>
                <input class="form-control" type="password" id="pw-confirm" name="confirm" minlength="6" required></div>
              <button type="submit" class="btn btn-primary">Update password</button>
            </form>
          </div>

          <div class="card mb-3">
            <div class="card-header"><h3>Appearance</h3></div>
            <div class="flex items-center justify-between">
              <span class="text-small text-muted">Theme: ${document.documentElement.getAttribute('data-theme') || 'light'} mode</span>
              <button type="button" class="btn btn-sm" data-act="toggle-theme">Switch theme</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="text-danger">Danger zone</h3></div>
            <p class="text-small">Restores all seeded demo data (users, courses, grades, logs) and clears your session.</p>
            <button type="button" class="btn btn-danger btn-block" data-act="reset-demo">Reset demo data</button>
          </div>
        </div>
      </div>`;
  },

  search() {
    const user = session.user;
    const q = (state.query.q || '').trim().toLowerCase();
    const courses = db.courses.filter((c) => `${c.code} ${c.title} ${c.desc} ${c.category}`.toLowerCase().includes(q));
    const people = user.role === 'admin'
      ? db.users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q))
      : user.role === 'instructor'
        ? db.users.filter((u) => u.role === 'student' && `${u.name} ${u.email}`.toLowerCase().includes(q))
        : [];
    const quizzes = user.role === 'instructor'
      ? db.quizzes.filter((qz) => myCourses().some((c) => c.id === qz.courseId) && qz.title.toLowerCase().includes(q))
      : [];

    return `
      <div class="page-head"><div><h2>Search results</h2>
        <p>Query: <code>${esc(q || '—')}</code> · ${courses.length + people.length + quizzes.length} match(es).</p></div></div>
      ${!q ? '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Nothing to search</h3><p>Use the search box in the top bar.</p></div>' : `
        <h3 class="section-title" style="margin-top:0">Courses (${courses.length})</h3>
        ${courses.length ? `<div class="course-grid">${courses.map((c) => courseCard(c, {
          studentId: user.role === 'student' ? user.id : undefined,
          mode: user.role === 'admin' ? 'admin' : user.role === 'instructor' ? 'instructor' : undefined,
        })).join('')}</div>` : '<p class="text-muted">No course matches.</p>'}

        ${people.length ? `<h3 class="section-title">People (${people.length})</h3>
          <div class="card">${people.map((p) => `
            <div class="list-item"><span class="avatar">${initials(p.name)}</span>
              <div style="flex:1"><strong>${esc(p.name)}</strong>
                <div class="text-small text-muted">${esc(p.email)} · ${esc(p.role)}</div></div>
              ${badge(p.status)}</div>`).join('')}</div>` : ''}

        ${quizzes.length ? `<h3 class="section-title">Quizzes (${quizzes.length})</h3>
          <div class="card">${quizzes.map((qz) => `
            <div class="list-item"><span class="stat-icon">✎</span>
              <div style="flex:1"><strong>${esc(qz.title)}</strong>
                <div class="text-small text-muted">${esc(byId(db.courses, qz.courseId).code)} · ${qz.questions.length} questions</div></div>
              ${badge(qz.status)}
              <button type="button" class="btn btn-sm" data-nav="quiz" data-id="${qz.id}">Open</button></div>`).join('')}</div>` : ''}
      `}`;
  },
};

/* page wiring: route shared + param pages into every role's page map */
PAGES.student.course = PAGES.course;
PAGES.student.lesson = PAGES.lesson;
PAGES.student.take = PAGES.take;
PAGES.instructor.course = PAGES.course;
PAGES.admin.course = PAGES.course;
Object.keys(SHARED_PAGES).forEach((key) => {
  PAGES.student[key] = SHARED_PAGES[key];
  PAGES.instructor[key] = SHARED_PAGES[key];
  PAGES.admin[key] = SHARED_PAGES[key];
});

/* ======================= 16. Quiz player ================================ */
function openQuizPlayer(quizId) {
  const user = session.user;
  const quiz = byId(db.quizzes, quizId);
  if (!quiz) return;
  const win = quizWindow(quiz);
  const used = attemptsFor(user.id, quizId).length;
  if (!win.open || used >= quiz.maxAttempts) { toast(win.reason || 'No attempts remaining.', 'error'); return; }

  const totalMarks = quiz.questions.reduce((s, q) => s + q.marks, 0);
  const endsAt = Date.now() + quiz.timeLimitMin * 60000;

  const body = `
    <form id="quiz-take-form" data-form="quiz-take" data-id="${quiz.id}">
      <div class="flex items-center justify-between gap-1 mb-2">
        <span class="text-small text-muted">Attempt ${used + 1} of ${quiz.maxAttempts} · ${totalMarks} marks</span>
        <span class="badge badge-warning" id="quiz-timer">${quiz.timeLimitMin}:00</span>
      </div>
      ${quiz.questions.map((q, i) => `
        <fieldset class="quiz-question" style="border:1px solid var(--border);margin:0 0 1rem">
          <legend class="flex items-center gap-1"><strong>Q${i + 1}. ${esc(q.prompt)}</strong>
            <span class="chip">${q.marks} mark(s)</span></legend>
          ${q.options.map((o, oi) => `
            <label class="quiz-option">
              <input type="radio" name="ans_${esc(q.id)}" value="${oi}">
              <span>${esc(o)}</span>
            </label>`).join('')}
        </fieldset>`).join('')}
      <p class="text-small text-muted">Unanswered questions score zero. The attempt submits automatically when the timer ends.</p>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="cancel-quiz">Save &amp; leave</button>
        <button type="submit" class="btn btn-primary">Submit answers</button>
      </div>
    </form>`;

  openModal({ title: quiz.title, body, large: true });

  state.quiz = { quizId, endsAt, timerId: null };
  state.quiz.timerId = setInterval(() => {
    const el = $('#quiz-timer');
    if (!el) { clearInterval(state.quiz.timerId); return; }
    const left = Math.max(0, state.quiz.endsAt - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (left <= 0) {
      clearInterval(state.quiz.timerId);
      toast('Time is up — submitting your answers…', 'warning');
      const form = $('#quiz-take-form');
      if (form) form.requestSubmit();
    }
  }, 500);
}

function stopQuizTimer() {
  if (state.quiz && state.quiz.timerId) clearInterval(state.quiz.timerId);
  state.quiz = null;
}

function showQuizResult(attempt, total, score) {
  const quiz = byId(db.quizzes, attempt.quizId);
  const remaining = quiz.maxAttempts - attemptsFor(session.user.id, quiz.id).length;
  const body = `
    <div style="text-align:center">
      <div class="quiz-result-score ${attempt.passed ? 'text-success' : 'text-danger'}">${attempt.percentage}%</div>
      <p><strong>${attempt.passed ? 'Passed 🎉' : 'Not passed'}</strong> — you scored ${score} of ${total} marks.
        Pass mark is ${quiz.passMark}%.</p>
      ${badge(attempt.passed ? 'passed' : 'failed', attempt.passed ? 'Passed' : 'Failed')}
      <div class="quiz-meta-grid">
        <div class="quiz-meta-item"><span>Attempt</span><b>#${attempt.attemptNo || 1}</b></div>
        <div class="quiz-meta-item"><span>Attempts left</span><b>${Math.max(0, remaining)}</b></div>
        <div class="quiz-meta-item"><span>Submitted</span><b>${fmtDateTime(attempt.submittedAt)}</b></div>
      </div>
      <div class="card" style="text-align:left;background:var(--surface-2)">
        ${quiz.questions.map((q, i) => {
          const chosen = attempt.answers[q.id];
          const right = chosen === q.correct;
          return `<div class="list-item"><div style="flex:1">
            <strong>Q${i + 1}. ${esc(q.prompt)}</strong>
            <div class="text-small ${right ? 'text-success' : 'text-danger'}">
              Your answer: ${chosen !== undefined ? esc(q.options[chosen]) : 'not answered'}
              ${right ? '✓' : ` · correct: ${esc(q.options[q.correct])}`}
            </div></div>${badge(right ? 'passed' : 'failed', right ? `+${q.marks}` : '0')}</div>`;
        }).join('')}
      </div>
    </div>`;
  openModal({ title: `Result — ${quiz.title}`, body, large: true, footer: `<button type="button" class="btn btn-primary" data-act="close-modal">Done</button>` });
}

function openCertificate(courseId) {
  const user = session.user;
  const course = byId(db.courses, courseId);
  if (!course || !courseEligibleCert(user.id, courseId)) { toast('Certificate not available yet.', 'warning'); return; }
  const instructor = byId(db.users, course.instructorId);
  const grade = gradeFor(user.id, courseId);
  const enrolled = enrollmentFor(user.id, courseId);
  const body = `
    <div class="certificate">
      <div class="cert-seal">🏅</div>
      <p class="text-uppercase text-muted">Certificate of Completion</p>
      <h2>MiniLMS</h2>
      <p class="text-muted">This certifies that</p>
      <div class="cert-name">${esc(user.name)}</div>
      <p class="text-muted">has successfully completed the course</p>
      <div class="cert-course">${esc(course.code)} — ${esc(course.title)}</div>
      <p class="text-small text-muted">${course.credits} credits · ${esc(course.level)} · 100% of lessons</p>
      ${grade && grade.status === 'released' ? `<p>Final grade: <strong>${grade.score} (${grade.letter})</strong></p>` : ''}
      <div class="cert-meta">
        <span>Issued: ${fmtDate(enrolled?.completedAt || nowISO())}</span>
        <span>ID: <code>${esc(certIdFor(user.id, courseId))}</code></span>
        <span>Instructor: ${esc(instructor ? instructor.name : '—')}</span>
      </div>
    </div>`;
  openModal({
    title: 'Certificate', body, large: true,
    footer: `<button type="button" class="btn btn-ghost" data-act="close-modal">Close</button>
      <button type="button" class="btn btn-primary" data-act="print-cert">Print / Save PDF</button>`,
  });
}

/* ======================= 17. Modal forms ================================ */
function optionsHtml(list, selected, valueKey, labelFn) {
  return list.map((x) => `<option value="${esc(x[valueKey])}" ${x[valueKey] === selected ? 'selected' : ''}>${esc(labelFn(x))}</option>`).join('');
}

function openCourseForm(courseId) {
  const course = courseId ? byId(db.courses, courseId) : null;
  const instructors = db.users.filter((u) => u.role === 'instructor' && u.status === 'active');
  const body = `
    <form id="course-form" data-form="course" data-id="${course ? course.id : ''}">
      <div class="form-row">
        <div class="form-group"><label for="co-code">Course code *</label>
          <input class="form-control" id="co-code" name="code" value="${esc(course ? course.code : '')}" placeholder="e.g. DB-101" required>
          <small class="form-hint">Must be unique across the catalog (Rule 1).</small></div>
        <div class="form-group"><label for="co-title">Title *</label>
          <input class="form-control" id="co-title" name="title" value="${esc(course ? course.title : '')}" required></div>
      </div>
      <div class="form-group"><label for="co-desc">Description</label>
        <textarea class="form-control" id="co-desc" name="desc">${esc(course ? course.desc : '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label for="co-cat">Category</label>
          <input class="form-control" id="co-cat" name="category" value="${esc(course ? course.category : 'Computer Science')}"></div>
        <div class="form-group"><label for="co-level">Level</label>
          <select class="form-control" id="co-level" name="level">
            ${['Beginner', 'Intermediate', 'Advanced'].map((l) => `<option ${course && course.level === l ? 'selected' : ''}>${l}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="co-credits">Credits</label>
          <input class="form-control" type="number" min="1" max="10" id="co-credits" name="credits" value="${course ? course.credits : 3}"></div>
        <div class="form-group"><label for="co-status">Status</label>
          <select class="form-control" id="co-status" name="status">
            ${['draft', 'published', 'archived'].map((s) => `<option value="${s}" ${course && course.status === s ? 'selected' : (!course && s === 'draft' ? 'selected' : '')}>${s}</option>`).join('')}
          </select></div>
      </div>
      <div class="form-group"><label for="co-instructor">Instructor</label>
        <select class="form-control" id="co-instructor" name="instructorId">
          ${optionsHtml(instructors, course ? course.instructorId : session.user.id, 'id', (u) => `${u.name} (${u.email})`)}
        </select></div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">${course ? 'Save changes' : 'Create course'}</button>
      </div>
    </form>`;
  openModal({ title: course ? `Edit ${course.code}` : 'Create course', body, large: true });
}

function openModuleForm(courseId, moduleId) {
  const mod = moduleId ? byId(db.modules, moduleId) : null;
  const body = `
    <form data-form="module" data-id="${mod ? mod.id : ''}" data-course="${courseId || (mod ? mod.courseId : '')}">
      <div class="form-group"><label for="mo-title">Module title *</label>
        <input class="form-control" id="mo-title" name="title" value="${esc(mod ? mod.title : '')}" required></div>
      <div class="form-group"><label for="mo-desc">Description</label>
        <textarea class="form-control" id="mo-desc" name="description">${esc(mod ? mod.description : '')}</textarea></div>
      ${mod ? `<div class="form-group"><label for="mo-seq">Sequence number</label>
        <input class="form-control" type="number" min="1" id="mo-seq" name="seq" value="${mod.seq}">
        <small class="form-hint">Must be unique inside this course (Rule 2).</small></div>` : ''}
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">${mod ? 'Save module' : 'Add module'}</button>
      </div>
    </form>`;
  openModal({ title: mod ? 'Edit module' : 'Add module', body });
}

function openLessonForm(moduleId, lessonId) {
  const lesson = lessonId ? byId(db.lessons, lessonId) : null;
  const mid = lesson ? lesson.moduleId : moduleId;
  const body = `
    <form data-form="lesson" data-id="${lesson ? lesson.id : ''}" data-module="${mid}">
      <div class="form-group"><label for="le-title">Lesson title *</label>
        <input class="form-control" id="le-title" name="title" value="${esc(lesson ? lesson.title : '')}" required></div>
      <div class="form-row">
        <div class="form-group"><label for="le-type">Type</label>
          <select class="form-control" id="le-type" name="type">
            ${['video', 'reading', 'assignment'].map((t) => `<option value="${t}" ${lesson && lesson.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select></div>
        <div class="form-group"><label for="le-min">Duration (min)</label>
          <input class="form-control" type="number" min="1" id="le-min" name="durationMin" value="${lesson ? lesson.durationMin : 15}"></div>
      </div>
      ${!lesson ? `<div class="form-group"><label for="le-seq">Sequence (optional)</label>
        <input class="form-control" type="number" min="1" id="le-seq" name="seq" placeholder="auto">
        <small class="form-hint">Must be unique inside the module (Rule 2).</small></div>` : ''}
      <div class="form-group"><label for="le-url">Video URL (video lessons)</label>
        <input class="form-control" id="le-url" name="videoUrl" value="${esc(lesson ? lesson.videoUrl : '')}" placeholder="https://…"></div>
      <div class="form-group"><label for="le-content">Content</label>
        <textarea class="form-control" id="le-content" name="content" style="min-height:120px">${esc(lesson ? lesson.content : '')}</textarea></div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">${lesson ? 'Save lesson' : 'Add lesson'}</button>
      </div>
    </form>`;
  openModal({ title: lesson ? 'Edit lesson' : 'Add lesson', body, large: true });
}

function openQuizForm(courseId) {
  const courses = session.user.role === 'instructor' ? myCourses() : db.courses;
  const body = `
    <form data-form="create-quiz">
      <div class="form-group"><label for="qu-course">Course *</label>
        <select class="form-control" id="qu-course" name="courseId" required>
          ${optionsHtml(courses, courseId, 'id', (c) => `${c.code} — ${c.title}`)}
        </select></div>
      <div class="form-group"><label for="qu-title">Quiz title *</label>
        <input class="form-control" id="qu-title" name="title" placeholder="e.g. Unit test 1" required></div>
      <div class="form-row">
        <div class="form-group"><label for="qu-time">Time limit (min)</label>
          <input class="form-control" type="number" min="1" id="qu-time" name="timeLimitMin" value="10"></div>
        <div class="form-group"><label for="qu-att">Max attempts</label>
          <input class="form-control" type="number" min="1" id="qu-att" name="maxAttempts" value="2"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="qu-pass">Pass mark (%)</label>
          <input class="form-control" type="number" min="0" max="100" id="qu-pass" name="passMark" value="60"></div>
        <div class="form-group"><label for="qu-status">Status</label>
          <select class="form-control" id="qu-status" name="status">
            <option value="draft" selected>draft</option><option value="published">published</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="qu-from">Available from</label>
          <input class="form-control" type="date" id="qu-from" name="availableFrom" value="${nowISO().slice(0, 10)}"></div>
        <div class="form-group"><label for="qu-until">Until</label>
          <input class="form-control" type="date" id="qu-until" name="availableUntil" value="${shiftDays(14).slice(0, 10)}"></div>
      </div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">Create quiz</button>
      </div>
    </form>`;
  openModal({ title: 'New quiz', body, large: true });
}

function openQuestionForm(quizId) {
  const body = `
    <form data-form="question" data-id="${quizId}">
      <div class="form-group"><label for="qq-prompt">Question *</label>
        <textarea class="form-control" id="qq-prompt" name="prompt" required placeholder="Type the question prompt…"></textarea></div>
      ${[0, 1, 2, 3].map((i) => `
        <div class="form-group"><label for="qq-o${i}">Option ${i + 1}${i > 1 ? ' (optional)' : ' *'}</label>
          <input class="form-control" id="qq-o${i}" name="option${i}" ${i < 2 ? 'required' : ''}></div>`).join('')}
      <div class="form-row">
        <div class="form-group"><label for="qq-correct">Correct option</label>
          <select class="form-control" id="qq-correct" name="correct">
            <option value="0">Option 1</option><option value="1">Option 2</option>
            <option value="2">Option 3</option><option value="3">Option 4</option>
          </select></div>
        <div class="form-group"><label for="qq-marks">Marks</label>
          <input class="form-control" type="number" min="1" id="qq-marks" name="marks" value="1"></div>
      </div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">Add question</button>
      </div>
    </form>`;
  openModal({ title: 'Add question', body, large: true });
}

function openGradeForm(studentId, courseId) {
  const student = byId(db.users, studentId);
  const course = byId(db.courses, courseId);
  const grade = gradeFor(studentId, courseId);
  const body = `
    <form data-form="grade" data-student="${studentId}" data-course="${courseId}">
      <p class="text-small text-muted"><strong>${esc(student.name)}</strong> · ${esc(course.code)} ${esc(course.title)}</p>
      ${grade && grade.status === 'released' ? `<div class="warn-banner"><span>⚠</span><div>
        This grade was <strong>published</strong>${grade.publishedAt ? ` on ${fmtDate(grade.publishedAt)}` : ''}.
        Changing the score requires confirmation and is written to grade history (Rule 9).</div></div>` : ''}
      <div class="form-row">
        <div class="form-group"><label for="gr-score">Score (0–100) *</label>
          <input class="form-control" type="number" min="0" max="100" id="gr-score" name="score"
            value="${grade ? grade.score : ''}" required>
          <small class="form-hint">Values outside 0–100 are rejected (Rule 8).</small></div>
        <div class="form-group"><label for="gr-letter">Letter (auto)</label>
          <input class="form-control" id="gr-letter" value="${grade ? grade.letter : '—'}" disabled></div>
      </div>
      <div class="form-group"><label for="gr-feedback">Feedback</label>
        <textarea class="form-control" id="gr-feedback" name="feedback">${esc(grade ? grade.feedback : '')}</textarea></div>
      <div class="form-group">
        <label class="flex items-center gap-1" for="gr-publish" style="font-weight:600">
          <input type="checkbox" id="gr-publish" name="publish" ${grade && grade.status === 'released' ? 'checked' : ''}>
          Publish to student (visible immediately)
        </label></div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">Save grade</button>
      </div>
    </form>`;
  openModal({ title: grade ? 'Update grade' : 'Enter grade', body });
}

function openUserForm(userId) {
  const user = userId ? byId(db.users, userId) : null;
  const body = `
    <form data-form="user" data-id="${user ? user.id : ''}">
      <div class="form-group"><label for="us-name">Full name *</label>
        <input class="form-control" id="us-name" name="name" value="${esc(user ? user.name : '')}" required></div>
      <div class="form-group"><label for="us-email">Email *</label>
        <input class="form-control" type="email" id="us-email" name="email" value="${esc(user ? user.email : '')}"
          ${user ? 'disabled' : 'placeholder="name@example.com"'} required>
        ${user ? '<small class="form-hint">Email cannot be changed after creation.</small>' : ''}</div>
      <div class="form-row">
        <div class="form-group"><label for="us-role">Role</label>
          <select class="form-control" id="us-role" name="role" ${user ? 'disabled' : ''}>
            ${['student', 'instructor', 'admin'].map((r) => `<option value="${r}" ${user && user.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select></div>
        <div class="form-group"><label for="us-status">Status</label>
          <select class="form-control" id="us-status" name="status">
            <option value="active" ${user && user.status === 'active' ? 'selected' : ''}>active</option>
            <option value="inactive" ${user && user.status === 'inactive' ? 'selected' : ''}>inactive</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label for="us-dept">Department</label>
          <input class="form-control" id="us-dept" name="dept" value="${esc(user ? user.dept || '' : '')}"></div>
        <div class="form-group"><label for="us-phone">Phone</label>
          <input class="form-control" id="us-phone" name="phone" value="${esc(user ? user.phone || '' : '')}"></div>
      </div>
      <div class="form-group"><label for="us-pass">${user ? 'Reset password (optional)' : 'Password *'}</label>
        <input class="form-control" type="password" id="us-pass" name="password" ${user ? '' : 'minlength="6" required'}
          placeholder="${user ? 'leave blank to keep current' : 'min 6 characters'}"></div>
      <div class="modal-footer" style="padding:0;border:none">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
        <button type="submit" class="btn btn-primary">${user ? 'Save user' : 'Create user'}</button>
      </div>
    </form>`;
  openModal({ title: user ? `Edit ${user.name}` : 'Create user', body, large: true });
}


function flagInvalid(input, message) {
  if (!input) return;
  input.classList.add('is-invalid');
  const err = document.createElement('span');
  err.className = 'field-error';
  err.textContent = message;
  input.insertAdjacentElement('afterend', err);
  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    const next = input.nextElementSibling;
    if (next && next.classList.contains('field-error')) next.remove();
  }, { once: true });
}

const ACTIONS = {
  'open-login': (el) => {
    const area = el?.dataset?.area || '';
    PENDING_CATALOG = area ? { q: area, cat: '' } : null;
    openLogin(area ? `Sign in to search the live catalog for “${area}”.` : '');
  },
  'close-login': () => renderLanding(),
  'close-modal': () => { if (state.quiz) stopQuizTimer(); closeModal(); },
  'cancel-quiz': () => {
    if (confirmDialog('Leave the quiz? Unsubmitted answers will be lost.')) {
      stopQuizTimer(); closeModal(); toast('Attempt not submitted.', 'info');
    }
  },
  'logout': () => { $('#profile-menu').hidden = true; $('#logout-btn').click(); },
  'toggle-theme': () => $('#theme-toggle').click(),
  'request-password': () => {
    $('#profile-menu').hidden = true;
    navigate('profile');
    setTimeout(() => { const el = $('#pw-current'); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } }, 120);
  },
  'mark-notifs-read': () => {
    api.markNotificationsRead(session.user.id);
    $('#notif-menu').hidden = true;
    toast('All notifications marked as read.', 'success');
    render();
  },
  'reset-demo': () => {
    $('#profile-menu').hidden = true;
    if (confirmDialog('Sign out and clear local browser data (session, overlay, cache)? MySQL records are kept — the backend has no reset endpoint.')) api.resetDemo();
  },
  'back': () => history.length > 1 ? history.back() : navigate(ROLE_HOME[session.user.role]),

  'enroll-course': async (el) => {
    const res = await api.enroll(session.user.id, el.dataset.id);
    toast(res.ok ? 'Enrolled successfully — welcome aboard!' : res.error, res.ok ? 'success' : 'error');
    if (res.ok) { pushActivity('enrollment'); store.save(); render(); }
  },
  'unenroll-course': async (el) => {
    if (!confirmDialog('Drop this enrollment? Your progress is kept but the course moves to dropped.')) return;
    const res = await api.unenroll(session.user.id, el.dataset.id);
    toast(res.ok ? 'Course dropped.' : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'complete-lesson': async (el) => {
    const res = await api.completeLesson(session.user.id, el.dataset.id);
    if (res.ok) {
      toast(`Lesson complete — course progress ${res.pct}%${res.done === res.total ? ' · course finished! 🎓' : ''}.`, 'success');
      if (res.warn) toast(`Progress saved, but the enrollment status could not be updated: ${res.warn}`, 'warning');
      render();
    } else {
      toast(res.error, 'error');
    }
  },
  'start-quiz': (el) => openQuizPlayer(el.dataset.id),
  'view-certificate': (el) => openCertificate(el.dataset.id),
  'print-cert': () => window.print(),

  'open-create-course': () => openCourseForm(),
  'edit-course': (el) => openCourseForm(el.dataset.id),
  'archive-course': async (el) => {
    const res = await api.archiveCourse(el.dataset.id);
    toast(res.ok ? `Course ${res.course.code} → ${res.course.status}.` : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'toggle-publish-course': async (el) => {
    const c = byId(db.courses, el.dataset.id);
    const res = await api.updateCourse(c.id, { status: c.status === 'published' ? 'draft' : 'published' });
    toast(res.ok ? `Course is now ${res.course.status}.` : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'open-create-module': (el) => openModuleForm(el.dataset.id),
  'edit-module': (el) => openModuleForm(null, el.dataset.id),
  'delete-module': async (el) => {
    if (!confirmDialog('Delete this empty module?')) return;
    const res = await api.deleteModule(el.dataset.id);
    toast(res.ok ? 'Module deleted.' : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'open-create-lesson': (el) => openLessonForm(el.dataset.id),
  'edit-lesson': (el) => openLessonForm(null, el.dataset.id),
  'delete-lesson': async (el) => {
    if (!confirmDialog('Delete this lesson? Student progress for it will be removed too.')) return;
    const res = await api.deleteLesson(el.dataset.id);
    toast(res.ok ? 'Lesson deleted.' : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'open-create-quiz': (el) => openQuizForm(el.dataset.id),
  'open-create-quiz-pick': () => {
    const courses = myCourses();
    if (!courses.length) { toast('Create a course first.', 'warning'); return; }
    openQuizForm(courses[0].id);
  },
  'toggle-quiz-status': async (el) => {
    const q = byId(db.quizzes, el.dataset.id);
    const next = q.status === 'published' ? 'draft' : 'published';
    const res = await api.updateQuiz(q.id, { status: next });
    toast(res.ok ? `Quiz "${q.title}" → ${next}.` : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'delete-quiz': async (el) => {
    if (!confirmDialog('Delete this quiz and all its attempts?')) return;
    const res = await api.deleteQuiz(el.dataset.id);
    toast(res.ok ? 'Quiz deleted.' : res.error, res.ok ? 'success' : 'error');
    if (state.page === 'quiz') navigate('quiz-manager'); else render();
  },
  'open-add-question': (el) => openQuestionForm(el.dataset.id),
  'delete-question': async (el) => {
    if (!confirmDialog('Remove this question from the quiz?')) return;
    const res = await api.deleteQuestion(el.dataset.id, el.dataset.qid);
    toast(res.ok ? 'Question removed.' : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'open-grade': (el) => openGradeForm(el.dataset.student, el.dataset.course),
  'withdraw-grade': async (el) => {
    if (!confirmDialog('Move this published grade back to draft? The student will stop seeing it.')) return;
    const res = await api.withdrawGrade(el.dataset.id);
    toast(res.ok ? 'Grade withdrawn (back to draft).' : res.error, res.ok ? 'success' : 'error');
    render();
  },

  'open-create-user': () => openUserForm(),
  'edit-user': (el) => openUserForm(el.dataset.id),
  'toggle-user-status': async (el) => {
    const u = byId(db.users, el.dataset.id);
    const next = u.status === 'active' ? 'inactive' : 'active';
    if (!confirmDialog(`${next === 'inactive' ? 'Deactivate' : 'Reactivate'} ${u.email}?`)) return;
    const res = await api.updateUser(u.id, { status: next });
    toast(res.ok ? `${u.name} is now ${next}.` : res.error, res.ok ? 'success' : 'error');
    render();
  },
  'admin-drop-enrollment': async (el) => {
    const enr = byId(db.enrollments, el.dataset.id);
    if (!enr) return;
    if (!confirmDialog('Drop this enrollment?')) return;
    const res = await api.unenroll(enr.studentId, enr.courseId);
    toast(res.ok ? 'Enrollment dropped.' : res.error, res.ok ? 'success' : 'error');
    render();
  },
};


const FORMS = {
  async course(form) {
    const fd = new FormData(form);
    const id = form.dataset.id;
    const payload = {
      code: fd.get('code'), title: fd.get('title'), desc: fd.get('desc'),
      category: fd.get('category'), level: fd.get('level'), credits: fd.get('credits'),
      status: fd.get('status'), instructorId: fd.get('instructorId'),
    };
    const res = id ? await api.updateCourse(id, payload) : await api.createCourse(payload);
    if (!res.ok) {
      flagInvalid(form.querySelector('[name="code"]'), res.error);
      toast(res.error, 'error');
      return;
    }
    closeModal();
    toast(id ? 'Course updated.' : `Course ${res.course.code} created.`, 'success');
    if (!id) navigate('course', [res.course.id]); else render();
  },

  async module(form) {
    const fd = new FormData(form);
    const id = form.dataset.id;
    const payload = { title: fd.get('title'), description: fd.get('description'), seq: fd.get('seq') };
    const res = id ? await api.updateModule(id, payload) : await api.createModule(form.dataset.course, payload);
    if (!res.ok) { toast(res.error, 'error'); return; }
    closeModal();
    toast(id ? 'Module updated.' : 'Module added.', 'success');
    render();
  },

  async lesson(form) {
    const fd = new FormData(form);
    const id = form.dataset.id;
    const payload = {
      title: fd.get('title'), type: fd.get('type'), durationMin: fd.get('durationMin'),
      seq: fd.get('seq'), videoUrl: fd.get('videoUrl'), content: fd.get('content'),
    };
    const res = id ? await api.updateLesson(id, payload) : await api.createLesson(form.dataset.module, payload);
    if (!res.ok) { toast(res.error, 'error'); return; }
    closeModal();
    toast(id ? 'Lesson updated.' : 'Lesson added.', 'success');
    render();
  },

  async 'create-quiz'(form) {
    const fd = new FormData(form);
    const courseId = fd.get('courseId');
    const res = await api.createQuiz(courseId, {
      title: fd.get('title'), status: fd.get('status'),
      timeLimitMin: fd.get('timeLimitMin'), maxAttempts: fd.get('maxAttempts'),
      passMark: fd.get('passMark'), availableFrom: fd.get('availableFrom'), availableUntil: fd.get('availableUntil'),
    });
    if (!res.ok) { toast(res.error, 'error'); return; }
    closeModal();
    toast(`Quiz "${res.quiz.title}" created — add questions next.`, 'success');
    navigate('quiz', [res.quiz.id]);
  },

  async 'quiz-settings'(form) {
    const fd = new FormData(form);
    const res = await api.updateQuiz(form.dataset.id, {
      title: fd.get('title'), desc: fd.get('desc'), status: fd.get('status'),
      timeLimitMin: fd.get('timeLimitMin'), maxAttempts: fd.get('maxAttempts'),
      passMark: fd.get('passMark'), availableFrom: fd.get('availableFrom'), availableUntil: fd.get('availableUntil'),
    });
    if (!res.ok) { toast(res.error, 'error'); return; }
    toast('Quiz settings saved.', 'success');
    render();
  },

  async question(form) {
    const fd = new FormData(form);
    const options = [0, 1, 2, 3].map((i) => fd.get(`option${i}`)).filter((v) => v && String(v).trim());
    const res = await api.addQuestion(form.dataset.id, {
      prompt: fd.get('prompt'), options, correct: fd.get('correct'), marks: fd.get('marks'),
    });
    if (!res.ok) { toast(res.error, 'error'); return; }
    closeModal();
    toast('Question added.', 'success');
    render();
  },

  async grade(form) {
    const fd = new FormData(form);
    const score = fd.get('score');
    const publish = fd.get('publish') === 'on';
    const res = await api.saveGrade(form.dataset.student, form.dataset.course, score, fd.get('feedback'), publish);
    if (!res.ok) { flagInvalid(form.querySelector('[name="score"]'), res.error); toast(res.error, 'error'); return; }
    closeModal();
    toast(publish ? 'Grade published to the student.' : 'Draft grade saved.', 'success');
    render();
  },

  async user(form) {
    const fd = new FormData(form);
    const id = form.dataset.id;
    const payload = {
      name: fd.get('name'), email: fd.get('email'),
      status: fd.get('status'), dept: fd.get('dept'), phone: fd.get('phone'),
      password: fd.get('password') || undefined,
    };
    const roleValue = fd.get('role');
    if (roleValue) payload.role = roleValue;
    const res = id ? await api.updateUser(id, payload) : await api.createUser(payload);
    if (!res.ok) {
      flagInvalid(form.querySelector(id ? '[name="name"]' : '[name="email"]'), res.error);
      toast(res.error, 'error');
      return;
    }
    closeModal();
    toast(id ? 'User updated.' : `User ${res.user.email} created.`, 'success');
    render();
  },

  async profile(form) {
    const fd = new FormData(form);
    const res = await api.updateUser(session.user.id, {
      name: fd.get('name'), dept: fd.get('dept'), phone: fd.get('phone'), bio: fd.get('bio'),
    });
    if (!res.ok) { toast(res.error, 'error'); return; }
    toast('Profile saved.', 'success');
    render();
  },

  async password(form) {
    const fd = new FormData(form);
    if (fd.get('next') !== fd.get('confirm')) { toast('New passwords do not match.', 'error'); return; }
    const res = await api.changePassword(session.user.id, fd.get('current'), fd.get('next'));
    if (!res.ok) { flagInvalid(form.querySelector('[name="current"]'), res.error); toast(res.error, 'error'); return; }
    form.reset();
    toast('Password changed.', 'success');
  },

  async 'quiz-take'(form) {
    const fd = new FormData(form);
    const quiz = byId(db.quizzes, form.dataset.id);
    const answers = {};
    quiz.questions.forEach((q) => {
      const v = fd.get(`ans_${q.id}`);
      if (v !== null && v !== undefined && v !== '') answers[q.id] = Number(v);
    });
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered && !confirmDialog(`${unanswered} question(s) unanswered — submit anyway?`)) return;

    const res = await api.submitQuiz(session.user.id, quiz.id, answers);
    stopQuizTimer();
    if (!res.ok) { closeModal(); toast(res.error, 'error'); render(); return; }
    showQuizResult(res.attempt, res.total, res.score);
    renderShellChrome();
  },
};


function handleClickDelegates(e) {
  const navEl = e.target.closest('[data-nav]');
  if (navEl && navEl.dataset.nav) {
    e.preventDefault();
    $('#profile-menu').hidden = true;
    $('#notif-menu').hidden = true;
    if (window.matchMedia('(max-width: 768px)').matches) {
      $('#app').classList.remove('mobile-nav-open');
      $('#sidebar-overlay').hidden = true;
    }
    navigate(navEl.dataset.nav, navEl.dataset.id ? [navEl.dataset.id] : []);
    return;
  }
  const actionEl = e.target.closest('[data-act]');
  if (actionEl && actionEl.dataset.act) {
    const fn = ACTIONS[actionEl.dataset.act];
    if (fn) {
      e.preventDefault();
      if (actionEl._busy) return; // ignore repeat clicks while a request is running
      actionEl._busy = true;
      Promise.resolve(fn(actionEl))
        .catch((err) => toast(err?.message || String(err), 'error'))
        .finally(() => { actionEl._busy = false; });
    }
  }
}

function handleSubmitDelegates(e) {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const fn = FORMS[form.dataset.form];
  if (!fn) return;
  if (form._busy) return;
  form._busy = true;
  Promise.resolve(fn(form))
    .catch((err) => toast(err?.message || String(err), 'error'))
    .finally(() => { form._busy = false; });
}

function applyCatalogFilter() {
  const grid = $('#catalog-grid');
  if (!grid) return;
  const q = ($('#catalog-q')?.value || '').trim().toLowerCase();
  const cat = $('#catalog-cat')?.value || '';
  const level = $('#catalog-level')?.value || '';
  let shown = 0;
  $$('.course-card', grid).forEach((card) => {
    const ok = (!q || (card.dataset.search || '').includes(q)) &&
      (!cat || card.dataset.cat === cat) &&
      (!level || card.dataset.level === level);
    card.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });
  const count = $('#catalog-count');
  if (count) count.textContent = `${shown} shown`;
  const empty = $('#catalog-empty');
  if (empty) empty.hidden = shown > 0;
}

function handleInputDelegates(e) {
  const el = e.target;
  if (el.matches('[data-catalog-filter]')) { applyCatalogFilter(); return; }
  if (el.matches('[data-users-filter]') || el.matches('[data-enroll-filter]')) {
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      if (el.id) state.focusSelector = `#${el.id}`;
      else if (el.getAttribute('placeholder')) state.focusSelector = `[placeholder="${el.getAttribute('placeholder')}"]`;
      const patch = { q: el.value };
      if (el.id === 'users-role') {
        patch.q = $('#users-q') ? $('#users-q').value : '';
        state.focusSelector = '#users-role';
      }
      navigate(state.page, state.params, patch);
    }, el.tagName === 'SELECT' ? 0 : 260);
  }
}

function handleChangeDelegates(e) {
  const el = e.target;
  if (el.matches('[data-users-filter]') && el.tagName === 'SELECT') {
    navigate(state.page, state.params, { q: $('#users-q') ? $('#users-q').value : '', role: el.value });
  } else if (el.matches('[data-audit-filter]')) {
    navigate(state.page, state.params, { action: el.value });
  } else if (el.matches('[data-enroll-filter]') && el.tagName === 'SELECT') {
    navigate(state.page, state.params, { q: el.value });
  }
}


async function init() {
  await store.load();

  const theme = localStorage.getItem(THEME_KEY);
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('#theme-toggle').innerHTML = theme === 'dark' ? '&#9728;' : '&#9789;';
  }

  wireAuth();
  wireShell();
  wireLanding();

  window.addEventListener('hashchange', () => {
    render();
    if (state.focusSelector) {
      const el = $(state.focusSelector);
      if (el) { el.focus(); if (el.setSelectionRange && el.type !== 'number') el.setSelectionRange(el.value.length, el.value.length); }
      state.focusSelector = null;
    }
  });

  document.addEventListener('click', handleClickDelegates);
  document.addEventListener('submit', handleSubmitDelegates);
  document.addEventListener('input', handleInputDelegates);
  document.addEventListener('change', handleChangeDelegates);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal-root').hidden) {
      if (state.quiz) { if (!confirmDialog('Leave the quiz?')) return; stopQuizTimer(); }
      closeModal();
    }
  });

  if (OFFLINE) {
    toast(`The backend at ${API_BASE || location.origin} is unreachable — showing local demo data; changes will NOT be saved to MySQL. Start it with: cd minilms\\backend && npm start`, 'warning');
  }

  if (session.user) {
    const route = parseHash();
    if (route.page) render();
    else navigate(ROLE_HOME[session.user.role]);
    if (!route.page) render();
  } else if (AUTH_NOTICE) {
    const notice = AUTH_NOTICE;
    renderAuth();
    toast(notice, 'warning');
  } else {
    renderLanding();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
