import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export function ScrollRow({
  children,
  count,
  arrows = "edge",
}: {
  children: ReactNode;
  count: number;
  arrows?: "edge" | "cover";
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    function measure() {
      const node = scroller.current;
      if (!node) return;
      setEdges({
        left: node.scrollLeft > 8,
        right: node.scrollLeft + node.clientWidth < node.scrollWidth - 8,
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [count]);

  function slide(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(200, el.clientWidth * 0.72), behavior: "smooth" });
  }

  return (
    <div className="relative">
      {edges.left ? (
        <button type="button" aria-label="Previous" className={arrowClass("left", arrows)} onClick={() => slide(-1)}>
          <LuChevronLeft className="h-5 w-5" />
        </button>
      ) : null}
      <div ref={scroller} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth py-2">
        {children}
      </div>
      {edges.right ? (
        <button type="button" aria-label="Next" className={arrowClass("right", arrows)} onClick={() => slide(1)}>
          <LuChevronRight className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}

function arrowClass(side: "left" | "right", arrows: "edge" | "cover") {
  const place =
    arrows === "cover"
      ? `${side === "left" ? "left-1" : "right-1"} top-[5.94rem] h-14 w-8 -translate-y-1/2`
      : `${side === "left" ? "left-0" : "right-0"} top-8 h-10 w-10`;
  return `absolute ${place} z-10 grid place-items-center rounded-full border border-[#e4ddd2] bg-white text-[#3d3a36] shadow-md transition hover:scale-105 hover:bg-paper`;
}
