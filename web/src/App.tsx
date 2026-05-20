import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { VersionBadge } from './components/VersionBadge'
import { ArmiesPage } from './pages/ArmiesPage'
import { MatchesPage } from './pages/MatchesPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-full flex-col">
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<Navigate to="/armies" replace />} />
            <Route path="/armies" element={<ArmiesPage />} />
            <Route path="/matches" element={<MatchesPage />} />
          </Routes>
        </main>
        <VersionBadge />
        <TabBar />
      </div>
    </BrowserRouter>
  )
}

function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex h-16 items-stretch border-t border-white/10 bg-[#1a2b4a]/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <TabLink to="/armies" label="Armies" />
      <TabLink to="/matches" label="Matches" />
    </nav>
  )
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 items-center justify-center text-sm font-semibold transition-colors ${
          isActive ? 'text-white' : 'text-white/55'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
