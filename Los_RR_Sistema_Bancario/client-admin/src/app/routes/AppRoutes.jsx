import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { DashboardPage } from '../layouts/DashboardPage.jsx';
import { ProtectedRoutes } from './ProtectedRoutes.jsx';
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { Dashboard } from '../../pages/Dashboard.jsx';
import { Accounts } from '../../pages/Accounts.jsx';
import { Beneficiaries } from '../../pages/Beneficiaries.jsx';
import { Transfers } from '../../pages/Transfers.jsx';
import { Reversals } from '../../pages/Reversals.jsx';
import { Currency } from '../../pages/Currency.jsx';
import { AdminAccountsView } from '../../pages/AdminAccountsView.jsx';
import { AdminBeneficiariesView } from '../../pages/AdminBeneficiariesView.jsx';
import { AdminTransfersView } from '../../pages/AdminTransfersView.jsx';
import { AdminLimitsView } from '../../pages/AdminLimitsView.jsx';
import { AdminReversalsView } from '../../pages/AdminReversalsView.jsx';
import { AdminCurrencyView } from '../../pages/AdminCurrencyView.jsx';
import { AdminUsersView } from '../../pages/AdminUsersView.jsx';
import { AdminDisableRequestsView } from '../../pages/AdminDisableRequestsView.jsx';
import { Deposits } from '../../pages/Deposits.jsx';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const RoleBasedPage = ({ adminElement, clientElement }) => {
  const role = useAuthStore((state) => state.user?.role?.toUpperCase());
  const isAdmin = role === 'ADMIN' || role === 'ADMIN_ROLE';

  return isAdmin ? adminElement : clientElement;
};

const DashboardIndex = () => {
  const role = useAuthStore((state) => state.user?.role?.toUpperCase());
  const isAdmin = role === 'ADMIN' || role === 'ADMIN_ROLE';
  return isAdmin ? <Dashboard /> : <Accounts />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<AuthPage />} />
      <Route path='/verify-email' element={<VerifyEmailPage />} />
      <Route path='/unauthorized' element={<UnauthorizedPage />} />
      <Route
        path='/dashboard/*'
        element={
          <ProtectedRoutes>
            <DashboardPage />
          </ProtectedRoutes>
        }
      >
        <Route
          index
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <DashboardIndex />
            </RoleGuard>
          }
        />
        <Route
          path='accounts'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminAccountsView />} clientElement={<Accounts />} />
            </RoleGuard>
          }
        />
        <Route
          path='beneficiaries'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminBeneficiariesView />} clientElement={<Beneficiaries />} />
            </RoleGuard>
          }
        />
        <Route
          path='transactions'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminTransfersView />} clientElement={<Transfers />} />
            </RoleGuard>
          }
        />
        <Route
          path='limits'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminLimitsView />
            </RoleGuard>
          }
        />
        <Route
          path='reversals'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminReversalsView />} clientElement={<Reversals />} />
            </RoleGuard>
          }
        />
        <Route
          path='currency'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminCurrencyView />} clientElement={<Currency />} />
            </RoleGuard>
          }
        />
        <Route
          path='deposits'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE', 'CLIENTE']}>
              <RoleBasedPage adminElement={<AdminAccountsView />} clientElement={<Deposits />} />
            </RoleGuard>
          }
        />
        <Route
          path='disable-requests'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminDisableRequestsView />
            </RoleGuard>
          }
        />
        <Route
          path='users'
          element={
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <AdminUsersView />
            </RoleGuard>
          }
        />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Route>
    </Routes>
  );
};
