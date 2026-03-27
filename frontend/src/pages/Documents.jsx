import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileUp, FolderOpen, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

import { api } from "../api/client";
import AppShell from "../components/AppShell";

/**
 * Render the documents workspace.
 * @returns {JSX.Element}
 */
export default function Documents() {
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const documents = documentsQuery.data?.documents || [];

  async function handleUpload(files) {
    const [file] = files;
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await api.upload.uploadDocument(file, setUploadProgress);
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

    const interval = window.setInterval(() => {
      documentsQuery.refetch();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [documents, documentsQuery]);

  return (
    <AppShell
      title="Documents"
      pageLabel="Documents"
      suggestions={[
        "What documents should I upload first?",
        "Can you summarize my uploaded evidence?",
        "What is missing from my filing pack?"
      ]}
    >
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6">
          <div
            {...getRootProps()}
            className={`rounded-[20px] border-2 border-dashed px-6 py-12 text-center ${
              isDragActive ? "border-purple bg-purple/8" : "border-navy-border bg-navy/60"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple/12 text-purple-light">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-display text-3xl font-bold text-text-primary">
              Drag &amp; drop ITR, GSTR, Form 26AS, or circular PDFs
            </h2>
            <p className="mt-3 text-base leading-8 text-text-secondary">
              Upload documents to ground retrieval and compliance answers in your own workspace data.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-purple/30 bg-purple/10 px-4 py-2 text-sm font-semibold text-purple-light">
              Browse files
            </div>
            {isUploading ? (
              <div className="mx-auto mt-6 max-w-xl rounded-full bg-navy-border">
                <div
                  className="h-2 rounded-full bg-purple transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            ) : null}
          </div>
        </motion.div>

        <div className="surface-card p-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-text-secondary" />
            <h2 className="font-display text-3xl font-bold text-text-primary">Workspace files</h2>
          </div>

          <div className="mt-6">
            {documents.length ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl border border-navy-border bg-navy px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/[0.04] p-3 text-text-secondary">
                        <FileUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{document.filename}</p>
                        <p className="text-sm text-text-muted">{document.file_type}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-navy-border bg-navy-card px-3 py-1 text-xs font-semibold text-text-secondary">
                      {document.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-navy-border bg-navy/60 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] text-text-secondary">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-text-primary">No documents uploaded yet</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Start with ITR, GSTR, Form 26AS, or key circular PDFs to improve every assistant response.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
