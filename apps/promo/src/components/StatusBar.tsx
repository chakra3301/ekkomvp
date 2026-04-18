export const StatusBar: React.FC<{tint?: string}> = ({tint = '#FFFFFF'}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        padding: '24px 56px 0 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: tint,
        fontFamily: '-apple-system, sans-serif',
        fontSize: 34,
        fontWeight: 600,
        zIndex: 50,
      }}
    >
      <span>9:41</span>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{fontSize: 28}}>••••</span>
        <span style={{fontSize: 28}}>📶</span>
        <div
          style={{
            width: 42,
            height: 22,
            border: `2px solid ${tint}`,
            borderRadius: 5,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 2,
              background: tint,
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};
