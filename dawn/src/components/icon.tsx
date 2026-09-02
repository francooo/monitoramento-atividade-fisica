import Image from "next/image";

/**
 * Cada ícone é o SVG exportado do Figma, servido de /public/icons.
 * As dimensões abaixo são as do arquivo original — passar `size` só é
 * necessário quando o mesmo glifo aparece em dois tamanhos diferentes.
 */
export const ICONS = {
  mail: { src: "/icons/mail.svg", size: 19 },
  lock: { src: "/icons/lock.svg", size: 19 },
  "lock-lg": { src: "/icons/lock-lg.svg", size: 28 },
  eye: { src: "/icons/eye.svg", size: 19 },
  user: { src: "/icons/user.svg", size: 19 },
  google: { src: "/icons/google.svg", size: 19 },
  apple: { src: "/icons/apple.svg", size: 19 },
  back: { src: "/icons/back.svg", size: 24 },
  bell: { src: "/icons/bell.svg", size: 23 },
  pin: { src: "/icons/pin.svg", size: 13 },
  more: { src: "/icons/more.svg", size: 20 },
  heart: { src: "/icons/heart.svg", size: 20 },
  comment: { src: "/icons/comment.svg", size: 20 },
  "tab-home": { src: "/icons/tab-home.svg", size: 23 },
  "tab-map": { src: "/icons/tab-map.svg", size: 23 },
  "tab-progress": { src: "/icons/tab-progress.svg", size: 23 },
  "tab-user": { src: "/icons/tab-user.svg", size: 23 },
  "tab-plus": { src: "/icons/tab-plus.svg", size: 26 },
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  alt?: string;
};

export function Icon({ name, size, className, alt = "" }: IconProps) {
  const icon = ICONS[name];
  const dimension = size ?? icon.size;

  return (
    <Image
      src={icon.src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={className}
      style={{ width: dimension, height: dimension }}
      aria-hidden={alt === "" ? true : undefined}
      priority={false}
    />
  );
}
