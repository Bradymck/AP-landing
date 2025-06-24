import FloatingIslands from '../components/FloatingIslands';

export default function PricingPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      <FloatingIslands />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center text-white">
        <h1 className="text-6xl font-bold text-shadow-glow">Pricing</h1>
        <p className="mt-4 text-xl text-shadow-glow">Simple and transparent pricing for everyone</p>
      </div>
    </main>
  );
} 