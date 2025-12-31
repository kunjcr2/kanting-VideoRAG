import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AppShell from './components/AppShell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppShell />} />
    </Routes>
  )
}

export default App
