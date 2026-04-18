import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {StatusBar} from '../components/StatusBar';
import {ProfileCard} from '../components/ProfileCard';
import {LogoGlyph} from '../components/Logo';

export const DiscoverStack: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 18, stiffness: 90}});
  const topY = interpolate(enter, [0, 1], [120, 0]);
  const topOpacity = interpolate(enter, [0, 1], [0, 1]);

  const tapStart = 70;
  const tapProgress = spring({frame: frame - tapStart, fps, config: {damping: 14, stiffness: 180}});
  const tapScale = interpolate(tapProgress, [0, 0.4, 1], [1, 0.96, 1]);

  return (
    <AbsoluteFill style={{background: '#0F1115'}}>
      <StatusBar />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          padding: '40px 48px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <LogoGlyph size={120} />
          <span
            style={{
              color: '#fff',
              fontFamily: 'Arches, serif',
              fontStyle: 'italic',
              fontSize: 56,
            }}
          >
            discover
          </span>
        </div>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 34,
          }}
        >
          ⚡
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            transform: `translateY(40px) scale(0.94)`,
            opacity: 0.55,
            filter: 'blur(0.5px)',
          }}
        >
          <ProfileCard
            name="Jordan"
            role="Designer"
            initial="J"
            gradient={['#DB2777', '#7C3AED']}
          />
        </div>

        <div
          style={{
            transform: `translateY(${topY}px) scale(${tapScale})`,
            opacity: topOpacity,
          }}
        >
          <ProfileCard
            name="Maya Chen"
            role="Visual Artist"
            location="Brooklyn"
            initial="M"
            gradient={['#0080FF', '#7C3AED']}
            badges={['illustration', 'motion']}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {[
          {icon: '✕', color: '#EF4444'},
          {icon: '★', color: '#0080FF'},
          {icon: '♥', color: '#10B981'},
        ].map((a) => (
          <div
            key={a.icon}
            style={{
              width: 110,
              height: 110,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: `2px solid ${a.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: a.color,
              fontSize: 48,
              backdropFilter: 'blur(10px)',
            }}
          >
            {a.icon}
          </div>
        ))}
      </div>

      <TabBar active="discover" />
    </AbsoluteFill>
  );
};

export const TabBar: React.FC<{active: string}> = ({active}) => {
  const tabs = [
    {key: 'discover', icon: '◎', label: 'Discover'},
    {key: 'likes', icon: '♥', label: 'Likes'},
    {key: 'messages', icon: '✉', label: 'Messages'},
    {key: 'profile', icon: '◉', label: 'Profile'},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        background: 'rgba(15,17,21,0.85)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        paddingBottom: 24,
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.key}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            color: active === t.key ? '#0080FF' : 'rgba(255,255,255,0.45)',
            fontSize: 20,
            fontFamily: '-apple-system, sans-serif',
          }}
        >
          <div style={{fontSize: 36}}>{t.icon}</div>
          <div>{t.label}</div>
        </div>
      ))}
    </div>
  );
};
