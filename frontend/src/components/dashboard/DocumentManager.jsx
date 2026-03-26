import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../../api/client";

/**
 * Render document uploads and recent file activity.
 * @param {{ documents: Array, onRefresh: () => void, compact?: boolean }} props
 * @returns {JSX.Element}
 */
export default function DocumentManager({ documents, onRefresh, compact = false }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
    multiple: false,
    onDrop: handleUpload
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
          <p className="text-sm text-slate-500">Upload ITR, GSTR, Form 26AS, and circular PDFs for retrieval.</p>
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
        <p className="mt-1 text-sm text-slate-500">or click to browse files up to 50MB</p>
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
        {(compact ? documents.slice(0, 5) : documents).map((document) => (
          <div key={document.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{document.filename}</p>
                <p className="text-xs text-slate-500">
                  {document.file_type} · {new Date(document.uploaded_at).toLocaleDateString("en-IN")}
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
        ))}
      </div>
    </div>
  );
}

