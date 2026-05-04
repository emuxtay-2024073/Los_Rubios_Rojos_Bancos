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
import { Limits } from '../../pages/Limits.jsx';
import { Reversals } from '../../pages/Reversals.jsx';
import { Currency } from '../../pages/Currency.jsx';
import { Users } from '../../pages/Users.jsx';

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
            <RoleGuard allowedRoles={['ADMIN', 'ADMIN_ROLE']}>
              <DashboardPage />
            </RoleGuard>
          </ProtectedRoutes>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path='accounts' element={<Accounts />} />
        <Route path='beneficiaries' element={<Beneficiaries />} />
        <Route path='transactions' element={<Transfers />} />
        <Route path='limits' element={<Limits />} />
        <Route path='reversals' element={<Reversals />} />
        <Route path='currency' element={<Currency />} />
        <Route path='users' element={<Users />} />
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Route>
    </Routes>
  );
};
