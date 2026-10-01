#!/usr/bin/env node
/* ============================================================
   DreamShare — Online Server (zero dependencies!)
   Real accounts · dreams · likes · comments · follows · notifs
   ------------------------------------------------------------
   Run:  node server.js        →  http://localhost:3000
   Data: data/db.json (auto-created)
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA, 'db.json');
const SECRET_FILE = path.join(DATA, 'secret');
const MAX_BODY = 6 * 1024 * 1024; // 6MB (photos as dataURL)
const TOKEN_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

fs.mkdirSync(DATA, { recursive: true });

/* ---------------- Secret ---------------- */
let SECRET;
try { SECRET = fs.readFileSync(SECRET_FILE, 'utf8'); }
catch { SECRET = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(SECRET_FILE, SECRET, { mode: 0o600 }); }

/* ---------------- JSON DB ---------------- */
function emptyDb() {
  return { users: [], dreams: [], comments: [], commentLikes: [], likes: [], saves: [], follows: [], notifs: [] };
}
let db;
try { db = { ...emptyDb(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) }; }
catch { db = emptyDb(); }

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE);
  }, 60);
}
function flushNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
process.on('SIGINT', () => { flushNow(); process.exit(0); });
process.on('SIGTERM', () => { flushNow(); process.exit(0); });

/* ---------------- Crypto helpers ---------------- */
function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return salt + ':' + hash;
}
function verifyPw(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const test = crypto.scryptSync(String(pw), salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch { return false; }
}
function b64u(s) { return Buffer.from(s).toString('base64url'); }
function sign(data) { return crypto.createHmac('sha256', SECRET).update(data).digest('base64url'); }
function makeToken(userId) {
  const payload = b64u(JSON.stringify({ u: userId, e: Date.now() + TOKEN_TTL }));
  return payload + '.' + sign(payload);
}
function readToken(token) {
  try {
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;
    const a = sign(payload), b = sig;
    if (a.length !== b.length || !crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))) return null;
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!d.u || d.e < Date.now()) return null;
    return db.users.find(u => u.id === d.u) || null;
  } catch { return null; }
}

/* ---------------- Helpers ---------------- */
const id = () => crypto.randomUUID();
const now = () => Date.now();

function publicUser(u, me) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    bio: u.bio || '',
    guest: !!u.guest,
    hue: u.hue == null ? 250 : u.hue,
    followers: db.follows.filter(f => f.followingId === u.id).length,
    following: db.follows.filter(f => f.followerId === u.id).length,
    dreamCount: db.dreams.filter(d => d.authorId === u.id).length,
    isFollowing: me ? db.follows.some(f => f.followerId === me.id && f.followingId === u.id) : false,
    isMe: me ? me.id === u.id : false,
    joinedAt: u.createdAt
  };
}

function publicDream(d, me) {
  const author = db.users.find(u => u.id === d.authorId);
  return {
    id: d.id,
    text: d.text,
    feeling: d.feeling || null,
    tags: d.tags || [],
    scene: d.scene || null,
    photo: d.photo || null,
    interpretation: d.interpretation || null,
    createdAt: d.createdAt,
    likes: db.likes.filter(l => l.dreamId === d.id).length,
    likedByMe: me ? db.likes.some(l => l.dreamId === d.id && l.userId === me.id) : false,
    saved: me ? db.saves.some(s => s.dreamId === d.id && s.userId === me.id) : false,
    commentCount: db.comments.filter(c => c.dreamId === d.id).length,
    author: publicUser(author, me)
  };
}

function publicComment(c, me) {
  const u = db.users.find(x => x.id === c.userId);
  return {
    id: c.id,
    text: c.text,
    createdAt: c.createdAt,
    likes: db.commentLikes.filter(l => l.commentId === c.id).length,
    likedByMe: me ? db.commentLikes.some(l => l.commentId === c.id && l.userId === me.id) : false,
    author: publicUser(u, me)
  };
}

function notify(recipientId, actorId, type, extra = {}) {
  if (recipientId === actorId) return; // no self-notifications
  db.notifs.unshift({
    id: id(), userId: recipientId, actorId, type,
    dreamId: extra.dreamId || null, preview: extra.preview || '',
    read: false, createdAt: now()
  });
  save();
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Data too large (max 6MB)'), { code: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { code: 400 })); }
    });
    req.on('error', reject);
  });
}

function authUser(req) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : (req.headers['x-token'] || '');
  return token ? readToken(token) : null;
}

/* ============================================================
   API ROUTES
   ============================================================ */
const api = {};

/* ---- Auth ---- */
api['POST /api/auth/signup'] = async (req, res, m, q, me, body) => {
  const name = String(body.name || '').trim();
  const username = String(body.username || '').trim().toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!name || name.length < 2) return json(res, 400, { error: 'Naam daalo (2+ letters)' });
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return json(res, 400, { error: 'Username: 3-20 letters/numbers/underscore (a-z, 0-9, _)' });
  if (!email || email.length < 5) return json(res, 400, { error: 'Email ya Phone daalo' });
  if (password.length < 6) return json(res, 400, { error: 'Password kam se kam 6 characters ka rakho' });
  if (db.users.some(u => u.username === username)) return json(res, 409, { error: 'Ye username le liya gaya hai — koi aur try karo' });
  if (db.users.some(u => u.email === email)) return json(res, 409, { error: 'Ye email/phone pehle se account hai — Log In karo' });

  const u = {
    id: id(), name, username, email,
    pw: hashPw(password),
    bio: 'New dreamer 🌙',
    hue: Math.floor(Math.random() * 360),
    guest: false,
    createdAt: now()
  };
  db.users.push(u); save();
  return json(res, 200, { token: makeToken(u.id), user: publicUser(u, u) });
};

api['POST /api/auth/google'] = async (req, res, m, q, me, body) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const credential = String(body.credential || '');
  if (!clientId) return json(res, 503, { error: 'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in Render.' });
  if (!credential || credential.length > 12000) return json(res, 400, { error: 'Missing or invalid Google credential' });
  const verify = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
  if (!verify.ok) return json(res, 401, { error: 'Google credential could not be verified' });
  const g = await verify.json();
  if (g.aud !== clientId || g.email_verified !== 'true' || !g.email) return json(res, 401, { error: 'Google account verification failed' });
  let u = db.users.find(x => x.email === String(g.email).toLowerCase());
  if (!u) {
    const base = String(g.email).split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 15) || 'dreamer';
    let username = base, n = 1;
    while (db.users.some(x => x.username === username)) username = (base.slice(0, 15) + '_' + n++).slice(0, 20);
    u = { id:id(), name:String(g.name || g.given_name || 'Dreamer').slice(0,40), username, email:String(g.email).toLowerCase(), pw:'', bio:'New dreamer 🌙', hue:Math.floor(Math.random()*360), guest:false, createdAt:now(), googleSub:g.sub };
    db.users.push(u); save();
  }
  return json(res, 200, { token:makeToken(u.id), user:publicUser(u,u) });
};

api['POST /api/auth/login'] = async (req, res, m, q, me, body) => {
  const who = String(body.id || '').trim().toLowerCase();
  const password = String(body.password || '');
  const u = db.users.find(x => x.username === who || x.email === who);
  if (!u || !verifyPw(password, u.pw)) return json(res, 401, { error: 'Galat username/email ya password' });
  return json(res, 200, { token: makeToken(u.id), user: publicUser(u, u) });
};

api['GET /api/me'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Not logged in' });
  return json(res, 200, {
    user: publicUser(me, me),
    following: db.follows.filter(f => f.followerId === me.id).map(f => f.followingId)
  });
};

api['PUT /api/me'] = async (req, res, m, q, me, body) => {
  if (!me) return json(res, 401, { error: 'Not logged in' });
  if (body.name != null) me.name = String(body.name).trim().slice(0, 40) || me.name;
  if (body.bio != null) me.bio = String(body.bio).trim().slice(0, 140);
  save();
  return json(res, 200, { user: publicUser(me, me) });
};

/* ---- Feed ---- */
api['GET /api/feed'] = async (req, res, m, q, me) => {
  const filter = q.get('filter') || 'latest';
  let list = [...db.dreams];
  if (filter === 'following') {
    if (!me) return json(res, 401, { error: 'Login karo' });
    const ids = db.follows.filter(f => f.followerId === me.id).map(f => f.followingId);
    ids.push(me.id);
    list = list.filter(d => ids.includes(d.authorId));
  }
  const likeCount = d => db.likes.filter(l => l.dreamId === d.id).length;
  const cmtCount = d => db.comments.filter(c => c.dreamId === d.id).length;
  if (filter === 'trending') {
    list.sort((a, b) => (likeCount(b) - likeCount(a)) || (b.createdAt - a.createdAt));
  } else if (filter === 'foryou') {
    // best = engagement + recency boost
    const score = d => {
      const ageH = (now() - d.createdAt) / 36e5;
      const recency = Math.max(0, 12 - ageH * 0.3);
      return likeCount(d) * 3 + cmtCount(d) * 2 + recency;
    };
    list.sort((a, b) => score(b) - score(a));
  } else {
    list.sort((a, b) => b.createdAt - a.createdAt);
  }
  return json(res, 200, { dreams: list.map(d => publicDream(d, me)) });
};

/* ---- Dreams ---- */
api['POST /api/dreams'] = async (req, res, m, q, me, body) => {
  if (!me) return json(res, 401, { error: 'Dream post karne ke liye account banao / Log In karo' });
  const text = String(body.text || '').trim();
  const photo = body.photo ? String(body.photo) : null;
  if (!text && !photo) return json(res, 400, { error: 'Dream likho ya photo do' });
  if (text.length > 2000) return json(res, 400, { error: 'Dream bahut lamba hai (max 2000 chars)' });
  if (photo && photo.length > 5e6) return json(res, 400, { error: 'Photo bahut badi hai' });

  const d = {
    id: id(), authorId: me.id, text,
    feeling: body.feeling || null,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 6).map(String) : [],
    scene: body.scene || null,
    photo,
    interpretation: body.interpretation || null,
    createdAt: now()
  };
  db.dreams.push(d); save();
  return json(res, 200, { dream: publicDream(d, me) });
};

api['GET /api/dreams/:id'] = async (req, res, m, q, me) => {
  const d = db.dreams.find(x => x.id === m.id);
  if (!d) return json(res, 404, { error: 'Dream nahi mila' });
  const comments = db.comments.filter(c => c.dreamId === d.id);
  return json(res, 200, {
    dream: publicDream(d, me),
    comments: comments.map(c => publicComment(c, me))
  });
};

api['POST /api/dreams/:id/like'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Like karne ke liye Log In karo' });
  const d = db.dreams.find(x => x.id === m.id);
  if (!d) return json(res, 404, { error: 'Dream nahi mila' });
  const i = db.likes.findIndex(l => l.dreamId === d.id && l.userId === me.id);
  if (i >= 0) { db.likes.splice(i, 1); }
  else {
    db.likes.push({ userId: me.id, dreamId: d.id, createdAt: now() });
    notify(d.authorId, me.id, 'like', { dreamId: d.id, preview: d.text.slice(0, 60) });
  }
  save();
  return json(res, 200, { likedByMe: i < 0, likes: db.likes.filter(l => l.dreamId === d.id).length });
};

api['POST /api/dreams/:id/save'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Save karne ke liye Log In karo' });
  const d = db.dreams.find(x => x.id === m.id);
  if (!d) return json(res, 404, { error: 'Dream nahi mila' });
  const i = db.saves.findIndex(s => s.dreamId === d.id && s.userId === me.id);
  if (i >= 0) db.saves.splice(i, 1);
  else db.saves.push({ userId: me.id, dreamId: d.id, createdAt: now() });
  save();
  return json(res, 200, { saved: i < 0 });
};

api['POST /api/dreams/:id/comments'] = async (req, res, m, q, me, body) => {
  if (!me) return json(res, 401, { error: 'Comment karne ke liye Log In karo' });
  const d = db.dreams.find(x => x.id === m.id);
  if (!d) return json(res, 404, { error: 'Dream nahi mila' });
  const text = String(body.text || '').trim();
  if (!text) return json(res, 400, { error: 'Comment khali hai' });
  if (text.length > 500) return json(res, 400, { error: 'Comment bahut lamba hai (max 500)' });
  const c = { id: id(), dreamId: d.id, userId: me.id, text, createdAt: now() };
  db.comments.push(c); save();
  notify(d.authorId, me.id, 'comment', { dreamId: d.id, preview: text.slice(0, 60) });
  return json(res, 200, { comment: publicComment(c, me) });
};

api['POST /api/comments/:id/like'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Log In karo' });
  const c = db.comments.find(x => x.id === m.id);
  if (!c) return json(res, 404, { error: 'Comment nahi mila' });
  const i = db.commentLikes.findIndex(l => l.commentId === c.id && l.userId === me.id);
  if (i >= 0) db.commentLikes.splice(i, 1);
  else {
    db.commentLikes.push({ userId: me.id, commentId: c.id, createdAt: now() });
    notify(c.userId, me.id, 'like', { dreamId: c.dreamId, preview: c.text.slice(0, 60) });
  }
  save();
  return json(res, 200, { likedByMe: i < 0, likes: db.commentLikes.filter(l => l.commentId === c.id).length });
};

/* ---- Users / Follow ---- */
api['GET /api/users/:username'] = async (req, res, m, q, me) => {
  const un = String(m.username).toLowerCase();
  const u = un === 'me' ? me : db.users.find(x => x.username === un);
  if (!u) return json(res, 404, { error: 'User nahi mila' });
  const dreams = db.dreams.filter(d => d.authorId === u.id).sort((a, b) => b.createdAt - a.createdAt);
  return json(res, 200, { user: publicUser(u, me), dreams: dreams.map(d => publicDream(d, me)) });
};

api['POST /api/users/:id/follow'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Follow karne ke liye Log In karo' });
  const target = db.users.find(x => x.id === m.id);
  if (!target) return json(res, 404, { error: 'User nahi mila' });
  if (target.id === me.id) return json(res, 400, { error: 'Khud ko follow? 😄' });
  const i = db.follows.findIndex(f => f.followerId === me.id && f.followingId === target.id);
  if (i >= 0) db.follows.splice(i, 1);
  else {
    db.follows.push({ followerId: me.id, followingId: target.id, createdAt: now() });
    notify(target.id, me.id, 'follow');
  }
  save();
  return json(res, 200, {
    isFollowing: i < 0,
    followers: db.follows.filter(f => f.followingId === target.id).length
  });
};

/* ---- Search ---- */
const CAT_KW = {
  nightmare: ['scared', 'lost', 'fear', 'dark', 'death', 'disappear', "couldn't find", 'monster', 'chased', 'nightmare'],
  lucid: ['flying', 'fly', 'float', 'floating', 'flew', 'sky', 'lucid'],
  romantic: ['love', 'kiss', 'wedding', 'bride', 'romantic'],
  strange: ['whale', 'ocean', 'floating', 'door', 'snake', 'strange', 'deep', 'weird'],
  recurring: ['exam', 'school', 'again', 'answer sheet', 'recurring', 'same dream'],
  spiritual: ['light', 'stars', 'star', 'moon', 'grandfather', 'grandmother', 'peaceful', 'spirit', 'god']
};

api['GET /api/search'] = async (req, res, m, q, me) => {
  const cat = (q.get('cat') || '').toLowerCase();
  const query = (q.get('q') || '').trim().toLowerCase();
  let users = [];
  let dreams = db.dreams;

  if (cat && CAT_KW[cat]) {
    const kw = CAT_KW[cat];
    dreams = dreams.filter(d => {
      const t = (d.text + ' ' + (d.tags || []).join(' ')).toLowerCase();
      return t.includes(cat) || kw.some(w => t.includes(w));
    });
  } else if (query) {
    users = db.users.filter(u =>
      u.username.includes(query) || u.name.toLowerCase().includes(query)
    ).slice(0, 10);
    dreams = dreams.filter(d => {
      const author = db.users.find(u => u.id === d.authorId) || {};
      const t = (d.text + ' ' + (d.tags || []).join(' ') + ' ' + (author.username || '') + ' ' + (author.name || '')).toLowerCase();
      return t.includes(query);
    });
  }
  dreams = [...dreams].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);
  return json(res, 200, {
    users: users.map(u => publicUser(u, me)),
    dreams: dreams.map(d => publicDream(d, me))
  });
};

/* ---- Notifications ---- */
api['GET /api/notifs'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Login karo' });
  const mine = db.notifs.filter(n => n.userId === me.id).slice(0, 50);
  return json(res, 200, {
    notifs: mine.map(n => ({
      id: n.id, type: n.type, preview: n.preview, dreamId: n.dreamId,
      read: n.read, createdAt: n.createdAt,
      actor: publicUser(db.users.find(u => u.id === n.actorId), me)
    })),
    unread: mine.filter(n => !n.read).length
  });
};

api['POST /api/notifs/read'] = async (req, res, m, q, me) => {
  if (!me) return json(res, 401, { error: 'Login karo' });
  db.notifs.forEach(n => { if (n.userId === me.id) n.read = true; });
  save();
  return json(res, 200, { ok: true });
};

/* ---- Health ---- */
api['GET /api/stats'] = async (req, res) => {
  return json(res, 200, { users: db.users.length, dreams: db.dreams.length, comments: db.comments.length });
};

/* ============================================================
   HTTP SERVER (static + api)
   ============================================================ */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};

function serveStatic(req, res, urlPath) {
  let p = urlPath === '/' ? '/index.html' : urlPath;
  p = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const file = path.join(PUB, p);
  if (!file.startsWith(PUB)) return json(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (err, buf) => {
    if (err) {
      // SPA fallback → index.html
      fs.readFile(path.join(PUB, 'index.html'), (e2, buf2) => {
        if (e2) return json(res, 404, { error: 'Not found' });
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(String(buf2).replace('__GOOGLE_CLIENT_ID__', String(process.env.GOOGLE_CLIENT_ID || '')));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(path.extname(file) === '.html' ? String(buf).replace('__GOOGLE_CLIENT_ID__', String(process.env.GOOGLE_CLIENT_ID || '')) : buf);
  });
}

function matchRoute(method, pathname) {
  for (const key of Object.keys(api)) {
    const [m, pattern] = key.split(' ');
    if (m !== method) continue;
    const pp = pattern.split('/');
    const up = pathname.split('/');
    if (pp.length !== up.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(up[i]);
      else if (pp[i] !== up[i]) { ok = false; break; }
    }
    if (ok) return { handler: api[key], params };
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const pathname = u.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
    });
    return res.end();
  }

  if (pathname.startsWith('/api/')) {
    const route = matchRoute(req.method, pathname);
    if (!route) return json(res, 404, { error: 'Unknown API: ' + pathname });
    try {
      const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : null;
      const me = authUser(req);
      await route.handler(req, res, route.params, u.searchParams, me, body || {});
    } catch (e) {
      json(res, e.code || 500, { error: e.message || 'Server error' });
    }
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('┌──────────────────────────────────────────┐');
  console.log('│  🌙 DreamShare Server — LIVE             │');
  console.log('│  http://localhost:' + PORT + '                    │');
  console.log('│  Users: ' + String(db.users.length).padEnd(4) + ' Dreams: ' + String(db.dreams.length).padEnd(4) + '             │');
  console.log('└──────────────────────────────────────────┘');
});
