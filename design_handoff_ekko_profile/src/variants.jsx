// 5 profile layout variants. Each receives: { theme, accent, avatarShape, coverStyle, font, editing, setProfile, profile, onTapWork }

const { Avatar, StatusChip, GmBadge, SkillChip, EditableText, CoverPlaceholder } = window;

// ────────────────────────────────────────────────
// Variant 1 — HERO-FORWARD
// Big full-bleed cover with parallax; name overlays bottom; work in horizontal rail below
// ────────────────────────────────────────────────
function VariantHero({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork, scrollY = 0 }) {
  const P = profile;
  const coverH = 440;
  const coverTransform = `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0008})`;
  return (
    <div>
      {/* Hero cover */}
      <div style={{
        position: 'relative', height: coverH, overflow: 'hidden',
        margin: coverStyle === 'card' ? '0 16px' : 0,
        borderRadius: coverStyle === 'card' ? 24 : 0,
      }}>
        <div style={{ position: 'absolute', inset: 0, transform: coverTransform, transformOrigin: 'center bottom' }}>
          <CoverPlaceholder
            seed={9}
            color={accent}
            color2="#0a0a0e"
            label="DEAD/INTERNET/ARCHIVE"
            sublabel="vol.03"
          />
        </div>
        {/* dark gradient at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }} />
        {/* overlay name */}
        <div style={{
          position: 'absolute', left: 20, right: 20, bottom: 24,
          color: '#fff',
        }}>
          <div style={{
            fontFamily: '"Noto Sans JP", system-ui',
            fontSize: 10, letterSpacing: '0.25em', color: accent,
            marginBottom: 6, opacity: 0.95,
          }}>✦ {window.JP?.name || 'ノヴァ・ワールド'} ✦</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.2em', opacity: 0.7,
            marginBottom: 8,
          }}>⌘ {P.handle} · {P.location}</div>
          <div style={{
            fontFamily: font.display, fontSize: 56, lineHeight: 0.88,
            fontWeight: 400, letterSpacing: '-0.03em',
            textShadow: `0 2px 24px ${accent}66, 0 2px 24px rgba(0,0,0,0.6)`,
          }}>
            {P.name}
            {P.gm && <GmBadge accent={accent} />}
          </div>
          <div style={{
            marginTop: 10, fontFamily: font.body, fontSize: 14,
            opacity: 0.85, letterSpacing: '0.02em',
          }}>{P.role} <span style={{ fontFamily: '"Noto Sans JP", system-ui', opacity: 0.7, marginLeft: 6 }}>/ {window.JP?.role || '創造技術者'}</span></div>
        </div>
        {/* Avatar floating bottom-left */}
        <div style={{ position: 'absolute', left: 16, bottom: -34 }}>
          <Avatar size={74} style={avatarShape} accent={accent} theme={theme} />
        </div>
      </div>

      {/* About */}
      <div style={{ padding: '52px 20px 12px' }}>
        <EditableText
          editing={editing}
          value={P.about}
          style={{
            fontFamily: font.body, fontSize: 15, lineHeight: 1.55,
            color: theme.fg, letterSpacing: '0.005em',
          }}
        />
      </div>

      {/* Skills */}
      <div style={{ padding: '8px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {P.skills.map(s => <SkillChip key={s} theme={theme} accent={accent}>{s}</SkillChip>)}
      </div>

      {/* Stats row */}
      <StatsRow P={P} theme={theme} accent={accent} font={font} />

      {/* Work rail — horizontal */}
      <SectionHeader label="WORK / 06" theme={theme} accent={accent} font={font} />
      <div style={{
        display: 'flex', gap: 10, padding: '0 20px 4px',
        overflowX: 'auto', scrollSnapType: 'x mandatory',
      }}>
        {P.portfolio.map((w, i) => (
          <div key={w.id} onClick={() => onTapWork(w)} style={{
            flex: '0 0 auto', width: 180, cursor: 'pointer',
            scrollSnapAlign: 'start',
          }}>
            <div style={{
              width: 180, height: 220, borderRadius: 14, overflow: 'hidden',
              border: `0.5px solid ${theme.border}`,
            }}>
              <CoverPlaceholder seed={i + 1} color={w.color} color2={w.color2} label={w.title} sublabel={w.year} />
            </div>
            <div style={{
              fontFamily: font.body, fontSize: 12, color: theme.muted,
              marginTop: 6, letterSpacing: '0.04em',
            }}>{w.tag.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <LookingForBlock P={P} theme={theme} accent={accent} font={font} />
      <SocialsBlock P={P} theme={theme} accent={accent} font={font} />

      <div style={{ height: 120 }} />
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 2 — EDITORIAL GRID
// Magazine-style: small cover card, massive serif name, work as 2-col grid
// ────────────────────────────────────────────────
function VariantEditorial({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  return (
    <div style={{ padding: '0 18px' }}>
      {/* Masthead */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 0 14px', borderBottom: `0.5px solid ${theme.border}`,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.15em', color: theme.muted, textTransform: 'uppercase',
      }}>
        <span>EKKO / ISSUE 047</span>
        <span>◆ APR 26</span>
      </div>

      {/* name block */}
      <div style={{ padding: '28px 0 20px' }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
          letterSpacing: '0.2em', color: accent, marginBottom: 10,
        }}>FEATURE / PROFILE №{String(P.stats.projects).padStart(3, '0')}</div>
        <div style={{
          fontFamily: font.display, fontSize: 74, lineHeight: 0.85,
          color: theme.fg, letterSpacing: '-0.04em', fontWeight: 400,
          textWrap: 'pretty',
        }}>
          {P.name.replace('.WRLD', '.')}
          <span style={{ fontStyle: 'italic', opacity: 0.6 }}>wrld</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginTop: 14, gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.body, fontSize: 14, color: theme.fg, fontStyle: 'italic' }}>{P.role}</div>
            <div style={{ fontFamily: font.body, fontSize: 13, color: theme.muted, marginTop: 2 }}>📍 {P.location}</div>
          </div>
          <Avatar size={60} style={avatarShape} accent={accent} theme={theme} />
        </div>
      </div>

      {/* Drop-cap about */}
      <div style={{
        padding: '18px 0', borderTop: `0.5px solid ${theme.border}`,
        borderBottom: `0.5px solid ${theme.border}`,
      }}>
        <p style={{
          fontFamily: font.body, fontSize: 15, lineHeight: 1.55,
          color: theme.fg, margin: 0, textWrap: 'pretty',
        }}>
          <span style={{
            fontFamily: font.display, fontSize: 58, lineHeight: 0.8,
            float: 'left', marginRight: 8, marginTop: 4, marginBottom: -4,
            color: accent, fontWeight: 400,
          }}>{P.about.charAt(0)}</span>
          {P.about.slice(1)}
        </p>
      </div>

      {/* Skills as index */}
      <div style={{ padding: '18px 0 4px' }}>
        <SectionLabel theme={theme} accent={accent}>INDEX / DISCIPLINES</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {P.skills.map((s, i) => (
            <span key={s} style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              color: theme.fg, letterSpacing: '0.04em',
              padding: '2px 0',
            }}>
              {String(i + 1).padStart(2, '0')} · {s}{i < P.skills.length - 1 ? '   ' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Work 2-col grid */}
      <div style={{ padding: '18px 0 8px' }}>
        <SectionLabel theme={theme} accent={accent}>SELECTED WORK</SectionLabel>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12,
        }}>
          {P.portfolio.map((w, i) => (
            <div key={w.id} onClick={() => onTapWork(w)} style={{ cursor: 'pointer' }}>
              <div style={{
                aspectRatio: '1', borderRadius: 4, overflow: 'hidden',
                border: `0.5px solid ${theme.border}`,
              }}>
                <CoverPlaceholder seed={i + 11} color={w.color} color2={w.color2} label={w.title} sublabel={w.year} />
              </div>
              <div style={{
                marginTop: 6, display: 'flex', justifyContent: 'space-between',
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                letterSpacing: '0.1em', color: theme.muted, textTransform: 'uppercase',
              }}>
                <span>№ {String(i + 1).padStart(2, '0')}</span>
                <span>{w.tag}</span>
              </div>
              <div style={{
                fontFamily: font.body, fontSize: 13, color: theme.fg,
                marginTop: 2, fontWeight: 500,
              }}>{w.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats + looking for footer */}
      <div style={{ padding: '18px 0', borderTop: `0.5px solid ${theme.border}`, marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Object.entries(P.stats).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: font.display, fontSize: 22, color: theme.fg, letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: theme.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: -2 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
      <LookingForBlock P={P} theme={theme} accent={accent} font={font} noPadding />
      <SocialsBlock P={P} theme={theme} accent={accent} font={font} noPadding />
      <div style={{ height: 120 }} />
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 3 — SPLIT (left rail avatar + right content)
// ────────────────────────────────────────────────
function VariantSplit({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  return (
    <div>
      {/* Top: full-width cover but shorter */}
      <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
        <CoverPlaceholder seed={7} color={accent} color2="#0a0a0e" label="SIGNAL.01" sublabel="live" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
      </div>

      {/* Split body */}
      <div style={{ display: 'flex', padding: '16px 16px 0', gap: 14, marginTop: -44, position: 'relative', zIndex: 2 }}>
        {/* Left rail */}
        <div style={{ width: 86, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Avatar size={86} style={avatarShape} accent={accent} theme={theme} />
          <div style={{
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.3em', color: theme.muted, textTransform: 'uppercase',
            marginTop: 8,
          }}>{P.handle}</div>
          <div style={{
            padding: '6px 0',
            fontFamily: font.display, fontSize: 32, color: accent,
            lineHeight: 0.9, fontWeight: 400, writingMode: 'vertical-rl',
            transform: 'rotate(180deg)', letterSpacing: '-0.02em',
          }}>{P.stats.projects} works</div>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, paddingTop: 40, minWidth: 0 }}>
          <div style={{
            fontFamily: font.display, fontSize: 42, lineHeight: 0.9,
            color: theme.fg, fontWeight: 400, letterSpacing: '-0.03em',
          }}>
            {P.name}
            {P.gm && <GmBadge accent={accent} />}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 13, color: theme.muted, marginTop: 6 }}>
            {P.role} · {P.location}
          </div>

          <div style={{
            marginTop: 18, padding: 14, borderRadius: 12,
            background: theme.cardBg, border: `0.5px solid ${theme.border}`,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
              letterSpacing: '0.2em', color: accent, textTransform: 'uppercase', marginBottom: 6,
            }}>NOW →</div>
            <div style={{ fontFamily: font.body, fontSize: 13, color: theme.fg, lineHeight: 1.45 }}>
              {P.currentProject}
            </div>
          </div>

          <div style={{
            marginTop: 14, fontFamily: font.body, fontSize: 13, lineHeight: 1.55,
            color: theme.fg,
          }}>{P.about}</div>

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {P.skills.map(s => <SkillChip key={s} theme={theme} accent={accent} variant="outline">{s}</SkillChip>)}
          </div>
        </div>
      </div>

      {/* Full-width work strip */}
      <div style={{ marginTop: 24 }}>
        <SectionHeader label="PORTFOLIO / ALL" theme={theme} accent={accent} font={font} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, padding: '0 2px' }}>
          {P.portfolio.map((w, i) => (
            <div key={w.id} onClick={() => onTapWork(w)} style={{
              aspectRatio: '1', position: 'relative', overflow: 'hidden', cursor: 'pointer',
            }}>
              <CoverPlaceholder seed={i + 21} color={w.color} color2={w.color2} label={w.title} />
              <div style={{
                position: 'absolute', top: 6, left: 6,
                fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
                color: w.color, letterSpacing: '0.15em',
              }}>0{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      <StatsRow P={P} theme={theme} accent={accent} font={font} />
      <LookingForBlock P={P} theme={theme} accent={accent} font={font} />
      <SocialsBlock P={P} theme={theme} accent={accent} font={font} />
      <div style={{ height: 120 }} />
    </div>
  );
}

// ────────────────────────────────────────────────
// Variant 4 — CARD STACK (swipeable work deck)
// ────────────────────────────────────────────────
function VariantStack({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const [idx, setIdx] = React.useState(0);
  const curr = P.portfolio[idx];
  const next = P.portfolio[(idx + 1) % P.portfolio.length];
  const next2 = P.portfolio[(idx + 2) % P.portfolio.length];
  return (
    <div>
      {/* Header — compact */}
      <div style={{ padding: '8px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar size={64} style={avatarShape} accent={accent} theme={theme} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: font.display, fontSize: 30, lineHeight: 0.95,
            color: theme.fg, fontWeight: 400, letterSpacing: '-0.02em',
          }}>
            {P.name}
            {P.gm && <GmBadge accent={accent} />}
          </div>
          <div style={{ fontFamily: font.body, fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {P.role} · {P.location}
          </div>
        </div>
      </div>

      {/* About — compact */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.5, color: theme.fg, opacity: 0.85 }}>
          {P.about}
        </div>
      </div>

      {/* Card stack */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 10,
        }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.2em', color: accent }}>
            WORK / {String(idx + 1).padStart(2,'0')} OF {String(P.portfolio.length).padStart(2,'0')}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {P.portfolio.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 14 : 4, height: 4, borderRadius: 2,
                background: i === idx ? accent : theme.border,
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: 380, perspective: 1000 }}>
          {/* Stack layers */}
          {[next2, next, curr].map((w, layer) => {
            const depth = 2 - layer; // 0 = front
            return (
              <div key={w.id + layer} style={{
                position: 'absolute', inset: 0,
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.04})`,
                opacity: 1 - depth * 0.3,
                zIndex: 10 - depth,
                borderRadius: 18, overflow: 'hidden',
                border: `0.5px solid ${theme.border}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                transition: 'all 0.4s cubic-bezier(.2,.8,.2,1)',
              }}>
                <CoverPlaceholder seed={P.portfolio.indexOf(w) + 30} color={w.color} color2={w.color2} label={w.title} sublabel={w.year} />
                {depth === 0 && (
                  <div style={{
                    position: 'absolute', left: 18, right: 18, bottom: 18,
                    color: '#fff',
                  }}>
                    <div style={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                      letterSpacing: '0.15em', color: w.color, textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>{w.tag} · {w.year}</div>
                    <div style={{
                      fontFamily: font.display, fontSize: 32, lineHeight: 0.95,
                      fontWeight: 400, letterSpacing: '-0.02em',
                    }}>{w.title}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center' }}>
          <button onClick={() => setIdx((idx - 1 + P.portfolio.length) % P.portfolio.length)} style={stackBtn(theme)}>←</button>
          <button onClick={() => onTapWork(curr)} style={{ ...stackBtn(theme), flex: 1, background: accent, color: '#000', fontFamily: '"Space Grotesk", system-ui', fontWeight: 600, fontSize: 13, letterSpacing: '0.02em' }}>Open {curr.title}</button>
          <button onClick={() => setIdx((idx + 1) % P.portfolio.length)} style={stackBtn(theme)}>→</button>
        </div>
      </div>

      <StatsRow P={P} theme={theme} accent={accent} font={font} />
      <div style={{ padding: '8px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {P.skills.map(s => <SkillChip key={s} theme={theme} accent={accent}>{s}</SkillChip>)}
      </div>
      <LookingForBlock P={P} theme={theme} accent={accent} font={font} />
      <SocialsBlock P={P} theme={theme} accent={accent} font={font} />
      <div style={{ height: 120 }} />
    </div>
  );
}

function stackBtn(theme) {
  return {
    padding: '12px 18px', borderRadius: 999,
    background: theme.cardBg, border: `0.5px solid ${theme.border}`,
    color: theme.fg, cursor: 'pointer', fontSize: 16,
  };
}

// ────────────────────────────────────────────────
// Variant 5 — TERMINAL / ARCHIVE
// Monospace-heavy, data-table of work, subverted structure
// ────────────────────────────────────────────────
function VariantTerminal({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const mono = '"JetBrains Mono", monospace';
  return (
    <div style={{ padding: '0 16px', fontFamily: mono }}>
      {/* Boot line */}
      <div style={{
        fontSize: 10, letterSpacing: '0.1em', color: theme.muted,
        padding: '4px 0 10px',
      }}>
        <span style={{ color: accent }}>●</span> SESSION/042 · MOUNT OK · <span style={{ color: accent }}>NOVA@EKKO</span>
      </div>

      {/* ASCII/frame header */}
      <div style={{
        border: `1px solid ${theme.border}`, borderRadius: 8,
        padding: 14, position: 'relative',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar size={56} style={avatarShape} accent={accent} theme={theme} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 2,
            }}>$ whoami</div>
            <div style={{
              fontFamily: font.display, fontSize: 28, lineHeight: 1,
              color: theme.fg, fontWeight: 400, letterSpacing: '-0.02em',
            }}>{P.name}</div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 4, letterSpacing: '0.04em' }}>
              {P.role.toUpperCase()} · {P.location.toUpperCase()}
            </div>
          </div>
          {P.gm && <GmBadge accent={accent} />}
        </div>

        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${theme.border}`,
          fontSize: 11, lineHeight: 1.6, color: theme.fg, letterSpacing: '0.01em',
        }}>
          <span style={{ color: accent }}>&gt; </span>{P.about}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        marginTop: 10, border: `1px solid ${theme.border}`, borderRadius: 8,
      }}>
        {Object.entries(P.stats).map(([k, v], i) => (
          <div key={k} style={{
            padding: '10px 8px',
            borderLeft: i > 0 ? `1px solid ${theme.border}` : 'none',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, color: theme.fg, fontWeight: 600 }}>{v}</div>
            <div style={{ fontSize: 8, color: theme.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Current */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 6 }}>$ cat now.txt</div>
        <div style={{
          padding: 12, background: theme.cardBg, borderRadius: 6,
          border: `1px solid ${theme.border}`,
          fontSize: 12, color: theme.fg, lineHeight: 1.5,
        }}>
          <div style={{ fontSize: 10, color: theme.muted, marginBottom: 4 }}># current-project.md</div>
          {P.currentProject}
        </div>
      </div>

      {/* Work table */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 8 }}>$ ls -la ./portfolio</div>
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '28px 1fr 70px 60px',
            padding: '6px 10px', fontSize: 9, letterSpacing: '0.15em',
            color: theme.muted, background: theme.cardBg, textTransform: 'uppercase',
            borderBottom: `1px solid ${theme.border}`,
          }}>
            <span>№</span><span>NAME</span><span>TAG</span><span style={{ textAlign: 'right' }}>YR</span>
          </div>
          {P.portfolio.map((w, i) => (
            <div key={w.id} onClick={() => onTapWork(w)} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 70px 60px',
              padding: '10px', alignItems: 'center',
              borderBottom: i < P.portfolio.length - 1 ? `1px solid ${theme.border}` : 'none',
              cursor: 'pointer', fontSize: 11, color: theme.fg,
            }}>
              <span style={{ color: accent }}>0{i + 1}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                  background: `linear-gradient(135deg, ${w.color}, ${w.color2})`,
                }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.title}</span>
              </span>
              <span style={{ color: theme.muted, fontSize: 10 }}>{w.tag}</span>
              <span style={{ textAlign: 'right', color: theme.muted }}>{w.year}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skills list */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 8 }}>$ cat skills.txt</div>
        <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.fg }}>
          {P.skills.map((s, i) => (
            <div key={s}>
              <span style={{ color: theme.muted }}>{String(i + 1).padStart(2, '0')} │</span> {s}
            </div>
          ))}
        </div>
      </div>

      {/* Looking for */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 8 }}>$ grep -i "looking.for"</div>
        {P.lookingFor.map((l, i) => (
          <div key={l} style={{ fontSize: 11, color: theme.fg, marginBottom: 4 }}>
            <span style={{ color: accent }}>&gt;</span> {l}
          </div>
        ))}
      </div>

      {/* Socials */}
      <div style={{ marginTop: 16, paddingBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: accent, marginBottom: 8 }}>$ ./connect</div>
        {P.socials.map(s => (
          <div key={s.label} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: `1px dashed ${theme.border}`,
            fontSize: 11, color: theme.fg,
          }}>
            <span style={{ color: theme.muted }}>{s.label.toUpperCase()}</span>
            <span>{s.handle}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 120 }} />
    </div>
  );
}

// ────────────────────────────────────────────────
// Shared sub-blocks
// ────────────────────────────────────────────────
function SectionHeader({ label, theme, accent, font }) {
  return (
    <div style={{
      padding: '24px 20px 10px',
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    }}>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
      }}>{label}</span>
      <span style={{
        flex: 1, marginLeft: 10, height: 0.5, background: theme.border,
        alignSelf: 'center',
      }} />
    </div>
  );
}

function SectionLabel({ children, theme, accent }) {
  return (
    <div style={{
      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
      letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
      paddingBottom: 6, borderBottom: `0.5px solid ${theme.border}`,
    }}>{children}</div>
  );
}

function StatsRow({ P, theme, accent, font }) {
  return (
    <div style={{
      margin: '20px 20px 0', padding: '14px 0',
      borderTop: `0.5px solid ${theme.border}`, borderBottom: `0.5px solid ${theme.border}`,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
    }}>
      {Object.entries(P.stats).map(([k, v]) => (
        <div key={k} style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: font.display, fontSize: 22, color: theme.fg,
            fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1,
          }}>{v}</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
            color: theme.muted, letterSpacing: '0.2em',
            textTransform: 'uppercase', marginTop: 4,
          }}>{k}</div>
        </div>
      ))}
    </div>
  );
}

function LookingForBlock({ P, theme, accent, font, noPadding }) {
  return (
    <div style={{ padding: noPadding ? '16px 0 0' : '0 20px', marginTop: noPadding ? 0 : 20 }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
        marginBottom: 10,
      }}>◉ LOOKING FOR</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {P.lookingFor.map((l, i) => (
          <div key={l} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 8,
            background: theme.cardBg, border: `0.5px solid ${theme.border}`,
            fontFamily: font.body, fontSize: 13, color: theme.fg,
          }}>
            <span style={{ color: accent, fontFamily: '"JetBrains Mono", monospace', fontSize: 10 }}>0{i + 1}</span>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialsBlock({ P, theme, accent, font, noPadding }) {
  return (
    <div style={{ padding: noPadding ? '16px 0 0' : '0 20px', marginTop: 20 }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
        marginBottom: 10,
      }}>⌁ ELSEWHERE</div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 10, overflow: 'hidden',
        border: `0.5px solid ${theme.border}`,
      }}>
        {P.socials.map((s, i) => (
          <div key={s.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px',
            borderBottom: i < P.socials.length - 1 ? `0.5px solid ${theme.border}` : 'none',
            background: theme.cardBg,
            fontFamily: font.body, fontSize: 13,
          }}>
            <span style={{ color: theme.muted }}>{s.label}</span>
            <span style={{ color: theme.fg, fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>{s.handle} →</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  VariantHero, VariantEditorial, VariantSplit, VariantStack, VariantTerminal,
});
