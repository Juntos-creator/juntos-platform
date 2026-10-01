import { Navbar } from '@/components/navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container py-8">{children}</main>
    </>
  );
}
