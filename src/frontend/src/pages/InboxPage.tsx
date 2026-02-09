import MainLayout from '@/components/layout/MainLayout';
import Inbox from '@/components/messages/Inbox';

export default function InboxPage() {
  return (
    <MainLayout>
      <div className="container py-8 animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Inbox</h1>
          <p className="page-description">Direct messages between leagues and referees</p>
        </div>
        <Inbox />
      </div>
    </MainLayout>
  );
}
