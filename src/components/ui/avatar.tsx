import Image, { type ImageProps } from "next/image";
import type { HTMLAttributes } from "react";

const cn = (...inputs: Array<string | false | null | undefined>) =>
  inputs.filter(Boolean).join(" ");

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="avatar"
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-amber-200", className)}
      {...props}
    />
  );
}

type AvatarImageProps = Omit<ImageProps, "fill">;

export function AvatarImage({ className, alt, width = 40, height = 40, src, ...props }: AvatarImageProps) {
  return (
    <Image
      data-slot="avatar-image"
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      width={width}
      height={height}
      src={src}
      sizes={props.sizes ?? "40px"}
      {...props}
    />
  );
}

interface AvatarFallbackProps extends HTMLAttributes<HTMLSpanElement> {
  initials?: string;
}

export function AvatarFallback({ className, initials, ...props }: AvatarFallbackProps) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-amber-700",
        className,
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
