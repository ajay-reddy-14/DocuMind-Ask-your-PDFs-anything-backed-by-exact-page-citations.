import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, MessageSquare, Loader2, AlertCircle, ChevronRight,
  BookOpen, Copy, CheckCircle
} from 'lucide-react';
import { documentService } from '../services/document.service';
import { conversationService } from '../services/conversation.service';
import type { Document, DocumentSummary } from '../types';

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [copied, setCopied] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    documentService
      .get(id)
      .then(setDoc)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll while document is not yet PROCESSED
  useEffect(() => {
    if (!id || !doc || doc.status === 'PROCESSED' || doc.status === 'FAILED') return;
    const timer = setInterval(() => {
      documentService.get(id).then(setDoc).catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [id, doc]);

  const handleSummarize = async () => {
    if (!id) return;
    setSummaryError('');
    setSummaryLoading(true);
    try {
      const s = await documentService.summarize(id);
      setSummary(s);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!id) return;
    setStartingChat(true);
    try {
      const conv = await conversationService.create(id);
      navigate(`/chat/${conv.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat.');
      setStartingChat(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
        <p className="text-gray-700 dark:text-gray-300">{error || 'Document not found.'}</p>
      </div>
    );
  }

  const isReady = doc.status === 'PROCESSED';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400 mb-6">
        <span
          onClick={() => navigate('/documents')}
          className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors"
        >
          Documents
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{doc.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-3">
                <FileText className="h-6 w-6 text-brand-600" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 dark:text-white truncate">{doc.title}</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{doc.originalFileName}</p>
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <span
                    className={`badge ${
                      isReady
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : doc.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {doc.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Size</dt>
                <dd className="text-gray-900 dark:text-white">{formatBytes(doc.fileSize)}</dd>
              </div>
              {doc.pageCount != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Pages</dt>
                  <dd className="text-gray-900 dark:text-white">{doc.pageCount}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Uploaded</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleStartChat}
              disabled={!isReady || startingChat}
              className="btn-primary w-full"
              title={!isReady ? 'Wait for processing to complete' : ''}
            >
              {startingChat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Ask AI
            </button>
            <button
              onClick={handleSummarize}
              disabled={!isReady || summaryLoading}
              className="btn-secondary w-full"
            >
              {summaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
              Generate summary
            </button>
          </div>

          {!isReady && doc.status !== 'FAILED' && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              Processing your document… This may take a moment.
            </div>
          )}

          {doc.status === 'FAILED' && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              Processing failed. The PDF may be corrupt or password-protected.
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div className="lg:col-span-2">
          {summaryError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {summaryError}
            </div>
          )}

          {summary ? (
            <div className="card space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">Summary</h2>
                <button
                  onClick={() =>
                    handleCopy(
                      `${summary.shortSummary}\n\n${summary.detailedSummary}\n\nKey Points:\n${summary.keyPoints.map((p) => `• ${p}`).join('\n')}`
                    )
                  }
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Overview</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary.shortSummary}</p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Detailed</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary.detailedSummary}</p>
              </div>

              {summary.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Key Points</h3>
                  <ul className="space-y-1.5">
                    {summary.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-500">
              <BookOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">
                {isReady
                  ? 'Click "Generate summary" to get an AI-powered overview of this document.'
                  : 'Summary will be available once the document is processed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

