import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const DashboardContainer = ({ user, onLogout, children }) => {
  return (
    <div className='min-h-screen page-background flex flex-col'>
      <Navbar user={user} onLogout={onLogout} />

      <div className='flex flex-1'>
        <Sidebar />

        <main className='flex-1 p-6 md:p-8'>{children}</main>
      </div>
    </div>
  );
};
