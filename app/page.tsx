"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import {
    OrbitControls,
    ScrollControls,
    useHelper,
    useTexture,
} from "@react-three/drei";
import EarthDayMap from "../public/earth/2k_earth_daymap.jpg";
import EarthNightMap from "../public/earth/2k_earth_nightmap.jpg";
import EarthCloudsMap from "../public/earth/2k_earth_clouds.jpg";
import EarthNormalMap from "../public/earth/2k_earth_normal_map.jpg";
import EarthSpecularMap from "../public/earth/2k_earth_specular_map.jpg";
import { TextureLoader } from "three";

export default function Home() {
    return (
        <main className="flex min-h-screen w-screen h-screen flex-col items-center justify-between bg-black">
            <Canvas style={{ width: "100vw", height: "100vh" }}>
                <Scene />
            </Canvas>
        </main>
    );
}

function RotatingSphere() {
    const ref = useRef<THREE.Mesh>(null);
    const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(
        THREE.TextureLoader,
        [
            EarthDayMap.src,
            EarthNormalMap.src,
            EarthSpecularMap.src,
            EarthCloudsMap.src,
        ]
    );

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshPhongMaterial specularMap={specularMap} />
            <meshStandardMaterial map={colorMap} normalMap={normalMap} />
        </mesh>
    );
}

export function Scene() {
    return (
        <>
            <directionalLight position={[2, 2, 2]} intensity={1} />
            <OrbitControls enableZoom={true} />
            <ScrollControls pages={3} damping={0.25}>
                <RotatingSphere />
            </ScrollControls>
        </>
    );
}
