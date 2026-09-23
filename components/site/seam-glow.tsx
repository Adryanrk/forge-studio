const TONES = {
  // Matches the shader/object's cool endpoint (see HeroScene's colorCool).
  cool: "82,79,77",
  // Matches the shader/object's warm endpoint (see HeroScene's colorWarm).
  warm: "115,77,46",
} as const;

/**
 * A soft, blurred radial glow reused at every major section seam so the
 * hero's atmosphere doesn't drop to flat black after one section. Kept
 * restrained (low opacity, heavy blur, offset above the heading) so it
 * reads as ambient light, never a shape, and never sits behind text.
 * Requires the parent section to be `position: relative`.
 */
export function SeamGlow({ tone = "cool" }: { tone?: keyof typeof TONES }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-[0.06] blur-3xl"
      style={{
        background: `radial-gradient(50% 100% at 50% 0%, rgb(${TONES[tone]}) 0%, transparent 70%)`,
      }}
    />
  );
}
