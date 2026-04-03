/**
 * Bottom “collecting your thoughts” progress-style UI (dots + label).
 */
export default function SplashLoader({ visible }) {
  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {[0, 0.45, 0.9].map((delay, k) => (
          <div
            key={k}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#7c3aed",
              animation: `dumpDot 1.5s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            color: "#5b21b6",
            fontSize: 11,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          collecting your thoughts
        </span>
        {[0.9, 0.45, 0].map((delay, k) => (
          <div
            key={k}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#7c3aed",
              animation: `dumpDot 1.5s ease-in-out ${delay}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dumpDot {
          0%, 100% { opacity: 0.2; transform: scale(1) translateY(0px); }
          50%       { opacity: 1;   transform: scale(1.7) translateY(-2px); }
        }
      `}</style>
    </>
  );
}
