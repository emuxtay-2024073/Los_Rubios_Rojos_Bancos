import { Navbar } from './Navbar.jsx';
import { ClientSidebar } from './ClientSidebar.jsx';

export const ClientDashboardContainer = ({ user, onLogout, children }) => {
  return (
    <div className='min-h-screen page-background flex flex-col'>
      <Navbar user={user} onLogout={onLogout} />

      <div className='flex flex-1'>
        <ClientSidebar />

        <main className='flex-1 p-6 md:p-8'>{children}</main>
      </div>
    </div>
  );
};
