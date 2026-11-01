import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { LuChevronDown } from "react-icons/lu";
import { cx } from "../lib/format";

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface CommonSelectProps<T extends string> {
  value: T | undefined;
  item: readonly SelectOption<T>[];
  w?: number;
  onValueChange: (val: T) => void;
  className?: string;
  arrow?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export default function CommonSelect<T extends string>({
  value,
  item,
  w = 120,
  onValueChange,
  disabled = false,
  className,
  arrow,
  placeholder = "Select an option",
  "aria-label": ariaLabel,
}: CommonSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [box, setBox] = useState({ top: 0, left: 0, width: 160, maxHeight: 240 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = item.find((option) => option.value === value);

  function measure() {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const openUp = below < 180 && above > below;
    const maxHeight = Math.max(120, Math.min(280, openUp ? above : below));
    setBox({
      top: openUp ? Math.max(8, rect.top - maxHeight - 6) : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) return;
    measure();
    const selectedIndex = item.findIndex((option) => option.value === value);
    setActive(selectedIndex >= 0 ? selectedIndex : 0);

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(next: T) {
    onValueChange(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function move(step: number) {
    if (item.length === 0) return;
    setActive((current) => (current + step + item.length) % item.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else move(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (item[active]) choose(item[active].value);
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End" && open) {
      event.preventDefault();
      setActive(Math.max(0, item.length - 1));
    }
  }

  return (
    <div ref={rootRef} className={cx("relative", className)} style={{ minWidth: w }}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
        className={cx(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-card px-3 py-2.5 text-left text-sm text-ink outline-none transition focus:border-pine",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className={cx("truncate", !selected && "text-stone-400")}>{selected?.label ?? placeholder}</span>
        {arrow ? (
          <span aria-hidden>{arrow}</span>
        ) : (
          <LuChevronDown aria-hidden className={cx("h-4 w-4 shrink-0 text-mute transition", open && "rotate-180")} />
        )}
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
              className="fixed z-50 overflow-auto rounded-lg border border-line bg-card py-1 shadow-card"
            >
              {item.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === active;
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={isSelected}
                    className={cx(
                      "block w-full cursor-pointer px-3 py-2 text-left text-sm transition",
                      isSelected ? "bg-pine-soft font-medium text-pine-dark" : "text-ink hover:bg-paper",
                      isActive && !isSelected && "bg-paper",
                    )}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
