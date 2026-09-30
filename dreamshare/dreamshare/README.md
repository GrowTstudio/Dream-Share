# 🌙 DreamShare — Your Dreams. Our Community. (ONLINE)

Ab yeh **asli multi-user social app** hai — Instagram jaisa!
Real accounts, real IDs (@username), real dreams, real followers/following,
real likes/comments/notifications. Koi fake/demo data nahi — app **khali start**
hota hai; jaise-jaise log aate hain, feed bharta hai. 👥

---

## 🚀 Chalane ka tarika

```bash
node server.js          # ya: npm start
```
Browser me khulega: **http://localhost:3000**

- Node.js 16+ chahiye (https://nodejs.org) — aur kuch nahi! (zero dependencies)
- Database automatically banta hai: `data/db.json`
- Accounts, passwords (securely hashed), dreams, follows — sab save rehta hai

**Test karo 2 accounts se:** ek browser me normal, doosra incognito window —
2 signup karo, ek dusre ko follow karo, dream post karo, comment karo — sab real!

---

## 📱 App Features (real)

| Feature | Detail |
|---|---|
| 👤 **Real Accounts** | Sign Up (Name, @username, Email/Phone, Password) · Log In · Guest (browse-only) |
| 🌙 **Dreams** | Text ✍️ · Voice 🎙️ (speech-to-text) · Photo 📸 · Feelings · Tags |
| 🤖 **AI Interpretation** | Post se pehle dream ka meaning (Possible Meaning, Emotional Themes, Key Symbols, Common Interpretations) |
| 📰 **Feed** | For You (smart ranking) · Trending (most liked) · Recent · Following (sirf jinhe follow kiya) |
| ❤️ **Likes · 💬 Comments · 🔖 Save · ↗ Share** | Sab real users ke beech; share = working link (koi bhi kholega to dream dikhega) |
| ➡️ **Follow / Unfollow** | Instagram jaisa — real follower/following counts |
| 👤 **Profile** | Har user ki real ID: @username, bio, Dreams/Followers/Following, About tab |
| 🔍 **Explore** | Live search (users + dreams + tags) · Categories · Trending |
| 🔔 **Notifications** | Real-time: kisne like kiya, comment kiya, follow kiya |
| 🌐 **Deep links** | Dream ka link share karo — `?d=<id>` se seedha khulta hai |

Guest mode me sab dekh sakte ho; post/like/comment/follow ke liye account chahiye
(bilkul Instagram jaisa).

---

## 🌍 INTERNET PAR KAISE DAALEIN (doston ke saath chalane ke liye)

### Option 1 — Free hosting (sabse aasaan) ⭐
1. [Render.com](https://render.com) / [Railway.app](https://railway.app) / [Fly.io](https://fly.io) par account banao
2. "New Web Service" → yeh code upload karo (GitHub repo ya zip)
3. Settings: **Start command = `node server.js`** · Port = `3000` (Render PORT env khud set karta hai — code me supported hai)
4. Deploy! Aapko ek link milega jaise `https://dreamshare.onrender.com` — woh link doston ko bhejo
5. ⚠️ Free plans par server sota hai (cold start ~30s) — theek hai demo ke liye
6. 💾 Data rakhne ke liye "Persistent Disk" laga lo `data/` folder par (Render/Railway me option hota hai)

### Option 2 — Docker (koi bhi VPS / cloud)
```bash
docker build -t dreamshare .
docker run -p 3000:3000 -v $(pwd)/data:/app/data dreamshare
```
`Dockerfile` included hai.

### Option 3 — Apna laptop = server (temporary test)
Upar `node server.js` chalao, aur [localhost.run](https://localhost.run) / ngrok se public link banao:
```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```
Jo public URL mile — wahi doston ke saath share kar do!

---

## 📁 Files

```
dreamshare/
├── server.js              ← Backend server (accounts · API · database) — zero deps
├── package.json           ← npm start
├── Dockerfile             ← deploy ke liye
├── data/                  ← database yahan banta hai (db.json + secret key)
└── public/                ← Frontend (jo browser me dikhta hai)
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── scenes.js      (SVG art — moon, forest, ocean, brain...)
    │   ├── ai.js          (dream interpretation engine)
    │   ├── api.js         (server se baat-cheet)
    │   └── app.js         (screens + actions)
    └── offline-demo.html  ← purana single-file OFFLINE demo (bina server chalta hai)
```

---

## 🔌 Real AI (GPT/Gemini) jodna ho to

`public/js/ai.js` → `interpretDream(text, feeling, tags)` ko API call se replace karo
(README code schema wahi hai jo UI render karta hai). Backend me bhi kar sakte ho
`POST /api/dreams` ke time. Abhi offline engine (~25 dream symbols) demo ke liye hai.

---

## 🔒 Security notes (production ke liye)

- Passwords `scrypt` se hashed hain (plain text kabhi store nahi hota) ✅
- Login tokens HMAC-signed hain ✅
- Public hosting ke liye HTTPS (Render/Railway dete hain) ✅
- Bade scale ke liye: SQLite/Postgres + Redis + rate-limiting + email verification add karo

---

## ❓ Aksar pooche sawal

**Q: Feed khali kyun hai?**
A: Kyunki yeh ASLI app hai — data tabhi aayega jab log signup karke dreams share
karenge. Pehle signup tum karo! 🚀

**Q: Password bhool gaya?**
A: Abhi demo me reset nahi hai — `data/db.json` me se user hata sakte ho ya naya
account bana lo. (Production me email-reset add koga.)

**Q: Purana offline demo kahan hai?**
A: `public/offline-demo.html` — woh bina server/internet ke chalta hai (fake data ke saath).

Sweet dreams! 🌙
