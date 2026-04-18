// Variant 11 — HIRING CLIENT PROFILE
// From the client's POV — a company / brand recruiter profile visible to creatives
// Shows: brand hero, open briefs, budget, timeline, what they're looking for, past hires
const { Avatar, GmBadge, SkillChip, CoverPlaceholder } = window;

window.CLIENT_DATA = {
  company: 'ATELIER NULL',
  jpName: 'アトリエ・ヌル',
  tagline: 'Independent studio. Weird software. Seoul / Brooklyn.',
  size: '14 ppl',
  founded: '2021',
  website: 'atelier-null.xyz',
  verified: true,

  briefs: [
    {
      id: 'b1',
      title: 'Art Director — Spring Campaign',
      type: 'contract',
      budget: '$14k—$22k',
      timeline: '6 weeks',
      starts: 'MAY 05',
      tags: ['Art Direction', '3D', 'Type Design'],
      priority: 'urgent',
      applicants: 47,
    },
    {
      id: 'b2',
      title: '3D Artist — Product Renders',
      type: 'project',
      budget: '$4k—$8k',
      timeline: '3 weeks',
      starts: 'ROLLING',
      tags: ['Blender', 'Octane', 'Product'],
      applicants: 112,
    },
    {
      id: 'b3',
      title: 'Motion Designer — Loop reel',
      type: 'per-deliverable',
      budget: '$500—$2k / loop',
      timeline: 'ongoing',
      starts: 'OPEN',
      tags: ['Motion', 'After Effects', 'Loops'],
      applicants: 89,
    },
  ],

  pastHires: [
    { id: 'h1', name: 'mona.jpg',      role: 'AD',      color: '#FF3D9A' },
    { id: 'h2', name: 'k-void',        role: '3D',      color: '#00E5A0' },
    { id: 'h3', name: 'rin.fx',        role: 'Motion',  color: '#B85CFF' },
    { id: 'h4', name: 'chromakid',     role: 'Type',    color: '#FFD93D' },
    { id: 'h5', name: 'static/saint',  role: 'Sound',   color: '#5EC7FF' },
  ],

  lookingFor: [
    'Taste > technique. Show us ONE piece you love.',
    'Comfort with ambiguity & shipping weird work.',
    'Async-first. Notion + Linear + Figma.',
    'Asia or East Coast timezone preferred.',
  ],

  stats: {
    hires: 34,
    avgDays: '9d',
    response: '100%',
    repeat: '68%',
  },

  culture: ['Async-first', 'Weekly demos', 'Profit share', 'Open budgets', 'Remote ok', '4-day week'],
};

function VariantClient({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const D = window.CLIENT_DATA;
  const JP = window.JP || {};
  const mono = '"JetBrains Mono", monospace';

  return (
    <div>
      {/* Company hero header */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
          aspectRatio: '16/10',
        }}>
          <CoverPlaceholder seed={55} color={accent} color2="#0a0a0e" anime={true} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }} />
          {/* top chip */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: `0.5px solid ${accent}`,
            fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', color: accent,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
            HIRING · 3 OPEN
          </div>
          {D.verified && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 999,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              fontFamily: mono, fontSize: 9, letterSpacing: '0.15em', color: '#fff',
            }}>
              <span style={{ color: accent }}>✓</span> VERIFIED CLIENT
            </div>
          )}
          {/* Name block */}
          <div style={{
            position: 'absolute', left: 16, right: 16, bottom: 16,
            color: '#fff',
          }}>
            <div style={{
              fontFamily: '"Noto Sans JP", system-ui', fontSize: 10,
              letterSpacing: '0.3em', color: accent, marginBottom: 6,
            }}>✦ {D.jpName} ✦</div>
            <div style={{
              fontFamily: font.display, fontSize: 34, lineHeight: 0.9,
              fontWeight: 400, letterSpacing: '-0.03em',
              textShadow: `0 2px 24px ${accent}55`,
            }}>{D.company}</div>
            <div style={{
              fontFamily: font.body, fontSize: 12, color: 'rgba(255,255,255,0.75)',
              marginTop: 6,
            }}>{D.tagline}</div>
          </div>
        </div>

        {/* Company meta row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2, marginTop: 10, borderRadius: 10, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
        }}>
          {[
            { k: 'SIZE', v: D.size },
            { k: 'FOUNDED', v: D.founded },
            { k: 'REPLY', v: D.stats.response },
          ].map((x, i) => (
            <div key={x.k} style={{
              padding: '10px 8px',
              background: theme.cardBg, textAlign: 'center',
              borderRight: i < 2 ? `0.5px solid ${theme.border}` : 'none',
            }}>
              <div style={{ fontFamily: font.display, fontSize: 18, color: theme.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{x.v}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em', marginTop: 4 }}>{x.k}</div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: accent, color: '#000', cursor: 'pointer',
            fontFamily: '"Space Grotesk", system-ui', fontSize: 14, fontWeight: 700,
            letterSpacing: '-0.01em',
          }}>✦ Apply to Atelier</button>
          <button style={{
            padding: '14px 16px', borderRadius: 12,
            background: theme.cardBg, color: theme.fg, border: `0.5px solid ${theme.border}`,
            cursor: 'pointer', fontFamily: '"Space Grotesk", system-ui', fontSize: 14, fontWeight: 600,
          }}>☆</button>
          <button style={{
            padding: '14px 16px', borderRadius: 12,
            background: theme.cardBg, color: theme.fg, border: `0.5px solid ${theme.border}`,
            cursor: 'pointer', fontFamily: '"Space Grotesk", system-ui', fontSize: 14, fontWeight: 600,
          }}>↗</button>
        </div>
      </div>

      {/* Open briefs */}
      <div style={{ padding: '6px 16px 0' }}>
        <ClientHead jp="募集中" en={`OPEN BRIEFS · ${D.briefs.length}`} theme={theme} accent={accent} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {D.briefs.map(b => (
            <div key={b.id} onClick={() => onTapWork({ title: b.title, tag: b.type, year: b.starts, color: accent, color2: '#0a0a0e' })} style={{
              position: 'relative', padding: 14, borderRadius: 12,
              background: theme.cardBg, border: `0.5px solid ${b.priority === 'urgent' ? accent : theme.border}`,
              cursor: 'pointer', overflow: 'hidden',
            }}>
              {b.priority === 'urgent' && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  padding: '3px 10px',
                  background: accent, color: '#000',
                  fontFamily: mono, fontSize: 8, letterSpacing: '0.2em', fontWeight: 700,
                  borderBottomLeftRadius: 8,
                }}>● URGENT</div>
              )}
              <div style={{
                fontFamily: mono, fontSize: 9, letterSpacing: '0.2em',
                color: accent, textTransform: 'uppercase', marginBottom: 6,
              }}>{b.type} · STARTS {b.starts}</div>
              <div style={{
                fontFamily: font.display, fontSize: 19, lineHeight: 1.15,
                color: theme.fg, letterSpacing: '-0.01em', fontWeight: 500,
                paddingRight: b.priority === 'urgent' ? 70 : 0,
              }}>{b.title}</div>
              <div style={{
                display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10,
              }}>
                {b.tags.map(t => (
                  <span key={t} style={{
                    padding: '3px 7px', borderRadius: 4,
                    background: `${accent}18`, color: accent,
                    fontFamily: mono, fontSize: 9, letterSpacing: '0.08em',
                  }}>{t}</span>
                ))}
              </div>
              <div style={{
                marginTop: 12, paddingTop: 10,
                borderTop: `0.5px dashed ${theme.border}`,
                display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                gap: 8, alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em' }}>BUDGET</div>
                  <div style={{ fontFamily: font.body, fontSize: 13, color: theme.fg, fontWeight: 600, marginTop: 2 }}>{b.budget}</div>
                </div>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em' }}>TIMELINE</div>
                  <div style={{ fontFamily: font.body, fontSize: 13, color: theme.fg, fontWeight: 600, marginTop: 2 }}>{b.timeline}</div>
                </div>
                <div style={{
                  fontFamily: mono, fontSize: 9, color: theme.muted,
                  letterSpacing: '0.1em', textAlign: 'right',
                }}>
                  <span style={{ color: theme.fg, fontWeight: 600 }}>{b.applicants}</span> applied
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What they're looking for */}
      <div style={{ padding: '22px 16px 0' }}>
        <ClientHead jp="求める人物像" en="WHAT WE LOOK FOR" theme={theme} accent={accent} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {D.lookingFor.map((l, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 1fr',
              gap: 8, padding: '10px 0',
              borderBottom: i < D.lookingFor.length - 1 ? `0.5px dashed ${theme.border}` : 'none',
            }}>
              <div style={{
                fontFamily: mono, fontSize: 11, color: accent,
                letterSpacing: '0.1em', fontWeight: 600,
              }}>0{i + 1}</div>
              <div style={{ fontFamily: font.body, fontSize: 13, color: theme.fg, lineHeight: 1.45 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past hires */}
      <div style={{ padding: '22px 16px 0' }}>
        <ClientHead jp="実績の作家" en={`WE'VE HIRED · ${D.pastHires.length}+`} theme={theme} accent={accent} />
        <div style={{
          marginTop: 12, display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 2,
        }}>
          {D.pastHires.map(h => (
            <div key={h.id} style={{
              flex: '0 0 auto', width: 110,
              padding: 10, borderRadius: 10,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                margin: '0 auto 8px',
                background: `conic-gradient(from 140deg, ${h.color}, ${h.color}44, ${h.color})`,
                border: `1.5px solid ${h.color}`,
                padding: 3,
              }}>
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: theme.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: mono, fontSize: 14, color: h.color, fontWeight: 700,
                }}>{h.name.charAt(0).toUpperCase()}</div>
              </div>
              <div style={{
                fontFamily: mono, fontSize: 10, color: theme.fg,
                letterSpacing: '0.04em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{h.name}</div>
              <div style={{
                fontFamily: mono, fontSize: 8, color: theme.muted,
                letterSpacing: '0.2em', marginTop: 2, textTransform: 'uppercase',
              }}>{h.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Track record stats */}
      <div style={{ padding: '22px 16px 0' }}>
        <ClientHead jp="実績" en="TRACK RECORD" theme={theme} accent={accent} />
        <div style={{
          marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderRadius: 10, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
        }}>
          {[
            { k: 'HIRES', v: D.stats.hires },
            { k: 'AVG TIME', v: D.stats.avgDays },
            { k: 'REPLIES', v: D.stats.response },
            { k: 'REPEAT', v: D.stats.repeat },
          ].map((x, i) => (
            <div key={x.k} style={{
              padding: '12px 4px', textAlign: 'center',
              background: theme.cardBg,
              borderRight: i < 3 ? `0.5px solid ${theme.border}` : 'none',
            }}>
              <div style={{ fontFamily: font.display, fontSize: 20, color: theme.fg, letterSpacing: '-0.02em', lineHeight: 1 }}>{x.v}</div>
              <div style={{ fontFamily: mono, fontSize: 8, color: theme.muted, letterSpacing: '0.2em', marginTop: 4 }}>{x.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Culture chips */}
      <div style={{ padding: '22px 16px 0' }}>
        <ClientHead jp="文化" en="CULTURE" theme={theme} accent={accent} />
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {D.culture.map(c => <SkillChip key={c} theme={theme} accent={accent} variant="outline">{c}</SkillChip>)}
        </div>
      </div>

      {/* Final pitch */}
      <div style={{ padding: '26px 16px 0' }}>
        <div style={{
          padding: '22px 18px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${accent}22, transparent 70%), ${theme.cardBg}`,
          border: `1px solid ${accent}44`,
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: '"Noto Sans JP", system-ui', fontSize: 10,
            letterSpacing: '0.3em', color: accent, marginBottom: 8,
          }}>✦ 君の番だ ✦</div>
          <div style={{
            fontFamily: font.display, fontSize: 26, lineHeight: 1,
            color: theme.fg, letterSpacing: '-0.02em', fontWeight: 400,
            textWrap: 'balance',
          }}>Think you'd fit?<br/>Send us one piece.</div>
          <button style={{
            marginTop: 14, padding: '12px 24px', borderRadius: 999,
            background: accent, color: '#000', border: 'none',
            fontFamily: '"Space Grotesk", system-ui', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.02em', cursor: 'pointer',
          }}>APPLY NOW →</button>
          <div style={{
            marginTop: 10,
            fontFamily: mono, fontSize: 9, color: theme.muted,
            letterSpacing: '0.15em',
          }}>avg. response in 9 days</div>
        </div>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}

function ClientHead({ jp, en, theme, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{en}</div>
      <div style={{
        fontFamily: '"Noto Sans JP", system-ui', fontSize: 10,
        letterSpacing: '0.3em', color: theme.muted, whiteSpace: 'nowrap',
      }}>{jp}</div>
    </div>
  );
}

window.VariantClient = VariantClient;
