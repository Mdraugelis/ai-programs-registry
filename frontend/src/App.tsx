import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Layout from './components/layout/Layout';
import InitiativeList from './components/initiatives/InitiativeList';
import IntakeForm from './components/forms/IntakeForm';
import InitiativeDetail from './components/initiatives/InitiativeDetail';
import DocumentTestPage from './components/shared/documents/DocumentTestPage';
import TestSimple from './components/TestSimple';
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
  console.log('App component rendering...');
  
  try {
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
                    <Route path="/test-documents" element={<DocumentTestPage />} />
                    <Route path="/test-simple" element={<TestSimple />} />
                  </Routes>
                </Layout>
              </Router>
            </FiltersProvider>
          </InitiativesProvider>
        </AuthProvider>
      </MantineProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return <div style={{ padding: '20px', background: 'red', color: 'white' }}>Error in App: {String(error)}</div>;
  }
}

export default App;
