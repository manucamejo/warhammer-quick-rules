import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ArmiesPage } from './pages/ArmiesPage'
import { ArmyDetailPage } from './pages/ArmyDetailPage'
import { MatchesPage } from './pages/MatchesPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-full flex-col">
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/armies" replace />} />
            <Route path="/armies" element={<ArmiesPage />} />
            <Route path="/armies/:id" element={<ArmyDetailPage />} />
            <Route path="/matches" element={<MatchesPage />} />
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
      className="fixed inset-x-0 bottom-0 z-10 flex items-stretch border-t border-white/10 bg-[#0f1d36]/95 backdrop-blur"
      style={{
        height: 'calc(4rem + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
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
      className={({ isActive }) =>
        `group relative flex flex-1 items-center justify-center transition-colors ${
          isActive ? '' : 'text-white/45 hover:text-white/70'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 shadow-[0_0_12px_rgba(251,146,60,0.7)]"
            />
          )}
          <span
            className={`text-lg font-extrabold uppercase tracking-[0.18em] ${
              isActive
                ? 'bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 bg-clip-text text-transparent drop-shadow-[0_1px_8px_rgba(251,146,60,0.35)]'
                : ''
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
