import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Incidents from './pages/Incidents';
import Analytics from './pages/Analytics';
import Simulation from './pages/Simulation';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-100'} grid-pattern`}>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard darkMode={darkMode} />} />
            <Route path="/clients" element={<Clients darkMode={darkMode} />} />
            <Route path="/clients/:id" element={<ClientDetail darkMode={darkMode} />} />
            <Route path="/incidents" element={<Incidents darkMode={darkMode} />} />
            <Route path="/analytics" element={<Analytics darkMode={darkMode} />} />
            <Route path="/simulation" element={<Simulation darkMode={darkMode} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
