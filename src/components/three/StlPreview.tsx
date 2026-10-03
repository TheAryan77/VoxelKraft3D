"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { Bounds, Center, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { StudioLights } from "./StudioLights";

export interface StlDimensions {
  x: number;
  y: number;
  z: number;
}

interface StlPreviewProps {
  file: File;
  visible: boolean;
  onMeasured?: (dims: StlDimensions) => void;
  onFail?: () => void;
}

/**
 * Live preview of an uploaded STL (behind NEXT_PUBLIC_FEATURE_STL_PREVIEW).
 * STL units are assumed to be millimetres, which is the slicer convention.
 */
export function StlPreview({ file, visible, onMeasured, onFail }: StlPreviewProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    file
      .arrayBuffer()
      .then((buffer) => {
        if (cancelled) return;
        const geo = new STLLoader().parse(buffer);
        geo.computeBoundingBox();
        geo.computeVertexNormals();
        const size = geo.boundingBox!.getSize(new THREE.Vector3());
        onMeasured?.({ x: size.x, y: size.y, z: size.z });
        setGeometry(geo);
      })
      .catch(() => !cancelled && onFail?.());
    return () => {
      cancelled = true;
    };
    // Re-parse only when the file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d9d1c4", roughness: 0.55, metalness: 0 }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  const height = useMemo(() => {
    if (!geometry?.boundingBox) return 1;
    // STL is Z-up; the scene is Y-up.
    return geometry.boundingBox.max.z - geometry.boundingBox.min.z;
  }, [geometry]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.2, 4.4]} fov={30} near={0.01} far={10000} />
      <StudioLights />
      {geometry && (
        <>
          <Bounds fit clip observe margin={1.25} maxDuration={0.0001}>
            <Center>
              <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
            </Center>
          </Bounds>
          {visible && (
            <ContactShadows position={[0, -height / 2, 0]} scale={height * 4} far={height} resolution={256} blur={2.5} opacity={0.4} />
          )}
        </>
      )}
    </>
  );
}
