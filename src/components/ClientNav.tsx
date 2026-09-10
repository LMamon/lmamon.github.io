import { useEffect, useState } from "react";
import Field from "./Field";
import { RadialNavOverlay } from "./NavOverlay";

const NAV = [
  {label: "ABOUT", href: "/", angle: -1.1},
  {label: "PROJECTS", href: "/projects", angle: -2},
  {label: "POSTS", href: "/posts", angle: 2.4},
];

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export default function ClientNav() {
  const [hoverAngle, setHoverAngle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) return;

      event.preventDefault();

      if (!event.repeat) setListening(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) return;

      event.preventDefault();

      setListening(false);
    };

    const onBlur = () => {
      setListening(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <>
      <Field
        hovered={hovered}
        hoverAngle={hoverAngle}
        listening={listening}
      />

      <RadialNavOverlay
        nav={NAV}
        onHover={(angle) => {
          setHoverAngle(angle);
          setHovered(true);
        }}
        onLeave={() => {
          setHovered(false);
        }}
      />
    </>
  );
}