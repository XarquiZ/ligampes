'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import Image from 'next/image'

export function HeroImage() {
    const ref = useRef<HTMLDivElement>(null)

    // Mouse tilt effect
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseX = useSpring(x, { stiffness: 500, damping: 90 })
    const mouseY = useSpring(y, { stiffness: 500, damping: 90 })

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect()
        const xPoint = clientX - left - width / 2
        const yPoint = clientY - top - height / 2

        x.set(xPoint / width)
        y.set(yPoint / height)
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["10deg", "-10deg"])
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-10deg", "10deg"])

    return (
        <div className="w-full perspect-[2000px] mt-20 px-4 md:px-0">
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 100, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.2, type: "spring", bounce: 0.2 }}
                style={{
                    transformStyle: "preserve-3d",
                    rotateX: rotateX,
                    rotateY: rotateY,
                }}
                onMouseMove={onMouseMove}
                onMouseLeave={() => {
                    x.set(0)
                    y.set(0)
                }}
                className="relative w-full max-w-6xl mx-auto rounded-xl shadow-2xl shadow-emerald-500/20 border border-zinc-800 bg-zinc-900 overflow-hidden group cursor-pointer"
            >
                <div className="relative aspect-video">
                    <Image
                        src="/screens/dashboard.png"
                        alt="Liga.On Dashboard Interface"
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Reflection / Gloss Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
            </motion.div>
        </div>
    )
}
