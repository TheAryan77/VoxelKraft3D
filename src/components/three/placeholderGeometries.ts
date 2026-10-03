import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { PlaceholderKind } from "@/lib/models.config";

/**
 * Procedural stand-ins for every model slot. Each kind is one merged geometry,
 * standing upright on Y, roughly 2 units tall.
 */

function merge(parts: THREE.BufferGeometry[]) {
  const prepared = parts.map((g) => {
    const geo = g.index ? g.toNonIndexed() : g;
    // mergeGeometries needs identical attribute sets.
    for (const name of Object.keys(geo.attributes)) {
      if (!["position", "normal", "uv"].includes(name)) geo.deleteAttribute(name);
    }
    return geo;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error("Placeholder geometry merge failed");
  return merged;
}

function at(geo: THREE.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  geo.rotateX(rx);
  geo.rotateY(ry);
  geo.rotateZ(rz);
  geo.translate(x, y, z);
  return geo;
}

function vase() {
  const profile = new THREE.CatmullRomCurve3(
    [
      [0.0, 0.0],
      [0.46, 0.0],
      [0.62, 0.22],
      [0.76, 0.62],
      [0.72, 0.98],
      [0.52, 1.32],
      [0.36, 1.58],
      [0.34, 1.78],
      [0.44, 1.98],
      [0.47, 2.02],
    ].map(([r, y]) => new THREE.Vector3(r, y, 0)),
    false,
    "centripetal",
  )
    .getSpacedPoints(34)
    .map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  return new THREE.LatheGeometry(profile, 32);
}

function gear() {
  const teeth = 14;
  const outer = 1;
  const root = 0.82;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const pts: [number, number][] = [
      [root, a0],
      [outer, a0 + step * 0.18],
      [outer, a0 + step * 0.48],
      [root, a0 + step * 0.66],
    ];
    pts.forEach(([r, a], j) => {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0 && j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.26, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const cut = new THREE.Path();
    cut.absarc(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.12, 0, Math.PI * 2, true);
    shape.holes.push(cut);
  }
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: 0.32,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 1,
    curveSegments: 10,
  });
  body.translate(0, 0, -0.16);
  const hub = at(new THREE.CylinderGeometry(0.34, 0.34, 0.56, 24, 1, true), 0, 0, 0, Math.PI / 2);
  const g = merge([body, hub]);
  g.translate(0, 1.05, 0);
  return g;
}

function figure() {
  const parts = [
    at(new THREE.CylinderGeometry(0.62, 0.66, 0.14, 32), 0, 0.07, 0),
    at(new THREE.CapsuleGeometry(0.13, 0.62, 4, 12), -0.17, 0.5, 0),
    at(new THREE.CapsuleGeometry(0.13, 0.62, 4, 12), 0.17, 0.5, 0),
    at(new THREE.CapsuleGeometry(0.3, 0.48, 6, 16), 0, 1.18, 0),
    at(new THREE.CapsuleGeometry(0.09, 0.52, 4, 10), -0.42, 1.2, 0, 0, 0, -0.35),
    at(new THREE.CapsuleGeometry(0.09, 0.52, 4, 10), 0.42, 1.2, 0, 0, 0, 0.35),
    at(new THREE.SphereGeometry(0.24, 20, 14), 0, 1.78, 0),
  ];
  return merge(parts);
}

function box() {
  const base = at(new RoundedBoxGeometry(1.5, 0.78, 1.05, 3, 0.07), 0, 0.39, 0);
  const lid = at(new RoundedBoxGeometry(1.5, 0.16, 1.05, 3, 0.05), 0, 0.98, 0);
  const tab = at(new RoundedBoxGeometry(0.5, 0.12, 0.08, 2, 0.03), 0, 0.68, 0.55);
  const port = at(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 18), -0.45, 0.4, 0.54, Math.PI / 2);
  const button = at(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 20), 0.42, 1.09, 0.2);
  return merge([base, lid, tab, port, button]);
}

function building() {
  const parts: THREE.BufferGeometry[] = [];
  const tiers: [number, number, number][] = [
    [1.4, 0.42, 1.1],
    [1.05, 0.78, 0.86],
    [0.78, 0.62, 0.66],
    [0.48, 0.42, 0.42],
  ];
  let y = 0;
  for (const [w, h, d] of tiers) {
    parts.push(at(new THREE.BoxGeometry(w, h, d), 0, y + h / 2, 0));
    // Floor slabs read as stacked layers.
    const floors = Math.max(1, Math.round(h / 0.2));
    for (let f = 1; f < floors; f++) {
      parts.push(at(new THREE.BoxGeometry(w + 0.06, 0.03, d + 0.06), 0, y + (f * h) / floors, 0));
    }
    y += h;
  }
  parts.push(at(new THREE.CylinderGeometry(0.02, 0.05, 0.4, 8), 0, y + 0.2, 0));
  return merge(parts);
}

/** Tip at the origin, pointing down. */
function nozzle() {
  const parts = [
    at(new THREE.ConeGeometry(0.15, 0.2, 24, 1, true), 0, 0.1, 0, Math.PI),
    at(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 6), 0, 0.25, 0),
    at(new RoundedBoxGeometry(0.62, 0.36, 0.48, 2, 0.03), 0.08, 0.48, 0),
    at(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 16), 0, 0.87, 0),
    at(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), 0, 0.82, 0),
    at(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), 0, 0.92, 0),
    at(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 24), 0, 1.02, 0),
  ];
  return merge(parts);
}

function torus() {
  const g = new THREE.TorusKnotGeometry(0.62, 0.2, 140, 14, 2, 3);
  g.computeBoundingBox();
  g.translate(0, -(g.boundingBox?.min.y ?? -0.9), 0);
  return g;
}

const builders: Record<PlaceholderKind, () => THREE.BufferGeometry> = {
  vase,
  gear,
  figure,
  box,
  building,
  nozzle,
  torus,
};

const cache = new Map<PlaceholderKind, { solid: THREE.BufferGeometry; edges: THREE.BufferGeometry }>();

/** Geometry is cached per kind; materials are created per slot. */
export function getPlaceholderGeometry(kind: PlaceholderKind) {
  let entry = cache.get(kind);
  if (!entry) {
    const solid = builders[kind]();
    const edges = new THREE.EdgesGeometry(solid, kind === "vase" ? 0.05 : 14);
    entry = { solid, edges };
    cache.set(kind, entry);
  }
  return entry;
}
