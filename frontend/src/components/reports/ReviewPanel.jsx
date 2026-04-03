import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
import { Document, Page, pdfjs } from "react-pdf";
import { Check, X, FileText, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Ensure pdf worker is set
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function ReviewPanel({ reportId, reportUrl, onShareClient }) {
  const [annotations, setAnnotations] = useState([]);
  const [history, setHistory] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState("PENDING_REVIEW");
  const [newComment, setNewComment] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reportId) {
      loadAuditTrail();
    }
  }, [reportId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      // In real scenario we use api.review.getAuditTrail
      // Mocking fetch as the exact api map might not be updated in client.js yet
      const res = await api.reports.list(); // just for auth ping mostly
      // Assuming api endpoints are manually created via fetch if client.js hasn't been updated
      const token = localStorage.getItem("cubitax_token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const url = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/reports/${reportId}/audit-trail`;
      const fetched = await fetch(url, { headers }).then(r => r.json());
      if (fetched.annotations) {
          setAnnotations(fetched.annotations);
      }
      if (fetched.approvals && fetched.approvals.length > 0) {
          setApprovalStatus(fetched.approvals[0].status);
          setHistory(fetched.approvals);
      }
    } catch (e) {
      toast.error("Failed to load review data");
    } finally {
      setLoading(false);
    }
  };

  const addAnnotation = async () => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem("cubitax_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const url = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/reports/${reportId}/annotations`;
    try {
      await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: newComment, annotation_type: "COMMENT" })
      });
      setNewComment("");
      loadAuditTrail();
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const markResolved = async (ann_id) => {
    const token = localStorage.getItem("cubitax_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const url = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/reports/${reportId}/annotations/${ann_id}/resolve`;
    try {
      await fetch(url, { method: "POST", headers });
      loadAuditTrail();
    } catch {
      toast.error("Failed to resolve annotation");
    }
  };

  const updateApproval = async (status) => {
    const token = localStorage.getItem("cubitax_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const url = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/reports/${reportId}/approval`;
    try {
      await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status, review_notes: reviewNotes })
      });
      toast.success(`Report marked as ${status}`);
      setReviewNotes("");
      loadAuditTrail();
    } catch {
      toast.error("Failed to update approval");
    }
  };

  const handleShare = async () => {
    const token = localStorage.getItem("cubitax_token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const url = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/reports/${reportId}/share-with-client`;
    try {
      await fetch(url, { method: "POST", headers });
      toast.success("Shared with client successfully");
      if (onShareClient) onShareClient();
      loadAuditTrail();
    } catch {
      toast.error("Failed to share with client. Make sure it's approved.");
    }
  };

  return (
    <div className="flex w-full h-[600px] border border-border rounded-xl overflow-hidden bg-bg-tertiary/10">
      {/* Left panel: Annotations */}
      <div className="w-[30%] border-r border-border flex flex-col bg-surface overflow-hidden">
        <div className="p-4 border-b border-border bg-bg-tertiary">
          <h3 className="font-bold">Annotations</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {annotations.map((ann) => (
            <div key={ann.id} className={`p-3 rounded border ${ann.resolved ? 'border-border opacity-50' : 'border-warning/50 bg-warning/5'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold badge-neutral">{ann.annotation_type}</span>
                {!ann.resolved && (
                  <button onClick={() => markResolved(ann.id)} className="text-xs text-mint hover:underline">
                    Resolve
                  </button>
                )}
              </div>
              <p className="text-sm">{ann.content}</p>
            </div>
          ))}
          {annotations.length === 0 && !loading && (
            <p className="text-sm text-text-muted text-center pt-8">No annotations yet</p>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <textarea
            className="w-full bg-bg border border-border p-2 rounded text-sm mb-2 focus:border-accent outline-none"
            rows="3"
            placeholder="Add an annotation..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={addAnnotation} className="btn-primary w-full text-xs">
            Add Comment
          </button>
        </div>
      </div>

      {/* Center panel: PDF Viewer */}
      <div className="w-[50%] flex flex-col items-center overflow-y-auto bg-bg p-4 relative">
        {reportUrl ? (
          <Document
            file={reportUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<Loader2 className="animate-spin text-accent" />}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} className="mb-4 shadow-panel rounded" renderTextLayer={true} renderAnnotationLayer={true} />
            ))}
          </Document>
        ) : (
          <div className="m-auto text-text-muted flex flex-col items-center">
            <FileText className="h-10 w-10 mb-2 opacity-30" />
            <p>Select a report to view</p>
          </div>
        )}
      </div>

      {/* Right panel: Approval Status */}
      <div className="w-[20%] border-l border-border flex flex-col bg-surface overflow-hidden">
        <div className="p-4 border-b border-border bg-bg-tertiary">
          <h3 className="font-bold">Approval Status</h3>
        </div>
        <div className="p-4 flex-1 flex flex-col space-y-4">
          <div>
            <span className={`badge-${approvalStatus === 'APPROVED' ? 'success' : approvalStatus === 'REVISION_REQUESTED' ? 'danger' : 'warning'}`}>
              {approvalStatus.replace('_', ' ')}
            </span>
          </div>

          <textarea
            className="w-full bg-bg border border-border p-2 rounded text-sm focus:border-accent outline-none"
            rows="3"
            placeholder="Review notes..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />

          <button onClick={() => updateApproval("APPROVED")} className="btn-primary" disabled={approvalStatus === 'APPROVED'}>
            <Check className="h-4 w-4 mr-1" /> Approve
          </button>
          
          <button onClick={() => updateApproval("REVISION_REQUESTED")} className="btn-secondary text-danger border-danger/30 hover:bg-danger/10">
            <X className="h-4 w-4 mr-1" /> Request Revision
          </button>

          <div className="pt-8 border-t border-border mt-auto">
             <button 
               onClick={handleShare} 
               className="btn-primary w-full bg-mint text-black hover:bg-mint/80"
               disabled={approvalStatus !== 'APPROVED'}
             >
               <Send className="h-4 w-4 mr-1" /> Share with Client
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
