import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Layout from './components/layout/Layout';
import InitiativeList from './components/initiatives/InitiativeList';
import IntakeForm from './components/forms/IntakeForm';
import InitiativeDetail from './components/initiatives/InitiativeDetail';
import { AuthProvider } from './contexts/AuthContext';
import { InitiativesProvider } from './contexts/InitiativesContext';
import { FiltersProvider } from './contexts/FiltersContext';

// Import Mantine core styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

// Create custom theme for AI Programs Registry
const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
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
    </MantineProvider>
  );
}

export default App;
