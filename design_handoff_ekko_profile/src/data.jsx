// Profile data — original content, not tied to any real user
const PROFILE = {
  name: "NOVA.WRLD",
  handle: "@novawrld",
  role: "Creative Technologist",
  location: "Brooklyn, NY",
  status: "active", // active | paused | focusing
  gm: true,
  about: "Building strange interfaces at the edge of web & ritual. Currently obsessed with spatial audio, generative type, and the aesthetics of decay.",
  lookingFor: ["Collab on mixed-reality zine", "Type designer friends", "Sound artists"],
  currentProject: "Dead Signals — a multiplayer radio for lost transmissions",
  skills: ["Creative Code", "Three.js", "Type Design", "Motion", "Sound", "Brand"],
  stats: { matches: 142, likes: 2847, projects: 17, followers: "3.4k" },
  socials: [
    { label: "Site", handle: "novawrld.xyz" },
    { label: "IG", handle: "@novawrld" },
    { label: "Are.na", handle: "nova-wrld" },
  ],
  portfolio: [
    { id: "p1", title: "DEAD SIGNALS", year: "2026", tag: "interactive", color: "#FF3D5A", color2: "#1a0000" },
    { id: "p2", title: "NULL CATHEDRAL", year: "2025", tag: "3d / web", color: "#00E5A0", color2: "#001a12" },
    { id: "p3", title: "FORM / RITE", year: "2025", tag: "type", color: "#FFD93D", color2: "#1a1500" },
    { id: "p4", title: "OBSOLETE/2001", year: "2024", tag: "zine", color: "#B85CFF", color2: "#0e001a" },
    { id: "p5", title: "LOW-BAND FM", year: "2024", tag: "sound", color: "#FF7A1A", color2: "#1a0a00" },
    { id: "p6", title: "GHOST LAYER", year: "2024", tag: "filter", color: "#5EC7FF", color2: "#001420" },
  ],
};

window.PROFILE = PROFILE;

// Japanese furigana / katakana renderings for anime flavor
window.JP = {
  name: "ノヴァ・ワールド",     // NOVA WORLD katakana
  role: "創造技術者",            // creative technologist
  location: "ブルックリン",      // brooklyn
  nowPlaying: "再生中",
  profile: "プロフィール",
  work: "作品集",
  discover: "探索",
  likes: "好き",
  matches: "縁",
  reel: "映像",
  music: "音楽",
  photo: "写真",
  threeD: "三次元",
  lookingFor: "募集中",
  about: "自己紹介",
};

// Reusable SVG placeholder "cover art" — striped, monochrome-tinted, with mono label
window.CoverPlaceholder = function CoverPlaceholder({ color, color2, label, sublabel, style = {}, seed = 1, anime = true }) {
  // Deterministic pseudo-random bits seeded from id
  const r = (n) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2);
  const sparkles = Array.from({ length: 14 }, (_, i) => ({
    x: r(i) * 100,
    y: r(i + 50) * 100,
    s: r(i + 100) * 1.4 + 0.4,
    rot: r(i + 200) * 360,
  }));
  // speed lines (manga)
  const speedLines = Array.from({ length: 22 }, (_, i) => ({
    y: (i / 22) * 100 + r(i) * 4,
    w: r(i + 300) * 30 + 10,
  }));
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: `radial-gradient(ellipse at 30% 40%, ${color}55 0%, ${color2} 50%, #000 100%)`,
      overflow: 'hidden',
      ...style,
    }}>
      {/* halftone dots — classic manga screen tone */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${color}40 1.2px, transparent 1.5px)`,
        backgroundSize: '5px 5px',
        mixBlendMode: 'screen',
        opacity: 0.55,
      }} />
      {/* diagonal speed lines */}
      {anime && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          mixBlendMode: 'screen', opacity: 0.35,
        }}>
          {speedLines.map((s, i) => (
            <line key={i} x1={100 - s.w} y1={s.y} x2="100" y2={s.y + 2}
              stroke={color} strokeWidth="0.3" />
          ))}
        </svg>
      )}
      {/* subject silhouette — abstract anime figure */}
      {anime && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0.55,
        }}>
          {/* wing/aura spikes */}
          <g fill="none" stroke={color} strokeWidth="0.4" opacity="0.7">
            {[...Array(10)].map((_, i) => (
              <path key={i} d={`M 50 ${30 + i * 1.5} L ${20 + r(i)*10} ${10 + i*3} M 50 ${30 + i * 1.5} L ${80 - r(i+1)*10} ${10 + i*3}`} />
            ))}
          </g>
          {/* silhouette — hair + shoulders */}
          <path d={`M 36 55 Q 32 40 42 30 Q 50 22 58 30 Q 68 40 64 55 Q 70 62 68 80 L 32 80 Q 30 62 36 55 Z`}
            fill={color2} stroke={color} strokeWidth="0.3" opacity="0.85" />
          {/* eye glow */}
          <circle cx="44" cy="42" r="1.4" fill={color} />
          <circle cx="56" cy="42" r="1.4" fill={color} />
        </svg>
      )}
      {/* shoujo sparkles */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {sparkles.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y}) scale(${s.s}) rotate(${s.rot})`}>
            <path d="M0,-3 L0.6,-0.6 L3,0 L0.6,0.6 L0,3 L-0.6,0.6 L-3,0 L-0.6,-0.6 Z" fill="#fff" opacity={0.85} />
            <circle r="0.4" fill={color} />
          </g>
        ))}
      </svg>
      {/* mono label */}
      {label && (
        <div style={{
          position: 'absolute', left: 14, bottom: 12, right: 14,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: '0.12em', color, opacity: 0.95,
          textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          textShadow: `0 1px 0 ${color2}`,
        }}>
          <span>{label}</span>
          {sublabel && <span style={{ opacity: 0.6 }}>{sublabel}</span>}
        </div>
      )}
      {/* corner crosshair */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        width: 14, height: 14, opacity: 0.6,
      }}>
        <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 1, background: color }} />
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 1, background: color }} />
      </div>
    </div>
  );
};
