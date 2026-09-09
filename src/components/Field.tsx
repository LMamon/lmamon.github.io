import { useEffect, useRef } from "react";
import { Scene } from "../field/Scene";

export type FieldMode = | "idle" | "hover" | "listening";

type FieldProps = {
  mode: FieldMode;
  hoverAngle: number;
};

export default function Field({ mode, hoverAngle }: FieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const scene = new Scene(container);

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
}, []);

  useEffect(() => {sceneRef.current?.setState(mode, hoverAngle, ); }, 
                  [mode, hoverAngle]);

  return (
    <div
      ref={containerRef}
      className="field-canvas"
    />
  );
}