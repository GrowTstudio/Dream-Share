/* ============================================================
   DreamShare — Online App (real users · real dreams · real follows)
   ============================================================ */
const App = (() => {

  const $app = document.getElementById('app');
  const $tabbar = document.getElementById('tabbar');
  const $toast = document.getElementById('toast');
  const $busy = document.getElementById('busy');

  /* ---------------- State ---------------- */
  let S = {
    me: null,                 // my publicUser (from server)
    following: [],
    feed: [],
    notifs: [],
    stack: [{ s: 'splash' }],
    feedTab: 'foryou',
    notifTab: 'all',
    authMode: 'login',
    draft: { text: '', mode: 'text', feeling: null, tags: [], photo: null },
    interpretation: null,
    aiBusy: false,
    rec: { on: false, sec: 0 },
    search: null,             // last search payload
    searchQ: '',
    profile: null,            // {user, dreams} for profile screen
    comments: null,           // {dream, comments}
    profileTab: 'dreams',
    commentDraft: '',
    busy: false
  };
  let recTimer = null, recog = null, toastTimer = null, poller = null;

  /* ---------------- Helpers ---------------- */
  const top = () => S.stack[S.stack.length - 1];
  function go(s, p = {}) { S.stack.push({ s, ...p }); render(); }
  function back() { stopRec(true); if (S.stack.length > 1) { S.stack.pop(); render(); } }
  function switchTab(s, p = {}) { stopRec(true); S.stack = [{ s, ...p }]; render(); }

  function setBusy(v) {
    S.busy = v;
    if ($busy) $busy.classList.toggle('on', !!v);
  }

  async function wrap(fn) {
    setBusy(true);
    try { await fn(); }
    catch (e) {
      if (e && e.status === 401) {
        API.setToken(''); S.me = null;
        toast(e.message || 'Session khatam — dobara Log In karo');
        S.stack = [{ s: 'auth' }]; S.authMode = 'login'; render();
      } else {
        toast(e && e.message ? e.message : 'Kuch galat ho gaya');
      }
    } finally { setBusy(false); }
  }

  function needLogin() {
    if (S.me) return false;
    toast('Iske liye account chahiye — Log In / Sign Up karo 🌙');
    S.authMode = 'signup';
    go('auth');
    return true;
  }

  function timeAgo(ts) {
    const min = (Date.now() - ts) / 60000;
    if (min < 1) return 'now';
    if (min < 60) return Math.round(min) + 'm ago';
    if (min < 1440) return Math.round(min / 60) + 'h ago';
    return Math.round(min / 1440) + 'd ago';
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
  }
  const unread = () => S.notifs.filter(n => !n.read).length;

  /* ---------------- Icons ---------------- */
  const I = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    search: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    heart: '<svg class="wide" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    comment: '<svg class="wide" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>',
    save: '<svg class="wide" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    share: '<svg class="wide" width="20" height="20" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>',
    reply: '<svg class="wide" width="15" height="15" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17l-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>',
    mic: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/></svg>',
    micSm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/></svg>',
    typeSm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
    photoSm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    dots: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    eye: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 8l10 6 10-6"/></svg>',
    lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    person: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    at: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>',
    home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    compass: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    bell: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.5 21a2 2 0 0 0 3 0"/></svg>',
    userTab: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    plus: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    spark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
    tick: '<svg class="tick" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    cal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };

  const av = (u, cls = 'md') => {
    const usr = u || { id: 'guest', name: 'Guest', hue: 280 };
    return `<div class="avatar ${cls}">${Scenes.avatar(usr)}</div>`;
  };

  /* ---------------- Post renderers ---------------- */
  function postCard(d) {
    const a = d.author;
    const img = d.photo
      ? `<div class="post-img"><img src="${esc(d.photo)}" alt="dream art"/></div>`
      : (d.scene ? `<div class="post-img">${Scenes.scene(d.scene, d.id)}</div>` : '');
    return `
    <article class="post" data-id="${d.id}">
      <div class="post-head">
        ${av(a, 'md')}
        <div class="who" data-act="profile" data-username="${esc(a.username)}">
          <div class="name">${esc(a.name)}</div>
          <div class="handle">@${esc(a.username)} · ${timeAgo(d.createdAt)}</div>
        </div>
        <span class="post-tag">${esc(d.tags && d.tags[0] ? '#' + d.tags[0] : (d.feeling ? '#' + d.feeling : '#Dream'))}</span>
      </div>
      <div class="post-text" data-act="comments" data-id="${d.id}">${esc(d.text)}</div>
      ${img}
      <div class="post-actions">
        <button class="act ${d.likedByMe ? 'liked' : ''}" data-act="like" data-id="${d.id}" aria-label="Like">${I.heart}<span>${d.likes}</span></button>
        <button class="act" data-act="comments" data-id="${d.id}" aria-label="Comments">${I.comment}<span>${d.commentCount}</span></button>
        <span class="spacer"></span>
        <button class="act ${d.saved ? 'saved' : ''}" data-act="save" data-id="${d.id}" aria-label="Save">${I.save}</button>
        <button class="act" data-act="share" data-id="${d.id}" aria-label="Share">${I.share}</button>
      </div>
    </article>`;
  }

  function miniPost(d) {
    const a = d.author;
    return `
    <div class="mini-post" data-id="${d.id}">
      <div class="head">
        ${av(a, 'sm')}
        <div class="who" data-act="profile" data-username="${esc(a.username)}">
          <div class="name">${esc(a.name)}</div>
          <div class="time">@${esc(a.username)} · ${timeAgo(d.createdAt)}</div>
        </div>
        <span class="post-tag">${esc(d.tags && d.tags[0] ? '#' + d.tags[0] : (d.feeling ? '#' + d.feeling : '#Dream'))}</span>
      </div>
      <div class="txt" data-act="comments" data-id="${d.id}">${esc(d.text)}</div>
      <div class="foot">
        <button class="act ${d.likedByMe ? 'liked' : ''}" data-act="like" data-id="${d.id}">${I.heart}<span>${d.likes}</span></button>
        <button class="act" data-act="comments" data-id="${d.id}">${I.comment}<span>${d.commentCount}</span></button>
        <span class="spacer"></span>
        <button class="act ${d.saved ? 'saved' : ''}" data-act="save" data-id="${d.id}">${I.save}</button>
        <button class="act" data-act="share" data-id="${d.id}">${I.share}</button>
      </div>
    </div>`;
  }

  function userRow(u, extra = '') {
    return `
    <div class="user-row">
      ${av(u, 'md')}
      <div class="who" data-act="profile" data-username="${esc(u.username)}">
        <div class="name">${esc(u.name)}</div>
        <div class="handle">@${esc(u.username)} · ${u.dreamers ? '' : u.dreamCount} dreams</div>
      </div>
      ${extra || (u.isMe ? '' : `
        <button class="btn ${u.isFollowing ? 'btn-ghost' : 'btn-primary'} follow-sm" data-act="follow" data-id="${u.id}">
          ${u.isFollowing ? 'Following ✓' : 'Follow'}
        </button>`)}
    </div>`;
  }

  /* ---------------- Screens ---------------- */
  function screenSplash() {
    return `
    <div class="screen">
      <div class="splash-art">${Scenes.splash()}</div>
      <div class="splash-content">
        <div class="splash-logo">${Scenes.logo(84)}</div>
        <div class="splash-title">DreamShare</div>
        <div class="splash-sub">Your Dreams. Our Community.</div>
        <div class="splash-desc">Share your dreams, discover meanings, and connect with people who understand.</div>
        <div class="splash-bottom">
          <button class="btn btn-primary btn-block" data-act="go-auth-signup">Get Started</button>
          <div class="linkline">Already have an account? <b data-act="go-auth-login">Log In</b></div>
          <div class="linkline" style="margin-top:10px"><b data-act="guest">Continue as Guest 👀</b></div>
        </div>
      </div>
    </div>`;
  }

  function screenAuth() {
    const signup = S.authMode === 'signup';
    return `
    <div class="screen">
      <div class="appbar">
        <button class="iconbtn" data-act="back">${I.back}</button>
      </div>
      <div class="scroll auth-wrap pb-safe">
        <div class="auth-brand">
          ${Scenes.logo(64)}
          <div class="brand-name">DreamShare</div>
        </div>
        <div class="auth-welcome">
          <h2>${signup ? 'Create your account' : 'Welcome back!'}</h2>
          <p>${signup ? 'Real ID banao — log tumhe @username se dhoondenge' : 'Log in to continue'}</p>
        </div>
        ${signup ? `
        <label class="field">${I.person}
          <input id="f-name" type="text" placeholder="Aapka naam" maxlength="40"/>
        </label>
        <label class="field">${I.at}
          <input id="f-user" type="text" placeholder="Username (e.g. aanya_dreams)" maxlength="20" autocapitalize="off"/>
        </label>` : ''}
        <label class="field">${I.mail}
          <input id="f-id" type="text" placeholder="Email / Phone / Username" autocapitalize="off"/>
        </label>
        <label class="field">${I.lock}
          <input id="f-pw" type="password" placeholder="Password (min 6 chars)"/>
          <span class="eye" data-act="toggle-pw">${I.eye}</span>
        </label>
        ${signup ? '' : '<div class="forgot" data-act="forgot">Forgot password?</div>'}
        <button class="btn btn-primary btn-block" data-act="${signup ? 'signup' : 'login'}">${signup ? 'Sign Up' : 'Log In'}</button>
        <div class="orline">or</div>
        <div class="oauth">
          <button class="btn btn-dark btn-block" data-act="oauth" data-p="Google">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.3 5.2C41 35.5 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <button class="btn btn-dark btn-block" data-act="oauth" data-p="Apple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.2.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.6-3.8zM14.1 5.3c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z"/></svg>
            Continue with Apple
          </button>
        </div>
        <div class="auth-switch">${signup ? 'Already have an account?' : "Don't have an account?"}
          <b data-act="toggle-auth">${signup ? 'Log In' : 'Sign Up'}</b>
        </div>
      </div>
    </div>`;
  }

  function screenHome() {
    const tabs = [['foryou', 'For You'], ['trending', 'Trending'], ['recent', 'Recent'], ['following', 'Following']];
    const list = S.feed;
    let items;
    if (S.busy && !list.length) {
      items = `<div class="empty"><div class="big">🌙</div><p>Dreams load ho rahe hain...</p></div>`;
    } else if (!list.length) {
      items = `<div class="empty"><div class="big">✨</div><p>${S.feedTab === 'following'
        ? 'Jinhe follow karoge unke dreams yahan dikhenge.<br/>Explore me log dhoondho!'
        : 'Abhi koi dream share nahi hua.<br/>Tum bano pehle dreamer! 🌙'}</p>
        <div style="height:16px"></div>
        <button class="btn btn-primary" data-act="share-mode" data-m="text">+ Share your dream</button></div>`;
    } else {
      items = list.map((d, i) => (i === 0 ? postCard(d) + aiPromo() : postCard(d))).join('');
    }
    return `
    <div class="screen">
      <div class="appbar">
        <div class="brand">${Scenes.logo(32)}<span class="brand-name">DreamShare</span></div>
        <span class="spacer"></span>
        <button class="iconbtn" data-act="tab" data-s="explore" aria-label="Search">${I.search}</button>
        <button class="iconbtn" data-act="profile" data-username="${S.me ? esc(S.me.username) : ''}" aria-label="Profile" style="padding:0;width:38px">
          ${av(S.me, 'sm')}
        </button>
      </div>
      <div class="scroll pb-nav">
        <div class="pad">
          <div class="prompt-card">
            <div class="prompt-q" data-act="share-mode" data-m="text">
              <span class="spark">${I.spark}</span>
              <span>What did you dream last night?</span>
            </div>
            <div class="prompt-actions">
              <button class="btn btn-ghost" data-act="share-mode" data-m="text">${I.typeSm} Type</button>
              <button class="btn btn-ghost" data-act="share-mode" data-m="voice">${I.micSm} Voice</button>
            </div>
          </div>
          <div style="height:14px"></div>
          <div class="chip-row" style="margin-bottom:14px">
            ${tabs.map(([k, l]) => `<button class="chip ${S.feedTab === k ? 'on' : ''}" data-act="feedtab" data-k="${k}">${l}</button>`).join('')}
          </div>
          ${items}
        </div>
      </div>
    </div>`;
  }

  function aiPromo() {
    return `
    <div class="ai-promo" data-act="share-mode" data-m="text">
      <div class="ic">${I.spark}</div>
      <div><div class="t">Get AI Interpretation</div><div class="s">Discover what your dream might mean</div></div>
    </div>`;
  }

  function screenShare() {
    const d = S.draft;
    let modeUi = '';
    if (d.mode === 'text') {
      modeUi = `<div class="ta-wrap"><textarea id="dream-text" placeholder="Describe your dream...&#10;e.g. I was in a big ocean, then a whale came to me...">${esc(d.text)}</textarea></div>`;
    } else if (d.mode === 'voice') {
      const rec = S.rec;
      modeUi = `
      <div class="voice-wrap">
        <button class="mic-orb ${rec.on ? 'rec' : ''}" data-act="mic" aria-label="Record">${I.mic}</button>
        <div class="mic-hint">${rec.on ? 'Listening… tap to stop' : 'Tap the mic and speak your dream'}</div>
        <div class="mic-time">${String(Math.floor(rec.sec / 60)).padStart(2, '0')}:${String(rec.sec % 60).padStart(2, '0')}</div>
        <div class="wave ${rec.on ? '' : 'idle'}"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="transcript"><textarea id="dream-text" placeholder="Your words will appear here... you can also edit them.">${esc(d.text)}</textarea></div>
      </div>`;
    } else {
      modeUi = d.photo
        ? `<div class="photo-preview"><img src="${esc(d.photo)}" alt="Your dream photo"/>
             <button class="rm" data-act="rm-photo">✕</button></div>
           <div style="height:12px"></div>
           <div class="ta-wrap"><textarea id="dream-text" placeholder="Say something about this dream...">${esc(d.text)}</textarea></div>`
        : `<label class="photo-drop" for="photo-input">
             ${I.photoSm}
             <b>Add a dream photo</b>
             <span class="tiny dim">Tap to choose from gallery</span>
           </label>
           <input id="photo-input" type="file" accept="image/*" class="hidden"/>`;
    }

    const feels = [['Happy', '😊'], ['Sad', '😢'], ['Scared', '😨'], ['Excited', '🤩'], ['Confused', '😕'], ['Calm', '😌'], ['Angry', '😠'], ['Other', '🌀']];
    const tags = ['Nightmare', 'Lucid', 'Romantic', 'Strange', 'Recurring', 'Other'];

    return `
    <div class="screen">
      <div class="appbar">
        <button class="iconbtn" data-act="back">${I.back}</button>
        <div class="center-title">Share Your Dream</div>
        <span class="spacer"></span>
      </div>
      <div class="scroll pad pb-safe">
        <div class="seg">
          <button class="btn ${d.mode === 'text' ? 'on' : ''}" data-act="draft-mode" data-m="text">${I.typeSm} Text</button>
          <button class="btn ${d.mode === 'voice' ? 'on' : ''}" data-act="draft-mode" data-m="voice">${I.micSm} Voice</button>
          <button class="btn ${d.mode === 'photo' ? 'on' : ''}" data-act="draft-mode" data-m="photo">${I.photoSm} Photo</button>
        </div>
        ${modeUi}
        <h3 class="sect-title">How did you make you feel?</h3>
        <div class="feel-grid">
          ${feels.map(([k, e]) => `
            <button class="feel ${d.feeling === k ? 'on' : ''}" data-act="feel" data-k="${k}">
              <span class="em">${e}</span><span>${k}</span>
            </button>`).join('')}
        </div>
        <h3 class="sect-title">Tags (optional)</h3>
        <div class="chip-row">
          ${tags.map(t => `<button class="chip tag ${d.tags.includes(t) ? 'on' : ''}" data-act="tag" data-k="${t}">${t}</button>`).join('')}
        </div>
        <div style="height:20px"></div>
      </div>
      <div class="bottom-cta">
        <button class="btn btn-primary btn-block" data-act="to-ai">Post Dream</button>
      </div>
    </div>`;
  }

  function screenAI() {
    if (S.aiBusy || !S.interpretation) {
      const steps = ['Reading your dream...', 'Identifying key symbols...', 'Matching emotional patterns...', 'Preparing your insights...'];
      return `
      <div class="screen">
        <div class="appbar">
          <button class="iconbtn" data-act="back">${I.back}</button>
          <div class="center-title">AI Interpretation</div>
        </div>
        <div class="scroll pad">
          <div class="ai-loading">
            ${Scenes.brain('load')}
            <h3 style="font-size:17px">AI is reading your dream...</h3>
            <div class="ai-steps" id="ai-steps">
              ${steps.map((t, i) => `<div class="ai-step" data-i="${i}">${I.tick}<span>${t}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    }
    const it = S.interpretation;
    return `
    <div class="screen">
      <div class="appbar">
        <button class="iconbtn" data-act="back">${I.back}</button>
        <div class="center-title">AI Interpretation</div>
      </div>
      <div class="scroll pad pb-safe">
        <div class="ai-hero">
          ${Scenes.brain('hero')}
          <h2>${esc(it.headline)}</h2>
          <p>${esc(it.disclaimer)}</p>
        </div>
        <div style="height:14px"></div>
        ${it.sections.map(sec => `
          <div class="ai-section">
            <div class="ic" style="background:${sec.bg}">${sec.icon}</div>
            <div><div class="t">${esc(sec.title)}</div><div class="b">${esc(sec.body)}</div></div>
          </div>`).join('')}
        <div style="height:12px"></div>
        <button class="btn btn-ghost btn-block" data-act="back">✏️ Edit dream</button>
        <div style="height:12px"></div>
      </div>
      <div class="bottom-cta">
        <button class="btn btn-primary btn-block" data-act="post-dream">Post Dream</button>
      </div>
    </div>`;
  }

  function screenComments() {
    const data = S.comments;
    if (!data || !data.dream) return `<div class="screen"><div class="empty"><div class="big">🌙</div><p>Load ho raha hai...</p></div></div>`;
    const d = data.dream;
    const a = d.author;
    const t = top();
    let cs = [...data.comments];
    if (t.sort === 'new') cs.sort((x, y) => y.createdAt - x.createdAt);
    else cs.sort((x, y) => (y.likes - x.likes) || (y.createdAt - x.createdAt));

    return `
    <div class="screen">
      <div class="appbar">
        <button class="iconbtn" data-act="back">${I.back}</button>
        <div class="center-title">Comments</div>
      </div>
      <div class="scroll">
        <div class="cs-post">
          <div class="post-head">
            ${av(a, 'md')}
            <div class="who" data-act="profile" data-username="${esc(a.username)}">
              <div class="name">${esc(a.name)}</div>
              <div class="handle">@${esc(a.username)} · ${timeAgo(d.createdAt)}</div>
            </div>
            <span class="post-tag">${esc(d.tags && d.tags[0] ? '#' + d.tags[0] : (d.feeling ? '#' + d.feeling : '#Dream'))}</span>
          </div>
          <div class="post-text">${esc(d.text)}</div>
          <div class="post-actions">
            <button class="act ${d.likedByMe ? 'liked' : ''}" data-act="like" data-id="${d.id}">${I.heart}<span>${d.likes}</span></button>
            <button class="act">${I.comment}<span>${d.commentCount}</span></button>
            <span class="spacer"></span>
            <button class="act ${d.saved ? 'saved' : ''}" data-act="save" data-id="${d.id}">${I.save}</button>
            <button class="act" data-act="share" data-id="${d.id}">${I.share}</button>
          </div>
        </div>
        <div class="cs-count-row">
          <h3>Comments (${data.comments.length})</h3>
          <button class="chip" data-act="sort" data-k="${t.sort === 'new' ? 'top' : 'new'}">${t.sort === 'new' ? 'Newest ▾' : 'Top ▾'}</button>
        </div>
        ${cs.length ? cs.map(c => `
          <div class="comment">
            ${av(c.author, 'sm')}
            <div class="body">
              <div class="top">
                <span class="name">${esc(c.author.name)}</span>
                <span class="handle">@${esc(c.author.username)}</span>
                <span class="time">${timeAgo(c.createdAt)}</span>
              </div>
              <div class="txt">${esc(c.text)}</div>
              <div class="sub">
                <button class="${c.likedByMe ? 'liked' : ''}" data-act="like-comment" data-cid="${c.id}">${I.heart}<span>${c.likes}</span></button>
                <button data-act="reply" data-h="${esc(c.author.username)}">${I.reply} Reply</button>
              </div>
            </div>
          </div>`).join('') : `<div class="empty"><div class="big">💬</div><p>Be the first to comment<br/>on this dream.</p></div>`}
        <div style="height:10px"></div>
      </div>
      <div class="comment-bar">
        <input class="inp" id="comment-input" placeholder="Add a comment..." value="${esc(S.commentDraft)}"/>
        <button class="send" data-act="send-comment" data-id="${d.id}" aria-label="Send">${I.send}</button>
      </div>
    </div>`;
  }

  function screenProfile() {
    const data = S.profile;
    if (!data || !data.user) return `<div class="screen"><div class="empty"><div class="big">🌙</div><p>Profile load ho raha hai...</p></div></div>`;
    const u = data.user;
    const mine = data.dreams;

    const cta = u.isMe
      ? `<button class="btn btn-outline-sm" style="flex:1" data-act="share-mode" data-m="text">+ Share a dream</button>
         <button class="dots-btn" data-act="edit-profile">${I.dots}</button>`
      : `<button class="btn ${u.isFollowing ? 'btn-ghost' : 'btn-primary'}" style="flex:1;height:46px;border-radius:14px;font-size:15px" data-act="follow" data-id="${u.id}">${u.isFollowing ? 'Following ✓' : 'Follow'}</button>
         <button class="dots-btn" data-act="more">${I.dots}</button>`;

    return `
    <div class="screen">
      <div class="appbar" style="position:absolute;left:0;right:0;top:0;z-index:5;background:linear-gradient(180deg,rgba(5,5,12,.5),transparent)">
        <button class="iconbtn" data-act="back-or-home">${I.back}</button>
        <span class="spacer"></span>
        <button class="iconbtn" data-act="${u.isMe ? 'edit-profile' : 'more'}">${I.dots}</button>
      </div>
      <div class="scroll pb-nav">
        <div class="cover">${Scenes.cover('p' + u.id)}</div>
        <div class="profile-top">
          ${av(u, 'lg')}
          <div class="name">${esc(u.name)}</div>
          <div class="handle">@${esc(u.username)}</div>
          <div class="bio">${esc(u.bio)}</div>
          <div class="stats">
            <div class="stat"><div class="n">${u.dreamCount}</div><div class="l">Dreams</div></div>
            <div class="stat"><div class="n">${u.followers}</div><div class="l">Followers</div></div>
            <div class="stat"><div class="n">${u.following}</div><div class="l">Following</div></div>
          </div>
          <div class="profile-cta">${cta}</div>
        </div>
        <div class="ptabs">
          <button class="ptab ${S.profileTab === 'dreams' ? 'on' : ''}" data-act="ptab" data-k="dreams">Dreams</button>
          <button class="ptab ${S.profileTab === 'about' ? 'on' : ''}" data-act="ptab" data-k="about">About</button>
        </div>
        ${S.profileTab === 'dreams'
      ? (mine.length
        ? mine.map(miniPost).join('')
        : `<div class="empty"><div class="big">🌙</div><p>${u.isMe ? 'Share your first dream and<br/>start your journey!' : 'Inhone abhi tak koi dream share nahi kiya.'}</p></div>`)
      : `<div class="card about-card">
               <div class="name">About ${esc(u.name)}</div>
               <p>${esc(u.bio)}</p>
               <div class="about-row">${I.cal} Joined ${new Date(u.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
               <div class="about-row">${I.link} ${esc(u.username)}@dreamshare</div>
             </div>`}
      </div>
    </div>`;
  }

  function screenNotifications() {
    const tabs = [['all', 'All'], ['like', 'Likes'], ['comment', 'Comments'], ['follow', 'Follows']];
    let list = S.notifs;
    if (S.notifTab !== 'all') list = list.filter(n => n.type === S.notifTab);

    const verb = { like: 'liked your dream', comment: 'commented on your dream', follow: 'started following you' };
    const row = (n) => `
      <div class="notif ${n.read ? '' : 'unread'}" data-act="open-notif" data-id="${n.id}" data-dream="${n.dreamId || ''}" data-user="${esc(n.actor ? n.actor.username : '')}">
        ${av(n.actor, 'md')}
        <div class="body">
          <div class="t"><b>${esc(n.actor ? n.actor.name : 'Someone')}</b> ${verb[n.type] || n.type}</div>
          ${n.preview ? `<div class="quote">"${esc(n.preview)}"</div>` : ''}
          <div class="time">${timeAgo(n.createdAt)}</div>
        </div>
        <span class="chev">${I.chev}</span>
      </div>`;

    return `
    <div class="screen">
      <div class="appbar"><div class="title" style="font-size:21px;font-weight:900;padding-left:6px">Notifications</div></div>
      <div class="chip-scroll" style="padding-bottom:12px">
        ${tabs.map(([k, l]) => `<button class="chip ${S.notifTab === k ? 'on' : ''}" data-act="notif-tab" data-k="${k}">${l}</button>`).join('')}
      </div>
      <div class="scroll pb-nav">
        ${list.length ? list.map(row).join('') : `<div class="empty"><div class="big">🔔</div><p>Abhi koi notification nahi.<br/>Jaise log tumhare dreams dekhenge — yahan aayega!</p></div>`}
      </div>
    </div>`;
  }

  function screenExplore() {
    const cats = ['Nightmare', 'Lucid', 'Romantic', 'Strange', 'Recurring', 'Spiritual'];
    const res = S.search;
    let results = '';
    if (res) {
      const isCat = !!res.cat;
      results = `
        ${res.users && res.users.length ? `
          <h3 class="sect-title">People</h3>
          ${res.users.map(u => userRow(u)).join('')}` : ''}
        <h3 class="sect-title">${isCat ? esc(res.cat) + ' Dreams' : 'Dreams'} (${res.dreams.length})</h3>
        <div id="explore-results">
          ${res.dreams.length ? res.dreams.map(miniPost).join('') : `<div class="empty"><div class="big">🔍</div><p>Kuch nahi mila.<br/>Aur log aane do — dreams bharte jayenge!</p></div>`}
        </div>`;
    } else {
      results = `
        <h3 class="sect-title">Popular Categories</h3>
        <div class="cat-grid">
          ${cats.map(c => {
        const key = c.toLowerCase();
        return `
            <div class="cat" data-act="category" data-k="${c}">
              ${Scenes.catArt[key]('ex' + key)}
              <span class="lbl">${c}</span>
            </div>`;
      }).join('')}
        </div>
        <h3 class="sect-title">Trending Dreams</h3>
        <div id="explore-results">
          ${S.feed.length ? S.feed.map(d => `
            <div class="trend-card" data-act="comments" data-id="${d.id}">
              <div class="post-head" style="margin-bottom:8px">
                ${av(d.author, 'sm')}
                <div class="who" data-act="profile" data-username="${esc(d.author.username)}">
                  <div class="name">${esc(d.author.name)}</div>
                  <div class="handle">@${esc(d.author.username)}</div>
                </div>
                <span class="post-tag">${esc(d.tags && d.tags[0] ? '#' + d.tags[0] : (d.feeling ? '#' + d.feeling : '#Dream'))}</span>
              </div>
              <div class="post-text">${esc(d.text)}</div>
              <div class="post-actions">
                <span class="act ${d.likedByMe ? 'liked' : ''}" style="padding-left:0">${I.heart}<span>${d.likes}</span></span>
                <span class="act">${I.comment}<span>${d.commentCount}</span></span>
              </div>
            </div>`).join('') : `<div class="empty"><div class="big">🌙</div><p>Community badh rahi hai...<br/>Jald hi yahan dreams dikhenge!</p></div>`}
        </div>`;
    }

    return `
    <div class="screen">
      <div class="appbar"><div class="title" style="font-size:21px;font-weight:900;padding-left:6px">Explore</div></div>
      <div class="scroll pb-nav pad">
        <div class="searchbar">
          ${I.search}
          <input id="search-input" type="text" placeholder="Search dreams, users, tags..." value="${esc(S.searchQ)}"/>
        </div>
        ${results}
        <div style="height:14px"></div>
      </div>
    </div>`;
  }

  function screenEditProfile() {
    const u = S.me;
    return `
    <div class="screen">
      <div class="appbar">
        <button class="iconbtn" data-act="back">${I.back}</button>
        <div class="center-title">Edit Profile</div>
      </div>
      <div class="scroll pad pb-safe">
        <h3 class="sect-title">Display name</h3>
        <label class="field"><input id="e-name" type="text" value="${esc(u.name)}" maxlength="40"/></label>
        <h3 class="sect-title">Bio</h3>
        <div class="ta-wrap"><textarea id="e-bio" maxlength="140" placeholder="Apne baare me kuch likho...">${esc(u.bio)}</textarea></div>
        <div style="height:12px"></div>
        <p class="tiny dim">Username: @${esc(u.username)} (abhi change nahi hota)</p>
      </div>
      <div class="bottom-cta">
        <button class="btn btn-primary btn-block" data-act="save-profile">Save Changes</button>
      </div>
    </div>`;
  }

  function screenShareSheet(p) {
    const link = shareLink(p.id);
    const d = (S.comments && S.comments.dream && S.comments.dream.id === p.id) ? S.comments.dream
      : S.feed.find(x => x.id === p.id);
    return `
    <div class="screen">
      <div class="scroll pad">${d ? postCard(d) : '<div class="empty"><div class="big">🌙</div><p>Dream share ho raha hai...</p></div>'}</div>
      <div class="sheet-wrap" data-act="close-sheet">
        <div class="sheet" data-stop="1">
          <h4>Share this dream</h4>
          <div class="sheet-grid">
            <button class="sheet-act" data-act="share-native" data-id="${p.id}"><span class="ic">↗️</span>Share</button>
            <button class="sheet-act" data-act="copy-link" data-l="${esc(link)}"><span class="ic">🔗</span>Copy link</button>
            <button class="sheet-act" data-act="share-wa" data-id="${p.id}"><span class="ic">💬</span>WhatsApp</button>
            <button class="sheet-act" data-act="close-sheet"><span class="ic">✖️</span>Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function shareLink(dreamId) {
    return location.origin + location.pathname + '?d=' + dreamId;
  }

  /* ---------------- Tab bar ---------------- */
  function renderTabbar() {
    const scr = top().s;
    const showOn = ['home', 'explore', 'notifs', 'profile'];
    const show = (S.stack.length === 1 && showOn.includes(scr));
    $tabbar.classList.toggle('hidden', !show);
    if (!show) return;

    const u = S.me ? unread() : 0;
    const item = (s, icon, label) => `
      <button class="tab ${scr === s ? 'on' : ''}" data-act="tab" data-s="${s}">
        ${icon}<span>${label}</span>
        ${s === 'notifs' && u ? `<span class="badge">${u}</span>` : ''}
      </button>`;
    $tabbar.innerHTML = `
      ${item('home', I.home, 'Home')}
      ${item('explore', I.compass, 'Explore')}
      <div class="fab-wrap"><button class="fab" data-act="share-mode" data-m="text" aria-label="Share dream">${I.plus}</button></div>
      ${item('notifs', I.bell, 'Notifications')}
      ${item('profile', I.userTab, 'Profile')}`;
  }

  /* ---------------- Render ---------------- */
  const scrollMemo = {};
  function render() {
    const t = top();
    const key = t.s + (t.id || t.username || '');
    const prev = $app.querySelector('.scroll');
    if (prev && $app.dataset.key) scrollMemo[$app.dataset.key] = prev.scrollTop;

    let html = '';
    switch (t.s) {
      case 'splash': html = screenSplash(); break;
      case 'auth': html = screenAuth(); break;
      case 'home': html = screenHome(); break;
      case 'share': html = screenShare(); break;
      case 'ai': html = screenAI(); break;
      case 'comments': html = screenComments(); break;
      case 'profile': html = screenProfile(); break;
      case 'notifs': html = screenNotifications(); break;
      case 'explore': html = screenExplore(); break;
      case 'editprofile': html = screenEditProfile(); break;
      case 'sheet': html = screenShareSheet(t); break;
      default: html = screenSplash();
    }
    $app.innerHTML = html;
    $app.dataset.key = key;
    renderTabbar();
    bindInputs();
    const sc = $app.querySelector('.scroll');
    if (sc && scrollMemo[key] && t.s === 'home') sc.scrollTop = scrollMemo[key];
  }

  /* ---------------- Input bindings ---------------- */
  function bindInputs() {
    const ta = document.getElementById('dream-text');
    if (ta) ta.addEventListener('input', () => { S.draft.text = ta.value; });

    const ci = document.getElementById('comment-input');
    if (ci) ci.addEventListener('input', () => { S.commentDraft = ci.value; });

    const si = document.getElementById('search-input');
    if (si) {
      let deb = null;
      si.addEventListener('input', () => {
        S.searchQ = si.value;
        clearTimeout(deb);
        deb = setTimeout(async () => {
          const q = S.searchQ.trim();
          if (!q) { S.search = null; render(); return; }
          try {
            S.search = await API.search(q);
            S.search.cat = null;
            render();
            const s2 = document.getElementById('search-input');
            if (s2) { s2.focus(); s2.setSelectionRange(s2.value.length, s2.value.length); }
          } catch (e) { toast(e.message); }
        }, 350);
      });
    }

    const pi = document.getElementById('photo-input');
    if (pi) {
      pi.addEventListener('change', () => {
        const f = pi.files && pi.files[0];
        if (!f) return;
        if (f.size > 3.5 * 1024 * 1024) { toast('Photo chhoti rakho (max ~3MB)'); return; }
        const r = new FileReader();
        r.onload = () => { S.draft.photo = r.result; render(); toast('Photo added 📸'); };
        r.readAsDataURL(f);
      });
    }
  }

  /* ---------------- Voice ---------------- */
  const DEMO_LINES = [
    'I was walking on a beach at night and the waves were glowing blue. Then I saw a door standing in the sand.',
    'I dreamt that I was late for a train, but the train waited for me the whole time.',
    'A big snake was following me through my old school, but it turned into a river.'
  ];

  function startRec() {
    S.rec.on = true; S.rec.sec = 0;
    recTimer = setInterval(() => {
      S.rec.sec++;
      const el = document.querySelector('.mic-time');
      if (el) el.textContent = `${String(Math.floor(S.rec.sec / 60)).padStart(2, '0')}:${String(S.rec.sec % 60).padStart(2, '0')}`;
    }, 1000);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try {
        recog = new SR();
        recog.continuous = true; recog.interimResults = true; recog.lang = 'en-IN';
        let base = S.draft.text ? S.draft.text + ' ' : '';
        recog.onresult = (e) => {
          let finalT = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalT += e.results[i][0].transcript;
          }
          if (finalT) {
            S.draft.text = (base + finalT).trim();
            base = S.draft.text + ' ';
            const ta = document.getElementById('dream-text');
            if (ta) ta.value = S.draft.text;
          }
        };
        recog.onerror = () => { };
        recog.start();
      } catch (e) { recog = null; }
    }
    render();
  }

  function stopRec(silent) {
    if (recTimer) { clearInterval(recTimer); recTimer = null; }
    if (recog) { try { recog.stop(); } catch (e) { } recog = null; }
    if (!S.rec.on) return;
    const wasSec = S.rec.sec;
    S.rec.on = false;
    if (!S.draft.text.trim() && wasSec >= 1 && !silent) {
      S.draft.text = DreamAI.pick(DEMO_LINES);
      toast('Demo transcript added 🎙️');
    }
    if (!silent) render();
  }

  /* ---------------- Data loaders ---------------- */
  async function loadFeed() {
    const filter = { foryou: 'foryou', trending: 'trending', recent: 'latest', following: 'following' }[S.feedTab] || 'latest';
    const d = await API.feed(filter);
    S.feed = d.dreams;
  }
  async function loadNotifs() {
    if (!S.me) return;
    const d = await API.notifs();
    S.notifs = d.notifs;
  }
  async function openComments(id) {
    S.commentDraft = '';
    S.comments = null;
    go('comments', { id, sort: 'top' });
    try {
      S.comments = await API.dream(id);
      render();
    } catch (e) { toast(e.message); back(); }
  }
  async function openProfile(username) {
    if (!username) { if (needLogin()) return; username = S.me.username; }
    S.profile = null;
    S.profileTab = 'dreams';
    go('profile', { username });
    try {
      S.profile = await API.user(username);
      render();
    } catch (e) { toast(e.message); back(); }
  }
  function refreshDreamInViews(dream) {
    const i = S.feed.findIndex(d => d.id === dream.id);
    if (i >= 0) S.feed[i] = dream;
    if (S.comments && S.comments.dream && S.comments.dream.id === dream.id) S.comments.dream = dream;
    if (S.profile && S.profile.dreams) {
      const j = S.profile.dreams.findIndex(d => d.id === dream.id);
      if (j >= 0) S.profile.dreams[j] = dream;
    }
    if (S.search && S.search.dreams) {
      const k = S.search.dreams.findIndex(d => d.id === dream.id);
      if (k >= 0) S.search.dreams[k] = dream;
    }
  }
  function findDream(id) {
    return S.feed.find(d => d.id === id)
      || (S.comments && S.comments.dream && S.comments.dream.id === id ? S.comments.dream : null)
      || (S.profile && S.profile.dreams ? S.profile.dreams.find(d => d.id === id) : null)
      || (S.search && S.search.dreams ? S.search.dreams.find(d => d.id === id) : null);
  }

  /* ---------------- Actions ---------------- */
  const actions = {
    back,
    'back-or-home': () => { if (S.stack.length > 1) back(); else switchTab('home'); },
    'go-auth-login': () => { S.authMode = 'login'; go('auth'); },
    'go-auth-signup': () => { S.authMode = 'signup'; go('auth'); },
    'toggle-auth': () => { S.authMode = S.authMode === 'login' ? 'signup' : 'login'; render(); },
    'toggle-pw': () => {
      const f = document.getElementById('f-pw');
      if (f) f.type = f.type === 'password' ? 'text' : 'password';
    },
    forgot: () => toast('Forgot password ke liye server admin se contact karo (demo)'),
    oauth: (el) => toast(el.dataset.p + ' Sign-In jald hi — abhi Email se Sign Up karo 🙂'),

    signup: () => wrap(async () => {
      const name = document.getElementById('f-name').value.trim();
      const username = document.getElementById('f-user').value.trim();
      const email = document.getElementById('f-id').value.trim();
      const password = document.getElementById('f-pw').value;
      const r = await API.signup({ name, username, email, password });
      API.setToken(r.token);
      S.me = r.user;
      S.stack = [{ s: 'home' }];
      await Promise.all([loadFeed(), loadNotifs()]);
      render();
      toast('Welcome to DreamShare, ' + S.me.name + '! 🌙');
    }),

    login: () => wrap(async () => {
      const who = document.getElementById('f-id').value.trim();
      const password = document.getElementById('f-pw').value;
      const r = await API.login({ id: who, password });
      API.setToken(r.token);
      S.me = r.user;
      S.stack = [{ s: 'home' }];
      await Promise.all([loadFeed(), loadNotifs()]);
      render();
      toast('Welcome back, ' + S.me.name + '! 🌙');
    }),

    guest: () => {
      S.me = null;
      API.setToken('');
      switchTab('home');
      toast('Guest mode — sab dekh sakte ho, post/like/follow ke liye account banao');
      wrap(async () => { await loadFeed(); render(); });
    },

    tab: (el) => {
      const s = el.dataset.s;
      if (s === 'profile') { openProfile(S.me ? S.me.username : ''); return; }
      if (s === 'notifs' && !S.me) { needLogin(); return; }
      switchTab(s);
      if (s === 'home') wrap(async () => { await loadFeed(); render(); });
      if (s === 'notifs') wrap(async () => {
        await loadNotifs();
        await API.readNotifs();
        S.notifs.forEach(n => n.read = true);
        render();
      });
      if (s === 'explore') {
        wrap(async () => {
          if (!S.search) { await loadFeed(); }
          render();
        });
      }
    },

    feedtab: (el) => {
      S.feedTab = el.dataset.k;
      render();
      wrap(async () => { await loadFeed(); render(); });
    },
    'notif-tab': (el) => { S.notifTab = el.dataset.k; render(); },
    ptab: (el) => { S.profileTab = el.dataset.k; render(); },

    'share-mode': (el) => {
      if (needLogin()) return;
      S.draft.mode = el.dataset.m || 'text';
      if (S.rec.on) stopRec(true);
      go('share');
    },
    'draft-mode': (el) => {
      S.draft.mode = el.dataset.m;
      if (S.rec.on) stopRec(true);
      render();
    },
    feel: (el) => { S.draft.feeling = S.draft.feeling === el.dataset.k ? null : el.dataset.k; render(); },
    tag: (el) => {
      const k = el.dataset.k;
      const i = S.draft.tags.indexOf(k);
      if (i >= 0) S.draft.tags.splice(i, 1); else S.draft.tags.push(k);
      render();
    },
    'rm-photo': () => { S.draft.photo = null; render(); },
    mic: () => { if (S.rec.on) stopRec(); else startRec(); },

    'to-ai': () => {
      const d = S.draft;
      const txt = (d.text || '').trim();
      if (!txt && !d.photo) { toast('Pehle apna dream likho ya bolo 🌙'); return; }
      S.aiBusy = true; S.interpretation = null;
      go('ai');
      const steps = document.querySelectorAll('.ai-step');
      steps.forEach((el, i) => setTimeout(() => el.classList.add('done'), 350 + i * 420));
      setTimeout(() => {
        S.interpretation = DreamAI.interpretDream(txt, d.feeling, d.tags);
        S.aiBusy = false;
        render();
      }, 2200);
    },

    'post-dream': () => wrap(async () => {
      const d = S.draft;
      const txt = (d.text || '').trim() || '(A dream told in a picture 🌙)';
      const r = await API.postDream({
        text: txt,
        feeling: d.feeling,
        tags: d.tags,
        scene: d.photo ? null : (S.interpretation ? S.interpretation.scene : 'mist'),
        photo: d.photo,
        interpretation: S.interpretation
      });
      S.draft = { text: '', mode: 'text', feeling: null, tags: [], photo: null };
      S.interpretation = null;
      S.feedTab = 'foryou';
      S.stack = [{ s: 'home' }];
      await Promise.all([loadFeed(), loadNotifs()]);
      render();
      toast('Dream posted! Duniya dekh sakti hai ✨');
    }),

    like: (el) => {
      if (needLogin()) return;
      const id = el.dataset.id;
      const local = findDream(id);
      // optimistic
      if (local) { local.likedByMe = !local.likedByMe; local.likes += local.likedByMe ? 1 : -1; render(); }
      wrap(async () => {
        const r = await API.like(id);
        const d = findDream(id);
        if (d) { d.likedByMe = r.likedByMe; d.likes = r.likes; }
        else await loadFeed();
        render();
      });
    },

    save: (el) => {
      if (needLogin()) return;
      const id = el.dataset.id;
      wrap(async () => {
        const r = await API.save(id);
        const d = findDream(id);
        if (d) d.saved = r.saved;
        render();
        toast(r.saved ? 'Saved to your collection 🔖' : 'Removed from saved');
      });
    },

    comments: (el) => openComments(el.dataset.id),
    sort: (el) => { top().sort = el.dataset.k; render(); },

    'like-comment': (el) => {
      if (needLogin()) return;
      const cid = el.dataset.cid;
      wrap(async () => {
        const r = await API.likeComment(cid);
        if (S.comments) {
          const c = S.comments.comments.find(x => x.id === cid);
          if (c) { c.likedByMe = r.likedByMe; c.likes = r.likes; }
        }
        render();
      });
    },
    reply: (el) => {
      if (needLogin()) return;
      S.commentDraft = '@' + el.dataset.h + ' ';
      render();
      const ci = document.getElementById('comment-input');
      if (ci) ci.focus();
    },
    'send-comment': (el) => {
      if (needLogin()) return;
      const ci = document.getElementById('comment-input');
      const v = ((ci && ci.value) || S.commentDraft || '').trim();
      if (!v) { toast('Comment likho pehle ✍️'); return; }
      wrap(async () => {
        const r = await API.comment(el.dataset.id, v);
        if (S.comments) {
          S.comments.comments.unshift(r.comment);
          S.comments.dream.commentCount++;
        }
        S.commentDraft = '';
        top().sort = 'new';
        render();
        toast('Comment added 💬');
      });
    },

    profile: (el) => openProfile(el.dataset.username),
    follow: (el) => {
      if (needLogin()) return;
      const id = el.dataset.id;
      wrap(async () => {
        const r = await API.follow(id);
        // update wherever visible
        const patch = (u) => {
          if (u && u.id === id) { u.isFollowing = r.isFollowing; u.followers = r.followers; }
        };
        if (S.profile) patch(S.profile.user);
        if (S.search) (S.search.users || []).forEach(patch);
        S.feed.forEach(d => patch(d.author));
        if (S.me) {
          const meR = await API.me();
          S.me = meR.user; S.following = meR.following;
        }
        render();
        toast(r.isFollowing ? 'Following ✓' : 'Unfollowed');
      });
    },

    more: () => toast('More options (report / block — jald hi)'),
    'edit-profile': () => { if (needLogin()) return; go('editprofile'); },
    'save-profile': () => wrap(async () => {
      const name = document.getElementById('e-name').value.trim();
      const bio = document.getElementById('e-bio').value.trim();
      const r = await API.updateMe({ name, bio });
      S.me = r.user;
      back();
      toast('Profile updated ✓');
    }),

    'open-notif': (el) => {
      if (!S.me) { needLogin(); return; }
      const dreamId = el.dataset.dream;
      const username = el.dataset.user;
      wrap(async () => {
        await API.readNotifs();
        S.notifs.forEach(n => n.read = true);
        if (dreamId) await openComments(dreamId);
        else if (username) await openProfile(username);
        else render();
      });
    },

    category: (el) => {
      const cat = el.dataset.k;
      wrap(async () => {
        S.searchQ = '';
        S.search = await API.category(cat);
        S.search.cat = cat;
        render();
      });
    },

    share: (el) => go('sheet', { id: el.dataset.id }),
    'close-sheet': (el, ev) => {
      if (el.classList.contains('sheet-wrap') && ev.target.closest('.sheet') && !ev.target.closest('[data-act="close-sheet"]')) return;
      back();
    },
    'share-native': (el) => {
      const id = el.dataset.id;
      const d = findDream(id);
      const text = `🌙 DreamShare — ${d && d.author ? '@' + d.author.username + "'s" : ''} dream: "${(d && d.text || '').slice(0, 80)}"`;
      const url = shareLink(id);
      if (navigator.share) {
        navigator.share({ title: 'DreamShare', text, url }).catch(() => { });
      } else {
        copy(text + ' ' + url);
        toast('Copied — share anywhere! ↗️');
      }
      back();
    },
    'copy-link': (el) => { copy(el.dataset.l); toast('Link copied! 🔗'); back(); },
    'share-wa': (el) => {
      const t = encodeURIComponent('Dekho yeh dream 🌙 DreamShare par: ' + shareLink(el.dataset.id));
      window.open('https://wa.me/?text=' + t, '_blank');
      back();
    }
  };

  function copy(t) {
    try {
      navigator.clipboard.writeText(t);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta);
      try { ta.select(); document.execCommand('copy'); } catch (e2) { }
      ta.remove();
    }
  }

  /* ---------------- Global events ---------------- */
  $app.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (el.dataset.stop) return;
    if (actions[act]) { ev.preventDefault(); actions[act](el, ev); }
  });

  /* ---------------- Boot ---------------- */
  async function init() {
    render(); // splash first
    let started = false;

    if (API.loggedIn()) {
      try {
        setBusy(true);
        const meR = await API.me();
        S.me = meR.user; S.following = meR.following;
        await Promise.all([loadFeed(), loadNotifs()]);
        started = true;
      } catch (e) { API.setToken(''); }
      setBusy(false);
    }

    // deep links: ?d=<dreamId> or ?u=<username>
    const q = new URLSearchParams(location.search);
    const dId = q.get('d');
    const uName = q.get('u');

    if (dId) {
      S.stack = [{ s: 'home' }];
      if (!started && API.loggedIn()) { try { await loadFeed(); started = true; } catch (e) { } }
      render();
      openComments(dId);
    } else if (uName) {
      S.stack = [{ s: 'home' }];
      render();
      openProfile(uName);
    } else if (started) {
      switchTab('home');
    }

    // live updates — Instagram jaisa
    clearInterval(poller);
    poller = setInterval(async () => {
      if (!S.me || S.busy) return;
      try {
        await loadNotifs();
        const scr = top().s;
        if (scr === 'home') { await loadFeed(); render(); }
        else if (scr === 'notifs') render();
        else renderTabbar();
      } catch (e) { /* ignore */ }
    }, 15000);
  }

  init();
  return { S };
})();
