export default function FrontLayer() {
  return (
    <div
      className="layer-front"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Container for orbit chips with z > 0 */}
      <div
        id="skills-orbit-front"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
