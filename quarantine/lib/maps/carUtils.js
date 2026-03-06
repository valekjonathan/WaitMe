export const carColors = {
  gris: "#9CA3AF",
  blanco: "#FFFFFF",
  negro: "#111827",
  rojo: "#EF4444",
  azul: "#3B82F6",
  verde: "#10B981",
  amarillo: "#F59E0B"
};

export function getCarColor(color) {
  if (!color) return carColors.gris;
  return carColors[color] || carColors.gris;
}
