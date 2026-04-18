// Discipline-specific variants: 3D, Music, Video, Photography
const { Avatar, StatusChip, GmBadge, SkillChip, CoverPlaceholder } = window;

// Extended profile data for discipline variants (reuses base + adds specifics)
window.DISCIPLINE_DATA = {
  threeD: {
    assets: [
      { id: 'a1', name: 'Chrome_Seraph_v04.glb',  tris: '128k', size: '24.1 MB', tag: 'character', color: '#C4FF3D' },
      { id: 'a2', name: 'Null_Cathedral.usdz',    tris: '412k', size: '88.0 MB', tag: 'environ',   color: '#00E5A0' },
      { id: 'a3', name: 'Ritual_Mask_HiPoly.fbx', tris: '56k',  size: '12.3 MB', tag: 'prop',      color: '#FF3D5A' },
      { id: 'a4', name: 'Debris_Kit_01.blend',    tris: '203k', size: '41.7 MB', tag: 'kit',       color: '#B85CFF' },
      { id: 'a5', name: 'Liquid_Form_A.spz',      tris: '—',    size: '8.2 MB',  tag: 'splat',     color: '#5EC7FF' },
    ],
    software: ['Blender', 'Houdini', 'ZBrush', 'Substance', 'Octane', 'Three.js'],
    rigs: { polysShipped: '4.2M', renderHrs: '1,284', clients: 11 },
  },
  music: {
    tracks: [
      { id: 't1', title: 'Dead Signals (feat. vx)', bpm: 128, key: 'Fm',  len: '4:12', wave: 22, color: '#FF3D5A' },
      { id: 't2', title: 'Low-Band FM',              bpm: 92,  key: 'C',   len: '3:47', wave: 16, color: '#FFD93D' },
      { id: 't3', title: 'Null Lullaby',             bpm: 74,  key: 'Abm', len: '5:22', wave: 12, color: '#B85CFF' },
      { id: 't4', title: 'Cathedral (edit)',         bpm: 140, key: 'D',   len: '3:18', wave: 28, color: '#00E5A0' },
      { id: 't5', title: 'Ghost Layer',              bpm: 110, key: 'Em',  len: '4:58', wave: 20, color: '#5EC7FF' },
    ],
    gear: ['Ableton', 'OP-1', 'Moog Subharmonicon', 'Elektron Digitakt', 'SM7B'],
    stats: { plays: '184k', releases: 12, labels: 3 },
  },
  video: {
    reel: [
      { id: 'v1', title: 'DEAD SIGNALS — trailer', len: '1:12', tag: 'dir/edit',  color: '#FF3D5A' },
      { id: 'v2', title: 'HYUNDAI × NOVA spot',    len: '0:30', tag: 'commercial',color: '#5EC7FF' },
      { id: 'v3', title: 'Chakra — music video',   len: '3:47', tag: 'mv',        color: '#B85CFF' },
      { id: 'v4', title: 'Archive/002 — doc',      len: '7:18', tag: 'documentary',color: '#FFD93D' },
      { id: 'v5', title: 'Null Cathedral — loop',  len: '0:15', tag: 'mograph',   color: '#00E5A0' },
      { id: 'v6', title: 'Found Footage Vol.3',    len: '2:04', tag: 'experimental',color: '#FF7A1A' },
    ],
    gear: ['FX3', 'DJI Ronin 4D', 'Atomos Ninja', 'Premiere', 'After Effects', 'DaVinci'],
    stats: { minutes: '412', spots: 24, festivals: 6 },
  },
  photo: {
    frames: [
      { id: 'f1', cam: 'Leica Q2',        lens: '28mm f/1.7', iso: 400, shutter: '1/250', tag: 'street',    color: '#FF3D5A' },
      { id: 'f2', cam: 'Contax T2',       lens: '38mm f/2.8', iso: 800, shutter: '1/60',  tag: 'film',      color: '#FFD93D' },
      { id: 'f3', cam: 'Mamiya 7ii',      lens: '80mm f/4',   iso: 160, shutter: '1/125', tag: 'medium-fmt',color: '#00E5A0' },
      { id: 'f4', cam: 'Sony A7IV',       lens: '85mm f/1.4', iso: 200, shutter: '1/500', tag: 'portrait',  color: '#B85CFF' },
      { id: 'f5', cam: 'Ricoh GR IIIx',   lens: '40mm f/2.8', iso: 1600,shutter: '1/30',  tag: 'night',     color: '#5EC7FF' },
      { id: 'f6', cam: 'Hasselblad 500cm',lens: '80mm f/2.8', iso: 100, shutter: '1/250', tag: 'studio',    color: '#FF7A1A' },
      { id: 'f7', cam: 'Fuji X100V',      lens: '23mm f/2',   iso: 320, shutter: '1/180', tag: 'travel',    color: '#C4FF3D' },
      { id: 'f8', cam: 'Pentax 67',       lens: '105mm f/2.4',iso: 400, shutter: '1/60',  tag: 'fashion',   color: '#FF3D9A' },
    ],
    series: ['Angeleno Echoes', 'Wet Concrete', 'Strangers Smoking', 'After Midnight'],
    gear: ['Leica Q2', 'Contax T2', 'Mamiya 7ii', 'Portra 400', 'HC-110'],
  },
};

// ──────────────── Shared tiny header used by discipline variants ────────────────
function DiscHeader({ P, theme, accent, font, avatarShape, role, handle }) {
  return (
    <div style={{ padding: '6px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <Avatar size={60} style={avatarShape} accent={accent} theme={theme} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: font.display, fontSize: 28, lineHeight: 0.95,
          color: theme.fg, fontWeight: 400, letterSpacing: '-0.02em',
        }}>
          {P.name}
          {P.gm && <GmBadge accent={accent} />}
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: '0.15em', color: accent, textTransform: 'uppercase',
          marginTop: 4,
        }}>{role}</div>
        <div style={{ fontFamily: font.body, fontSize: 11, color: theme.muted, marginTop: 2 }}>
          {handle || P.handle} · {P.location}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 6 — 3D / ASSETS
// Grid of rotating wireframe cubes + asset file table
// ────────────────────────────────────────────────
function Variant3D({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const D = window.DISCIPLINE_DATA.threeD;
  const mono = '"JetBrains Mono", monospace';
  return (
    <div>
      <DiscHeader P={P} theme={theme} accent={accent} font={font} avatarShape={avatarShape} role="3D Artist / Technical" />

      {/* Viewport card */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          position: 'relative', aspectRatio: '16/11', borderRadius: 14, overflow: 'hidden',
          background: '#000', border: `0.5px solid ${theme.border}`,
        }}>
          {/* Grid floor */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(${accent}22 1px, transparent 1px),
              linear-gradient(90deg, ${accent}22 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
            transform: 'perspective(500px) rotateX(55deg) translateY(20%) scale(1.8)',
            transformOrigin: 'center',
            maskImage: 'linear-gradient(180deg, transparent 20%, black 60%, black 90%, transparent 100%)',
          }} />
          {/* Rotating wireframe cube */}
          <svg viewBox="-50 -50 100 100" style={{
            position: 'absolute', left: '50%', top: '44%', transform: 'translate(-50%, -50%)',
            width: '50%', height: '70%',
            animation: 'spin3d 18s linear infinite',
          }}>
            <defs>
              <linearGradient id="w" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <g stroke="url(#w)" strokeWidth="0.6" fill="none">
              {/* icosahedron-ish */}
              <polygon points="0,-30 26,-9 16,24 -16,24 -26,-9" />
              <polygon points="0,30 26,9 16,-24 -16,-24 -26,9" opacity="0.6" />
              <line x1="0" y1="-30" x2="0" y2="30" />
              <line x1="26" y1="-9" x2="-26" y2="9" />
              <line x1="-26" y1="-9" x2="26" y2="9" />
              <line x1="16" y1="24" x2="-16" y2="-24" />
              <line x1="-16" y1="24" x2="16" y2="-24" />
            </g>
            <circle cx="0" cy="0" r="2" fill={accent} />
          </svg>
          {/* HUD corners */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            fontFamily: mono, fontSize: 9, color: accent, letterSpacing: '0.15em',
          }}>● VIEWPORT · PERSP · 60mm</div>
          <div style={{
            position: 'absolute', top: 10, right: 10,
            fontFamily: mono, fontSize: 9, color: '#fff', opacity: 0.6, letterSpacing: '0.15em',
          }}>24.0 FPS</div>
          <div style={{
            position: 'absolute', bottom: 10, left: 10, right: 10,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: mono, fontSize: 9, color: '#fff', opacity: 0.55, letterSpacing: '0.12em',
          }}>
            <span>x: 0.00  y: 0.00  z: 0.00</span>
            <span>TRIS 412K</span>
          </div>
        </div>

        {/* Rig stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12,
        }}>
          {[
            { k: 'POLYS SHIPPED', v: D.rigs.polysShipped },
            { k: 'RENDER HRS',    v: D.rigs.renderHrs },
            { k: 'CLIENTS',       v: D.rigs.clients },
          ].map(s => (
            <div key={s.k} style={{
              padding: 10, borderRadius: 8,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
            }}>
              <div style={{ fontFamily: font.display, fontSize: 22, color: theme.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em', marginTop: 4 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset library table */}
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase' }}>
            ASSET LIBRARY / {D.assets.length}
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.15em' }}>
            sort: recent ↓
          </div>
        </div>
        <div style={{ border: `0.5px solid ${theme.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {D.assets.map((a, i) => (
            <div key={a.id} onClick={() => onTapWork({ title: a.name, tag: a.tag, year: '2026', color: a.color, color2: '#0a0a0e' })} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto',
              padding: '12px', alignItems: 'center', gap: 10,
              borderBottom: i < D.assets.length - 1 ? `0.5px solid ${theme.border}` : 'none',
              cursor: 'pointer', background: theme.cardBg,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, position: 'relative',
                background: `linear-gradient(135deg, ${a.color}, ${a.color}33)`,
                border: `0.5px solid ${a.color}`,
                overflow: 'hidden',
              }}>
                <svg viewBox="0 0 32 32" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <polygon points="16,4 28,12 28,22 16,28 4,22 4,12" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.9" />
                  <line x1="16" y1="4" x2="16" y2="28" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
                  <line x1="4" y1="12" x2="28" y2="22" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
                  <line x1="28" y1="12" x2="4" y2="22" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: mono, fontSize: 12, color: theme.fg,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{a.name}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.1em', marginTop: 2 }}>
                  {a.tag.toUpperCase()} · {a.tris} tris · {a.size}
                </div>
              </div>
              <div style={{ color: accent, fontSize: 14 }}>↓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Software chips */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          PIPELINE
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {D.software.map(s => <SkillChip key={s} theme={theme} accent={accent} variant="outline">{s}</SkillChip>)}
        </div>
      </div>

      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.55, color: theme.fg, opacity: 0.85 }}>
          {P.about}
        </div>
      </div>

      <div style={{ height: 140 }} />
      <style>{`@keyframes spin3d { to { transform: translate(-50%, -50%) rotateY(360deg); } }`}</style>
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 7 — MUSIC
// Now-playing card + track list with waveforms
// ────────────────────────────────────────────────
function VariantMusic({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const D = window.DISCIPLINE_DATA.music;
  const mono = '"JetBrains Mono", monospace';
  const [playing, setPlaying] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const cur = D.tracks[playing];

  return (
    <div>
      <DiscHeader P={P} theme={theme} accent={accent} font={font} avatarShape={avatarShape} role="Producer / Sound" />

      {/* Now playing */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
          background: `linear-gradient(135deg, ${cur.color}22, #0a0a0e 60%)`,
          padding: 16,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0 20px, ${cur.color}08 20px 21px)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 84, height: 84, borderRadius: 10, overflow: 'hidden',
              border: `0.5px solid ${theme.border}`,
              flexShrink: 0,
            }}>
              <CoverPlaceholder seed={playing + 60} color={cur.color} color2="#0a0a0e" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>
                ♫ NOW PLAYING
              </div>
              <div style={{
                fontFamily: font.display, fontSize: 22, color: theme.fg,
                fontWeight: 400, letterSpacing: '-0.02em', marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{cur.title}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: theme.muted, letterSpacing: '0.1em', marginTop: 4 }}>
                {cur.bpm} BPM · KEY {cur.key} · {cur.len}
              </div>
            </div>
          </div>

          {/* Waveform */}
          <div style={{ position: 'relative', marginTop: 14, display: 'flex', gap: 2, alignItems: 'center', height: 44 }}>
            {Array.from({ length: 52 }).map((_, i) => {
              const h = Math.abs(Math.sin(i * 0.8 + playing) * Math.cos(i * 0.3)) * 36 + 4;
              const active = i < 18;
              return (
                <div key={i} style={{
                  flex: 1, height: h, borderRadius: 1,
                  background: active ? cur.color : theme.border,
                  opacity: active ? 1 : 0.6,
                }} />
              );
            })}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 6,
            fontFamily: mono, fontSize: 9, color: theme.muted,
          }}>
            <span>1:24</span><span>-{cur.len}</span>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 10,
          }}>
            <button onClick={() => setPlaying((playing - 1 + D.tracks.length) % D.tracks.length)} style={musicBtn(theme)}>⏮</button>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{
              ...musicBtn(theme), background: accent, color: '#000',
              width: 48, height: 48, fontSize: 18,
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={() => setPlaying((playing + 1) % D.tracks.length)} style={musicBtn(theme)}>⏭</button>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          RELEASES / {D.tracks.length}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {D.tracks.map((t, i) => (
            <div key={t.id} onClick={() => { setPlaying(i); setIsPlaying(true); onTapWork({ title: t.title, tag: 'track', year: '2026', color: t.color, color2: '#0a0a0e' }); }} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr 60px 40px',
              padding: '10px 12px', alignItems: 'center', gap: 10,
              borderRadius: 8, cursor: 'pointer',
              background: i === playing ? theme.cardBg : 'transparent',
              border: i === playing ? `0.5px solid ${theme.border}` : '0.5px solid transparent',
            }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: i === playing ? accent : theme.muted }}>
                {i === playing && isPlaying ? '▶' : String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: font.body, fontSize: 13, color: theme.fg, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{t.title}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.1em', marginTop: 2 }}>
                  {t.bpm}BPM · {t.key}
                </div>
              </div>
              {/* mini waveform */}
              <div style={{ display: 'flex', gap: 1.5, alignItems: 'center', height: 18 }}>
                {Array.from({ length: 14 }).map((_, j) => (
                  <div key={j} style={{
                    flex: 1,
                    height: Math.abs(Math.sin(j * 0.9 + i)) * 14 + 3,
                    background: i === playing ? t.color : theme.border,
                    borderRadius: 0.5,
                  }} />
                ))}
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: theme.muted, textAlign: 'right' }}>{t.len}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {[
            { k: 'PLAYS',     v: D.stats.plays },
            { k: 'RELEASES',  v: D.stats.releases },
            { k: 'LABELS',    v: D.stats.labels },
          ].map(s => (
            <div key={s.k} style={{
              padding: 10, borderRadius: 8,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: font.display, fontSize: 22, color: theme.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em', marginTop: 4 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gear */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          SIGNAL CHAIN
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {D.gear.map(g => <SkillChip key={g} theme={theme} accent={accent} variant="outline">{g}</SkillChip>)}
        </div>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}
function musicBtn(theme) {
  return {
    width: 38, height: 38, borderRadius: 999,
    background: theme.cardBg, border: `0.5px solid ${theme.border}`,
    color: theme.fg, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

// ────────────────────────────────────────────────
// Variant 8 — VIDEOGRAPHY / REEL
// Cinematic reel player + cinemascope thumbnail list
// ────────────────────────────────────────────────
function VariantVideo({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const D = window.DISCIPLINE_DATA.video;
  const mono = '"JetBrains Mono", monospace';
  const [active, setActive] = React.useState(0);
  const cur = D.reel[active];

  return (
    <div>
      <DiscHeader P={P} theme={theme} accent={accent} font={font} avatarShape={avatarShape} role="Director / Editor" />

      {/* Cinemascope player */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          position: 'relative', aspectRatio: '2.39/1', borderRadius: 10, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`, background: '#000',
        }}>
          <CoverPlaceholder seed={active + 80} color={cur.color} color2="#000" />
          {/* cinemascope bars */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)' }} />
          {/* play button */}
          <button style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 54, height: 54, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: `1px solid ${accent}`, color: accent, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, paddingLeft: 3,
          }}>▶</button>
          {/* HUD */}
          <div style={{
            position: 'absolute', top: 8, left: 10, right: 10,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: mono, fontSize: 8, color: '#fff', opacity: 0.75, letterSpacing: '0.15em',
          }}>
            <span>● REC · {cur.tag.toUpperCase()}</span>
            <span>2.39:1 · 24p</span>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, left: 12, right: 12,
            color: '#fff',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'flex-end',
              fontFamily: mono, fontSize: 9, opacity: 0.6, marginBottom: 4,
            }}>TC 00:{active * 14 + 12}:18</div>
            <div style={{
              fontFamily: font.display, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1.05,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{cur.title}</div>
            <div style={{ fontFamily: mono, fontSize: 9, opacity: 0.7, letterSpacing: '0.15em', marginTop: 3 }}>
              0{active + 1} / 0{D.reel.length} · {cur.len}
            </div>
          </div>
        </div>

        {/* Scrubber */}
        <div style={{
          marginTop: 10, height: 3, borderRadius: 2,
          background: theme.border, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '34%', background: accent }} />
        </div>
      </div>

      {/* Reel thumbs */}
      <div style={{ padding: '20px 0 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '0 16px', marginBottom: 10,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            REEL · 24—26
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>all →</div>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
          {D.reel.map((r, i) => (
            <div key={r.id} onClick={() => setActive(i)} style={{
              flex: '0 0 auto', width: 200, scrollSnapAlign: 'start', cursor: 'pointer',
              opacity: i === active ? 1 : 0.55, transition: 'opacity 0.2s',
            }}>
              <div style={{
                aspectRatio: '2.39/1', borderRadius: 6, overflow: 'hidden', position: 'relative',
                border: i === active ? `1px solid ${accent}` : `0.5px solid ${theme.border}`,
              }}>
                <CoverPlaceholder seed={i + 90} color={r.color} color2="#000" />
                <div style={{
                  position: 'absolute', bottom: 4, right: 6,
                  fontFamily: mono, fontSize: 9, color: '#fff',
                  background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: 2,
                }}>{r.len}</div>
              </div>
              <div style={{
                fontFamily: font.body, fontSize: 12, color: theme.fg,
                marginTop: 6, fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{r.title}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.1em', marginTop: 2, textTransform: 'uppercase' }}>
                {r.tag}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { k: 'MINUTES CUT', v: D.stats.minutes },
            { k: 'SPOTS',       v: D.stats.spots },
            { k: 'FESTIVALS',   v: D.stats.festivals },
          ].map(s => (
            <div key={s.k} style={{
              padding: 10, borderRadius: 8,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: font.display, fontSize: 22, color: theme.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em', marginTop: 4 }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gear */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          KIT
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {D.gear.map(g => <SkillChip key={g} theme={theme} accent={accent} variant="outline">{g}</SkillChip>)}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.55, color: theme.fg, opacity: 0.85 }}>
          {P.about}
        </div>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 9 — PHOTOGRAPHY
// Contact sheet grid + EXIF detail strip
// ────────────────────────────────────────────────
function VariantPhoto({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const D = window.DISCIPLINE_DATA.photo;
  const mono = '"JetBrains Mono", monospace';
  const [sel, setSel] = React.useState(0);
  const cur = D.frames[sel];

  return (
    <div>
      <DiscHeader P={P} theme={theme} accent={accent} font={font} avatarShape={avatarShape} role="Photographer" />

      {/* Featured photo */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          aspectRatio: '3/4', borderRadius: 4, overflow: 'hidden', position: 'relative',
          border: `0.5px solid ${theme.border}`,
        }}>
          <CoverPlaceholder seed={sel + 200} color={cur.color} color2="#0a0a0e" />
          {/* EXIF stripe */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '10px 12px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7), transparent)',
            display: 'flex', justifyContent: 'space-between',
            fontFamily: mono, fontSize: 9, color: '#fff', letterSpacing: '0.12em',
          }}>
            <span>● {cur.cam.toUpperCase()}</span>
            <span>{String(sel + 1).padStart(3, '0')}/{String(D.frames.length).padStart(3, '0')}</span>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '14px 12px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)',
            color: '#fff',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', opacity: 0.85,
            }}>
              <span>{cur.lens}</span>
              <span>ISO {cur.iso}</span>
              <span>{cur.shutter}s</span>
            </div>
            <div style={{
              fontFamily: font.display, fontSize: 18,
              letterSpacing: '-0.01em', marginTop: 6, fontStyle: 'italic',
            }}>
              {cur.tag} · frame {sel + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Contact sheet */}
      <div style={{ padding: '18px 16px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase' }}>
            CONTACT SHEET
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.15em' }}>
            ROLL #{String(D.frames.length).padStart(3,'0')}
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
          padding: 6, background: theme.cardBg, borderRadius: 4,
          border: `0.5px solid ${theme.border}`,
        }}>
          {D.frames.map((f, i) => (
            <div key={f.id} onClick={() => setSel(i)} style={{
              position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden',
              cursor: 'pointer',
              outline: i === sel ? `2px solid ${accent}` : 'none',
              outlineOffset: 1,
            }}>
              <CoverPlaceholder seed={i + 200} color={f.color} color2="#0a0a0e" />
              <div style={{
                position: 'absolute', top: 2, left: 3,
                fontFamily: mono, fontSize: 8, color: '#fff',
                textShadow: '0 1px 1px rgba(0,0,0,0.8)',
              }}>{String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Series list */}
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          SERIES
        </div>
        <div style={{
          borderRadius: 10, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
        }}>
          {D.series.map((s, i) => (
            <div key={s} onClick={() => onTapWork({ title: s, tag: 'series', year: '2025', color: D.frames[i % D.frames.length].color, color2: '#0a0a0e' })} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px',
              borderBottom: i < D.series.length - 1 ? `0.5px solid ${theme.border}` : 'none',
              background: theme.cardBg, cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontFamily: font.display, fontSize: 19, color: theme.fg, letterSpacing: '-0.01em', fontStyle: 'italic' }}>
                  {s}
                </div>
                <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, letterSpacing: '0.15em', marginTop: 2 }}>
                  {12 + i * 4} FRAMES · 202{5 - (i % 2)}
                </div>
              </div>
              <div style={{ color: theme.muted, fontSize: 14 }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gear */}
      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.25em', color: accent, textTransform: 'uppercase', marginBottom: 10 }}>
          BAG
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {D.gear.map(g => <SkillChip key={g} theme={theme} accent={accent} variant="outline">{g}</SkillChip>)}
        </div>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}

Object.assign(window, {
  Variant3D, VariantMusic, VariantVideo, VariantPhoto,
});
