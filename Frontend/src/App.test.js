import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AllRoutes from './AllRoutes';
import App from './App';

test('renders a route to the HomeScreen', () => {
  render(
    <MemoryRouter initialEntries={['/Home']}>
      <AllRoutes />
    </MemoryRouter>
  );

  expect(screen.getByText(/Home Screen/i)).toBeInTheDocument();
});


test('renders App component with routes', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );


  const appElement = screen.getByTestId('child');
  expect(appElement).toBeInTheDocument();

  
  const allRoutesElement = screen.getByTestId('semi-child');
  expect(allRoutesElement).toBeInTheDocument();

  // You can add more specific assertions if needed based on your UI elements
});
