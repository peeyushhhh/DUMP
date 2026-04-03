import { useState } from "react";
import SplashCanvas from "./splash/SplashCanvas";
import SplashLoader from "./splash/SplashLoader";
import SplashText from "./splash/SplashText";

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("animating");
  const [msgOpacity, setMsgOpacity] = useState(0);
  const [msgY, setMsgY] = useState(40);
  const [cvOpacity, setCvOpacity] = useState(1);

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
    </div>
  );
}
