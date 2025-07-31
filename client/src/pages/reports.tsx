import { Layout } from "@/components/Layout";
import { ReportsAndAnalytics } from "@/components/ReportsAndAnalytics";

export default function ReportsPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReportsAndAnalytics />
      </div>
    </Layout>
  );
}