import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertTriangle, CheckCircle2, Clock3, FileText, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../../api/client";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const SUPPORTED_LABELS = ["ITR", "GSTR", "Form 26AS", "TDS Certificate", "GST Circulars", "Company filings"];

/**
 * Render document uploads and recent file activity.
 * @param {{ documents: Array, onRefresh: () => void, compact?: boolean }} props
 * @returns {JSX.Element}
 */
export default function DocumentManager({ documents, onRefresh, compact = false }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const indexedCount = documents.filter((document) => document.status === "INDEXED").length;
  const processingCount = documents.filter((document) => document.status === "PROCESSING").length;
  const failedCount = documents.filter((document) => document.status === "FAILED").length;
  const visibleDocuments = compact ? documents.slice(0, 5) : documents;

  async function handleUpload(files) {
    const [file] = files;
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await api.upload.uploadDocument(file, setUploadProgress);
      toast.success("Document uploaded. Processing has started.");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"]
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    onDropAccepted: handleUpload,
    onDropRejected(rejections) {
      const [rejection] = rejections;
      const sizeError = rejection?.errors?.find((error) => error.code === "file-too-large");
      toast.error(sizeError ? "PDF exceeds the 100MB upload limit" : "Only PDF files are supported");
    }
  });

  useEffect(() => {
    if (!documents.some((document) => document.status === "PROCESSING")) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      onRefresh();
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [documents, onRefresh]);

  return (
    <div className="glass-card rounded-[28px] border border-white/80 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-primary">Document Intelligence</h2>
          <p className="text-sm text-slate-500">
            Upload high-value PDFs for cited retrieval, reporting, and filing review. Large documents up to 100MB are
            supported.
          </p>
        </div>
        <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 md:block">
          {documents.length} total files
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-emerald-50/80 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Indexed</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{indexedCount}</p>
        </div>
        <div className="rounded-3xl bg-amber-50/80 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock3 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Processing</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{processingCount}</p>
        </div>
        <div className="rounded-3xl bg-rose-50/80 px-4 py-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Needs review</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">{failedCount}</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`mt-5 rounded-[24px] border border-dashed p-5 text-center transition ${
          isDragActive ? "border-brand-accent bg-violet-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-8 w-8 text-brand-accent" />
        <p className="mt-3 font-medium text-slate-900">Drag and drop a PDF here</p>
        <p className="mt-1 text-sm text-slate-500">or click to browse files up to 100MB</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUPPORTED_LABELS.map((label) => (
            <span key={label} className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-500">
              {label}
            </span>
          ))}
        </div>
        {isUploading ? (
          <div className="mt-4 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-brand-accent transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {visibleDocuments.length ? (
          visibleDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{document.filename}</p>
                  <p className="text-xs text-slate-500">
                    {document.file_type} · {new Date(document.uploaded_at).toLocaleDateString("en-IN")}
                    {document.chunk_count ? ` · ${document.chunk_count} chunks` : ""}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  document.status === "INDEXED"
                    ? "bg-emerald-50 text-emerald-600"
                    : document.status === "FAILED"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-amber-50 text-amber-600"
                }`}
              >
                {document.status}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center">
            <p className="font-medium text-slate-900">No documents uploaded yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Start with GSTR, ITR, Form 26AS, TDS certificates, or GST circular PDFs to improve answer quality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
