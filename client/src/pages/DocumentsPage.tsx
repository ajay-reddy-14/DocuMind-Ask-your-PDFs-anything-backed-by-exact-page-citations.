import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Trash2, Eye, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { documentService } from '../services/document.service';
import type { Document } from '../types';

const MAX_SIZE_MB = 20;

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({ status }: { status: Document['status'] }) {
  if (status === 'PROCESSED') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'FAILED') return <AlertCircle className="h-4 w-4 text-red-500" />;
  if (status === 'PROCESSING') return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(() => {
    return documentService.list().then(setDocuments).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDocuments().finally(() => setLoading(false));
  }, [fetchDocuments]);

  // Poll for status updates on pending/processing documents
  useEffect(() => {
    const hasInProgress = documents.some(
      (d) => d.status === 'PENDING' || d.status === 'PROCESSING'
    );
    if (!hasInProgress) return;
    const timer = setInterval(() => fetchDocuments(), 3000);
    return () => clearInterval(timer);
  }, [documents, fetchDocuments]);

  const handleFile = async (file: File) => {
    setUploadError('');
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploadProgress(0);
    try {
      const doc = await documentService.upload(file, (pct) => setUploadProgress(pct));
      setDocuments((prev) => [doc, ...prev]);
      setUploadProgress(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      setUploadProgress(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document? This will also delete all associated conversations.')) return;
    setDeletingId(id);
    try {
      await documentService.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Library</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload PDFs and start chatting with their contents.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        <Upload className={`h-10 w-10 mb-3 ${isDragging ? 'text-brand-600' : 'text-gray-400'}`} />
        <p className="font-medium text-gray-700 dark:text-gray-300">
          Drop a PDF here or <span className="text-brand-600">browse</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF only · Max {MAX_SIZE_MB} MB</p>

        {uploadProgress !== null && (
          <div className="mt-4 w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-1.5 rounded-full bg-brand-600 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
          <p>No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="h-8 w-8 text-brand-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(doc.fileSize)}
                    {doc.pageCount != null ? ` · ${doc.pageCount} pages` : ''}
                    {' · '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusIcon status={doc.status} />
                <Link
                  to={`/documents/${doc.id}`}
                  className="rounded-md p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded-md p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  title="Delete document"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

