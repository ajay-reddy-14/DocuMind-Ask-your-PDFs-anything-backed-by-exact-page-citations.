import { Link } from 'react-router-dom';
import { FileText, Zap, Shield, MessageSquare, Upload, BookOpen, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const features = [
    {
      icon: <Upload className="h-6 w-6 text-brand-600" />,
      title: 'Upload PDFs',
      desc: 'Drag and drop any PDF. We store it securely and process it in the background.',
    },
    {
      icon: <Zap className="h-6 w-6 text-brand-600" />,
      title: 'AI-Powered Answers',
      desc: 'Ask questions in plain English. Gemini retrieves the most relevant passages and generates precise answers.',
    },
    {
      icon: <BookOpen className="h-6 w-6 text-brand-600" />,
      title: 'Page Citations',
      desc: 'Every answer links back to the exact page in the document – no hallucinations.',
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-brand-600" />,
      title: 'Chat History',
      desc: 'Your conversations are saved. Pick up where you left off at any time.',
    },
    {
      icon: <FileText className="h-6 w-6 text-brand-600" />,
      title: 'Smart Summaries',
      desc: 'Generate a short overview, detailed breakdown, or key bullet points in one click.',
    },
    {
      icon: <Shield className="h-6 w-6 text-brand-600" />,
      title: 'Private by Design',
      desc: 'Your documents are private. We never expose files publicly or share your data.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-950 py-24 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-900/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 mb-6">
            Powered by Google Gemini + RAG
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Chat with your PDFs{' '}
            <span className="text-brand-600">intelligently</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
            Upload any PDF, ask questions in plain English, and get precise AI-generated answers
            backed by page-level citations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary text-base px-6 py-3">
              Get started – it's free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-6 py-3">
              Sign in
            </Link>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-100 dark:bg-brand-900/20 blur-3xl opacity-50" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-3xl opacity-50" />
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-xl mx-auto">
            DocuMind combines document management, vector search, and LLM generation into one clean interface.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-600 text-white text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to try DocuMind?</h2>
          <p className="text-brand-100 mb-8">
            Create your free account and start chatting with your first document in minutes.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-white text-brand-700 font-semibold px-6 py-3 hover:bg-brand-50 transition-colors">
            Create account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400 dark:text-gray-600 bg-white dark:bg-gray-950">
        © {new Date().getFullYear()} DocuMind · Built with React, Express &amp; Gemini
      </footer>
    </div>
  );
}

