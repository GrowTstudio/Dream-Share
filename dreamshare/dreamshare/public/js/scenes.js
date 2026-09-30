/* ============================================================
   DreamShare — inline SVG art (self-contained, no external files)
   ============================================================ */
const Scenes = (() => {

  const stars = (n, seed = 1, w = 400, h = 250) => {
    let s = '';
    let x = (seed * 9301 + 49297) % 233280;
    const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
    for (let i = 0; i < n; i++) {
      const cx = (rnd() * w).toFixed(1), cy = (rnd() * h * 0.7).toFixed(1);
      const r = (rnd() * 1.3 + 0.4).toFixed(2), o = (rnd() * 0.7 + 0.25).toFixed(2);
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${o}"/>`;
    }
    return s;
  };

  const moon = (cx, cy, r, gid, big = true) => `
    <defs>
      <radialGradient id="mglow${gid}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffe9c9" stop-opacity=".9"/>
        <stop offset="35%" stop-color="#f7c98a" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#f7c98a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="mface${gid}" cx="38%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#fff6e3"/>
        <stop offset="60%" stop-color="#f3d3a0"/>
        <stop offset="100%" stop-color="#e0b077"/>
      </radialGradient>
    </defs>
    ${big ? `<circle cx="${cx}" cy="${cy}" r="${r * 2.6}" fill="url(#mglow${gid})"/>` : ''}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#mface${gid})"/>
    <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.25}" r="${r * 0.16}" fill="#d9a86c" opacity=".45"/>
    <circle cx="${cx + r * 0.25}" cy="${cy + r * 0.2}" r="${r * 0.11}" fill="#d9a86c" opacity=".4"/>
    <circle cx="${cx + r * 0.05}" cy="${cy - r * 0.42}" r="${r * 0.07}" fill="#d9a86c" opacity=".35"/>`;

  /* ---------- Brand logo (crescent + sparkles) ---------- */
  const logo = (size = 54) => `
  <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="lg1" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stop-color="#c9bcff"/>
        <stop offset="100%" stop-color="#7c6cf0"/>
      </linearGradient>
    </defs>
    <path d="M38.5 8.5c-11.8 1.6-21 11.7-21 24 0 13.2 10.8 24 24 24 3.2 0 6.2-.6 9-1.8C45 60.5 37.6 64 29 64 14.6 64 3 52.4 3 38 3 21.5 17.2 8.2 33.4 8c1.7 0 3.4.2 5.1.5z" fill="url(#lg1)"/>
    <path d="M46 6l1.6 4.2L51.8 12l-4.2 1.6L46 17.8l-1.6-4.2L40.2 12l4.2-1.8z" fill="#fff"/>
    <path d="M55.5 20l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#cfc6ff"/>
    <path d="M50 30l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#a78bfa"/>
  </svg>`;

  /* ---------- Splash landscape ---------- */
  const splash = () => `
  <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="spSky" x1="0" y1="0" x2="0" y2="800">
        <stop offset="0%" stop-color="#1a1040"/>
        <stop offset="35%" stop-color="#3b2168"/>
        <stop offset="62%" stop-color="#7a3f7e"/>
        <stop offset="82%" stop-color="#c96a8e"/>
        <stop offset="100%" stop-color="#2a1638"/>
      </linearGradient>
      <radialGradient id="spCl" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffb6c9" stop-opacity=".85"/>
        <stop offset="100%" stop-color="#ffb6c9" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="800" fill="url(#spSky)"/>
    ${stars(38, 7, 400, 380)}
    ${moon(200, 405, 58, 'sp')}
    <g opacity=".8">
      <ellipse cx="70" cy="470" rx="130" ry="34" fill="#d989a8" opacity=".55"/>
      <ellipse cx="320" cy="505" rx="150" ry="38" fill="#c96a9a" opacity=".5"/>
      <ellipse cx="150" cy="545" rx="180" ry="42" fill="#a8558c" opacity=".55"/>
      <ellipse cx="330" cy="585" rx="160" ry="40" fill="#7e3f78" opacity=".6"/>
      <ellipse cx="60" cy="615" rx="150" ry="38" fill="#5b2f66" opacity=".65"/>
    </g>
    <ellipse cx="200" cy="405" rx="150" ry="150" fill="url(#spCl)" opacity=".35"/>
    <!-- cliff -->
    <path d="M0 800 L0 640 Q60 620 110 635 Q150 645 175 668 L205 700 L240 720 L300 738 L400 752 L400 800 Z" fill="#140a22"/>
    <path d="M0 800 L0 700 Q80 685 140 705 L210 745 L300 768 L400 775 L400 800 Z" fill="#0a0614"/>
    <!-- sitting person silhouette -->
    <g fill="#05030c">
      <ellipse cx="128" cy="632" rx="9" ry="10"/>
      <path d="M118 642 q10 -6 20 0 l6 24 -32 2 z"/>
      <path d="M120 662 l30 0 14 16 -10 6 -30 -6 z"/>
    </g>
  </svg>`;

  /* ---------- Dream scenes ---------- */
  const forest = (u) => `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="fSky${u}" x1="0" y1="0" x2="0" y2="250">
        <stop offset="0%" stop-color="#0b1a22"/>
        <stop offset="55%" stop-color="#123028"/>
        <stop offset="100%" stop-color="#05100c"/>
      </linearGradient>
      <radialGradient id="fGlow${u}" cx="50%" cy="62%" r="42%">
        <stop offset="0%" stop-color="#d8ffb0" stop-opacity=".95"/>
        <stop offset="35%" stop-color="#8fd97a" stop-opacity=".38"/>
        <stop offset="100%" stop-color="#8fd97a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="fRay${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#eaffd0" stop-opacity="0"/>
        <stop offset="100%" stop-color="#eaffd0" stop-opacity=".55"/>
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#fSky${u})"/>
    ${stars(12, 3, 400, 120)}
    <!-- far trees -->
    <g fill="#0a2018" opacity=".9">
      <path d="M40 250 L55 90 L70 250 Z"/><path d="M75 250 L92 70 L109 250 Z"/>
      <path d="M300 250 L318 80 L336 250 Z"/><path d="M335 250 L352 100 L369 250 Z"/>
    </g>
    <!-- glow & rays -->
    <ellipse cx="200" cy="160" rx="120" ry="95" fill="url(#fGlow${u})"/>
    <path d="M188 60 L178 250 L222 250 L212 60 Z" fill="url(#fRay${u})" opacity=".5"/>
    <path d="M165 80 L145 250 L175 250 L182 80 Z" fill="url(#fRay${u})" opacity=".3"/>
    <path d="M235 80 L242 250 L272 250 L252 80 Z" fill="url(#fRay${u})" opacity=".3"/>
    <!-- near trees -->
    <g fill="#04120c">
      <path d="M-10 250 L30 40 L72 250 Z"/><path d="M28 250 L58 25 L92 250 Z"/>
      <path d="M330 250 L368 35 L410 250 Z"/><path d="M305 250 L340 55 L375 250 Z"/>
      <rect x="24" y="150" width="10" height="100" rx="3"/>
      <rect x="360" y="145" width="11" height="105" rx="3"/>
    </g>
    <!-- path + figure -->
    <path d="M170 250 Q195 210 200 185 Q205 210 230 250 Z" fill="#0a1f14" opacity=".9"/>
    <g fill="#03130b">
      <circle cx="200" cy="188" r="4"/>
      <path d="M196 192 h8 l2 12 -6 10 -6 -10 z"/>
    </g>
    <!-- mist -->
    <ellipse cx="120" cy="235" rx="110" ry="16" fill="#9fd9a0" opacity=".14"/>
    <ellipse cx="300" cy="242" rx="120" ry="14" fill="#9fd9a0" opacity=".12"/>
  </svg>`;

  const city = (u) => `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="cSky${u}" x1="0" y1="0" x2="0" y2="250">
        <stop offset="0%" stop-color="#100b2e"/>
        <stop offset="55%" stop-color="#241a52"/>
        <stop offset="100%" stop-color="#3a2160"/>
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#cSky${u})"/>
    ${stars(30, 5, 400, 170)}
    ${moon(310, 62, 26, 'ct')}
    <!-- flying figure -->
    <g fill="#0d0a22" opacity=".95">
      <circle cx="150" cy="78" r="5.5"/>
      <path d="M144 84 q8 -5 15 0 l3 6 -20 2 z"/>
      <path d="M141 88 l-14 -8 2 5 12 8z"/>
      <path d="M160 88 l16 -10 -2 6 -14 9z"/>
      <path d="M146 92 l4 14 4 -2 -3 -12z"/>
      <path d="M154 93 l10 10 -3 3 -9 -9z"/>
    </g>
    <path d="M120 84 Q150 72 182 82" stroke="#a78bfa" stroke-width="1.4" fill="none" opacity=".5" stroke-dasharray="3 5"/>
    <!-- skyline -->
    <g fill="#0b0820">
      <rect x="0" y="170" width="34" height="80"/><rect x="38" y="150" width="28" height="100"/>
      <rect x="70" y="178" width="40" height="72"/><rect x="114" y="138" width="30" height="112"/>
      <rect x="148" y="165" width="36" height="85"/><rect x="188" y="148" width="26" height="102"/>
      <rect x="218" y="172" width="42" height="78"/><rect x="264" y="132" width="32" height="118"/>
      <rect x="300" y="162" width="30" height="88"/><rect x="334" y="144" width="36" height="106"/>
      <rect x="372" y="176" width="28" height="74"/>
    </g>
    <g fill="#ffd98a" opacity=".85">
      <rect x="44" y="158" width="4" height="5"/><rect x="54" y="158" width="4" height="5"/>
      <rect x="44" y="172" width="4" height="5"/><rect x="54" y="188" width="4" height="5"/>
      <rect x="120" y="148" width="4" height="5"/><rect x="130" y="162" width="4" height="5"/>
      <rect x="120" y="180" width="4" height="5"/><rect x="130" y="198" width="4" height="5"/>
      <rect x="196" y="156" width="4" height="5"/><rect x="196" y="176" width="4" height="5"/>
      <rect x="272" y="142" width="4" height="5"/><rect x="282" y="158" width="4" height="5"/>
      <rect x="272" y="182" width="4" height="5"/><rect x="282" y="204" width="4" height="5"/>
      <rect x="342" y="154" width="4" height="5"/><rect x="352" y="172" width="4" height="5"/>
      <rect x="342" y="194" width="4" height="5"/><rect x="78" y="188" width="4" height="5"/>
      <rect x="88" y="204" width="4" height="5"/><rect x="158" y="176" width="4" height="5"/>
      <rect x="168" y="196" width="4" height="5"/><rect x="230" y="184" width="4" height="5"/>
      <rect x="242" y="200" width="4" height="5"/><rect x="384" y="188" width="4" height="5"/>
    </g>
  </svg>`;

  const ocean = (u) => `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="oSky${u}" x1="0" y1="0" x2="0" y2="250">
        <stop offset="0%" stop-color="#0a2a4a"/>
        <stop offset="45%" stop-color="#08203f"/>
        <stop offset="100%" stop-color="#03101f"/>
      </linearGradient>
      <linearGradient id="oRay${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#bfe6ff" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#bfe6ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#oSky${u})"/>
    <path d="M150 0 L120 250 L180 250 L175 0 Z" fill="url(#oRay${u})"/>
    <path d="M240 0 L235 250 L300 250 L265 0 Z" fill="url(#oRay${u})" opacity=".7"/>
    <!-- whale -->
    <g fill="#041528" opacity=".96">
      <path d="M110 150 q60 -45 150 -18 q45 14 58 34 q-12 22 -60 26 q-85 8 -128 -12 q-24 -10 -20 -30 z"/>
      <path d="M312 168 q22 -20 34 -28 q-4 18 -2 30 q-12 8 -22 6z"/>
      <circle cx="150" cy="145" r="2.6" fill="#bfe6ff" opacity=".8"/>
    </g>
    <path d="M120 152 q40 -30 110 -16" stroke="#7fd0ff" stroke-width="1.4" fill="none" opacity=".35"/>
    <!-- floating stars -->
    <g fill="#eaf6ff">
      <path d="M70 70 l2.2 5.6 5.6 2.2 -5.6 2.2 -2.2 5.6 -2.2 -5.6 -5.6 -2.2 5.6 -2.2z" opacity=".95"/>
      <path d="M330 52 l1.8 4.6 4.6 1.8 -4.6 1.8 -1.8 4.6 -1.8 -4.6 -4.6 -1.8 4.6 -1.8z" opacity=".9"/>
      <path d="M260 100 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5z" opacity=".8"/>
      <path d="M55 180 l1.5 3.8 3.8 1.5 -3.8 1.5 -1.5 3.8 -1.5 -3.8 -3.8 -1.5 3.8 -1.5z" opacity=".75"/>
      <circle cx="365" cy="120" r="1.8" opacity=".8"/>
      <circle cx="95" cy="40" r="1.5" opacity=".7"/>
      <circle cx="215" cy="55" r="1.6" opacity=".75"/>
      <circle cx="300" cy="205" r="1.7" opacity=".7"/>
      <circle cx="40" cy="115" r="1.4" opacity=".65"/>
    </g>
    <ellipse cx="200" cy="248" rx="220" ry="24" fill="#02101d"/>
  </svg>`;

  const windowScene = (u) => `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="wSky${u}" x1="0" y1="0" x2="0" y2="250">
        <stop offset="0%" stop-color="#141030"/>
        <stop offset="100%" stop-color="#080614"/>
      </linearGradient>
      <linearGradient id="wBeam${u}" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#cfd6ff" stop-opacity=".3"/>
        <stop offset="100%" stop-color="#cfd6ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#wSky${u})"/>
    <!-- window -->
    <rect x="228" y="28" width="132" height="150" rx="8" fill="#2a2554" stroke="#0c0a1c" stroke-width="8"/>
    <rect x="228" y="28" width="132" height="150" rx="6" fill="#332a63"/>
    ${stars(14, 4, 132, 150).replace(/<circle/g, `<circle transform="translate(228,28)"`)}
    ${moon(318, 70, 20, 'wn', true).replace(/<defs>[\s\S]*?<\/defs>/, '')}
    <rect x="290" y="28" width="7" height="150" fill="#0c0a1c" opacity=".9"/>
    <rect x="228" y="96" width="132" height="7" fill="#0c0a1c" opacity=".9"/>
    <!-- beam -->
    <path d="M234 178 L120 250 L330 250 L352 178 Z" fill="url(#wBeam${u})"/>
    <!-- standing silhouette (grandfather) -->
    <g fill="#05040e">
      <circle cx="170" cy="112" r="13"/>
      <path d="M152 130 q18 -12 36 0 l8 70 -52 2 z"/>
      <path d="M158 128 q-16 4 -18 30 l8 2 6 -24z"/>
    </g>
    <ellipse cx="170" cy="212" rx="44" ry="8" fill="#000" opacity=".45"/>
    <!-- dust -->
    <g fill="#cfd6ff" opacity=".5">
      <circle cx="240" cy="150" r="1.4"/><circle cx="265" cy="190" r="1.2"/>
      <circle cx="210" cy="205" r="1.3"/><circle cx="300" cy="175" r="1.1"/>
    </g>
  </svg>`;

  const mist = (u) => `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="mSky${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1c1448"/>
        <stop offset="55%" stop-color="#3a2168"/>
        <stop offset="100%" stop-color="#120c2c"/>
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#mSky${u})"/>
    ${stars(24, 6, 400, 250)}
    ${moon(300, 80, 34, 'ms')}
    <ellipse cx="90" cy="200" rx="150" ry="40" fill="#a78bfa" opacity=".18"/>
    <ellipse cx="280" cy="230" rx="170" ry="36" fill="#7c6cf0" opacity=".22"/>
    <ellipse cx="180" cy="180" rx="120" ry="30" fill="#cfc6ff" opacity=".1"/>
  </svg>`;

  /* ---------- Brain ---------- */
  const brain = (u = 'ai') => `
  <svg viewBox="0 0 220 170" fill="none">
    <defs>
      <radialGradient id="brGlow${u}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a78bfa" stop-opacity=".55"/>
        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="brLine${u}" x1="0" y1="0" x2="220" y2="170">
        <stop offset="0%" stop-color="#d8ceff"/>
        <stop offset="100%" stop-color="#7c6cf0"/>
      </linearGradient>
    </defs>
    <ellipse cx="110" cy="88" rx="95" ry="72" fill="url(#brGlow${u})"/>
    <!-- brain outline -->
    <path d="M78 40 q-26 2 -32 24 q-22 8 -18 32 q-14 18 2 34 q4 24 30 26 q14 12 32 4
             M142 40 q26 2 32 24 q22 8 18 32 q14 18 -2 34 q-4 24 -30 26 q-14 12 -32 4"
          stroke="url(#brLine${u})" stroke-width="3.5" stroke-linecap="round" fill="rgba(124,108,240,.12)"/>
    <path d="M110 34 v100" stroke="url(#brLine${u})" stroke-width="3" stroke-linecap="round"/>
    <path d="M78 70 q12 8 14 24 q-14 6 -12 22" stroke="#c6b8ff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/>
    <path d="M142 70 q-12 8 -14 24 q14 6 12 22" stroke="#c6b8ff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/>
    <path d="M60 88 q14 -4 18 8" stroke="#c6b8ff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>
    <path d="M160 88 q-14 -4 -18 8" stroke="#c6b8ff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>
    <!-- neurons -->
    <g fill="#fff">
      <circle cx="84" cy="56" r="3"><animate attributeName="opacity" values="1;.3;1" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle cx="136" cy="56" r="3"><animate attributeName="opacity" values=".3;1;.3" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle cx="110" cy="84" r="3.4"><animate attributeName="opacity" values="1;.4;1" dur="1.7s" repeatCount="indefinite"/></circle>
      <circle cx="70" cy="102" r="2.6"><animate attributeName="opacity" values=".4;1;.4" dur="2.6s" repeatCount="indefinite"/></circle>
      <circle cx="150" cy="102" r="2.6"><animate attributeName="opacity" values="1;.4;1" dur="2.6s" repeatCount="indefinite"/></circle>
      <circle cx="110" cy="124" r="2.8"><animate attributeName="opacity" values=".5;1;.5" dur="1.9s" repeatCount="indefinite"/></circle>
    </g>
    <g stroke="#d8ceff" stroke-width="1" opacity=".5">
      <path d="M84 56 L110 84 L136 56"/>
      <path d="M70 102 L110 84 L150 102"/>
      <path d="M110 84 L110 124"/>
    </g>
  </svg>`;

  /* ---------- Category cards ---------- */
  const catArt = {
    nightmare: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cn${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a1030"/><stop offset="100%" stop-color="#0c0412"/></linearGradient></defs>
      <rect width="120" height="130" fill="url(#cn${u})"/>
      ${stars(10, 2, 120, 70)}
      <circle cx="78" cy="38" r="17" fill="#ff6b8a" opacity=".85"/>
      <circle cx="78" cy="38" r="26" fill="#ff6b8a" opacity=".15"/>
      <path d="M0 95 q20 -14 40 0 q20 14 40 0 q20 -14 40 0 l0 35 -120 0z" fill="#160618" opacity=".9"/>
      <path d="M0 108 q25 -10 45 2 q25 12 45 -2 q15 -8 30 -2 l0 22 -120 0z" fill="#0a030c"/>
      <path d="M30 88 l4 -14 4 14z" fill="#050208"/>
    </svg>`,
    lucid: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="cl${u}" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#6d5cf0"/><stop offset="100%" stop-color="#120a30"/></radialGradient></defs>
      <rect width="120" height="130" fill="url(#cl${u})"/>
      ${stars(14, 3, 120, 130)}
      <ellipse cx="60" cy="62" rx="34" ry="20" fill="none" stroke="#e6ddff" stroke-width="3"/>
      <circle cx="60" cy="62" r="9" fill="#fff"/>
      <circle cx="60" cy="62" r="4" fill="#3a2168"/>
    </svg>`,
    romantic: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cr${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5c2050"/><stop offset="100%" stop-color="#1c0a22"/></linearGradient></defs>
      <rect width="120" height="130" fill="url(#cr${u})"/>
      ${stars(10, 4, 120, 80)}
      <circle cx="42" cy="44" r="15" fill="#ffd3e0" opacity=".9"/>
      <circle cx="72" cy="52" r="11" fill="#ff9fc2" opacity=".85"/>
      <path d="M60 92 c-6 -10 -20 -6 -20 4 c0 8 12 14 20 20 c8 -6 20 -12 20 -20 c0 -10 -14 -14 -20 -4z" fill="#ff6ba0" opacity=".9"/>
    </svg>`,
    strange: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cs${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0e3a32"/><stop offset="100%" stop-color="#061418"/></linearGradient></defs>
      <rect width="120" height="130" fill="url(#cs${u})"/>
      ${stars(8, 5, 120, 90)}
      <rect x="44" y="38" width="32" height="58" rx="4" fill="#0b241f" stroke="#7be3c8" stroke-width="2.5"/>
      <circle cx="68" cy="70" r="3" fill="#7be3c8"/>
      <path d="M52 38 q8 -18 20 -8" stroke="#7be3c8" stroke-width="2" fill="none" opacity=".7"/>
    </svg>`,
    recurring: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><linearGradient id="cc${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#202a5c"/><stop offset="100%" stop-color="#0a0e24"/></linearGradient></defs>
      <rect width="120" height="130" fill="url(#cc${u})"/>
      ${stars(10, 6, 120, 130)}
      <circle cx="48" cy="55" r="13" fill="#ffe9c9" opacity=".95"/>
      <circle cx="74" cy="55" r="13" fill="#b9a8ff" opacity=".8"/>
      <circle cx="61" cy="82" r="13" fill="#6d5cf0" opacity=".85"/>
      <path d="M40 55 a28 28 0 1 1 10 24" stroke="#d8ceff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`,
    spiritual: (u) => `
    <svg viewBox="0 0 120 130" preserveAspectRatio="xMidYMid slice">
      <defs><radialGradient id="cp${u}" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#3f2f8f"/><stop offset="100%" stop-color="#100a28"/></radialGradient></defs>
      <rect width="120" height="130" fill="url(#cp${u})"/>
      ${stars(12, 7, 120, 90)}
      <circle cx="60" cy="52" r="18" fill="#ffe9a8" opacity=".9"/>
      <circle cx="60" cy="52" r="28" fill="#ffe9a8" opacity=".15"/>
      <path d="M60 82 c-12 4 -18 12 -18 12 c12 2 24 2 36 0 c0 0 -6 -8 -18 -12z" fill="#cfc6ff" opacity=".9"/>
      <path d="M60 94 c-14 6 -22 14 -22 14 c16 4 28 4 44 0 c0 0 -8 -8 -22 -14z" fill="#a78bfa" opacity=".8"/>
    </svg>`
  };

  const cover = (u = 'cv') => `
  <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="cv${u}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#3b2168"/><stop offset="55%" stop-color="#6d3f8c"/>
        <stop offset="100%" stop-color="#c96a8e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="150" fill="url(#cv${u})"/>
    ${stars(18, 9, 400, 100)}
    ${moon(330, 46, 22, 'cv2')}
    <ellipse cx="80" cy="130" rx="140" ry="34" fill="#4b2a72" opacity=".7"/>
    <ellipse cx="300" cy="145" rx="160" ry="32" fill="#3a1f5c" opacity=".8"/>
  </svg>`;

  /* ---------- Avatar (gradient + initials) ---------- */
  const avatar = (user) => {
    const h = user.hue != null ? user.hue : 250;
    const gid = 'av' + user.id;
    const initials = (user.name || '?')
      .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `<svg viewBox="0 0 64 64">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stop-color="hsl(${h},70%,62%)"/>
        <stop offset="100%" stop-color="hsl(${(h + 45) % 360},65%,38%)"/>
      </linearGradient></defs>
      <rect width="64" height="64" fill="url(#${gid})"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="800"
            fill="#fff" text-anchor="middle" opacity=".95">${initials}</text>
    </svg>`;
  };

  const scene = (key, uid = Math.random().toString(36).slice(2, 7)) => {
    switch (key) {
      case 'forest': return forest(uid);
      case 'city': return city(uid);
      case 'ocean': return ocean(uid);
      case 'window': return windowScene(uid);
      case 'mist': return mist(uid);
      default: return mist(uid);
    }
  };

  return { logo, splash, scene, brain, avatar, cover, catArt };
})();
