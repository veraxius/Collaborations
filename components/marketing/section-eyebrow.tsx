export function SectionEyebrow({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <p
      className={`mk-eyebrow ${
        dark
          ? "bg-signal-amber/15 text-signal-amber"
          : "bg-signal-amber/15 text-asphalt"
      }`}
    >
      {children}
    </p>
  );
}
