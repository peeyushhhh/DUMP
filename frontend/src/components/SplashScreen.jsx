import { useState } from "react";
import SplashCanvas from "./splash/SplashCanvas";
import SplashLoader from "./splash/SplashLoader";
import SplashText from "./splash/SplashText";

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("animating");
  const [msgOpacity, setMsgOpacity] = useState(0);
  const [msgY, setMsgY] = useState(40);
  const [cvOpacity, setCvOpacity] = useState(1);
  const [skipHover, setSkipHover] = useState(false);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#05010f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      <SplashCanvas
        cvOpacity={cvOpacity}
        setCvOpacity={setCvOpacity}
        setPhase={setPhase}
        setMsgOpacity={setMsgOpacity}
        setMsgY={setMsgY}
        onComplete={onComplete}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 45%, rgba(5,1,15,0.65) 100%)",
        }}
      />

      <SplashLoader visible={phase === "animating"} />

      <SplashText
        visible={phase === "message"}
        msgOpacity={msgOpacity}
        msgY={msgY}
      />

      <button
        type="button"
        onClick={() => onComplete?.()}
        onMouseEnter={() => setSkipHover(true)}
        onMouseLeave={() => setSkipHover(false)}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          background: "transparent",
          border: `1px solid ${skipHover ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)"}`,
          color: skipHover ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
          padding: "8px 20px",
          borderRadius: "20px",
          fontSize: "14px",
          cursor: "pointer",
          zIndex: 9999,
          fontFamily: "'Space Grotesk', sans-serif",
          pointerEvents: "auto",
        }}
      >
        Skip
      </button>
    </div>
  );
}
