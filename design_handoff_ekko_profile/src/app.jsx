// Main app — orchestrates variants, tweaks, edit mode, detail view, tab bar
const { IOSDevice } = window;
const { Avatar, StatusChip, TabBar, IOSTopChrome, CoverPlaceholder } = window;
const { VariantHero, VariantEditorial, VariantSplit, VariantStack, VariantTerminal } = window;
const { Variant3D, VariantMusic, VariantVideo, VariantPhoto } = window;
const { VariantHire } = window;
const { VariantClient } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "hero",
  "dark": true,
  "accent": "#FF3D9A",
  "fontPair": "anime-shoujo",
  "avatarShape": "flag",
  "coverStyle": "fullbleed"
}/*EDITMODE-END*/;

const VARIANTS = [
  { id: 'hero',      label: '01 · Hero',      comp: VariantHero },
  { id: 'editorial', label: '02 · Editorial', comp: VariantEditorial },
  { id: 'split',     label: '03 · Split',     comp: VariantSplit },
  { id: 'stack',     label: '04 · Stack',     comp: VariantStack },
  { id: 'terminal',  label: '05 · Terminal',  comp: VariantTerminal },
  { id: 'threeD',    label: '06 · 3D',        comp: Variant3D },
  { id: 'music',     label: '07 · Music',     comp: VariantMusic },
  { id: 'video',     label: '08 · Video',     comp: VariantVideo },
  { id: 'photo',     label: '09 · Photo',     comp: VariantPhoto },
  { id: 'hire',      label: '10 · Hire Me',   comp: VariantHire },
  { id: 'client',    label: '11 · Client',    comp: VariantClient },
];

const ACCENT_OPTS = [
  { id: '#FF3D9A', label: 'Sakura' },
  { id: '#C4FF3D', label: 'Lime' },
  { id: '#FF3D5A', label: 'Blood' },
  { id: '#00E5A0', label: 'Acid' },
  { id: '#B85CFF', label: 'Violet' },
  { id: '#FF7A1A', label: 'Ember' },
  { id: '#5EC7FF', label: 'Ice' },
];

const FONT_PAIRS = {
  'grotesk-serif': { display: '"Instrument Serif", "Times New Roman", serif', body: '"Space Grotesk", system-ui, sans-serif', label: 'Serif + Grotesk' },
  'anime-shoujo':  { display: '"Zen Antique", "Instrument Serif", serif',    body: '"Zen Kaku Gothic New", "Space Grotesk", sans-serif',  label: 'Shoujo' },
  'anime-tech':    { display: '"Rampart One", "Archivo Black", sans-serif',    body: '"Zen Kaku Gothic New", "Space Grotesk", sans-serif',  label: 'Mecha' },
  'mono-stack':    { display: '"JetBrains Mono", ui-monospace, monospace',    body: '"JetBrains Mono", ui-monospace, monospace',  label: 'All Mono' },
  'display-sans':  { display: '"Archivo Black", system-ui, sans-serif',       body: '"Space Grotesk", system-ui, sans-serif',     label: 'Display Sans' },
  'blackletter':   { display: '"UnifrakturCook", serif',                      body: '"Space Grotesk", system-ui, sans-serif',     label: 'Y2K Fraktur' },
};

const AVATAR_OPTS = ['flag', 'circle', 'squircle', 'square', 'none'];
const COVER_OPTS  = ['fullbleed', 'card'];

const THEMES = {
  dark: {
    bg: '#0A0A0E', cardBg: 'rgba(255,255,255,0.04)', fg: '#F3F3F0',
    muted: 'rgba(243,243,240,0.5)', border: 'rgba(255,255,255,0.1)',
    chipBg: 'rgba(255,255,255,0.06)',
    navBg: 'rgba(15,15,20,0.7)',
  },
  light: {
    bg: '#F5F4EE', cardBg: 'rgba(0,0,0,0.03)', fg: '#0A0A0E',
    muted: 'rgba(10,10,14,0.55)', border: 'rgba(0,0,0,0.1)',
    chipBg: 'rgba(0,0,0,0.05)',
    navBg: 'rgba(255,255,255,0.7)',
  },
};

function App() {
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [editing, setEditing] = React.useState(false);
  const [status, setStatus] = React.useState('active');
  const [tab, setTab] = React.useState('profile');
  const [detail, setDetail] = React.useState(null);
  const [profile, setProfile] = React.useState(window.PROFILE);
  const [scrollY, setScrollY] = React.useState(0);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editModeOn, setEditModeOn] = React.useState(false);

  const theme = tweaks.dark ? THEMES.dark : THEMES.light;
  const font = FONT_PAIRS[tweaks.fontPair] || FONT_PAIRS['grotesk-serif'];
  const accent = tweaks.accent;

  const updateTweak = (k, v) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };

  // Host Tweaks toggle wiring
  React.useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') { setEditModeOn(true); setPanelOpen(true); }
      if (e.data?.type === '__deactivate_edit_mode') { setEditModeOn(false); setPanelOpen(false); }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const scrollerRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [tweaks.variant]);

  const V = VARIANTS.find(v => v.id === tweaks.variant) || VARIANTS[0];
  const VComp = V.comp;

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#0a0a0e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', boxSizing: 'border-box',
      position: 'relative',
      backgroundImage: `
        radial-gradient(ellipse 60% 40% at 20% 10%, ${accent}08, transparent),
        radial-gradient(ellipse 50% 50% at 90% 90%, ${accent}06, transparent)
      `,
    }}>
      {/* Variant switcher chips (always visible, subtle) */}
      <div style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4, zIndex: 100,
        padding: 4, borderRadius: 999,
        background: 'rgba(20,20,26,0.75)',
        backdropFilter: 'blur(20px)',
        border: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        {VARIANTS.map(v => (
          <button key={v.id} onClick={() => updateTweak('variant', v.id)} style={{
            padding: '8px 14px', borderRadius: 999, border: 'none',
            background: v.id === tweaks.variant ? accent : 'transparent',
            color: v.id === tweaks.variant ? '#000' : 'rgba(255,255,255,0.75)',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            letterSpacing: '0.08em', cursor: 'pointer', fontWeight: 500,
            whiteSpace: 'nowrap', textTransform: 'uppercase',
          }}>{v.label}</button>
        ))}
      </div>

      {/* iPhone frame */}
      <IOSDevice dark={tweaks.dark} width={402} height={874}>
        <div ref={scrollerRef} style={{
          width: '100%', height: '100%', overflow: 'auto',
          background: theme.bg, color: theme.fg,
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Top chrome */}
          <IOSTopChrome theme={theme} title="Profile" />

          {/* Action row */}
          <div style={{ padding: '6px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <StatusChip status={status} accent={accent} theme={theme} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setStatus(status === 'active' ? 'paused' : 'active')} style={actionBtn(theme, false, accent)}>
                {status === 'active' ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => setEditing(!editing)} style={actionBtn(theme, true, accent, editing)}>
                {editing ? '✓ Done' : '✎ Edit'}
              </button>
            </div>
          </div>

          {/* Variant body */}
          <VComp
            theme={theme} accent={accent}
            avatarShape={tweaks.avatarShape}
            coverStyle={tweaks.coverStyle}
            font={font}
            editing={editing}
            profile={profile}
            scrollY={scrollY}
            onTapWork={(w) => setDetail(w)}
          />

          {/* Detail sheet */}
          {detail && (
            <DetailSheet detail={detail} onClose={() => setDetail(null)} theme={theme} accent={accent} font={font} />
          )}
        </div>

        {/* Tab bar (inside device, above home indicator) */}
        <TabBar active={tab} theme={theme} accent={accent} onTap={setTab} />
      </IOSDevice>

      {/* Tweaks panel */}
      {editModeOn && panelOpen && (
        <TweaksPanel
          tweaks={tweaks}
          updateTweak={updateTweak}
          onClose={() => setPanelOpen(false)}
          accent={accent}
        />
      )}
      {editModeOn && !panelOpen && (
        <button onClick={() => setPanelOpen(true)} style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          padding: '12px 18px', borderRadius: 999,
          background: accent, color: '#000', border: 'none',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          letterSpacing: '0.1em', cursor: 'pointer', fontWeight: 600,
          textTransform: 'uppercase',
        }}>◎ Tweaks</button>
      )}
    </div>
  );
}

function actionBtn(theme, primary, accent, active) {
  return {
    padding: '7px 14px', borderRadius: 999,
    background: active ? accent : primary ? theme.fg : theme.cardBg,
    color: active ? '#000' : primary ? theme.bg : theme.fg,
    border: primary ? 'none' : `0.5px solid ${theme.border}`,
    fontFamily: '"Space Grotesk", system-ui',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  };
}

function DetailSheet({ detail, onClose, theme, accent, font }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: theme.bg,
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        padding: '12px 0 100px', maxHeight: '88%', overflow: 'auto',
        border: `0.5px solid ${theme.border}`,
        animation: 'slideUp 0.3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width: 40, height: 4, background: theme.border, borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{
          width: 'calc(100% - 32px)', margin: '0 16px',
          aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden',
          border: `0.5px solid ${theme.border}`,
        }}>
          <CoverPlaceholder seed={42} color={detail.color} color2={detail.color2} label={detail.title} sublabel={detail.year} />
        </div>
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            letterSpacing: '0.2em', color: accent, textTransform: 'uppercase',
          }}>{detail.tag} · {detail.year}</div>
          <div style={{
            fontFamily: font.display, fontSize: 42, lineHeight: 0.95,
            color: theme.fg, fontWeight: 400, letterSpacing: '-0.02em',
            marginTop: 8,
          }}>{detail.title}</div>
          <div style={{ fontFamily: font.body, fontSize: 14, lineHeight: 1.55, color: theme.muted, marginTop: 14 }}>
            A speculative artifact from the Dead Internet Archive. Tap, scroll, listen. Sometimes the signal speaks back.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button style={{
              flex: 1, padding: '14px', borderRadius: 12,
              background: accent, color: '#000', border: 'none',
              fontFamily: '"Space Grotesk", system-ui',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Open project →</button>
            <button style={{
              padding: '14px 18px', borderRadius: 12,
              background: theme.cardBg, color: theme.fg, border: `0.5px solid ${theme.border}`,
              fontFamily: '"Space Grotesk", system-ui',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>♥</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TweaksPanel({ tweaks, updateTweak, onClose, accent }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      width: 272,
      background: 'rgba(15,15,20,0.92)',
      backdropFilter: 'blur(24px) saturate(140%)',
      borderRadius: 18, overflow: 'hidden',
      border: '0.5px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      color: '#F3F3F0',
    }}>
      <div style={{
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>
          ◎ TWEAKS
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer', fontSize: 16, padding: 0,
        }}>✕</button>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflow: 'auto' }}>
        <TweakSeg label="Layout" value={tweaks.variant} opts={VARIANTS.map(v => ({ id: v.id, label: v.label.split(' · ')[1] }))} onChange={v => updateTweak('variant', v)} accent={accent} />
        <TweakSeg label="Theme" value={tweaks.dark ? 'dark' : 'light'} opts={[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }]} onChange={v => updateTweak('dark', v === 'dark')} accent={accent} />
        <TweakSwatches label="Accent" value={tweaks.accent} opts={ACCENT_OPTS} onChange={v => updateTweak('accent', v)} accent={accent} />
        <TweakSeg label="Font" value={tweaks.fontPair} opts={Object.entries(FONT_PAIRS).map(([id, f]) => ({ id, label: f.label }))} onChange={v => updateTweak('fontPair', v)} accent={accent} />
        <TweakSeg label="Avatar" value={tweaks.avatarShape} opts={AVATAR_OPTS.map(a => ({ id: a, label: a }))} onChange={v => updateTweak('avatarShape', v)} accent={accent} />
        <TweakSeg label="Cover" value={tweaks.coverStyle} opts={COVER_OPTS.map(c => ({ id: c, label: c }))} onChange={v => updateTweak('coverStyle', v)} accent={accent} />
      </div>
    </div>
  );
}

function TweakSeg({ label, value, opts, onChange, accent }) {
  return (
    <div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {opts.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 10px', borderRadius: 6,
            background: o.id === value ? accent : 'rgba(255,255,255,0.06)',
            color: o.id === value ? '#000' : '#F3F3F0',
            border: 'none', cursor: 'pointer',
            fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.04em', textTransform: 'capitalize',
          }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function TweakSwatches({ label, value, opts, onChange, accent }) {
  return (
    <div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {opts.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)} title={o.label} style={{
            width: 28, height: 28, borderRadius: 999,
            background: o.id, border: o.id === value ? '2px solid #fff' : '2px solid transparent',
            cursor: 'pointer', padding: 0,
            boxShadow: o.id === value ? `0 0 0 2px ${o.id}` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
