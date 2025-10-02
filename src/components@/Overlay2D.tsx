import { useGameStore } from "mods@utils/hooks";
import { useEffect, useState } from "react";

export default function OverlayUI({
  children,
  props,
  hidden = false,
}: {
  children?: React.ReactNode,
  props?: any,
  hidden?: boolean;
}): JSX.Element {
  "use client"

    const gameState = useGameStore((state: any) => state.GameState);
    const [state, setState] = useState(gameState as unknown as any);

    useEffect(() => {
        (async () => {
            setState(gameState);
        })();
    }, [gameState]);

  return (<>
      <div onTouchMoveCapture={(e) => e.preventDefault()} onClick={(e) => e.preventDefault()} onMouseOver={(e) => e.preventDefault()} className={"min-w-[100vw] min-h-[100vh] p-0 m-0 fixed overflow-hidden bg-none" + (hidden? " hidden": "")}>
          {children}
      </div>
  </>)
}