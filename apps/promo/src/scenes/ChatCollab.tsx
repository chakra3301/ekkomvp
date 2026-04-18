import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {StatusBar} from '../components/StatusBar';

type Msg = {
  from: 'me' | 'them';
  text: string;
  startFrame: number;
};

const MESSAGES: Msg[] = [
  {from: 'them', text: 'Hey! Just saw your portfolio — your motion work is unreal 🎨', startFrame: 10},
  {from: 'me', text: 'Ahh thank you!! Loved your last mural series 🔥', startFrame: 32},
  {from: 'them', text: 'Working on a short film rn, need a motion designer', startFrame: 56},
  {from: 'me', text: 'I\'m so in. Lets collab 🙌', startFrame: 85},
];

export const ChatCollab: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 18, stiffness: 80}});
  const enterOpacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{background: '#0F1115', opacity: enterOpacity}}>
      <StatusBar />

      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          padding: '30px 40px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          background: 'rgba(15,17,21,0.85)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: 42,
            width: 44,
          }}
        >
          ‹
        </div>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #0080FF, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 42,
            fontWeight: 700,
            fontFamily: '-apple-system, sans-serif',
          }}
        >
          M
        </div>
        <div>
          <div
            style={{
              color: '#fff',
              fontSize: 36,
              fontWeight: 600,
              fontFamily: '-apple-system, sans-serif',
            }}
          >
            Maya Chen
          </div>
          <div
            style={{
              color: '#10B981',
              fontSize: 24,
              fontFamily: '-apple-system, sans-serif',
              marginTop: 4,
            }}
          >
            ● online
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 0,
          right: 0,
          bottom: 200,
          padding: '20px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {MESSAGES.map((m, i) => {
          const local = frame - m.startFrame;
          if (local < 0) return null;
          const s = spring({frame: local, fps, config: {damping: 15, stiffness: 120}});
          const y = interpolate(s, [0, 1], [40, 0]);
          const opacity = interpolate(s, [0, 1], [0, 1]);

          const isMe = m.from === 'me';
          return (
            <div
              key={i}
              style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                padding: '26px 32px',
                borderRadius: 32,
                borderBottomRightRadius: isMe ? 10 : 32,
                borderBottomLeftRadius: isMe ? 32 : 10,
                background: isMe
                  ? 'linear-gradient(135deg, #0080FF, #0055B3)'
                  : 'rgba(255,255,255,0.08)',
                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: '-apple-system, sans-serif',
                fontSize: 34,
                lineHeight: 1.35,
                transform: `translateY(${y}px)`,
                opacity,
                boxShadow: isMe ? '0 10px 30px rgba(0,128,255,0.35)' : 'none',
              }}
            >
              {m.text}
            </div>
          );
        })}

        <TypingIndicator visible={frame >= 78 && frame < 90} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          bottom: 40,
          padding: '22px 28px',
          borderRadius: 40,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{flex: 1, color: 'rgba(255,255,255,0.35)', fontSize: 30, fontFamily: '-apple-system, sans-serif'}}>
          Message…
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #0080FF, #0055B3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 28,
          }}
        >
          ↑
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TypingIndicator: React.FC<{visible: boolean}> = ({visible}) => {
  const frame = useCurrentFrame();
  if (!visible) return null;
  const dots = [0, 1, 2].map((i) => {
    const t = (frame * 6 + i * 20) % 100;
    const y = Math.sin((t / 100) * Math.PI * 2) * 6;
    return (
      <div
        key={i}
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.6)',
          transform: `translateY(${y}px)`,
        }}
      />
    );
  });
  return (
    <div
      style={{
        alignSelf: 'flex-start',
        padding: '26px 32px',
        borderRadius: 32,
        borderBottomLeftRadius: 10,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: 10,
      }}
    >
      {dots}
    </div>
  );
};
