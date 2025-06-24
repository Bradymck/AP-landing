import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Gamepad2, Sparkles, Coins, Brain, ExternalLink, MessageSquare, Twitter, Twitch, Send, BarChart2, Activity, Code, CuboidIcon as Cube } from 'lucide-react'
import { DiscordLogo } from '@/components/discord-logo'
import FloatingIslands from "@/components/floating-islands"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-blue-900 text-white overflow-hidden relative">
      <FloatingIslands />
      
      {/* Main content wrapper */}
      <div className="relative z-10">
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ICON-CuOuU1sqlr7yqKKCKSW8Es5NkuYVmP.png"
              alt="Aqua Prime Logo"
              width={50}
              height={50}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-shadow-glow">Aqua Prime</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#moonstone" className="hover:text-purple-300 transition text-shadow-glow">What is Moonstone?</Link>
            <Link href="#features" className="hover:text-purple-300 transition text-shadow-glow">Vision</Link>
          </nav>
        </header>

        <main>
          <section className="relative">
            <div className="container mx-auto px-4 py-24">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h1 className="text-4xl md:text-7xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] text-outline-strong">
                  Welcome to Aqua Prime
                </h1>
                <p className="text-lg md:text-xl font-semibold bg-purple-800/80 text-white px-6 py-3 rounded-lg shadow-lg inline-block border-2 border-purple-400/50 mb-4">
                  Aqua Prime is A Table Top Inspired Economic Role Playing Escape Room. 🎲 🗝 🔒
                </p>
                <p className="text-lg md:text-xl font-semibold bg-purple-800/80 text-white px-6 py-3 rounded-lg shadow-lg inline-block border-2 border-purple-400/50">
                  Join us on a journey of growth and imagination as we transform our beloved Discord-based game into an immersive digital experience.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-shadow-glow"
                    asChild
                  >
                    <Link 
                      href="https://sessionsmedia.notion.site/Aqua-Prime-Overview-058105f15f08491c9257ff0150ec16e1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-blue-400 bg-blue-800/50 text-white hover:bg-blue-800 text-shadow-glow flex items-center gap-2"
                    asChild
                  >
                    <Link 
                      href="https://streamtide.io/profile/0xa32D872E45A87072B932D85bc23C1A6482b7D312"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Support Us <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="relative py-24 bg-black/20">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-8 text-shadow-glow text-outline-strong">Our Journey</h2>
                <p className="text-lg text-purple-200 text-shadow-glow mb-8">
                  Aqua Prime started as a passion project - a text-based tabletop RPG in Discord. Now, we're taking bold steps to create a Minimum Viable Metaverse, pushing the boundaries of what's possible in gaming.
                </p>
                <p className="text-lg text-purple-200 text-shadow-glow mb-8">
                  We're building with cutting-edge AI technology, integrating web3 NFTs, and stretching the possibilities of blockchain gaming. Our vision is to create an immersive, evolving digital experience that blends the best of tabletop RPGs with the limitless potential of the metaverse.
                </p>
              </div>
            </div>
          </section>

          {/* What is Moonstone Section */}
          <section id="moonstone" className="relative py-24 bg-black/20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                  <div className="w-32 h-32 relative flex-shrink-0">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ST%20(1)-mb2wg0FPYnJ1RYTBqXIrLBnvF4i7yd.png"
                      alt="Moonstone Logo"
                      width={128}
                      height={128}
                      className="object-contain drop-shadow-[0_0_15px_rgba(147,197,253,0.5)]"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-shadow-glow text-outline-strong">What is Moonstone?</h2>
                    <div className="space-y-4">
                      <p className="text-lg text-purple-200 text-shadow-glow">
                        Moonstone ($MSTN) is our experimental token as we explore blockchain integration. While its full utility is still in development, it represents our community's support and belief in the future of Aqua Prime.
                      </p>
                      <div className="bg-purple-900/40 p-4 rounded-lg border border-purple-700/50 space-y-4">
                        <p className="font-mono text-blue-300 text-shadow-glow">Ticker: $MSTN</p>
                        <p className="font-mono text-blue-300 text-shadow-glow break-all">
                          CA: <Link 
                            href="https://basescan.org/token/0xe03AedE0336c739f90311FE0b08ed03E3690E49a"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            0xe03AedE0336c739f90311FE0b08ed03E3690E49a
                          </Link>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link 
                            href="https://dexscreener.com/base/0x4a3ef8a187b83ed465c516c66ae3710e42390258"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-white"
                          >
                            <BarChart2 className="w-4 h-4" /> DexScreener
                          </Link>
                          <Link 
                            href="https://www.geckoterminal.com/base/pools/0x4a3ef8a187b83ed465c516c66ae3710e42390258"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-white"
                          >
                            <Activity className="w-4 h-4" /> GeckoTerminal
                          </Link>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-shadow-glow flex items-center gap-2"
                        asChild
                      >
                        <Link 
                          href="https://app.uniswap.org/swap?outputCurrency=0xe03AedE0336c739f90311FE0b08ed03E3690E49a&chain=base"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buy $MSTN <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="relative py-24 bg-black/20">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-shadow-glow text-outline-strong">Our Vision</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                  <MessageSquare className="h-8 w-8 mb-4 text-purple-400" />
                  <h3 className="text-xl font-bold mb-2 text-shadow-glow">Rich Storytelling</h3>
                  <p className="text-purple-200 text-shadow-glow">AI-powered narratives that adapt to player choices</p>
                </Card>
                <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                  <Gamepad2 className="h-8 w-8 mb-4 text-purple-400" />
                  <h3 className="text-xl font-bold mb-2 text-shadow-glow">Evolving Gameplay</h3>
                  <p className="text-purple-200 text-shadow-glow">Blending traditional RPG mechanics with cutting-edge AI</p>
                </Card>
                <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                  <Cube className="h-8 w-8 mb-4 text-purple-400" />
                  <h3 className="text-xl font-bold mb-2 text-shadow-glow">Web3 Integration</h3>
                  <p className="text-purple-200 text-shadow-glow">Unique NFTs and blockchain-powered game assets</p>
                </Card>
                <Card className="p-6 bg-purple-900/40 border-purple-700/50 backdrop-blur-sm">
                  <Code className="h-8 w-8 mb-4 text-purple-400" />
                  <h3 className="text-xl font-bold mb-2 text-shadow-glow">Minimum Viable Metaverse</h3>
                  <p className="text-purple-200 text-shadow-glow">Building the foundation for an expansive digital world</p>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-24 bg-black/20">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold text-shadow-glow text-outline-strong">Join Our Metaverse Adventure</h2>
                <p className="text-xl text-purple-200 text-shadow-glow">
                  Be part of our journey as we create a groundbreaking fusion of AI, blockchain, and immersive storytelling. Your support and feedback shape the future of Aqua Prime.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-shadow-glow"
                    asChild
                  >
                    <Link 
                      href="https://sessionsmedia.notion.site/Aqua-Prime-Overview-058105f15f08491c9257ff0150ec16e1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Learn More
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-blue-400 bg-blue-800/50 text-white hover:bg-blue-800 text-shadow-glow flex items-center gap-2"
                    asChild
                  >
                    <Link 
                      href="https://app.uniswap.org/swap?outputCurrency=0xe03AedE0336c739f90311FE0b08ed03E3690E49a&chain=base"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buy $MSTN <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
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
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-purple-300 text-shadow-glow">
                  © 2024 Aqua Prime. All rights reserved.
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
    </div>
  )
}

