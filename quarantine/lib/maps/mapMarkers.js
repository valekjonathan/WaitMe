export function createCarMarkerHtml(color = "#9CA3AF") {
  return `
    <div style="
      width:14px;
      height:14px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.4);
    "></div>
  `;
}

export function createUserLocationHtml() {
  return `
    <div style="
      width:12px;
      height:12px;
      border-radius:50%;
      background:#3B82F6;
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.4);
    "></div>
  `;
}
