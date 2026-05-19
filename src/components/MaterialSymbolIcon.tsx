type MaterialSymbolIconName = "calendar_month" | "newspaper" | "partly_cloudy_day" | "train";

const iconPaths: Record<MaterialSymbolIconName, string> = {
  calendar_month: "calendar_month.svg",
  newspaper: "newspaper.svg",
  partly_cloudy_day: "partly_cloudy_day.svg",
  train: "train.svg",
};

export function MaterialSymbolIcon({
  className = "",
  name,
}: {
  className?: string;
  name: MaterialSymbolIconName;
}) {
  const iconUrl = `${import.meta.env.BASE_URL}icons/material-symbols/${iconPaths[name]}`;

  return (
    <span
      aria-hidden="true"
      className={`material-symbol-icon ${className}`}
      style={{
        WebkitMaskImage: `url("${iconUrl}")`,
        maskImage: `url("${iconUrl}")`,
      }}
    />
  );
}
