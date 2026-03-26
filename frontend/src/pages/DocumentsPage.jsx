import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import DocumentManager from "../components/dashboard/DocumentManager";
import DashboardLayout from "../components/layout/DashboardLayout";

/**
 * Render the documents workspace page.
 * @returns {JSX.Element}
 */
export default function DocumentsPage() {
  const documentsQuery = useQuery({ queryKey: ["documents"], queryFn: api.upload.getDocuments });
  const documents = documentsQuery.data?.documents || [];

  return (
    <DashboardLayout title="Documents">
      <DocumentManager documents={documents} onRefresh={documentsQuery.refetch} />
    </DashboardLayout>
  );
}

