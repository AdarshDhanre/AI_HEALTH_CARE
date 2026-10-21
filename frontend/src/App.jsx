import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import RegisterPatient from './pages/RegisterPatient'
import CaseTaking from './pages/CaseTaking'
import Reports from './pages/Reports'
import ReportReview from './pages/ReportReview'
import PatientHistory from './pages/PatientHistory'
import UserManagement from './pages/admin/UserManagement'
import Analytics from './pages/research/Analytics'
import AyushmanScanner from './pages/AyushmanScanner'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  )
}

function Home() {
  const { user } = useAuth()
  if (user.role === 'ADMIN') return <Navigate to="/admin/users" replace />
  if (user.role === 'RESEARCHER') return <Navigate to="/research" replace />
  return <Dashboard />
}

const CLINICAL = ['DOCTOR', 'PATIENT']

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/patients" element={<ProtectedRoute roles={CLINICAL}><Patients /></ProtectedRoute>} />
        <Route path="/patients/new" element={<ProtectedRoute roles={CLINICAL}><RegisterPatient /></ProtectedRoute>} />
        <Route path="/patients/:id/case" element={<ProtectedRoute roles={['DOCTOR']}><CaseTaking /></ProtectedRoute>} />
        <Route path="/patients/:id/reports" element={<ProtectedRoute roles={CLINICAL}><Reports /></ProtectedRoute>} />
        <Route path="/patients/:id/history" element={<ProtectedRoute roles={CLINICAL}><PatientHistory /></ProtectedRoute>} />
        <Route path="/ayushman-scanner" element={<ProtectedRoute roles={CLINICAL}><AyushmanScanner /></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute roles={CLINICAL}><ReportReview /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute roles={['RESEARCHER', 'ADMIN']}><Analytics /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
