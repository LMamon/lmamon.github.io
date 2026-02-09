'use client';

import { useState } from "react";
import RadialNav from "./RadialNav";
import dynamic from "next/dynamic";
// import { RadialNavOverlay } from "./NavOverlay";

const NAV = [
  { label: "ABOUT", href: "/", angle: -1.1 },
  { label: "PROJECTS", href: "/projects", angle: -2 },
  { label: "POSTS", href: "/posts", angle: 2.4 },
];

const RadialNavOverlay = dynamic(
  () => import("./NavOverlay").then(m => m.RadialNavOverlay),
  { ssr: false }
);

export default function ClientNav() {
  const [active, setActive] = useState<number | null>(null);
  const [hoverAngle, setHoverAngle] = useState(0);
  const [hoverStrength, setHoverStrength] = useState(0);

  return (
    <>
      {/* <RadialNav active={active} /> */}
      
      <RadialNav
      hoverAngle={hoverAngle}
      hoverStrength={hoverStrength}
      />
      <RadialNavOverlay
        nav={NAV}
        onHover={(angle) => {
          setHoverAngle(angle);
          setHoverStrength(1);
        }}
        onLeave={() => setHoverStrength(0)}
        // active={active}
        // setActive={setActive}
      />
    </>
  );
}