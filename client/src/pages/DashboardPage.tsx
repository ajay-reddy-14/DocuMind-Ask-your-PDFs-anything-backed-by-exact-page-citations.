import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { documentService } from '../services/document.service';
import { conversationService } from '../services/conversation.service';
import type { Document, Conversation } from '../types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: Document['status'] }) {
  const map: Record<Document['status'], string> = {
    PENDING: 'badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    PROCESSING: 'badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PROCESSED: 'badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    FAILED: 'badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return <span className={map[status]}>{status}</span>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([documentService.list(), conversationService.list()])
      .then(([docs, convs]) => {
        setDocuments(docs);
        setConversations(convs);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's a snapshot of your workspace.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-brand-100 dark:bg-brand-900/30 p-3">
            <FileText className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{conversations.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Conversations</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {documents.filter((d) => d.status === 'PROCESSED').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ready to chat</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/documents" className="btn-primary">
          <Upload className="h-4 w-4" />
          Upload document
        </Link>
        {conversations.length > 0 && (
          <Link to={`/chat/${conversations[0].id}`} className="btn-secondary">
            <MessageSquare className="h-4 w-4" />
            Continue last chat
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Documents</h2>
            <Link to="/documents" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
              No documents yet.{' '}
              <Link to="/documents" className="text-brand-600 hover:underline">
                Upload one
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <li key={doc.id}>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-brand-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-400">{formatBytes(doc.fileSize)}</p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Conversations</h2>
          </div>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-30" />
              No conversations yet. Open a document and start asking questions!
            </div>
          ) : (
            <ul className="space-y-3">
              {conversations.slice(0, 5).map((conv) => (
                <li key={conv.id}>
                  <Link
                    to={`/chat/${conv.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {conv.document?.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

