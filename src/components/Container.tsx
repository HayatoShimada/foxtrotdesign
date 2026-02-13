export function Container({
  children,
  size = "default",
}: {
  children: React.ReactNode;
  size?: "sm" | "default" | "lg";
}) {
  const maxWidth = {
    sm: "max-w-xl",
    default: "max-w-2xl",
    lg: "max-w-3xl",
  }[size];

  return (
    <div className={`${maxWidth} mx-auto px-4 md:px-12 py-6 md:py-12`}>
      {children}
    </div>
  );
}
