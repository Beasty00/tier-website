import { cn } from "@/lib/utils";

type IconAsset = {
  className?: string;
  pixelated?: boolean;
  src: string;
};

const icons: Record<string, IconAsset> = {
  overall: { src: "/mode-emojis/trophy.svg" },
  ltms: { src: "/mode-emojis/crossed-swords.svg" },
  vanilla: { src: "/minecraft-items/end_crystal.png", pixelated: true },
  uhc: { src: "/mode-emojis/heart.svg" },
  pot: { src: "/minecraft-items/potion.png", pixelated: true },
  nethop: { src: "/mode-emojis/skull.svg", className: "mode-icon-nethop" },
  smp: { src: "/minecraft-items/ender_pearl.png", pixelated: true },
  sword: { src: "/minecraft-items/diamond_sword.png", pixelated: true },
  axe: { src: "/minecraft-items/diamond_axe.png", pixelated: true },
  mace: { src: "/minecraft-items/mace.png", pixelated: true }
};

type MinecraftItemIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "tab";
  slug: string;
  variant?: "framed" | "plain";
};

export function MinecraftItemIcon({ className = "", size = "md", slug, variant = "framed" }: MinecraftItemIconProps) {
  const item = icons[slug] || icons.sword;
  const boxSize = size === "lg" ? "h-10 w-10" : size === "tab" ? "h-8 w-8" : size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const imageSize = size === "lg" ? "h-7 w-7" : size === "tab" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <span
      className={cn(
        "grid place-items-center",
        boxSize,
        variant === "framed" && "rounded-xl border border-white/10 bg-[#101722] shadow-inset",
        className
      )}
    >
      <img
        src={item.src}
        alt=""
        draggable={false}
        className={cn("object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]", imageSize, item.pixelated && "pixelated", item.className)}
      />
    </span>
  );
}
