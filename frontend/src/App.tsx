import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recommendations from './pages/Recommendations';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// AWS Amplify configuration
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_example',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'example',
    }
  },
  API: {
    REST: {
      inventoryAPI: {
        endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://api.example.com',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      }
    }
  }
});

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <Router>
          <Layout user={user} signOut={signOut}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      )}
    </Authenticator>
  );
}

export default App;