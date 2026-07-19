'use client';

import { useRouter } from 'next/navigation';

const steps = [
  ['01', 'Take the skin quiz', 'Share your skin type, goals, routine habits, and main concerns.'],
  ['02', 'Upload a clear face photo', 'The AI scan checks six visible skin concern categories.'],
  ['03', 'Add weather context', 'UV, humidity, and temperature help shape daily skincare guidance.'],
  ['04', 'Get matched products', 'Ingredients and products are ranked around your scan and profile.'],
];

const concerns = ['Acne', 'Redness', 'Wrinkles', 'Dark spots', 'Pores', 'Dark circles'];

const personalization = [
  ['Skin profile', 'Skin type, sensitivity, goals, and routine preferences from the quiz.'],
  ['AI scan', 'Six condition scores from your uploaded face photo.'],
  ['Weather and UV', 'Daily SPF and hydration guidance based on local conditions.'],
  ['Ingredient matching', 'Product suggestions connected to concerns like pores, spots, and dark circles.'],
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F2EA] text-[#20241F]">
      <header className="sticky top-0 z-30 border-b border-[#20241F]/10 bg-[#F5F2EA]/90 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-left font-[family-name:var(--font-display)] text-xl font-medium tracking-wide text-[#20241F]"
          >
            SkinCare AI
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#20241F]/60 md:flex">
            <a href="#how-it-works" className="hover:text-[#20241F]">How it works</a>
            <a href="#analysis" className="hover:text-[#20241F]">Analysis</a>
            <a href="#recommendations" className="hover:text-[#20241F]">Recommendations</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="cursor-pointer rounded-md border border-[#20241F]/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#20241F]/80 transition hover:bg-white"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/register')}
              className="cursor-pointer rounded-md bg-[#182019] px-4 py-2 text-sm font-semibold text-[#F5F2EA] transition hover:bg-[#BD7B54]"
            >
              Start scan
            </button>
          </div>
        </div>
      </header>

      {/* HERO — untouched structure, original photo, no overlay treatment */}
      <section className="relative overflow-hidden border-b border-[#20241F]/10">
        <img
          src="/landing-hero.jpeg"
          alt="Person applying skincare cream"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover object-[85%_50%]"
        />
        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-1">
          <div className="max-w-2xl">
            <p className="mb-5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.26em] text-[#BD7B54]">
              AI skin analysis and recommendations
            </p>
            <h1 className="max-w-xl font-[family-name:var(--font-display)] text-5xl font-medium leading-[1.02] text-[#20241F] md:text-7xl">
              Understand your skin before choosing products.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#20241F]/70">
              Upload a face photo, complete a short skin quiz, and get concern scores plus product recommendations matched to your skin profile and local weather.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push('/register')}
                className="cursor-pointer rounded-md bg-[#182019] px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54]"
              >
                Start skin analysis
              </button>
              <button
                onClick={() => router.push('/login')}
                className="cursor-pointer rounded-md border border-[#20241F]/20 bg-white/70 px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#20241F]/80 transition hover:bg-white"
              >
                Take skin quiz
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#20241F]/10 bg-[#182019] px-5 py-5 text-[#F5F2EA]">
        <div className="mx-auto grid max-w-7xl gap-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.08em] sm:grid-cols-2 lg:grid-cols-4">
          <p>AI photo scan</p>
          <p>Weather-aware SPF guidance</p>
          <p>Ingredient matching</p>
          <p>Personalized product ranking</p>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[#BD7B54]">How it works</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium text-[#20241F]">
            From skin quiz to product match.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([number, title, text]) => (
            <article key={number} className="rounded-lg border border-[#20241F]/12 bg-white p-5">
              <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#BD7B54]">{number}</p>
              <h3 className="mt-8 font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#20241F]/60">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="analysis" className="bg-white px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[#BD7B54]">What we analyze</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium text-[#20241F]">
              Six visible skin concern categories.
            </h2>
            <p className="mt-5 max-w-md leading-7 text-[#20241F]/60">
              The scan is designed around the same six classes used by your model, so the landing page matches the real product.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concerns.map((concern) => (
              <div key={concern} className="rounded-lg border border-[#20241F]/12 bg-[#F5F2EA] p-5">
                <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[#20241F]">{concern}</p>
                <p className="mt-3 text-sm leading-6 text-[#20241F]/60">Scored as low, medium, or high after a clear face photo scan.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="recommendations" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[#BD7B54]">Personalized recommendations</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-medium text-[#20241F]">
              Care suggestions based on more than a selfie.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-[#20241F]/60">
              Recommendations combine your quiz, scan scores, local weather, and ingredient matching so the output feels specific to your skin.
            </p>
          </div>
          <div className="grid gap-3">
            {personalization.map(([title, text]) => (
              <div key={title} className="rounded-lg border border-[#20241F]/12 bg-white p-5">
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[#20241F]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#20241F]/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#93A899]/25 px-5 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.2em] text-[#BD7B54]">Ready when you are</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-medium text-[#20241F]">
              Start with a quiz, then scan your skin.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#20241F]/70">
              Personalized skincare guidance begins the moment you answer a few simple questions.
            </p>
          </div>
          <button
            onClick={() => router.push('/register')}
            className="cursor-pointer rounded-md bg-[#182019] px-6 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-[#F5F2EA] transition hover:bg-[#BD7B54]"
          >
            Get started
          </button>
        </div>
      </section>

      <div className="bg-[#F5F2EA] px-5 py-6 mb-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[#20241F]/12 bg-[#93A899]/15 px-6 py-4 shadow-sm">
            <p className="text-sm leading-6 text-[#20241F]/75 font-medium text-left max-w-4xl">
              Disclaimer: Not a medical diagnosis. AI-powered skincare guidance only. Consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-[#F5F2EA] px-5 py-6">
        <div className="mx-auto flex flex-col gap-4 max-w-7xl text-sm text-[#20241F]/50 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <a href="/" className="text-[#20241F]/70 hover:text-[#20241F]">Home</a>
            <button
              type="button"
              onClick={() => router.push('/login?redirect=/quiz')}
              className="text-left text-[#20241F]/70 hover:text-[#20241F]"
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => router.push('/login?redirect=/scan')}
              className="text-left text-[#20241F]/70 hover:text-[#20241F]"
            >
              Scan
            </button>
            <a href="/login" className="text-[#20241F]/70 hover:text-[#20241F]">Sign in</a>
            <a href="/register" className="text-[#20241F]/70 hover:text-[#20241F]">Sign up</a>
          </div>
          <p className="text-xs text-[#20241F]/60">© SkinCare AI. Built for better skin decisions.</p>
        </div>
      </footer>
    </main>
  );
}