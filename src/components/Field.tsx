import { useEffect, useRef } from "react";
import { Scene } from "../field/Scene";

export default function Field() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new Scene(container);

    return () => {
      scene.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="field-canvas"
    />
  );
}