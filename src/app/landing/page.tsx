// app/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, TrendingUp, Users, BookOpen, Shield, ChartBar, Zap, Globe, Award, CheckCircle, Activity, DollarSign, Target, Brain } from 'lucide-react'

// Improved Neural Network Background Component
const NeuralNetworkBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const updateCanvasSize = () => {
            canvas.width = window.innerWidth
            // Get the full height of the document
            canvas.height = document.documentElement.scrollHeight
        }

        updateCanvasSize()

        const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = []
        const nodeCount = 1000
        const connectionDistance = 500

        // Initialize nodes distributed across full page height
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 0.5
            })
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Update and draw nodes
            nodes.forEach((node, i) => {
                node.x += node.vx
                node.y += node.vy

                // Bounce off walls
                if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1
                if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1

                // Draw connections - connect to nearest 2-3 nodes only
                let connections = 0
                for (let j = i + 1; j < nodes.length && connections < 3; j++) {
                    const otherNode = nodes[j]
                    const dx = node.x - otherNode.x
                    const dy = node.y - otherNode.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance < connectionDistance) {
                        ctx.beginPath()
                        ctx.moveTo(node.x, node.y)
                        ctx.lineTo(otherNode.x, otherNode.y)
                        const opacity = (1 - distance / connectionDistance) * 0.15
                        ctx.strokeStyle = `rgba(100, 100, 100, ${opacity})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                        connections++
                    }
                }

                // Draw node
                ctx.beginPath()
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
                ctx.fillStyle = 'rgba(120, 120, 120, 0.3)'
                ctx.fill()
            })

            requestAnimationFrame(animate)
        }

        animate()

        const handleResize = () => {
            updateCanvasSize()
        }

        // Update canvas size when content changes
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize()
        })

        resizeObserver.observe(document.body)

        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            resizeObserver.disconnect()
        }
    }, [])

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full pointer-events-none" style={{ zIndex: 0 }} />
}

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) => {
    const [count, setCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [])

    useEffect(() => {
        if (!isVisible) return

        let startTime: number
        let animationFrame: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = (timestamp - startTime) / duration

            if (progress < 1) {
                setCount(Math.floor(end * progress))
                animationFrame = requestAnimationFrame(animate)
            } else {
                setCount(end)
            }
        }

        animationFrame = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationFrame)
    }, [end, duration, isVisible])

    return (
        <div ref={ref}>
            {prefix}{count.toLocaleString()}{suffix}
        </div>
    )
}

// Live Ping Animation Component
const LivePing = () => {
    return (
        <div className="relative inline-flex items-center">
      <span className="absolute inline-flex h-3 w-3 -left-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
            <span className="ml-3.5"></span>
        </div>
    )
}

export default function HomePage() {
    return (
        <div className="relative min-h-screen bg-white/90">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/80 pointer-events-none" style={{ zIndex: 1 }}></div>
            <NeuralNetworkBackground />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative" style={{ zIndex: 10 }}>
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100/95 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 mb-6 border border-gray-200">
                        <LivePing />
                        <span className="ml-1">Live : 2,847 traders online now</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
                        Trade With The 1%
                        <span className="block bg-gradient-to-r from-gray-700 via-black to-gray-700 bg-clip-text text-transparent">
              Not The 99%
            </span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Every trader verified. Every P&L authenticated. Every strategy transparent.
                        This is where serious money learns from serious traders.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                        <button className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors group">
                            Start Trading Smarter
                            <ArrowRight className="ml-2 w-5 h-5 transition-none" />
                        </button>
                        <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-black border-2 border-black rounded-lg font-semibold text-lg hover:bg-black hover:text-white transition-colors">
                            Watch Live Trades
                        </button>
                    </div>

                    {/* Enhanced Live Stats with Better Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200 hover:scale-105 transition-transform">
                            <div className="text-3xl font-black text-black mb-2">
                                <AnimatedCounter end={127} suffix="%" />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Avg. Annual Return</div>
                            <div className="text-xs text-gray-400 mt-1">Top 100 Traders</div>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-200 hover:scale-105 transition-transform">
                            <div className="text-3xl font-black text-black mb-2">
                                <AnimatedCounter end={3.2} suffix=":1" />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Avg. Risk/Reward</div>
                            <div className="text-xs text-gray-400 mt-1">Verified Trades</div>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-200 hover:scale-105 transition-transform">
                            <div className="text-3xl font-black text-black mb-2">
                                <AnimatedCounter end={47} prefix="$" suffix="M" />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Total Profits Shared</div>
                            <div className="text-xs text-gray-400 mt-1">Last 30 Days</div>
                        </div>
                        <div className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-lg border border-gray-200 hover:scale-105 transition-transform">
                            <div className="text-3xl font-black text-black mb-2">
                                <AnimatedCounter end={89} suffix="%" />
                            </div>
                            <div className="text-sm text-gray-600 font-medium">Win Rate Leaders</div>
                            <div className="text-xs text-gray-400 mt-1">500+ Trades Min.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trading Metrics Dashboard Preview */}
            <section className="relative py-20" style={{ position: 'relative', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center px-4 py-2 bg-gray-100/95 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 mb-6 border border-gray-200">
                            <LivePing />
                            <span className="ml-1">Live Metrics</span>
                        </div>
                        <h2 className="text-4xl font-black mb-4">Real Traders. Real Results. Real Time.</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Every trade verified. Every claim authenticated. Every strategy transparent.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Top Performer Card */}
                        <div className="bg-gradient-to-br from-black/95 to-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-gray-300 font-semibold">Today's Top Performer</div>
                                <CheckCircle className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="text-4xl font-black mb-2 text-green-400">+$18,470</div>
                            <div className="text-gray-300 mb-4">@TraderMike • SPY Options</div>
                            <div className="flex items-center space-x-4 text-sm">
                                <div>
                                    <div className="text-gray-400">Win Rate</div>
                                    <div className="font-bold">87%</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">ROI</div>
                                    <div className="font-bold">+284%</div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Trades</div>
                                    <div className="font-bold">12</div>
                                </div>
                            </div>
                        </div>

                        {/* Market Sentiment */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                            <h3 className="font-bold text-lg mb-6 flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-gray-600" />
                                Community Sentiment
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Bullish</span>
                                        <span className="font-bold text-green-600">68%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-300 to-green-600 rounded-full" style={{ width: '68%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Bearish</span>
                                        <span className="font-bold text-red-600">32%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-300 to-red-600 rounded-full" style={{ width: '32%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="text-sm text-gray-500">Based on 1,847 verified traders</div>
                            </div>
                        </div>

                        {/* Hot Strategies */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
                            <h3 className="font-bold text-lg mb-6 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
                                Trending Strategies
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50/90 backdrop-blur-sm rounded-lg hover:bg-gray-100/90 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-semibold">TSLA Iron Condor</div>
                                        <div className="text-sm text-gray-500">92% success rate</div>
                                    </div>
                                    <div className="text-green-600 font-bold">+42%</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-semibold">SPY 0DTE Scalp</div>
                                        <div className="text-sm text-gray-500">156 traders</div>
                                    </div>
                                    <div className="text-green-600 font-bold">+18%</div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-semibold">BTC Grid Bot</div>
                                        <div className="text-sm text-gray-500">24/7 automated</div>
                                    </div>
                                    <div className="text-green-600 font-bold">+8.4%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20" style={{ position: 'relative', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Built for Traders Who Mean Business</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Every feature designed to separate signal from noise
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-50/95 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group backdrop-blur-sm">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Broker-Verified P&L</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Connect TD Ameritrade, Interactive Brokers, or Robinhood. Your real returns, authenticated and displayed.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <ChartBar className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Copy Trading Engine</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Mirror verified traders automatically. Set risk limits, choose strategies, and let winners work for you.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <Target className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Strategy Backtesting</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Test any strategy against 10+ years of data. See real performance before risking real money.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Monetize Your Edge</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Proven track record? Charge for signals, education, or copy trading. We handle payments and verification.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Trading Rooms</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Live voice chat, screen sharing, and real-time trades. Learn by watching pros work in real-time.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <Brain className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">AI Trade Analysis</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Get instant feedback on every trade. Our AI analyzes setups, risk management, and suggests improvements.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20" style={{ position: 'relative', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Your Path to Trading Excellence</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join thousands who've transformed their trading in weeks, not years
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        <div className="relative group">
                            <div className="absolute -left-4 top-8 text-8xl font-black text-gray-100 select-none">01</div>
                            <div className="relative z-10 bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                    <Award className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Create Your Profile</h3>
                                <p className="text-gray-600">
                                    Sign up and optionally verify your trading accounts for credibility badges
                                </p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -left-4 top-8 text-8xl font-black text-gray-100 select-none">02</div>
                            <div className="relative z-10 bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Find Your Mentors</h3>
                                <p className="text-gray-600">
                                    Discover and follow traders with verified track records in your markets
                                </p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -left-4 top-8 text-8xl font-black text-gray-100 select-none">03</div>
                            <div className="relative z-10 bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Level Up Daily</h3>
                                <p className="text-gray-600">
                                    Learn from real trades, join discussions, and watch your performance improve
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof with Better Metrics */}
            <section className="relative py-20" style={{ position: 'relative', zIndex: 10 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Traders Who Found Their Edge</h2>
                        <p className="text-xl text-gray-600">
                            Real results from verified accounts
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Michael Chen",
                                role: "Options Trader",
                                content: "Went from -$8k to +$47k in 6 months after learning from verified pros. The copy trading feature literally changed my life.",
                                stats: { profit: "+$47,280", winRate: "73%", trades: "284" },
                                verified: true
                            },
                            {
                                name: "Sarah Williams",
                                role: "Day Trader",
                                content: "Finally found traders who show REAL broker statements. Made back my subscription cost in the first week.",
                                stats: { profit: "+$12,450", winRate: "81%", trades: "156" },
                                verified: true
                            },
                            {
                                name: "David Park",
                                role: "Swing Trader",
                                content: "The AI trade analysis helped me identify why I was losing. Fixed my risk management and now I'm consistently profitable.",
                                stats: { profit: "+$28,900", winRate: "67%", trades: "92" },
                                verified: true
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        ))}
                                    </div>
                                    {testimonial.verified && (
                                        <div className="flex items-center text-gray-600 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Verified
                                        </div>
                                    )}
                                </div>

                                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="font-semibold">{testimonial.name}</div>
                                            <div className="text-sm text-gray-500">{testimonial.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-around text-center">
                                        <div>
                                            <div className="text-green-600 font-bold">{testimonial.stats.profit}</div>
                                            <div className="text-xs text-gray-500">Total P&L</div>
                                        </div>
                                        <div>
                                            <div className="font-bold">{testimonial.stats.winRate}</div>
                                            <div className="text-xs text-gray-500">Win Rate</div>
                                        </div>
                                        <div>
                                            <div className="font-bold">{testimonial.stats.trades}</div>
                                            <div className="text-xs text-gray-500">Trades</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 bg-black text-white" style={{ position: 'relative', zIndex: 10 }}>
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold text-white/90 mb-8 border border-white/20">
                        <Zap className="w-4 h-4 mr-2 text-white" />
                        Limited Time: First 1,000 traders get Premium for 50% off!
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black mb-6">
                        Stop Learning From Losers
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                        Join the only platform where every educator shows verified broker statements.
                        Your time to level up is now.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                            Claim Your Spot
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </button>
                        <button className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white/50 rounded-lg font-semibold text-lg hover:bg-white hover:text-black transition-colors backdrop-blur">
                            See Live Demo
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-8">
                        No credit card required • 14-day free trial • Cancel anytime
                    </p>
                </div>
            </section>
        </div>
    )
}