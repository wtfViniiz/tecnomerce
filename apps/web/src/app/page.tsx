import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Tecnomerce
        </h1>
        <p className="mt-4 text-lg font-medium leading-relaxed text-charcoal/70">
          Sua loja online de confianca
        </p>
        <div className="mt-8">
          <Link
            href="/checkout"
            className="inline-block rounded-md bg-primary px-8 py-3 text-base font-bold text-primary-foreground shadow-medium transition-all hover:bg-primary/90"
          >
            Ir para o checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
