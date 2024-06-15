"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo, useLayoutEffect } from "react";
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
import gsap from "gsap";

export default function Home() {
    return (
        <main className="relative">
            <div className="absolute top-0 z-[-1]">
                <Canvas
                    style={{
                        backgroundColor: "red",
                        width: "100vw",
                        height: "100vh",
                    }}
                >
                    <Scene />
                </Canvas>
            </div>
            <h1>Hello my name is sam</h1>
        </main>
    );
}

function RotatingSphere() {
    const refEarth = useRef<THREE.Mesh>(null) as React.RefObject<THREE.Mesh>;
    const refClouds = useRef<THREE.Mesh>(null) as React.RefObject<THREE.Mesh>;
    const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useLoader(
        THREE.TextureLoader,
        [
            EarthDayMap.src,
            EarthNormalMap.src,
            EarthSpecularMap.src,
            EarthCloudsMap.src,
            EarthNightMap.src,
        ]
    );

    const earthMat = useMemo(() => {
        const material = new THREE.MeshStandardMaterial();
        material.onBeforeCompile = (shader) => {
            shader.uniforms.tClouds = { value: cloudsMap };
            shader.uniforms.tClouds.value.wrapS = THREE.RepeatWrapping;
            shader.uniforms.uv_xOffset = { value: 0 };
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <common>",
                `
                #include <common>
                uniform sampler2D tClouds;
                uniform float uv_xOffset;
              `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <roughnessmap_fragment>",
                `
                float roughnessFactor = roughness;

                #ifdef USE_ROUGHNESSMAP

                  vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
                  // reversing the black and white values because we provide the ocean map
                  texelRoughness = vec4(1.0) - texelRoughness;

                  // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
                  roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);

                #endif
              `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <emissivemap_fragment>",
                `
                #ifdef USE_EMISSIVEMAP

                  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

                  emissiveColor *= 1.0 - smoothstep(-0.02, 0.0, dot(vNormal, directionalLights[0].direction));

                  totalEmissiveRadiance *= emissiveColor.rgb;

                #endif

                float cloudsMapValue = texture2D(tClouds, vec2(vMapUv.x - uv_xOffset, vMapUv.y)).r;

                diffuseColor.rgb *= max(1.0 - cloudsMapValue, 0.2 );
                float intensity = 1.4 - dot(vNormal , vec3( 0.0, 0.0, 1.0 ) );
                vec3 atmosphere = vec3( 0.3, 0.6, 1.0 ) * pow(intensity, 5.0);
                diffuseColor.rgb += atmosphere;
              `
            );

            material.userData.shader = shader;
        };
        return material;
    }, []);

    useFrame((state, delta) => {
        if (refEarth.current && refClouds.current) {
            const interval = delta * 0.01;
            const speedFactor = 1; // replace with your speed factor
            refEarth.current.rotation.y += interval * 0.005 * speedFactor;
            refClouds.current.rotation.y += interval * 0.01 * speedFactor;

            const shader = earthMat.userData.shader;
            if (shader) {
                let offset = (interval * 0.005 * speedFactor) / (2 * Math.PI);
                shader.uniforms.uv_xOffset.value += offset % 1;
            }
        }
    });

    const groupRef = useRef<THREE.Group<THREE.Object3DEventMap>>(null);
    const tl = useRef<any>(null);

    useFrame(() => {
        tl.current.seek(window.scrollY * tl.current.duration());
    });

    useLayoutEffect(() => {
        tl.current = gsap.timeline();

        tl.current.to(
            groupRef.current.position,
            {
                duration: 2,
                y: -2.3 * (3 - 1),
            },
            0
        );
    }, []);

    return (
        <group ref={groupRef}>
            <mesh ref={refClouds}>
                <sphereGeometry args={[1.005, 64, 64]} />
                <meshStandardMaterial alphaMap={cloudsMap} transparent={true} />
            </mesh>
            <mesh ref={refEarth}>
                <sphereGeometry args={[1, 64, 64]} />
                <primitive
                    object={earthMat}
                    attach="material"
                    map={colorMap}
                    bumpMap={specularMap}
                    emissiveMap={nightMap}
                    emissive={new THREE.Color(0xffff88)}
                />
            </mesh>
        </group>
    );
}

export function Scene() {
    return (
        <>
            <directionalLight
                color={0xffffff}
                intensity={1.3}
                position={[-50, 0, 30]}
            />
            <OrbitControls enableZoom={false} />
            <ScrollControls pages={3} damping={0.25}>
                <RotatingSphere />
            </ScrollControls>
        </>
    );
}
