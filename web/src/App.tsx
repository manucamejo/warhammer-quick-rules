import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ArmiesPage } from './pages/ArmiesPage'
import { ArmyDetailPage } from './pages/ArmyDetailPage'
import { MatchDetailPage } from './pages/MatchDetailPage'
import { MatchesPage } from './pages/MatchesPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-full flex-col bg-[#451017]">
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/armies" replace />} />
            <Route path="/armies" element={<ArmiesPage />} />
            <Route path="/armies/:id" element={<ArmyDetailPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/matches/:id" element={<MatchDetailPage />} />
          </Routes>
        </main>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}

function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch border-t border-white/10 bg-[#0f1d36]"
      style={{
        height: 'calc(2.5rem + env(safe-area-inset-bottom))',
      }}
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
      className="group relative flex flex-1 items-end justify-center"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom) - 1.75rem, 0.375rem)',
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-white"
            />
          )}
          <span
            className={`text-base font-extrabold uppercase tracking-[0.18em] transition-colors ${
              isActive ? 'text-white' : 'text-white/45'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
