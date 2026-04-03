/**
 * Final welcome copy (DUMP title + tagline).
 */
export default function SplashText({ visible, msgOpacity, msgY }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        transform: `translateY(${msgY}px)`,
        opacity: msgOpacity,
        padding: "0 32px",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontSize: "clamp(10px, 1.6vw, 13px)",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "#6d28d9",
          marginBottom: 20,
          fontWeight: 600,
        }}
      >
        welcome to
      </div>

      <div
        style={{
          fontSize: "clamp(72px, 16vw, 130px)",
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.05em",
          lineHeight: 0.88,
          marginBottom: 28,
          textShadow: [
            "0 0 20px rgba(168,85,247,1)",
            "0 0 50px rgba(139,92,246,0.7)",
            "0 0 100px rgba(109,40,217,0.35)",
          ].join(", "),
        }}
      >
        DUMP
      </div>

      <div
        style={{
          width: 40,
          height: 1,
          margin: "0 auto 28px",
          background: "linear-gradient(90deg, transparent, #7c3aed, transparent)",
        }}
      />

      <div
        style={{
          fontSize: "clamp(14px, 2.8vw, 18px)",
          color: "#c4b5fd",
          fontWeight: 300,
          letterSpacing: "0.07em",
          lineHeight: 1.9,
        }}
      >
        dump your thoughts.
        <br />
        <span style={{ color: "#5b21b6", fontSize: "0.82em", letterSpacing: "0.18em" }}>
          no judgment. ever.
        </span>
      </div>
    </div>
  );
}
