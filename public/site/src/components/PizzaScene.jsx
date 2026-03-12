import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float, PerspectiveCamera } from '@react-three/drei'

function PizzaDough() {
    const mesh = useRef()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        mesh.current.rotation.x = Math.cos(t / 4) / 8
        mesh.current.rotation.y = Math.sin(t / 4) / 8
        mesh.current.position.y = (1 + Math.sin(t / 1.5)) / 10
    })

    return (
        <Float speed={4} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={mesh} scale={2}>
                <torusGeometry args={[1, 0.4, 32, 100]} />
                <MeshDistortMaterial
                    color="#8B5CF6"
                    speed={3}
                    distort={0.4}
                    radius={1}
                />
            </mesh>
        </Float>
    )
}

export default function PizzaScene() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                <PizzaDough />
            </Canvas>
        </div>
    )
}
