"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { DRACO_DECODER_PATH, type ModelFinish } from "@/lib/models.config";
import { sceneColors } from "@/lib/themeConfig";
import { useStore } from "@/lib/store";
import { appearanceStore } from "@/lib/theme";

/**
 * Drains colour from a material in its shader (after texture and vertex
 * colours are applied), for a raw, unpainted-print look.
 */
function applyRawFinish(material: THREE.Material, saturation: number) {
  const m = material as THREE.MeshStandardMaterial;
  if ("roughness" in m) m.roughness = Math.max(m.roughness, THREE.MathUtils.lerp(0.75, m.roughness, saturation));
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSaturation = { value: saturation };
    shader.fragmentShader = `uniform float uSaturation;\n${shader.fragmentShader}`.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      float vkLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      diffuseColor.rgb = mix(vec3(vkLuma), diffuseColor.rgb, uSaturation);`,
    );
  };
  m.customProgramCacheKey = () => `vk-saturation-${saturation}`;
  m.needsUpdate = true;
}

const baked = new WeakSet<THREE.Object3D>();

/**
 * Rigged models (characters) render through their skeleton, but a wireframe
 * drawn from the raw geometry would sit in the bind pose. Bakes each skinned
 * mesh into a plain mesh in its current pose, once per loaded file, so the
 * body, the wireframe, clipping and the auto-fit all agree.
 */
function bakeSkinnedMeshes(scene: THREE.Object3D) {
  if (baked.has(scene)) return;
  baked.add(scene);
  scene.updateMatrixWorld(true);
  const skinned: THREE.SkinnedMesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh);
  });
  const v = new THREE.Vector3();
  for (const mesh of skinned) {
    mesh.skeleton.update();
    const geometry = mesh.geometry.clone();
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      mesh.applyBoneTransform(i, v);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const plain = new THREE.Mesh(geometry, mesh.material);
    plain.name = mesh.name;
    plain.position.copy(mesh.position);
    plain.quaternion.copy(mesh.quaternion);
    plain.scale.copy(mesh.scale);
    mesh.parent?.add(plain);
    mesh.parent?.remove(mesh);
  }
}

/**
 * Loads a .glb (Draco-compressed by default) and returns a private clone, so
 * per-slot changes such as print-reveal clipping never leak into other slots.
 */
export function GLBModel({
  src,
  draco = true,
  saturation = 1,
  finish = "solid",
}: {
  src: string;
  draco?: boolean;
  saturation?: number;
  finish?: ModelFinish;
}) {
  const { scene } = useGLTF(src, draco ? DRACO_DECODER_PATH : false);
  const { palette, accent } = useStore(appearanceStore);
  const invalidate = useThree((s) => s.invalidate);

  // Shared by every mesh in the wireframe finish; recoloured when the appearance changes.
  const wire = useMemo(
    () => ({
      solid: new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
      line: new THREE.LineBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.85 }),
    }),
    [],
  );

  const clone = useMemo(() => {
    bakeSkinnedMeshes(scene);
    const root = scene.clone(true);
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const mesh of meshes) {
      if (finish === "wireframe") {
        // Raw mesh: a plain body with every triangle edge drawn on top.
        mesh.material = wire.solid.clone();
        const edges = new THREE.LineSegments(new THREE.WireframeGeometry(mesh.geometry), wire.line.clone());
        edges.name = "vk-wireframe";
        mesh.add(edges);
        continue;
      }
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
      if (saturation < 1) {
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => applyRawFinish(m, saturation));
      }
    }
    return root;
  }, [scene, saturation, finish, wire]);

  useEffect(() => {
    if (finish !== "wireframe") return;
    const colors = sceneColors(palette, accent);
    clone.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | THREE.LineBasicMaterial | undefined;
      if (!mat || Array.isArray(mat)) return;
      mat.color.set(o.name === "vk-wireframe" ? colors.wire : colors.solid);
    });
    invalidate();
  }, [clone, finish, palette, accent, invalidate]);

  useEffect(
    () => () => {
      clone.traverse((o) => {
        const obj = o as THREE.Mesh;
        if (obj.name === "vk-wireframe") obj.geometry.dispose();
        const mat = obj.material as THREE.Material | THREE.Material[] | undefined;
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      });
    },
    [clone],
  );

  useEffect(
    () => () => {
      wire.solid.dispose();
      wire.line.dispose();
    },
    [wire],
  );

  return <primitive object={clone} />;
}
