import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/format";

function dollars(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PriceRange({
  min,
  max,
  floor,
  ceiling,
  sort,
  onPrice,
  onSort,
}: {
  min: number;
  max: number;
  floor: number;
  ceiling: number;
  sort?: string;
  onPrice: (min: number, max: number) => void;
  onSort: (sort: "price_asc" | "price_desc") => void;
}) {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);
  const lowRef = useRef(min);
  const highRef = useRef(max);
  const onPriceRef = useRef(onPrice);
  const timer = useRef<number>();
  onPriceRef.current = onPrice;

  useEffect(() => {
    lowRef.current = min;
    highRef.current = max;
    setLow(min);
    setHigh(max);
  }, [min, max]);

  function setLowValue(value: number) {
    lowRef.current = value;
    setLow(value);
  }

  function setHighValue(value: number) {
    highRef.current = value;
    setHigh(value);
  }

  function commit() {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onPriceRef.current(lowRef.current, highRef.current);
    }, 200);
  }

  const span = Math.max(1, ceiling - floor);
  const start = ((low - floor) / span) * 100;
  const end = ((high - floor) / span) * 100;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Price</p>
          <p className="text-sm text-mute">
            {dollars(low)} – {dollars(high)}
          </p>
        </div>
        <div className="flex rounded-full bg-paper p-1">
          <button
            type="button"
            className={cx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              sort === "price_asc" ? "bg-ink text-paper" : "text-mute hover:text-ink",
            )}
            onClick={() => onSort("price_asc")}
          >
            Low to high
          </button>
          <button
            type="button"
            className={cx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              sort === "price_desc" ? "bg-ink text-paper" : "text-mute hover:text-ink",
            )}
            onClick={() => onSort("price_desc")}
          >
            High to low
          </button>
        </div>
      </div>
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pine"
          style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          value={low}
          aria-label="Minimum price"
          aria-valuemin={floor}
          aria-valuemax={high}
          aria-valuenow={low}
          className="price-range"
          onChange={(event) => {
            setLowValue(Math.min(Number(event.target.value), highRef.current));
            commit();
          }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          value={high}
          aria-label="Maximum price"
          aria-valuemin={low}
          aria-valuemax={ceiling}
          aria-valuenow={high}
          className="price-range"
          onChange={(event) => {
            setHighValue(Math.max(Number(event.target.value), lowRef.current));
            commit();
          }}
        />
      </div>
    </div>
  );
}
