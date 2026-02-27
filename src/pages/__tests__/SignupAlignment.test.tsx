import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';
import EmailVerificationPage from '../EmailVerificationPage';

describe('Alinhamento visual: LandingPage vs Cadastro de Teste Grátis', () => {
  it('usa a mesma cor e estilo nos CTAs principais', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    const landingButtons = screen
      .getAllByText(/Começar Grátis/i)
      .map(element => element.closest('button'))
      .filter((button): button is HTMLButtonElement => Boolean(button));
    const landingCta =
      landingButtons.find(button => button.className.includes('bg-[#F5A623]')) ??
      landingButtons[0];
    expect(landingCta).toBeTruthy();
    expect(landingCta.className).toContain('bg-[#F5A623]');

    render(
      <MemoryRouter>
        <EmailVerificationPage />
      </MemoryRouter>
    );
    const signupCta = screen.getByText(/Continuar/i).closest('button');
    expect(signupCta).toBeTruthy();
    expect(signupCta?.className).toContain('bg-[#F5A623]');
    expect(signupCta?.className).toContain('rounded-xl');
  });

  it('mantém superfícies, bordas e hierarquia visual', () => {
    render(
      <MemoryRouter>
        <EmailVerificationPage />
      </MemoryRouter>
    );
    const container = screen.getByText('Criar Conta').parentElement?.parentElement;
    expect(container).toBeTruthy();
    const cls = container?.className || '';
    expect(cls).toContain('bg-[#141414]');
    expect(cls).toContain('border-[#2a2a2a]');
    expect(cls).toContain('rounded-2xl');
  });

  it('inputs seguem tokens de foco e borda do design system', () => {
    render(
      <MemoryRouter>
        <EmailVerificationPage />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText('Ex: Barbearia do João');
    expect(input.className).toContain('border-[#2a2a2a]');
    expect(input.className).toContain('focus:ring-[#F5A623]');
    expect(input.className).toContain('bg-[#141414]');
  });
});
