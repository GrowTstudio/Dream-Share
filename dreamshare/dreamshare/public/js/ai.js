/* ============================================================
   DreamShare — AI Dream Interpretation Engine
   ------------------------------------------------------------
   Yeh ek offline keyword-based engine hai (demo ke liye).
   REAL AI (GPT/Gemini) jodne ke liye interpretDream() ko API
   call se replace karo — output schema wahi rahega.
   ============================================================ */
const DreamAI = (() => {

  /* Symbol dictionary: regex → insight fragments */
  const SYMBOLS = [
    { re: /\b(forest|trees?|jungle|woods?|nature)\b/i,
      label: 'Forest (life journey)', meaning: 'a journey through the unknown or a phase of personal growth',
      theme: 'change, uncertainty, personal growth', scene: 'forest' },
    { re: /\b(disappear|vanish|fading|gone|losing|lost)\b/i,
      label: 'Disappearing (loss of control)', meaning: 'a fear of losing something important or things changing faster than you\'d like',
      theme: 'anxiety, change, insecurity' },
    { re: /\b(light|glow|lamp|lantern|candle|shine|beam)\b/i,
      label: 'Small light (hope)', meaning: 'hope and guidance — a part of you that knows it will find a way',
      theme: 'hope, resilience, clarity' },
    { re: /\b(ocean|sea|water|wave|waves|whale|dolphin|fish|swim|drown|river|rain)\b/i,
      label: 'Water (emotions)', meaning: 'your emotional world — deep feelings you are processing',
      theme: 'emotions, healing, intuition', scene: 'ocean' },
    { re: /\b(deep ocean|deep sea|underwater|drowning)\b/i,
      label: 'Deep water (subconscious)', meaning: 'diving deep into your subconscious — sometimes feeling overwhelmed by emotions',
      theme: 'overwhelm, depth, self-discovery' },
    { re: /\b(stars?|constellation|galaxy|cosmos|universe)\b/i,
      label: 'Stars (guidance)', meaning: 'guidance, inspiration and a wish for something greater',
      theme: 'hope, destiny, wonder' },
    { re: /\b(fly|flying|flew|float|floating|hover|sky|clouds?)\b/i,
      label: 'Flying (freedom)', meaning: 'freedom, rising above problems and feeling in control of your life',
      theme: 'freedom, ambition, control', scene: 'city' },
    { re: /\b(fall|falling|fell|drop|dropping)\b/i,
      label: 'Falling (insecurity)', meaning: 'insecurity or fear of losing control in some area of life',
      theme: 'anxiety, insecurity, pressure' },
    { re: /\b(teeth?|tooth)\b/i,
      label: 'Teeth (self-image)', meaning: 'anxiety about how others see you, or worry about saying the wrong thing',
      theme: 'anxiety, self-image, communication' },
    { re: /\b(exam|test|school|college|class|answer sheet|paper|teacher|study|studying)\b/i,
      label: 'Exam (self-evaluation)', meaning: 'pressure to perform and fear of being judged or not being prepared enough',
      theme: 'pressure, self-doubt, expectations' },
    { re: /\b(death|died|dead|dying|funeral|grave|ghost|spirit|grandfather|grandmother|grandpa|grandma|uncle|aunt)\b/i,
      label: 'A loved one / death (change)', meaning: 'endings and transformation — or missing a bond and unresolved feelings',
      theme: 'grief, change, letting go', scene: 'window' },
    { re: /\b(chase|chased|chasing|running away|escape|escaping|follow|followed|monster|killer)\b/i,
      label: 'Being chased (avoidance)', meaning: 'something in waking life you are avoiding — it keeps asking for your attention',
      theme: 'stress, avoidance, fear' },
    { re: /\b(snake|snakes|serpent)\b/i,
      label: 'Snake (transformation)', meaning: 'hidden fears — or transformation and healing that is underway',
      theme: 'fear, transformation, healing' },
    { re: /\b(fire|burn|burning|flame|smoke)\b/i,
      label: 'Fire (intense emotion)', meaning: 'strong emotions — anger, passion or a desire to rebuild something',
      theme: 'anger, passion, renewal' },
    { re: /\b(house|home|room|building|door|window|stairs?)\b/i,
      label: 'House / door (the self)', meaning: 'your inner self — rooms represent different parts of your personality',
      theme: 'self, identity, opportunity' },
    { re: /\b(car|drive|driving|bus|train|bike|road|journey|path|travel)\b/i,
      label: 'Road / journey (direction)', meaning: 'the direction your life is taking and the choices in front of you',
      theme: 'direction, choices, progress' },
    { re: /\b(baby|child|kid|pregnan\w+|birth)\b/i,
      label: 'Baby (new beginning)', meaning: 'a new idea, project or phase of life that is being born',
      theme: 'new beginnings, potential' },
    { re: /\b(wedding|marriage|bride|groom|married|marry|love|kiss|crush|partner)\b/i,
      label: 'Love / wedding (union)', meaning: 'desire for connection and commitment — or coming into balance with yourself',
      theme: 'love, commitment, connection' },
    { re: /\b(money|cash|coins?|gold|rich|treasure|poor)\b/i,
      label: 'Money (self-worth)', meaning: 'self-worth, opportunity and how you value your own energy',
      theme: 'self-worth, opportunity, anxiety' },
    { re: /\b(storm|thunder|lightning|flood|hurricane|tornado)\b/i,
      label: 'Storm (emotional release)', meaning: 'emotional turbulence that is building up and asking to be released',
      theme: 'tension, release, change' },
    { re: /\b(mirror|reflection|shadow)\b/i,
      label: 'Mirror / shadow (the self)', meaning: 'how you see yourself — and parts of you that want to be acknowledged',
      theme: 'self-image, awareness' },
    { re: /\b(dog|cat|puppy|kitten|pet|animal|bird)\b/i,
      label: 'Animal (instinct)', meaning: 'your instincts — loyalty, comfort or a habit asking for attention',
      theme: 'instinct, comfort, loyalty' },
    { re: /\b(moon)\b/i,
      label: 'Moon (intuition)', meaning: 'your intuition and inner cycles — trust your gut right now',
      theme: 'intuition, cycles, femininity' },
    { re: /\b(night|dark|darkness|black)\b/i,
      label: 'Darkness (the unknown)', meaning: 'the unknown — your mind working through something you can\'t fully see yet',
      theme: 'uncertainty, the unconscious' },
    { re: /\b(beach|sand|island|mountain|cliff|hill|climbing)\b/i,
      label: 'Landscape (life path)', meaning: 'your wider life path — where you feel stuck and where you\'re headed',
      theme: 'ambition, journey, perspective' },
    { re: /\b(blood|injury|hurt|wound|accident|crying|tears)\b/i,
      label: 'Hurt / tears (emotional pain)', meaning: 'emotional pain that wants attention and compassion',
      theme: 'vulnerability, healing' },
  ];

  const FEEL_MOD = {
    Happy:   { mood: 'hopeful and positive', theme: 'joy, contentment' },
    Sad:     { mood: 'reflective and a little heavy', theme: 'sadness, loss, reflection' },
    Scared:  { mood: 'anxious and alert', theme: 'fear, anxiety, caution' },
    Excited: { mood: 'energized and open to change', theme: 'excitement, possibility' },
    Confused:{ mood: 'uncertain and searching for answers', theme: 'confusion, searching' },
    Calm:    { mood: 'peaceful and grounded', theme: 'peace, balance' },
    Angry:   { mood: 'charged with frustration', theme: 'anger, boundaries' },
    Other:   { mood: 'unusual and hard to label', theme: 'mystery, complexity' }
  };

  const TAG_MOD = {
    Nightmare: 'Because it felt like a nightmare, your brain may be stress-processing fears from the day.',
    Lucid: 'Being lucid shows strong self-awareness — you were observing your own mind at work.',
    Romantic: 'The romantic tone points to a wish for closeness, warmth or self-acceptance.',
    Strange: 'Strange dreams often mix memories in new ways while you sleep.',
    Recurring: 'Recurring dreams return until something they point to is fully felt or resolved.'
  };

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function matchSymbols(text) {
    const found = [];
    for (const s of SYMBOLS) {
      const m = text.match(s.re);
      if (m) found.push({ ...s, phrase: m[0] });
    }
    return found;
  }

  function sceneFor(text) {
    const found = matchSymbols(text);
    for (const s of found) if (s.scene) return s.scene;
    return 'mist';
  }

  /* --------- Public: dream → interpretation object --------- */
  function interpretDream(text, feeling, tags = []) {
    const t = text || '';
    const found = matchSymbols(t);
    const feel = FEEL_MOD[feeling] || FEEL_MOD.Other;
    const tagNotes = tags.map(x => TAG_MOD[x]).filter(Boolean);

    /* Key Symbols */
    let symbolsLine;
    if (found.length) {
      symbolsLine = found.slice(0, 4).map(s => s.label).join(', ');
    } else {
      symbolsLine = (feeling ? feeling + ' feelings' : 'everyday symbols') +
        ' (personal to your life right now)';
    }

    /* Emotional Themes */
    const themes = new Set();
    found.slice(0, 3).forEach(s => s.theme.split(',').map(x => x.trim()).forEach(x => themes.add(x)));
    feel.theme.split(',').map(x => x.trim()).forEach(x => themes.add(x));
    const themeList = [...themes].slice(0, 3).join(', ');

    /* Possible Meaning */
    let meaning;
    if (found.length >= 2) {
      meaning = `Your dream seems to center on ${found[0].meaning} combined with ${found[1].meaning}. ` +
        `Overall it points to ${feel.theme.split(',')[0]} — you may be processing something quietly in the background.`;
    } else if (found.length === 1) {
      meaning = `At its heart, this dream suggests ${found[0].meaning}. ` +
        `The ${found[0].phrase.toLowerCase()} imagery often shows up when you are navigating ${feel.theme.split(',')[0]}.`;
    } else {
      meaning = `This dream reads like a reflection of your inner state — ${feel.mood}. ` +
        `Even without classic symbols, the storyline mirrors something your mind has been carrying lately.`;
    }

    /* Common Interpretations */
    let common = 'You might be going through a transition or feeling overwhelmed, but there is hope ahead. ' +
      'Small steps in waking life can help this feeling settle.';
    if (found.length) {
      common = `A common reading of ${found[0].label.toLowerCase()} is that you are in a period of ${themeList.split(',')[0] || 'change'}. ` +
        (tagNotes[0] || `Your ${feeling ? feeling.toLowerCase() : 'mixed'} feeling suggests ${feel.mood}.`);
    } else if (tagNotes[0]) {
      common = tagNotes[0];
    }

    return {
      headline: "Here's what your dream might mean...",
      disclaimer: "Keep in mind, dream interpretation isn't a science, but it can offer helpful insights and perspectives.",
      sections: [
        { icon: '😊', bg: 'rgba(255,184,107,.15)', title: 'Possible Meaning', body: meaning },
        { icon: '🌸', bg: 'rgba(255,125,170,.15)', title: 'Emotional Themes', body: themeList.charAt(0).toUpperCase() + themeList.slice(1) },
        { icon: '🔍', bg: 'rgba(124,108,240,.18)', title: 'Key Symbols', body: symbolsLine },
        { icon: '👁️', bg: 'rgba(94,230,168,.15)', title: 'Common Interpretations', body: common }
      ],
      symbols: found.map(f => f.label),
      scene: sceneFor(t)
    };
  }

  return { interpretDream, sceneFor, pick };
})();
