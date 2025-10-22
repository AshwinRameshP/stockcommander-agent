import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: any }) => {
    const mockUser = {
      attributes: { email: 'test@example.com' },
      signInUserSession: {
        accessToken: {
          payload: { 'cognito:groups': ['manager'] }
        }
      }
    };
    const mockSignOut = jest.fn();
    return children({ signOut: mockSignOut, user: mockUser });
  },
}));

test('renders dashboard page', () => {
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
  
  expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
});