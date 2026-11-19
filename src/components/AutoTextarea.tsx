import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (v: string) => void;
}

/** Поле, которое растёт вместе с текстом */
export function AutoTextarea({ value, onValueChange, className = "", ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={"field ruled " + className}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      {...rest}
    />
  );
}
