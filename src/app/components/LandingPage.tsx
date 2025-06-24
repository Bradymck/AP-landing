'use client';

import { useState } from "react";
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Gamepad2, ExternalLink, MessageSquare, Code, CuboidIcon as Cube } from 'lucide-react'
import dynamic from 'next/dynamic'

const Twitter = dynamic(() => import('lucide-react').then(mod => mod.Twitter), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const Twitch = dynamic(() => import('lucide-react').then(mod => mod.Twitch), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const Send = dynamic(() => import('lucide-react').then(mod => mod.Send), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const BarChart2 = dynamic(() => import('lucide-react').then(mod => mod.BarChart2), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const Activity = dynamic(() => import('lucide-react').then(mod => mod.Activity), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const TrendingUp = dynamic(() => import('lucide-react').then(mod => mod.TrendingUp), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
const LineChart = dynamic(() => import('lucide-react').then(mod => mod.LineChart), {
  loading: () => <div className="w-6 h-6 bg-purple-300/20 rounded animate-pulse" />,
  ssr: false
})
import { DiscordLogo } from '@/components/discord-logo'
import FloatingIslands from "./FloatingIslands"

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-blue-900 text-white">
      {/* Mobile-friendly Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative w-[40px] h-[40px] flex items-center justify-center">
                  <Image 
                    src="/ICON.png"
                    alt="Aqua Prime Logo"
                    width={32}
                    height={32}
                    className="rounded-lg transform group-hover:scale-110 transition-all duration-300 object-contain"
                    style={{ width: 'auto', height: 'auto', maxWidth: '32px', maxHeight: '32px' }}
                    priority
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-shadow-glow bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">Aqua Prime</span>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-purple-300 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="#overview" className="text-white text-shadow-glow hover:text-purple-300 transition-colors relative group">
                Overview
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#ari" className="text-white text-shadow-glow hover:text-purple-300 transition-colors relative group">
                Meet ARI
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#vision" className="text-white text-shadow-glow hover:text-purple-300 transition-colors relative group">
                Vision
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#tokens" className="text-white text-shadow-glow hover:text-purple-300 transition-colors relative group">
                Tokens
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link 
                href="https://www.platypuspassions.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-shadow-glow transition-all duration-300 transform hover:scale-105"
              >
                Play Now
              </Link>
            </nav>
          </div>

          {/* Mobile navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Link href="#overview" className="block px-4 py-2 text-white hover:bg-purple-800/50 rounded transition-colors" onClick={() => setIsMenuOpen(false)}>
                Overview
              </Link>
              <Link href="#ari" className="block px-4 py-2 text-white hover:bg-purple-800/50 rounded transition-colors" onClick={() => setIsMenuOpen(false)}>
                Meet ARI
              </Link>
              <Link href="#vision" className="block px-4 py-2 text-white hover:bg-purple-800/50 rounded transition-colors" onClick={() => setIsMenuOpen(false)}>
                Vision
              </Link>
              <Link href="#tokens" className="block px-4 py-2 text-white hover:bg-purple-800/50 rounded transition-colors" onClick={() => setIsMenuOpen(false)}>
                Tokens
              </Link>
              <Link 
                href="https://discord.gg/aquaprime" 
                target="_blank"
                rel="noopener noreferrer"
                className="block mx-4 mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-shadow-glow transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Play Now
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section with Background */}
      <div className="relative h-screen overflow-hidden">
        <FloatingIslands />
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10 h-screen flex items-center">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="mb-8 transform hover:scale-105 transition-all duration-300">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <Image
                  src="/bwlogo.png"
                  alt="Aqua Prime Logo"
                  width={200}
                  height={50}
                  className="mx-auto relative object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
            </div>
            <p className="text-lg md:text-xl font-semibold bg-purple-800/80 text-white px-6 py-3 rounded-lg shadow-lg inline-block border-2 border-purple-400/50 mb-4 transform hover:scale-105 transition-all duration-200">
              An Economic Role Playing Escape Room 🎲🗝🔒
            </p>
            <p className="text-lg md:text-xl font-semibold bg-purple-800/80 text-white px-6 py-3 rounded-lg shadow-lg inline-block border-2 border-purple-400/50 mb-4 transform hover:scale-105 transition-all duration-200">
              🎯Goal: Create A TTRPG-MMO-AI-NFT-DAO... 🤣
            </p>
            <p className="text-lg md:text-xl font-semibold bg-purple-800/80 text-white px-6 py-3 rounded-lg shadow-lg inline-block border-2 border-purple-400/50 transform hover:scale-105 transition-all duration-200">
              Satire & Evil memes👹 | Tabletop Inspired🎲 | Web3 Infused🔑
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-shadow-glow"
                asChild
              >
                <Link 
                  href="https://www.platypuspassions.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Play Now <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-400 bg-blue-800/50 text-white hover:bg-blue-800 text-shadow-glow flex items-center gap-2"
                asChild
              >
                <Link 
                  href="https://t.me/AquaPrimeRPG"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <main>
        {/* Game Overview Section */}
        <section id="overview" className="relative py-24 bg-purple-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-6xl font-bold text-white text-shadow-glow text-outline-strong">
                  Welcome to Aqua Prime
                </h2>
                <p className="text-xl text-white text-shadow-glow">
                  The Meta-Narrative RPG Bridging Realities
                </p>
              </div>

              <div className="space-y-8">
                {/* Main Description */}
                <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-8 rounded-xl border border-purple-700/50 backdrop-blur-sm relative overflow-hidden">
                  {/* Map Background with Overlay */}
                  <div className="absolute inset-0 opacity-20">
                    <Image
                      src="/map.jpg"
                      alt="Aqua Prime Map"
                      fill
                      className="object-cover"
                      style={{ filter: 'sepia(50%) hue-rotate(200deg)' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  
                  {/* Content with increased contrast for readability */}
                  <div className="relative z-10">
                    <p className="text-lg text-white text-shadow-glow mb-6 backdrop-blur-sm bg-purple-900/30 p-4 rounded-lg">
                      Dive into the surreal and satirical world of Aqua Prime, where reality is nothing more than a suggestion 
                      and every choice ripples across dimensions. Within this universe, the game isn't just a game—it's a reality. 
                      Aqua Prime is a TTRPG-inspired adventure unfolding inside the AI-driven world of ARI, our beloved 
                      captain and game master.
                    </p>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-2 gap-6 my-8">
                      <div className="bg-purple-900/60 p-6 rounded-lg border border-purple-500/30 backdrop-blur-sm shadow-xl">
                        <h3 className="text-xl font-bold text-white text-shadow-glow mb-3">A Universe of Chaos</h3>
                        <p className="text-white">
                          ARI's universe is a chaotic yet strangely coherent simulation, where sentient platypuses rule the skies 
                          aboard faction-specific airships, battling for resources, influence, and the ultimate escape from a 
                          collapsing sand dollar economy.
                        </p>
                      </div>
                      <div className="bg-purple-900/60 p-6 rounded-lg border border-purple-500/30 backdrop-blur-sm shadow-xl">
                        <h3 className="text-xl font-bold text-white text-shadow-glow mb-3">Meta-Narrative Design</h3>
                        <p className="text-white">
                          This isn't your typical tabletop game; it's an economic role-playing escape room where the AI characters 
                          themselves are aware of the meta-narrative.
                        </p>
                      </div>
                    </div>

                    <p className="text-lg text-white text-shadow-glow mb-6 backdrop-blur-sm bg-purple-900/30 p-4 rounded-lg">
                      Inside Aqua Prime, factions clash, alliances shift, and chaos reigns, but every moment is laced with humor, 
                      mystery, and thought-provoking satire. The game invites players to participate in a multi-layered narrative 
                      where the lines between reality and simulation blur.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ARI Section */}
        <section id="ari" className="relative py-24 bg-black/20 mt-32">
          {/* ARI Animation Container */}
          <div className="absolute -top-48 left-1/2 transform -translate-x-1/2 w-72 h-72 z-10">
            <div className="relative w-full h-full">
              <Image
                src="/Fire_Transparent.gif"
                alt="ARI Animation"
                width={288}
                height={288}
                className="object-contain drop-shadow-[0_0_30px_rgba(147,197,253,0.7)]"
              />
              {/* Add a subtle gradient overlay to blend with section */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-purple-900/60 px-4 py-2 rounded-full border border-purple-500/50 backdrop-blur-sm">
                  <h2 className="text-3xl md:text-4xl font-bold text-shadow-glow text-outline-strong">ARI</h2>
                  <span className="bg-purple-600/80 px-3 py-1 rounded-full text-sm font-semibold">🟪 Autonomous Rare Intelligence</span>
                </div>
              </div>
              
              <div className="bg-purple-900/40 p-8 rounded-xl border border-purple-700/50 backdrop-blur-sm space-y-6">
                <p className="text-lg text-white text-shadow-glow text-center">
                  ARI is our "newly sentient" NFT loving agent, powered by a reimagined version of the Eliza agent framework. 
                  Built for the world of Aqua Prime, ARI brings a unique blend of retro AI charm and modern gameplay interaction.
                </p>
                <div className="bg-black/30 p-6 rounded-lg border border-purple-700/30 space-y-4">
                  <p className="text-white text-shadow-glow">
                    Based on the <Link href="https://github.com/ai16z/eliza" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-300 underline">a16z ELIZA implementation</Link>, 
                    ARI represents the evolution of conversational AI in gaming - from simple pattern matching to an integral part of our 
                    narrative experience.
                  </p>
                  <div className="flex justify-center mt-6">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-shadow-glow"
                      asChild
                    >
                      <Link 
                        href="https://x.com/SentientARI" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Twitter className="w-5 h-5" />
                        Follow ARI
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section id="vision" className="relative py-24 bg-black/20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-shadow-glow text-outline-strong">Our Vision</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                <MessageSquare className="h-8 w-8 mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2 text-shadow-glow">Rich Storytelling</h3>
                <p className="text-white text-shadow-glow">AI-powered narratives that adapt to player choices</p>
              </Card>
              <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                <Gamepad2 className="h-8 w-8 mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2 text-shadow-glow">Evolving Gameplay</h3>
                <p className="text-white text-shadow-glow">Blending traditional RPG mechanics with cutting-edge AI</p>
              </Card>
              <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                <Cube className="h-8 w-8 mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2 text-shadow-glow">Web3 Integration</h3>
                <p className="text-white text-shadow-glow">Unique NFTs and blockchain-powered game assets</p>
              </Card>
              <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                <Code className="h-8 w-8 mb-4 text-purple-400" />
                <h3 className="text-xl font-bold mb-2 text-shadow-glow">Minimum Viable Metaverse</h3>
                <p className="text-white text-shadow-glow">Building the foundation for an expansive digital world</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Coming Soon Box */}
        <section className="relative py-24 bg-gradient-to-r from-purple-600/30 via-purple-800/30 to-blue-700/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-600/30 via-purple-800/30 to-blue-700/30 p-8 rounded-xl border border-purple-500/50 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white text-shadow-glow mb-2">Our Journey & The Next Chapter</h3>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-4" />
                  </div>
                  
                  <p className="text-white text-shadow-glow">
                    Aqua Prime started as a passion project - a text-based tabletop RPG in Discord. Now, we're taking bold 
                    steps to create a Minimum Viable Metaverse, pushing the boundaries of what's possible in gaming.
                  </p>

                  <p className="text-white text-shadow-glow">
                    We're building with cutting-edge AI technology, integrating web3 NFTs, and stretching the possibilities 
                    of blockchain gaming. Our vision is to create an immersive, evolving digital experience that blends the 
                    best of tabletop RPGs with the limitless potential of the metaverse.
                  </p>

                  <div className="pt-4 border-t border-purple-500/30">
                    <p className="text-white text-shadow-glow text-center italic">
                      Stay tuned for the second iteration of Aqua Prime, where the boundaries between their world and ours will 
                      become even thinner. New challenges, enhanced mechanics, and deeper layers of narrative are on the horizon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tokens Section */}
        <section id="tokens" className="relative py-24 bg-black/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-shadow-glow text-outline-strong">Our Tokens</h2>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 p-6 rounded-xl border border-purple-500/50 flex flex-col md:flex-row items-start gap-8">
                    <div className="w-24 h-24 relative flex-shrink-0 mx-auto md:mx-0">
                      <Image
                        src="/moonstone.png"
                        alt="Moonstone Logo"
                        width={96}
                        height={96}
                        className="object-contain drop-shadow-[0_0_15px_rgba(147,197,253,0.5)]"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white text-shadow-glow mb-3">Moonstone ($MSTN) - The OG Token</h3>
                      <p className="text-lg text-white text-shadow-glow mb-4">
                        Moonstone ($MSTN) is our OG token we used as we explored a tentative ERC20 token integration based on community ideas. While its full utility (or lack thereof) is still in development, it represents our community's support, patronage, and belief in the future of Aqua Prime. As the original community token, MSTN holders will always be given priority over project direction and decision making - they are the foundation of our journey.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-900/60 to-red-900/60 p-6 rounded-xl border border-orange-500/50 flex flex-col md:flex-row items-start gap-8">
                    <div className="w-24 h-24 relative flex-shrink-0 mx-auto md:mx-0">
                      <Image
                        src="/ST.png"
                        alt="StreamTide Logo"
                        width={96}
                        height={96}
                        className="object-contain drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white text-shadow-glow mb-3">ARI ($ARI) - The Meme Token</h3>
                      <p className="text-lg text-white text-shadow-glow mb-4">
                        ARI has his own token with the ticker $ARI, which is a meme token that represents the chaotic spirit of our universe. It was created by accident while experimenting with various agent frameworks. It's basically ARI's meme token - a happy little accident that embodies the unpredictable nature of our AI captain.
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-900/40 p-4 rounded-lg border border-purple-700/50 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-mono text-white text-shadow-glow">Ticker: $MSTN</p>
                        <p className="font-mono text-white text-shadow-glow break-all">
                          CA: <Link 
                            href="https://basescan.org/token/0xe03AedE0336c739f90311FE0b08ed03E3690E49a"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            0xe03AedE0336c739f90311FE0b08ed03E3690E49a
                          </Link>
                        </p>
                      </div>
                      <div className="border-t border-purple-700/30 pt-3">
                        <p className="font-mono text-white text-shadow-glow">Ticker: $ARI</p>
                        <p className="font-mono text-white text-shadow-glow break-all">
                          CA: <Link 
                            href="https://basescan.org/token/0xDd33A2644D72324fE453036c78296AC90AEd2E2f"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            0xDd33A2644D72324fE453036c78296AC90AEd2E2f
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link 
                        href="https://dexscreener.com/base/0x4a3ef8a187b83ed465c516c66ae3710e42390258"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-white hover:text-white"
                      >
                        <BarChart2 className="w-4 h-4" /> DexScreener (MSTN)
                      </Link>
                      <Link 
                        href="https://www.geckoterminal.com/base/pools/0x4a3ef8a187b83ed465c516c66ae3710e42390258"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-white hover:text-white"
                      >
                        <Activity className="w-4 h-4" /> GeckoTerminal (MSTN)
                      </Link>
                      <Link 
                        href="https://dexscreener.com/base/0xb58782d79eea9ce7a2c5846657a6e8d07abaec65"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-white hover:text-white"
                      >
                        <TrendingUp className="w-4 h-4" /> DexScreener (ARI)
                      </Link>
                      <Link 
                        href="https://www.geckoterminal.com/base/pools/0xb58782d79eea9ce7a2c5846657a6e8d07abaec65"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-white hover:text-white"
                      >
                        <LineChart className="w-4 h-4" /> GeckoTerminal (ARI)
                      </Link>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-shadow-glow flex items-center gap-2"
                    asChild
                  >
                    <Link 
                      href="https://app.uniswap.org/swap?outputCurrency=0xDd33A2644D72324fE453036c78296AC90AEd2E2f&chain=base"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy $ARI <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-black/20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-8 relative">
              {/* Decorative Roll Image */}
              <div className="absolute -top-32 right-0 w-48 h-48 transform rotate-12 opacity-80">
                <div className="relative w-full h-full">
                  <Image
                    src="/roll.png"
                    alt="Decorative Roll"
                    width={160}
                    height={160}
                    className="object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                    style={{ width: 'auto', height: 'auto', maxWidth: '160px', maxHeight: '160px' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-shadow-glow text-outline-strong mb-6">
                  Join Our Metaverse Adventure
                </h2>
                <p className="text-xl text-white text-shadow-glow max-w-2xl mx-auto mb-8">
                  Be part of our journey as we create a groundbreaking fusion of AI, blockchain, and immersive storytelling. 
                  Your support and feedback shape the future of Aqua Prime.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-shadow-glow transform hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link 
                      href="https://sessionsmedia.notion.site/Aqua-Prime-Overview-058105f15f08491c9257ff0150ec16e1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-blue-400 bg-blue-800/50 text-white hover:bg-blue-800 text-shadow-glow flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
                    asChild
                  >
                    <Link 
                      href="https://app.uniswap.org/swap?outputCurrency=0xDd33A2644D72324fE453036c78296AC90AEd2E2f&chain=base"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy $ARI <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-6">
              <Link 
                href="https://x.com/aquaprimerpg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
              >
                <Twitter className="w-6 h-6" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link 
                href="https://www.twitch.tv/stream_tide" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
              >
                <Twitch className="w-6 h-6" />
                <span className="sr-only">Twitch</span>
              </Link>
              <Link 
                href="https://discord.com/invite/QPA9TkHUXm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
              >
                <DiscordLogo className="w-6 h-6" />
                <span className="sr-only">Discord</span>
              </Link>
              <Link 
                href="https://t.me/AquaPrimeRPG" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
              >
                <Send className="w-6 h-6" />
                <span className="sr-only">Telegram</span>
              </Link>
              <Link 
                href="https://dexscreener.com/base/0xb58782d79eea9ce7a2c5846657a6e8d07abaec65" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
                title="ARI Token on DexScreener"
              >
                <TrendingUp className="w-6 h-6" />
                <span className="sr-only">DexScreener</span>
              </Link>
              <Link 
                href="https://www.geckoterminal.com/base/pools/0xb58782d79eea9ce7a2c5846657a6e8d07abaec65" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-white transition-colors"
                title="ARI Token on GeckoTerminal"
              >
                <LineChart className="w-6 h-6" />
                <span className="sr-only">GeckoTerminal</span>
              </Link>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-purple-300 text-shadow-glow">
                2024 Aqua Prime. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm text-purple-300">
                <Link href="#" className="hover:text-white text-shadow-glow">Terms</Link>
                <Link href="#" className="hover:text-white text-shadow-glow">Privacy</Link>
                <Link href="#" className="hover:text-white text-shadow-glow">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}