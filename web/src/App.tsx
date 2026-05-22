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
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center">
      <nav
        className="pointer-events-auto flex w-full max-w-md items-stretch gap-1 rounded-t-3xl border-t border-white/10 bg-[#0f1d36]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-md"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
      >
        <TabLink to="/armies" label="Armies" />
        <TabLink to="/matches" label="Matches" />
      </nav>
    </div>
  )
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 items-center justify-center rounded-full px-4 py-2.5 text-sm font-extrabold uppercase tracking-[0.18em] transition-colors ${
          isActive
            ? 'bg-white/15 text-white'
            : 'text-white/55 active:bg-white/8'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
