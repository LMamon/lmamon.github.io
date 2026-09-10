import { useEffect, useRef } from "react";
import { Scene } from "../field/Scene";

type FieldProps = {
  hovered: boolean;
  hoverAngle: number;
  listening: boolean;
};

export default function Field({hovered, hoverAngle, listening}: FieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene(container);
    sceneRef.current = scene;

    return () => { scene.dispose(); sceneRef.current = null; }; }, []);

  useEffect(() => { sceneRef.current?.setHover(hoverAngle, hovered); }, [hoverAngle, hovered]);
  useEffect(() => { sceneRef.current?.setListening(listening); }, [listening]);

  return (
    <div
      ref={containerRef}
      className="field-canvas"
    />
  );
}