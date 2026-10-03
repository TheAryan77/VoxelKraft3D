// Regenerates public/map/world-dots.svg, the dotted world map used by the
// delivery section:  node scripts/generate-world-map.mjs
//
// Generated once here instead of in the browser, so dotted-map (350 KB of
// country data plus proj4) never ships to visitors. Each dot is drawn as a
// zero-length round-capped stroke inside one <path>, which keeps the file small.
// If you change the region or height, update MAP in src/components/ui/world-map.tsx.
import fs from "node:fs";
import DottedMap from "dotted-map";

const map = new DottedMap({ height: 100, grid: "diagonal" });
const { width, height } = map.image;
const points = Object.values(map.points);
const d = points.map((p) => `M${+p.x.toFixed(2)} ${+p.y.toFixed(2)}h0`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path d="${d}" stroke="#000" stroke-width="0.44" stroke-linecap="round" fill="none"/></svg>\n`;
fs.writeFileSync(new URL("../public/map/world-dots.svg", import.meta.url), svg);
console.log(`world-dots.svg: ${width}x${height}, ${points.length} dots, ${(svg.length / 1024).toFixed(0)} KB`, JSON.stringify(map.image.region));
