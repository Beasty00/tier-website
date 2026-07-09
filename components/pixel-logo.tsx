const cells = [
  "g", "g", "d", "d", "d", "g", "g", "g",
  "g", "d", "d", "g", "g", "d", "d", "g",
  "b", "b", "b", "b", "b", "b", "b", "b",
  "b", "e", "b", "b", "b", "b", "e", "b",
  "b", "b", "b", "b", "b", "b", "b", "b",
  "b", "b", "m", "m", "m", "m", "b", "b",
  "s", "s", "s", "l", "l", "s", "s", "s",
  "s", "s", "s", "s", "s", "s", "s", "s"
];

const tones: Record<string, string> = {
  g: "bg-emerald",
  d: "bg-[#1f7a3d]",
  b: "bg-[#4a2f1d]",
  e: "bg-diamond",
  m: "bg-lava",
  s: "bg-[#1a100b]"
};

export function PixelLogo({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <div className={size === "lg" ? "h-24 w-24" : "h-10 w-10"} aria-label="Minecraft pixel logo" role="img">
      <div className="grid h-full w-full grid-cols-8 gap-[2px] rounded-card border border-white/10 bg-black/60 p-2 shadow-glow">
        {cells.map((cell, index) => (
          <span key={`${cell}-${index}`} className={`${tones[cell]} rounded-[2px] shadow-inset`} />
        ))}
      </div>
    </div>
  );
}
