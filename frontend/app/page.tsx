import Link from "next/link";

const navFeatures = [
  {
    icon: "🔍",
    title: "Find Face",
    desc: "Upload a photo and instantly identify a person from the database using deep face embeddings.",
    href: "/find-face",
    cta: "Try Find Face",
    color: "from-blue-600 to-cyan-500",
    border: "border-blue-800 hover:border-blue-500",
    badge: "bg-blue-900/40 text-blue-300",
  },
  {
    icon: "🖼️",
    title: "Describe Image",
    desc: "Send any image to a vision LLM and receive a rich natural-language description in seconds.",
    href: "/describe-image",
    cta: "Try Describe",
    color: "from-purple-600 to-pink-500",
    border: "border-purple-800 hover:border-purple-500",
    badge: "bg-purple-900/40 text-purple-300",
  },
  {
    icon: "🗂️",
    title: "FaceHub",
    desc: "Register new people, browse all stored face embeddings, and manage the vector database.",
    href: "/facehub",
    cta: "Open FaceHub",
    color: "from-emerald-600 to-teal-500",
    border: "border-emerald-800 hover:border-emerald-500",
    badge: "bg-emerald-900/40 text-emerald-300",
  },
];

const steps = [
  {
    n: "01",
    title: "Image Input",
    desc: "A raw JPEG or PNG image is uploaded through the interface or API.",
    color: "text-blue-400",
  },
  {
    n: "02",
    title: "Face Detection",
    desc: "RetinaFace locates and crops the face region with high accuracy.",
    color: "text-purple-400",
  },
  {
    n: "03",
    title: "Embedding Extraction",
    desc: "ArcFace converts the face into a 512-dimensional vector representation.",
    color: "text-pink-400",
  },
  {
    n: "04",
    title: "Vector Search",
    desc: "ChromaDB performs cosine similarity search to return the closest match.",
    color: "text-emerald-400",
  },
];

const techs = [
  {
    name: "DeepFace",
    icon: "🧠",
    desc: "ArcFace model + RetinaFace detector for state-of-the-art face recognition.",
    border: "border-blue-800",
    bg: "bg-blue-950/50",
  },
  {
    name: "ChromaDB",
    icon: "🗄️",
    desc: "Persistent vector database storing face embeddings with cosine similarity search.",
    border: "border-purple-800",
    bg: "bg-purple-950/50",
  },
  {
    name: "vLLM",
    icon: "⚡",
    desc: "High-throughput LLM inference engine serving the vision description model.",
    border: "border-orange-800",
    bg: "bg-orange-950/50",
  },
  {
    name: "FastAPI",
    icon: "🚀",
    desc: "Async Python backend with automatic OpenAPI docs and Pydantic validation.",
    border: "border-green-800",
    bg: "bg-green-950/50",
  },
  {
    name: "Next.js 14",
    icon: "▲",
    desc: "App Router-based frontend with TypeScript, server components, and fast HMR.",
    border: "border-gray-700",
    bg: "bg-gray-900/80",
  },
  {
    name: "TailwindCSS",
    icon: "🎨",
    desc: "Utility-first CSS framework for a consistent, responsive, dark-mode UI.",
    border: "border-cyan-800",
    bg: "bg-cyan-950/50",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-28 pb-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center gap-6 pt-20">
        <span className="px-4 py-1.5 rounded-full border border-blue-700 bg-blue-900/30 text-blue-300 text-xs font-semibold tracking-widest uppercase">
          AI · Face Recognition · Vision LLM
        </span>

        <h1 className="text-7xl font-extrabold tracking-tight leading-none">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Deep
          </span>
          <span className="text-white">Eye</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          An AI-powered platform that identifies persons from photos using deep face embeddings
          and describes any image with a large vision language model.
        </p>

        <div className="flex items-center gap-4 mt-2">
          <Link
            href="/find-face"
            className="px-6 py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 transition-colors text-white"
          >
            Find a Face →
          </Link>
          <Link
            href="/describe-image"
            className="px-6 py-3 rounded-xl font-semibold border border-gray-700 hover:border-gray-500 hover:bg-gray-900 transition-colors text-gray-200"
          >
            Describe an Image
          </Link>
        </div>
      </section>

      {/* ── What is DeepEye ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">What is DeepEye?</p>
        <h2 className="text-4xl font-bold text-white mb-6">
          One platform, two AI superpowers.
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-400 leading-relaxed text-[15px]">
          <p>
            DeepEye combines biometric face recognition with multimodal vision AI. Register
            people once — DeepEye stores a unique 512-dimensional embedding — and then identify
            them from any new photo in milliseconds.
          </p>
          <p>
            Beyond faces, DeepEye connects to a self-hosted vLLM server to generate detailed
            natural-language descriptions of any image, making it a versatile visual AI toolbox
            for research and real-world applications.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {navFeatures.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group flex flex-col gap-4 p-6 rounded-2xl border ${f.border} bg-gray-900/60 transition-all hover:shadow-lg hover:shadow-blue-500/5`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${f.color} shrink-0`}
              >
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-white mb-1">{f.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full self-start ${f.badge}`}>
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How face recognition works ───────────────────────── */}
      <section className="max-w-4xl mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">How It Works</p>
        <h2 className="text-4xl font-bold text-white mb-10">
          Face recognition in 4 steps.
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative flex flex-col gap-3">
              {/* connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gray-800 z-0" />
              )}
              <span className={`text-4xl font-extrabold ${s.color} opacity-60`}>{s.n}</span>
              <p className="font-semibold text-white">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl border border-gray-800 bg-gray-900/50 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="text-3xl">🎯</div>
          <div>
            <p className="font-semibold text-white mb-1">ArcFace accuracy</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              DeepEye uses the ArcFace model, which achieves over 99.8% accuracy on LFW benchmark —
              one of the most accurate open-source face recognition architectures available.
            </p>
          </div>
        </div>
      </section>

      {/* ── Technologies ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Technologies</p>
        <h2 className="text-4xl font-bold text-white mb-10">
          Built on proven AI infrastructure.
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
          {techs.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col gap-3 p-5 rounded-2xl border ${t.border} ${t.bg}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{t.icon}</span>
                <span className="font-semibold text-white">{t.name}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

