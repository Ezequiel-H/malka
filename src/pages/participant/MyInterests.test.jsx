import { describe, it, expect } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyInterests from './MyInterests.jsx';

const Donde = () => {
  const l = useLocation();
  return <p>{`${l.pathname}${l.hash}`}</p>;
};

describe('MyInterests', () => {
  it('lleva a los intereses dentro del perfil', () => {
    render(
      <MemoryRouter initialEntries={['/my-interests']}>
        <Routes>
          <Route path="/my-interests" element={<MyInterests />} />
          <Route path="/my-profile" element={<Donde />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('/my-profile#intereses')).toBeInTheDocument();
  });
});
