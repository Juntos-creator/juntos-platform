import { Navbar } from '@/components/navbar';
import { ServiceWizard } from '@/components/service-wizard';

export default function NewServicePage() {
  return (
    <>
      <Navbar />
      <main className="container py-8">
        <ServiceWizard />
      </main>
    </>
  );
}
