// Removes TANGENT attributes from a .glb. three.js derives tangents for
// normal maps in the shader, so stored tangents are just extra bytes.
//   node scripts/strip-tangents.mjs input.glb output.glb
import { NodeIO } from "@gltf-transform/core";
import { prune } from "@gltf-transform/functions";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
let n = 0;
for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives())
    if (prim.getAttribute("TANGENT")) {
      prim.setAttribute("TANGENT", null);
      n++;
    }
await doc.transform(prune());
await io.write(output, doc);
console.log(`Removed TANGENT from ${n} primitive(s) -> ${output}`);
