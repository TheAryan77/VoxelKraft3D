// Removes named nodes (and anything under them) from a .glb, e.g. game-engine
// collision meshes that shouldn't render on the site.
//   node scripts/strip-nodes.mjs input.glb output.glb Castle_Collider [OtherNode…]
import { NodeIO } from "@gltf-transform/core";
import { prune } from "@gltf-transform/functions";

const [input, output, ...names] = process.argv.slice(2);
if (!input || !output || names.length === 0) {
  console.error("Usage: node scripts/strip-nodes.mjs input.glb output.glb NodeName [NodeName…]");
  process.exit(1);
}

const io = new NodeIO();
const doc = await io.read(input);
let removed = 0;
for (const node of doc.getRoot().listNodes()) {
  if (names.includes(node.getName())) {
    node.traverse((n) => n.dispose());
    removed++;
  }
}
await doc.transform(prune());
await io.write(output, doc);
console.log(`Removed ${removed} node(s): ${names.join(", ")} -> ${output}`);
