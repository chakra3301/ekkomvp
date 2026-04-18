import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {LogoGlyph, Wordmark} from '../components/Logo';

export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const glyphSpring = spring({frame, fps, config: {damping: 12, stiffness: 80, mass: 1}});
  const glyphScale = interpolate(glyphSpring, [0, 1], [3.5, 1]);
  const glyphOpacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  const wordmarkStart = 28;
  const wordmarkSpring = spring({
    frame: frame - wordmarkStart,
    fps,
    config: {damping: 15, stiffness: 90},
  });
  const wordmarkOpacity = interpolate(wordmarkSpring, [0, 1], [0, 1]);
  const wordmarkY = interpolate(wordmarkSpring, [0, 1], [60, 0]);

  const taglineStart = 50;
  const taglineOpacity = interpolate(frame, [taglineStart, taglineStart + 18], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const exitStart = 76;
  const exit = interpolate(frame, [exitStart, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitScale = interpolate(frame, [exitStart, 90], [1, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 40%, #0a2a55 0%, #050e20 60%, #020510 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: exit,
      }}
    >
      <div
        style={{
          transform: `scale(${glyphScale * exitScale})`,
          opacity: glyphOpacity,
          filter: 'drop-shadow(0 0 120px rgba(0,128,255,0.65))',
        }}
      >
        <LogoGlyph size={820} />
      </div>

      <div
        style={{
          marginTop: 20,
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <Wordmark size={260} />
      </div>

      <div
        style={{
          marginTop: 30,
          opacity: taglineOpacity,
          color: 'rgba(255,255,255,0.75)',
          fontFamily: '-apple-system, sans-serif',
          fontSize: 34,
          letterSpacing: 8,
          textTransform: 'uppercase',
          fontWeight: 300,
        }}
      >
        connect
      </div>
    </AbsoluteFill>
  );
};
