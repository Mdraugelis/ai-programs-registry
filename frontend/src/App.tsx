import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import InitiativeList from './components/initiatives/InitiativeList';
import IntakeForm from './components/forms/IntakeForm';
import InitiativeDetail from './components/initiatives/InitiativeDetail';
import { AuthProvider } from './contexts/AuthContext';
import { InitiativesProvider } from './contexts/InitiativesContext';
import { FiltersProvider } from './contexts/FiltersContext';

function App() {
  return (
    <AuthProvider>
      <InitiativesProvider>
        <FiltersProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/initiatives" replace />} />
                <Route path="/initiatives" element={<InitiativeList />} />
                <Route path="/initiatives/new" element={<IntakeForm />} />
                <Route path="/initiatives/:id" element={<InitiativeDetail />} />
                <Route path="/initiatives/:id/edit" element={<IntakeForm />} />
              </Routes>
            </Layout>
          </Router>
        </FiltersProvider>
      </InitiativesProvider>
    </AuthProvider>
  );
}

export default App;
