import MegapedeGame from "@/components/megapede-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black">
      <h1 className="text-2xl font-bold text-blue-500 mb-4">Moloch Blaster</h1>
      <MegapedeGame />
    </main>
  )
}
