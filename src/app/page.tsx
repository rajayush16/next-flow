import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050507] px-6 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_28%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center rounded-[40px] border border-white/8 bg-white/[0.03] px-8 py-16 text-center shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <p className="type-eyebrow mb-4 text-white/35">
          LLM Workflow Builder
        </p>
        <h1 className="type-display max-w-4xl text-white md:text-7xl">
          NextFlow
        </h1>
        <p className="type-body mt-6 max-w-2xl text-white/60 md:text-[1rem] md:leading-7">
          A Krea-inspired canvas for authenticated, multi-step Gemini workflows
          executed through Trigger.dev.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/workflow"
            className="type-ui-label inline-flex min-w-[252px] items-center justify-center rounded-full bg-white px-5 py-3 text-[#050507] transition hover:bg-white/90"
            style={{ color: "#050507" }}
          >
            <span style={{ color: "#050507" }}>Open workflow builder</span>
          </Link>
          <Link
            href="/sign-in"
            className="type-ui-label rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-white/75 transition hover:bg-white/[0.06] hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
