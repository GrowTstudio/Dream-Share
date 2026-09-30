/* ============================================================
   DreamShare — API client (talks to server.js)
   ============================================================ */
const API = (() => {
  const KEY = 'dreamshare_token';
  let token = '';
  try { token = localStorage.getItem(KEY) || ''; } catch (e) { }

  async function req(method, url, body) {
    let r;
    try {
      r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': 'Bearer ' + token } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (e) {
      throw new Error('Internet connection nahi mil raha — server chalu hai?');
    }
    let d = {};
    try { d = await r.json(); } catch (e) { }
    if (r.status === 401 && url !== '/api/auth/login') { /* keep token, caller decides */ }
    if (!r.ok) { const err = new Error(d.error || ('Error ' + r.status)); err.status = r.status; throw err; }
    return d;
  }

  return {
    get token() { return token; },
    setToken(t) {
      token = t || '';
      try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) { }
    },
    loggedIn() { return !!token; },

    signup: (x) => req('POST', '/api/auth/signup', x),
    login: (x) => req('POST', '/api/auth/login', x),
    me: () => req('GET', '/api/me'),
    updateMe: (x) => req('PUT', '/api/me', x),

    feed: (filter) => req('GET', '/api/feed?filter=' + encodeURIComponent(filter)),
    postDream: (x) => req('POST', '/api/dreams', x),
    dream: (id) => req('GET', '/api/dreams/' + id),
    like: (id) => req('POST', '/api/dreams/' + id + '/like'),
    save: (id) => req('POST', '/api/dreams/' + id + '/save'),
    comment: (id, text) => req('POST', '/api/dreams/' + id + '/comments', { text }),
    likeComment: (cid) => req('POST', '/api/comments/' + cid + '/like'),

    user: (username) => req('GET', '/api/users/' + encodeURIComponent(username)),
    follow: (userId) => req('POST', '/api/users/' + userId + '/follow'),

    search: (q) => req('GET', '/api/search?q=' + encodeURIComponent(q)),
    category: (cat) => req('GET', '/api/search?cat=' + encodeURIComponent(cat)),

    notifs: () => req('GET', '/api/notifs'),
    readNotifs: () => req('POST', '/api/notifs/read')
  };
})();
