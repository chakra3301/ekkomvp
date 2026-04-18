// Variant 10 — HIRE / CLIENT-FACING
// For clients looking to hire the artist: availability, rates, services, testimonials, process
const { Avatar, GmBadge, SkillChip, CoverPlaceholder } = window;

window.HIRE_DATA = {
  availability: {
    status: 'booking',       // booking | limited | closed
    next: 'MAY 12',
    capacity: '2 slots',
    timezone: 'PST (UTC-8)',
    replyTime: '< 24h',
  },
  services: [
    { id: 's1', name: 'Art Direction',      from: '$8k',   unit: '/ project',  tag: 'flagship', lead: '3 wks' },
    { id: 's2', name: 'Brand Identity',     from: '$12k',  unit: '/ project',  tag: 'popular',  lead: '4 wks' },
    { id: 's3', name: '3D / Motion',        from: '$2.5k', unit: '/ deliverable', lead: '1 wk' },
    { id: 's4', name: 'Creative Coding',    from: '$150',  unit: '/ hr',       lead: 'rolling' },
    { id: 's5', name: 'Consulting',         from: '$300',  unit: '/ hr',       lead: 'same wk' },
  ],
  clients: ['Hyundai', 'Kiehl\'s', 'Sonos', 'Nike SB', 'Are.na', 'Moment', 'Red Bull', 'Rapha'],
  testimonials: [
    { by: 'Maya K.',  role: 'CD @ Hyundai',   q: 'Nova shipped a fully realized world in two weeks. Weird in all the right ways.' },
    { by: 'Jun R.',   role: 'Founder @ null', q: 'Best creative collaborator I\'ve worked with in ten years. Taste + delivery.' },
    { by: 'Lena M.',  role: 'PM @ Sonos',     q: 'Handled brief, edge cases, and stakeholder drama without breaking stride.' },
  ],
  process: [
    { step: '01', title: 'DISCOVERY',  detail: '30-min call · scope, refs, fit check', len: '3 days' },
    { step: '02', title: 'PROPOSAL',   detail: 'written treatment + fixed quote',      len: '5 days' },
    { step: '03', title: 'MAKE',       detail: 'weekly reviews, shared build channel', len: '3–6 wks' },
    { step: '04', title: 'DELIVERY',   detail: 'final files, docs, handoff call',      len: '1 week' },
  ],
};

function VariantHire({ theme, accent, avatarShape, coverStyle, font, editing, profile, onTapWork }) {
  const P = profile;
  const D = window.HIRE_DATA;
  const JP = window.JP || {};
  const mono = '"JetBrains Mono", monospace';

  const statusMap = {
    booking: { label: 'BOOKING', dot: '#34E27A', tint: accent },
    limited: { label: 'LIMITED', dot: '#FFB23D', tint: '#FFB23D' },
    closed:  { label: 'CLOSED',  dot: '#FF3D5A', tint: '#FF3D5A' },
  };
  const s = statusMap[D.availability.status];

  return (
    <div>
      {/* Header w/ availability status */}
      <div style={{ padding: '6px 16px 16px' }}>
        <div style={{
          position: 'relative',
          padding: 16, borderRadius: 16,
          background: `linear-gradient(135deg, ${s.tint}18 0%, transparent 60%), ${theme.cardBg}`,
          border: `1px solid ${s.tint}44`,
          overflow: 'hidden',
        }}>
          {/* bg sparkles */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
            <CoverPlaceholder seed={77} color={s.tint} color2="transparent" anime={true} />
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar size={68} style={avatarShape} accent={accent} theme={theme} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 8px', borderRadius: 999,
                background: 'rgba(0,0,0,0.35)', border: `0.5px solid ${s.tint}`,
                fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', color: s.tint,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, boxShadow: `0 0 8px ${s.dot}` }} />
                {s.label}
              </div>
              <div style={{
                fontFamily: font.display, fontSize: 28, lineHeight: 0.95,
                color: theme.fg, fontWeight: 400, letterSpacing: '-0.02em',
                marginTop: 6,
              }}>
                {P.name}
                {P.gm && <GmBadge accent={accent} />}
              </div>
              <div style={{ fontFamily: font.body, fontSize: 12, color: theme.muted, marginTop: 2 }}>
                {P.role} · {P.location}
              </div>
            </div>
          </div>

          {/* availability grid */}
          <div style={{
            position: 'relative',
            marginTop: 14, paddingTop: 12,
            borderTop: `0.5px dashed ${theme.border}`,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          }}>
            {[
              { k: 'NEXT', v: D.availability.next },
              { k: 'SLOTS', v: D.availability.capacity.split(' ')[0] },
              { k: 'TZ', v: 'PST' },
              { k: 'REPLY', v: D.availability.replyTime },
            ].map(x => (
              <div key={x.k}>
                <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.2em', color: theme.muted, marginBottom: 3 }}>{x.k}</div>
                <div style={{ fontFamily: font.body, fontSize: 13, color: theme.fg, fontWeight: 600 }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: accent, color: '#000', cursor: 'pointer',
            fontFamily: '"Space Grotesk", system-ui', fontSize: 14, fontWeight: 700,
            letterSpacing: '-0.01em',
          }}>✦ Start a project</button>
          <button style={{
            padding: '14px 16px', borderRadius: 12,
            background: theme.cardBg, color: theme.fg, border: `0.5px solid ${theme.border}`,
            cursor: 'pointer', fontFamily: '"Space Grotesk", system-ui', fontSize: 14, fontWeight: 600,
          }}>↓ PDF</button>
        </div>
        <div style={{
          marginTop: 8, fontFamily: mono, fontSize: 9,
          color: theme.muted, letterSpacing: '0.15em', textAlign: 'center',
        }}>hire@novawrld.xyz · reply within 24h</div>
      </div>

      {/* Services / rate card */}
      <div style={{ padding: '6px 16px 0' }}>
        <SectionHead jp={JP.lookingFor || '募集中'} en="SERVICES / RATE CARD" theme={theme} accent={accent} />
        <div style={{
          marginTop: 10, borderRadius: 12, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
        }}>
          {D.services.map((svc, i) => (
            <div key={svc.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
              padding: '13px 14px', alignItems: 'center',
              background: theme.cardBg,
              borderBottom: i < D.services.length - 1 ? `0.5px solid ${theme.border}` : 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: font.body, fontSize: 14, color: theme.fg, fontWeight: 600,
                }}>
                  {svc.name}
                  {svc.tag && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 4,
                      background: accent, color: '#000',
                      fontFamily: mono, fontSize: 8, letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}>{svc.tag}</span>
                  )}
                </div>
                <div style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: '0.12em',
                  color: theme.muted, marginTop: 3, textTransform: 'uppercase',
                }}>
                  LEAD TIME · {svc.lead}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: font.display, fontSize: 18, color: theme.fg,
                  letterSpacing: '-0.02em', lineHeight: 1, fontWeight: 500,
                }}>{svc.from}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: theme.muted, marginTop: 2, letterSpacing: '0.08em' }}>
                  {svc.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clients marquee-style */}
      <div style={{ padding: '22px 0 0' }}>
        <div style={{ padding: '0 16px' }}>
          <SectionHead jp="実績" en="TRUSTED BY" theme={theme} accent={accent} />
        </div>
        <div style={{
          marginTop: 10, display: 'flex', gap: 8, overflowX: 'auto',
          padding: '0 16px 2px',
        }}>
          {D.clients.map(c => (
            <div key={c} style={{
              flex: '0 0 auto',
              padding: '10px 14px', borderRadius: 8,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
              fontFamily: font.display, fontSize: 16, color: theme.fg,
              letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ padding: '22px 16px 0' }}>
        <SectionHead jp="声" en="KIND WORDS" theme={theme} accent={accent} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {D.testimonials.map((t, i) => (
            <div key={i} style={{
              position: 'relative',
              padding: '14px 14px 14px 18px', borderRadius: 10,
              background: theme.cardBg, border: `0.5px solid ${theme.border}`,
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: accent, borderRadius: '2px 0 0 2px',
              }} />
              <div style={{
                fontFamily: font.display, fontSize: 40,
                lineHeight: 0.3, color: accent, opacity: 0.5,
                position: 'absolute', top: 18, right: 12,
              }}>❞</div>
              <div style={{
                fontFamily: font.body, fontSize: 13, color: theme.fg,
                lineHeight: 1.45, fontStyle: 'italic',
                paddingRight: 24,
              }}>"{t.q}"</div>
              <div style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: mono, fontSize: 10, letterSpacing: '0.08em',
              }}>
                <span style={{ color: theme.fg, fontWeight: 600 }}>{t.by}</span>
                <span style={{ color: theme.muted }}>·</span>
                <span style={{ color: theme.muted }}>{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div style={{ padding: '22px 16px 0' }}>
        <SectionHead jp="工程" en="HOW WE WORK" theme={theme} accent={accent} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column' }}>
          {D.process.map((p, i) => (
            <div key={p.step} style={{
              display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 10,
              padding: '14px 0',
              borderBottom: i < D.process.length - 1 ? `0.5px dashed ${theme.border}` : 'none',
              alignItems: 'baseline',
            }}>
              <div style={{
                fontFamily: font.display, fontSize: 28, color: accent,
                letterSpacing: '-0.02em', lineHeight: 1, fontWeight: 400,
              }}>{p.step}</div>
              <div>
                <div style={{
                  fontFamily: mono, fontSize: 11, letterSpacing: '0.2em',
                  color: theme.fg, fontWeight: 600,
                }}>{p.title}</div>
                <div style={{ fontFamily: font.body, fontSize: 12, color: theme.muted, marginTop: 3, lineHeight: 1.4 }}>
                  {p.detail}
                </div>
              </div>
              <div style={{
                fontFamily: mono, fontSize: 9, color: theme.muted,
                letterSpacing: '0.15em', whiteSpace: 'nowrap',
              }}>{p.len}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div style={{ padding: '22px 20px 0' }}>
        <SectionHead jp="得意" en="CAPABILITIES" theme={theme} accent={accent} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {P.skills.map(x => <SkillChip key={x} theme={theme} accent={accent} variant="outline">{x}</SkillChip>)}
        </div>
      </div>

      {/* Final CTA */}
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
          }}>✦ 一緒に作りませんか ✦</div>
          <div style={{
            fontFamily: font.display, fontSize: 28, lineHeight: 1,
            color: theme.fg, letterSpacing: '-0.02em', fontWeight: 400,
            textWrap: 'balance',
          }}>Let's make<br/>something strange.</div>
          <button style={{
            marginTop: 14, padding: '12px 24px', borderRadius: 999,
            background: accent, color: '#000', border: 'none',
            fontFamily: '"Space Grotesk", system-ui', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.02em', cursor: 'pointer',
          }}>BOOK A CALL →</button>
        </div>
      </div>

      <div style={{ height: 140 }} />
    </div>
  );
}

function SectionHead({ jp, en, theme, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 10,
    }}>
      <div style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        letterSpacing: '0.25em', color: accent, textTransform: 'uppercase',
      }}>{en}</div>
      <div style={{
        fontFamily: '"Noto Sans JP", system-ui', fontSize: 10,
        letterSpacing: '0.3em', color: theme.muted,
      }}>{jp}</div>
    </div>
  );
}

window.VariantHire = VariantHire;
