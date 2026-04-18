import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {StatusBar} from '../components/StatusBar';
import {AppIcon as EkkoAppIcon} from '../components/Logo';

const APPS: Array<{label: string; colors: [string, string]}> = [
  {label: 'Msg', colors: ['#34D399', '#10B981']},
  {label: 'Cal', colors: ['#F87171', '#DC2626']},
  {label: 'Mp', colors: ['#60A5FA', '#2563EB']},
  {label: 'Cam', colors: ['#A3A3A3', '#525252']},
  {label: 'Ph', colors: ['#FBBF24', '#F59E0B']},
  {label: 'Safari', colors: ['#38BDF8', '#0EA5E9']},
  {label: 'Mail', colors: ['#93C5FD', '#3B82F6']},
  {label: 'Notes', colors: ['#FDE68A', '#F59E0B']},
  {label: 'Photos', colors: ['#F472B6', '#DB2777']},
  {label: 'Clk', colors: ['#111827', '#1F2937']},
  {label: 'Set', colors: ['#9CA3AF', '#4B5563']},
  {label: 'App', colors: ['#3B82F6', '#1D4ED8']},
];

const DOCK: Array<{label: string; colors: [string, string]}> = [
  {label: 'Ph', colors: ['#22C55E', '#15803D']},
  {label: 'Sfr', colors: ['#38BDF8', '#0284C7']},
  {label: 'Msg', colors: ['#34D399', '#059669']},
  {label: 'Mus', colors: ['#F472B6', '#DB2777']},
];

const AppIcon: React.FC<{
  label: string;
  colors: [string, string];
  size?: number;
}> = ({label, colors, size = 150}) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.23,
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: size * 0.28,
            fontFamily: '-apple-system, sans-serif',
            fontWeight: 700,
            opacity: 0.85,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          color: '#fff',
          fontSize: 22,
          fontFamily: '-apple-system, sans-serif',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const HomeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  const tapStart = 28;
  const tapProgress = spring({frame: frame - tapStart, fps, config: {damping: 14, stiffness: 180}});
  const tapScale = interpolate(tapProgress, [0, 0.4, 1], [1, 0.86, 1]);

  const launchStart = 42;
  const launchProgress = spring({
    frame: frame - launchStart,
    fps,
    config: {damping: 200, mass: 0.5, stiffness: 70},
  });
  const ekkoScale = interpolate(launchProgress, [0, 1], [1, 14]);
  const ekkoOpacity = interpolate(frame, [launchStart, launchStart + 14], [1, 0.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const uiFadeOut = interpolate(frame, [launchStart, launchStart + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 30% 20%, #1a3a5c 0%, #0a1628 60%, #050a14 100%)',
        opacity: fadeIn,
      }}
    >
      <StatusBar />

      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          opacity: uiFadeOut,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 40,
            padding: '0 80px',
            width: '100%',
            maxWidth: 1000,
          }}
        >
          {APPS.map((app, i) => (
            <AppIcon key={i} label={app.label} colors={app.colors} />
          ))}
        </div>

      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 140,
          padding: '30px 60px',
          borderRadius: 48,
          margin: '0 40px',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          opacity: uiFadeOut,
        }}
      >
        {DOCK.map((app, i) => (
          <AppIcon key={i} label={app.label} colors={app.colors} size={130} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            transform: `scale(${ekkoScale * tapScale})`,
            opacity: ekkoOpacity,
            filter:
              frame >= launchStart
                ? 'drop-shadow(0 0 120px rgba(0,128,255,0.9))'
                : 'drop-shadow(0 20px 40px rgba(0,128,255,0.45))',
            borderRadius: 50,
            overflow: 'hidden',
            boxShadow:
              frame >= tapStart && frame < launchStart
                ? '0 0 0 10px rgba(255,255,255,0.75), 0 40px 90px rgba(0,128,255,0.75)'
                : '0 12px 44px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.18)',
          }}
        >
          <EkkoAppIcon size={220} rounded={false} />
        </div>
        <div
          style={{
            opacity: ekkoOpacity * uiFadeOut,
            color: '#fff',
            fontFamily: 'Arches, serif',
            fontStyle: 'italic',
            fontSize: 48,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: -1,
          }}
        >
          ekko
        </div>
      </div>
    </AbsoluteFill>
  );
};
