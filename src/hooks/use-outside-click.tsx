import React, { useEffect } from "react";

export const useOutsideClick = (ref: React.RefObject<HTMLElement | null>, callback: (event: Event) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if the click is inside the element.
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      callback(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
};
