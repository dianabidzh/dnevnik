import { useEffect, useState } from "react";

/** Показывает картинку из Blob и освобождает память, когда она не нужна */
export function BlobImage({ blob, alt, className }: { blob: Blob; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <img src={url} alt={alt} className={className} /> : null;
}
