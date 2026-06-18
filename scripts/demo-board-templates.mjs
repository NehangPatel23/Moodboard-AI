/** Demo public boards — sourced from DEFAULT_TEMPLATES in src/lib/ai.ts */

export const DEMO_BOARD_TEMPLATES = [
  {
    id: 'luxury-wellness',
    name: 'Luxury Wellness',
    prompt: 'luxury wellness brand for women aged 25-40',
    tags: ['wellness', 'premium', 'minimal'],
    mood: 'calm luxury',
    summary: 'A calm, elevated identity built around restraint, warmth, and trust.',
    tone: ['clean', 'credible', 'modern'],
    palette: [
      { label: 'Ivory', hex: '#fbf6ef', usage: 'Background and base surfaces' },
      { label: 'Sage', hex: '#b7c2ae', usage: 'Secondary accent and calm balance' },
      { label: 'Muted Gold', hex: '#c4a46a', usage: 'Warm metallic accent' },
      { label: 'Charcoal', hex: '#2d2926', usage: 'Primary text and contrast' },
    ],
    typography: [
      { role: 'heading', fontName: 'Cormorant Garamond', note: 'Elegant editorial headlines' },
      { role: 'body', fontName: 'Inter', note: 'Clean, highly readable body copy' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Data, labels, and system notes' },
    ],
    references: [
      {
        title: 'Minimal spa interior',
        category: 'Interior',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Soft product still life',
        category: 'Product',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Warm editorial portrait',
        category: 'Portrait',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Prioritize restraint over ornament.', type: 'instruction' },
      { text: 'Keep spacing generous and breathable.', type: 'idea' },
      { text: 'Use warm neutrals with one refined accent.', type: 'keyword' },
    ],
  },
  {
    id: 'fashion-editorial',
    name: 'Fashion Editorial',
    prompt: 'editorial campaign for a fashion drop',
    tags: ['fashion', 'editorial', 'bold'],
    mood: 'dramatic contrast',
    summary:
      'An expressive, high-fashion direction with sharp type, dramatic imagery, and confident spacing.',
    tone: ['refined', 'confident', 'graphic'],
    palette: [
      { label: 'Bone', hex: '#f2ede4', usage: 'Editorial background and gallery surfaces' },
      { label: 'Ink', hex: '#111827', usage: 'Text and deep contrast' },
      { label: 'Plum', hex: '#8b5cf6', usage: 'Fashion accent and highlight' },
      { label: 'Silver', hex: '#d5d8df', usage: 'Soft neutral support' },
    ],
    typography: [
      { role: 'heading', fontName: 'Playfair Display', note: 'High-contrast magazine headlines' },
      { role: 'body', fontName: 'DM Sans', note: 'Neutral copy with a modern feel' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Campaign details and labels' },
    ],
    references: [
      {
        title: 'Runway silhouette',
        category: 'Fashion',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Studio lighting setup',
        category: 'Editorial',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1485231183945-fffde7cc051e?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Texture and fabric close-up',
        category: 'Material',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Let negative space do more of the work.', type: 'instruction' },
      { text: 'Use a confident type scale with tight hierarchy.', type: 'idea' },
      { text: 'Balance grit with polish.', type: 'keyword' },
    ],
  },
  {
    id: 'fintech-product',
    name: 'Fintech Product',
    prompt: 'landing page vibe for a fintech app',
    tags: ['fintech', 'product', 'trust'],
    mood: 'confident clarity',
    summary:
      'A trustworthy product direction with clear hierarchy, modern blues, and crisp data-led visuals.',
    tone: ['clean', 'credible', 'structured'],
    palette: [
      { label: 'Slate', hex: '#2d3d62', usage: 'Primary brand color and headers' },
      { label: 'Mist', hex: '#d9e0ea', usage: 'Soft support surfaces and panels' },
      { label: 'Blue', hex: '#4f8cff', usage: 'Primary action and links' },
      { label: 'Mint', hex: '#9bf5d8', usage: 'Positive state and highlights' },
    ],
    typography: [
      { role: 'heading', fontName: 'Sora', note: 'Modern structured headlines' },
      { role: 'body', fontName: 'Inter', note: 'Clear product copy and UI text' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Data, metrics, and labels' },
    ],
    references: [
      {
        title: 'Product dashboard',
        category: 'UI',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Financial data detail',
        category: 'Data',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Make trust visible in every component.', type: 'instruction' },
      { text: 'Use structured spacing and calm contrast.', type: 'idea' },
      { text: 'Keep actions crisp and obvious.', type: 'keyword' },
    ],
  },
  {
    id: 'boutique-hotel',
    name: 'Boutique Hotel',
    prompt: 'brand direction for a boutique coastal hotel',
    tags: ['hospitality', 'travel', 'luxury'],
    mood: 'understated escape',
    summary:
      'A refined hospitality identity that pairs natural materials with quiet, sun-warmed luxury.',
    tone: ['warm', 'refined', 'inviting'],
    palette: [
      { label: 'Linen', hex: '#f4ede0', usage: 'Base surfaces and breathing room' },
      { label: 'Terracotta', hex: '#c2714e', usage: 'Warm accent and calls to action' },
      { label: 'Deep Teal', hex: '#2f5d62', usage: 'Grounding contrast and headers' },
      { label: 'Sand', hex: '#d8c7a8', usage: 'Secondary panels and texture' },
    ],
    typography: [
      { role: 'heading', fontName: 'Cormorant Garamond', note: 'Elegant, hospitable headlines' },
      { role: 'body', fontName: 'DM Sans', note: 'Warm, readable body copy' },
      { role: 'accent', fontName: 'Inter Tight', note: 'Wayfinding, labels, and details' },
    ],
    references: [
      {
        title: 'Sunlit lobby',
        category: 'Interior',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Coastal terrace',
        category: 'Architecture',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Linen and ceramic still life',
        category: 'Detail',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Let natural light lead the imagery.', type: 'instruction' },
      { text: 'Favor texture over gloss.', type: 'keyword' },
      { text: 'Evoke the calm of arrival.', type: 'idea' },
    ],
  },
  {
    id: 'developer-platform',
    name: 'Developer Platform',
    prompt: 'landing page for a developer infrastructure platform',
    tags: ['saas', 'developer', 'dark'],
    mood: 'precise and technical',
    summary:
      'A dark, engineered direction with monospace detailing, sharp grids, and signal-bright accents.',
    tone: ['technical', 'sharp', 'modern'],
    palette: [
      { label: 'Carbon', hex: '#0b0f17', usage: 'Primary dark background' },
      { label: 'Graphite', hex: '#1c2230', usage: 'Cards and elevated panels' },
      { label: 'Signal Green', hex: '#3ddc84', usage: 'Primary accent and status' },
      { label: 'Electric Blue', hex: '#5b8cff', usage: 'Links and interactive states' },
    ],
    typography: [
      { role: 'heading', fontName: 'Sora', note: 'Structured, modern headlines' },
      { role: 'body', fontName: 'Inter', note: 'Clear product and docs copy' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Code, metrics, and labels' },
    ],
    references: [
      {
        title: 'Terminal interface',
        category: 'UI',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Code editor close-up',
        category: 'Detail',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Network architecture diagram',
        category: 'Data',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Show real code, never lorem ipsum.', type: 'instruction' },
      { text: 'Density signals power.', type: 'keyword' },
      { text: 'Bright accents on deep neutrals.', type: 'idea' },
    ],
  },
  {
    id: 'specialty-coffee',
    name: 'Specialty Coffee',
    prompt: 'brand and packaging direction for a specialty coffee roaster',
    tags: ['hospitality', 'craft', 'warm'],
    mood: 'crafted warmth',
    summary:
      'An artisan roastery direction built on earthy tones, hand-made texture, and honest typography.',
    tone: ['crafted', 'warm', 'honest'],
    palette: [
      { label: 'Cream', hex: '#f1e7d6', usage: 'Packaging base and surfaces' },
      { label: 'Espresso', hex: '#3b2417', usage: 'Primary text and contrast' },
      { label: 'Roast', hex: '#9c5a33', usage: 'Warm brand accent' },
      { label: 'Moss', hex: '#6b7150', usage: 'Natural secondary accent' },
    ],
    typography: [
      { role: 'heading', fontName: 'Libre Baskerville', note: 'Honest, traditional headlines' },
      { role: 'body', fontName: 'DM Sans', note: 'Friendly, readable body copy' },
      { role: 'accent', fontName: 'Space Mono', note: 'Origin notes and lot numbers' },
    ],
    references: [
      {
        title: 'Pour-over ritual',
        category: 'Lifestyle',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Kraft packaging detail',
        category: 'Packaging',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Roastery interior',
        category: 'Interior',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Celebrate the craft and the origin.', type: 'idea' },
      { text: 'Texture should feel tactile.', type: 'keyword' },
      { text: 'Keep it honest, not precious.', type: 'instruction' },
    ],
  },
  {
    id: 'modern-architecture',
    name: 'Modern Architecture',
    prompt: 'portfolio direction for a modern architecture studio',
    tags: ['architecture', 'minimal', 'editorial'],
    mood: 'structured minimalism',
    summary:
      'A monochrome, grid-driven direction where whitespace, scale, and photography carry the brand.',
    tone: ['minimal', 'precise', 'editorial'],
    palette: [
      { label: 'Paper', hex: '#f5f5f3', usage: 'Gallery background and space' },
      { label: 'Concrete', hex: '#b8b8b4', usage: 'Neutral support tone' },
      { label: 'Graphite', hex: '#3a3a38', usage: 'Secondary text and lines' },
      { label: 'Onyx', hex: '#111110', usage: 'Primary text and contrast' },
    ],
    typography: [
      { role: 'heading', fontName: 'Inter Tight', note: 'Compact, architectural headlines' },
      { role: 'body', fontName: 'Inter', note: 'Quiet, precise body copy' },
      { role: 'accent', fontName: 'IBM Plex Mono', note: 'Captions, specs, and credits' },
    ],
    references: [
      {
        title: 'Concrete facade',
        category: 'Architecture',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Light study interior',
        category: 'Interior',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Structural detail',
        category: 'Detail',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Let the grid be visible.', type: 'instruction' },
      { text: 'Scale creates the drama.', type: 'idea' },
      { text: 'Restraint is the brand.', type: 'keyword' },
    ],
  },
  {
    id: 'streetwear-drop',
    name: 'Streetwear Drop',
    prompt: 'campaign direction for a limited streetwear drop',
    tags: ['streetwear', 'bold', 'urban'],
    mood: 'high-energy hype',
    summary:
      'A loud, urban direction with heavy type, high-contrast color, and motion-ready energy.',
    tone: ['bold', 'energetic', 'graphic'],
    palette: [
      { label: 'Asphalt', hex: '#161616', usage: 'Primary background and contrast' },
      { label: 'Hazard', hex: '#f2ff49', usage: 'High-energy primary accent' },
      { label: 'Concrete', hex: '#d6d6d6', usage: 'Neutral support' },
      { label: 'Flare', hex: '#ff5a3c', usage: 'Secondary accent and CTAs' },
    ],
    typography: [
      { role: 'heading', fontName: 'Sora', note: 'Heavy, attention-grabbing headlines' },
      { role: 'body', fontName: 'DM Sans', note: 'Clean counterpoint to loud type' },
      { role: 'accent', fontName: 'Space Mono', note: 'Drop dates and product codes' },
    ],
    references: [
      {
        title: 'Urban backdrop',
        category: 'Location',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Apparel flat lay',
        category: 'Product',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Crowd energy',
        category: 'Lifestyle',
        source: 'Unsplash',
        imageUrl:
          'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    notes: [
      { text: 'Type should feel loud.', type: 'keyword' },
      { text: 'Choose contrast over subtlety.', type: 'instruction' },
      { text: 'Built for motion and social.', type: 'idea' },
    ],
  },
];
