/* eslint-disable */
// Random Letter Swap — Originkit (adapted for React / Vite)

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useAnimate } from "framer-motion"

const useIsStaticRenderer = () => false

/**
 * RandomLetterSwap — text whose letters swap vertically on hover in a
 * random order. Two modes:
 *
 *   • forward  — plays the swap once on hover-enter. The handler is
 *     debounced leading + trailing (100ms) so quick repeated hovers
 *     still resolve cleanly. A `blocked` latch additionally suppresses
 *     overlapping runs until the last letter finishes.
 *
 *   • pingpong — plays forward on hover-enter, reverse on hover-leave,
 *     both debounced leading + trailing (100ms) so brief hover thrashing
 *     still settles to the correct final state.
 *
 * Per-letter class names (`.letter-N` and `.letter-secondary-N`) are
 * animated separately with their own delay so the swap order can be
 * shuffled at run-time.
 */
export default function RandomLetterSwap(props) {
    const {
        label = "LETTER SWAP",
        mode = "pingpong",
        reverse = false,
        staggerDuration = 0.05,
        ease,
        font,
        color = "inherit",
        onClick,
        style,
        className = "",
    } = props

    const isStatic = useIsStaticRenderer()
    const [scope, animate] = useAnimate()
    // forward-mode latch: ignore additional hovers until the active
    // animation finishes. pingpong mode ignores this.
    const [blocked, setBlocked] = useState(false)

    // Per-letter spring transition.
    const transition = useMemo(
        () => ease ?? { type: "spring", duration: 0.7, bounce: 0.2 },
        [ease]
    )

    // Shuffle real-letter slots leaving spaces out of the stagger
    const shuffleArray = (arr) => {
        const a = [...arr]
        a.sort(() => Math.random() - 0.5)
        return a
    }

    const mergeDelay = (base, i) => ({
        ...base,
        delay: i * staggerDuration,
    })

    // ---- Debounce machinery (shared by forward and pingpong) -------------
    const debouncedHoverStartRef = useRef(null)
    const debouncedHoverEndRef = useRef(null)
    const timerRefs = useRef({
        startTimer: null,
        startTrailing: false,
        endTimer: null,
        endTrailing: false,
    })

    useEffect(() => {
        if (isStatic) return

        // Only real letters get a stagger slot
        const letterIdxs = []
        const len = label ? label.length : 0
        for (let k = 0; k < len; k++) {
            if (label[k] !== " ") letterIdxs.push(k)
        }
        const count = letterIdxs.length

        // ---- Forward mode ------------------------------------------------
        const runForward = () => {
            if (blocked || count === 0) return
            setBlocked(true)
            const order = shuffleArray(letterIdxs)
            for (let i = 0; i < order.length; i++) {
                const idx = order[i]
                const isLast = i === order.length - 1
                animate(
                    `.letter-${idx}`,
                    { y: reverse ? "100%" : "-100%" },
                    mergeDelay(transition, i)
                ).then(() => {
                    animate(`.letter-${idx}`, { y: 0 }, { duration: 0 })
                })
                animate(
                    `.letter-secondary-${idx}`,
                    { top: "0%" },
                    mergeDelay(transition, i)
                ).then(() => {
                    animate(
                        `.letter-secondary-${idx}`,
                        { top: reverse ? "-100%" : "100%" },
                        { duration: 0 }
                    ).then(() => {
                        if (isLast) setBlocked(false)
                    })
                })
            }
        }

        // ---- Ping-pong mode ----------------------------------------------
        const runPingStart = () => {
            if (count === 0) return
            const order = shuffleArray(letterIdxs)
            for (let i = 0; i < order.length; i++) {
                const idx = order[i]
                animate(
                    `.letter-${idx}`,
                    { y: reverse ? "100%" : "-100%" },
                    mergeDelay(transition, i)
                )
                animate(
                    `.letter-secondary-${idx}`,
                    { top: "0%" },
                    mergeDelay(transition, i)
                )
            }
        }

        const runPingEnd = () => {
            if (count === 0) return
            const order = shuffleArray(letterIdxs)
            for (let i = 0; i < order.length; i++) {
                const idx = order[i]
                animate(`.letter-${idx}`, { y: 0 }, mergeDelay(transition, i))
                animate(
                    `.letter-secondary-${idx}`,
                    { top: reverse ? "-100%" : "100%" },
                    mergeDelay(transition, i)
                )
            }
        }

        const wait = 100
        const t = timerRefs.current

        const startBody = mode === "pingpong" ? runPingStart : runForward
        const endBody = runPingEnd

        debouncedHoverStartRef.current = () => {
            if (!t.startTimer) {
                startBody()
                t.startTimer = setTimeout(() => {
                    if (t.startTrailing) startBody()
                    t.startTrailing = false
                    t.startTimer = null
                }, wait)
            } else {
                t.startTrailing = true
            }
        }

        debouncedHoverEndRef.current = () => {
            if (!t.endTimer) {
                endBody()
                t.endTimer = setTimeout(() => {
                    if (t.endTrailing) endBody()
                    t.endTrailing = false
                    t.endTimer = null
                }, wait)
            } else {
                t.endTrailing = true
            }
        }

        return () => {
            if (t.startTimer) clearTimeout(t.startTimer)
            if (t.endTimer) clearTimeout(t.endTimer)
            t.startTimer = null
            t.endTimer = null
            t.startTrailing = false
            t.endTrailing = false
        }
    }, [
        isStatic,
        mode,
        reverse,
        staggerDuration,
        transition,
        animate,
        label,
        blocked,
    ])

    const hoverStart = () => {
        debouncedHoverStartRef.current?.()
    }
    const hoverEnd = () => {
        debouncedHoverEndRef.current?.()
    }

    // Accessible hidden span
    const srOnlyStyle = {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
    }

    const typeface = font || {}
    const fontCss = Object.fromEntries(
        Object.entries(typeface).filter(([k]) => k !== "textAlign")
    )

    const innerSpanStyle = {
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        ...fontCss,
        color: color === "inherit" ? undefined : color,
        cursor: onClick ? "pointer" : "default",
        paddingTop: "0.08em",
        paddingBottom: "0.12em",
    }

    const letters = label ? label.split("") : []
    const secondaryRestingTop = reverse ? "-100%" : "100%"
    const interactive = !isStatic

    const handlers = !interactive
        ? {}
        : mode === "pingpong"
          ? {
                onMouseEnter: hoverStart,
                onMouseLeave: hoverEnd,
                onClick,
            }
          : {
                onMouseEnter: hoverStart,
                onClick,
            }

    return (
        <div
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                maxWidth: "100%",
                ...style,
            }}
        >
            {letters.length === 0 ? null : (
                <span ref={scope} style={innerSpanStyle} {...handlers}>
                    <span style={srOnlyStyle}>{label}</span>
                    {letters.map((letter, i) => (
                        <span
                            key={i}
                            aria-hidden
                            style={{
                                whiteSpace: "pre",
                                position: "relative",
                                display: "inline-flex",
                            }}
                        >
                            <motion.span
                                className={`letter-${i}`}
                                style={{
                                    position: "relative",
                                    top: 0,
                                }}
                            >
                                {letter}
                            </motion.span>
                            <motion.span
                                className={`letter-secondary-${i}`}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: secondaryRestingTop,
                                }}
                            >
                                {letter}
                            </motion.span>
                        </span>
                    ))}
                </span>
            )}
        </div>
    )
}
