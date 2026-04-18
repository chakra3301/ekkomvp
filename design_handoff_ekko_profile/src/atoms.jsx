// Shared UI atoms for the profile variants
// Relies on theme provided via props

window.Avatar = function Avatar({ size = 88, style: shape = 'flag', accent = '#C4FF3D', theme }) {
  // shape: flag | circle | squircle | square | none
  const common = {
    width: size, height: size, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  };
  if (shape === 'none') return null;

  const innerGlyph = (
    <div style={{
      width: '72%', height: '72%',
      borderRadius: '50%',
      background: `conic-gradient(from 210deg, ${accent}, #7a3dff, #ff3d9a, ${accent})`,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: '18%', borderRadius: '50%',
        background: theme.cardBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: size * 0.22, color: theme.fg, fontWeight: 700,
        letterSpacing: '-0.04em',
      }}>N/W</div>
    </div>
  );

  if (shape === 'flag') {
    return (
      <div style={{ ...common, borderRadius: '50%', background: theme.fg, padding: 4, boxShadow: `0 0 0 2px ${theme.bg}, 0 0 0 3px ${accent}` }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {/* 4 bars — hanyang style */}
          <div style={{ position: 'absolute', left: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 10, height: 2, background: '#000' }} />)}
          </div>
          <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1,2,3].map(i => <div key={i} style={{ width: 10, height: 2, background: '#000' }} />)}
          </div>
          <div style={{
            position: 'absolute', inset: '20%', borderRadius: '50%',
            background: `linear-gradient(180deg, ${accent} 50%, #3d5aff 50%)`,
            transform: 'rotate(-30deg)',
          }} />
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: '30%', height: '30%', borderRadius: '50%',
            background: accent,
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
            width: '30%', height: '30%', borderRadius: '50%',
            background: '#3d5aff',
          }} />
        </div>
      </div>
    );
  }
  if (shape === 'squircle') {
    return <div style={{ ...common, borderRadius: size * 0.28, background: theme.cardBg, border: `1.5px solid ${accent}` }}>{innerGlyph}</div>;
  }
  if (shape === 'square') {
    return <div style={{ ...common, background: theme.cardBg, border: `1.5px solid ${accent}` }}>{innerGlyph}</div>;
  }
  // circle default
  return <div style={{ ...common, borderRadius: '50%', background: theme.cardBg, border: `1.5px solid ${accent}` }}>{innerGlyph}</div>;
};

window.StatusChip = function StatusChip({ status, accent, theme }) {
  const map = {
    active:  { label: 'Active',   dot: '#34E27A' },
    paused:  { label: 'Paused',   dot: '#FFB23D' },
    focusing:{ label: 'Focusing', dot: accent },
  };
  const s = map[status] || map.active;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 8px', borderRadius: 999,
      background: theme.chipBg, border: `0.5px solid ${theme.border}`,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.fg,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      {s.label}
    </div>
  );
};

window.GmBadge = function GmBadge({ accent }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 999,
      background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
      color: '#000',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      verticalAlign: 'middle', marginLeft: 8,
    }}>GM</span>
  );
};

window.TabBar = function TabBar({ active = 'profile', theme, accent, onTap }) {
  const JP = window.JP || {};
  const tabs = [
    { id: 'discover', label: 'Discover', jp: JP.discover || '探索', icon: '◎' },
    { id: 'likes',    label: 'Likes',    jp: JP.likes    || '好き', icon: '♥' },
    { id: 'matches',  label: 'Matches',  jp: JP.matches  || '縁',   icon: '◉' },
    { id: 'profile',  label: 'Profile',  jp: JP.profile  || 'プロフィール', icon: '◈' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: 12, right: 12,
      zIndex: 40,
      padding: '8px 10px',
      borderRadius: 999,
      background: theme.navBg,
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      border: `0.5px solid ${theme.border}`,
      display: 'flex', gap: 4, justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={() => onTap?.(t.id)} style={{
            flex: 1, background: isActive ? theme.cardBg : 'transparent',
            border: 'none', padding: '6px 4px', borderRadius: 999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            color: isActive ? accent : theme.muted,
            cursor: 'pointer',
            fontFamily: '"Space Grotesk", system-ui',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
            transition: 'all 0.2s',
          }}>
            <span style={{
              fontFamily: '"Noto Sans JP", system-ui', fontSize: 9,
              letterSpacing: '0.15em', opacity: isActive ? 0.9 : 0.6,
            }}>{t.jp}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

window.TopBar = function TopBar({ theme, accent, status, onStatusToggle, onEdit, editing, compact = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 16px 10px', gap: 8,
    }}>
      <window.StatusChip status={status} accent={accent} theme={theme} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onStatusToggle} style={{
          padding: '7px 14px', borderRadius: 999,
          background: theme.cardBg, color: theme.fg,
          border: `0.5px solid ${theme.border}`,
          fontFamily: '"Space Grotesk", system-ui',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {status === 'active' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={onEdit} style={{
          padding: '7px 14px', borderRadius: 999,
          background: editing ? accent : theme.fg,
          color: editing ? '#000' : theme.bg,
          border: 'none',
          fontFamily: '"Space Grotesk", system-ui',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {editing ? '✓ Done' : '✎ Edit'}
        </button>
      </div>
    </div>
  );
};

window.IOSTopChrome = function IOSTopChrome({ theme, title = 'Profile' }) {
  const JP = window.JP || {};
  // status bar is already rendered by IOSDevice; this renders title + gear
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '56px 16px 6px',
    }}>
      <div style={{ width: 36 }} />
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <div style={{
          fontFamily: '"Noto Sans JP", system-ui', fontSize: 9,
          letterSpacing: '0.3em', color: theme.muted, marginBottom: 2,
        }}>{JP.profile || 'プロフィール'}</div>
        <div style={{
          fontFamily: '"Space Grotesk", system-ui', fontWeight: 600,
          fontSize: 17, color: theme.fg, letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: '50%',
        background: theme.cardBg, border: `0.5px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: theme.fg, fontSize: 16,
      }}>⚙</button>
    </div>
  );
};

window.EditableText = function EditableText({ value, onChange, editing, style, tag = 'div', placeholder }) {
  const Tag = tag;
  if (!editing) return <Tag style={style}>{value}</Tag>;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange?.(e.target.innerText)}
      style={{
        ...style,
        outline: 'none',
        background: 'rgba(196,255,61,0.08)',
        borderRadius: 4,
        padding: '0 4px',
        margin: '0 -4px',
        boxShadow: 'inset 0 0 0 1px rgba(196,255,61,0.3)',
      }}
    >{value}</Tag>
  );
};

window.SkillChip = function SkillChip({ children, theme, accent, variant = 'default' }) {
  if (variant === 'outline') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '5px 10px', borderRadius: 6,
        border: `1px solid ${theme.border}`, color: theme.fg,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>{children}</span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 10px', borderRadius: 999,
      background: theme.chipBg, color: theme.fg,
      fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
      letterSpacing: '0.04em',
    }}>{children}</span>
  );
};
