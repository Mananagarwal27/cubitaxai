import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileUp, FolderOpen, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

import { api } from "../api/client";
import AppShell from "../components/AppShell";

export default function Documents() {
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const documents = documentsQuery.data?.documents || [];

  async function handleUpload(files) {
    const [file] = files;
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.upload.uploadDocument(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      toast.success("Document uploaded for indexing");
      documentsQuery.refetch();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDrop: handleUpload,
  });

  useEffect(() => {
    if (!documents.some((d) => d.status === "PROCESSING")) return;
    const interval = setInterval(() => documentsQuery.refetch(), 3000);
    return () => clearInterval(interval);
  }, [documents, documentsQuery]);

  return (
    <AppShell title="Documents">
      <div className="space-y-6">
        {/* Upload zone */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glow-card p-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
              isDragActive ? "border-accent bg-accent/5" : "border-border bg-bg-tertiary/30"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <UploadCloud className="h-7 w-7 text-accent" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">
              Drag & drop your tax documents
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              ITR, GSTR, Form 26AS, or circular PDFs — we parse and index everything.
            </p>
            <div className="mt-5">
              <span className="btn-secondary text-xs">Browse files</span>
            </div>
            {isUploading && (
              <div className="mx-auto mt-5 max-w-sm rounded-full bg-border overflow-hidden">
                <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        </motion.div>

        {/* File list */}
        <div className="glow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <FolderOpen className="h-5 w-5 text-text-muted" />
            <h2 className="font-display text-lg font-bold">Workspace files</h2>
            <span className="badge-neutral ml-auto">{documents.length} docs</span>
          </div>

          {documents.length ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg-tertiary/30 px-4 py-3 transition-colors hover:bg-surface-hover">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <FileUp className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{doc.filename}</p>
                      <p className="text-xs text-text-muted">{doc.file_type}</p>
                    </div>
                  </div>
                  <span className={`badge-${doc.status === "INDEXED" ? "success" : doc.status === "PROCESSING" ? "warning" : "neutral"} shrink-0`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-text-muted" />
              <h3 className="mt-4 font-display text-lg font-bold">No documents yet</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Upload ITR, GSTR, or Form 26AS to ground every assistant response in your data.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
