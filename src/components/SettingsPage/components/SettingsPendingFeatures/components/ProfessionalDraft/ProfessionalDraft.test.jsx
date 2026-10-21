import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfessionalDraft } from './ProfessionalDraft';

const profile = { job_title: '', department: '', office: '', biography: '' };

describe('ProfessionalDraft', () => {
  it('names the local draft and enables the save once a field changed', () => {
    const { rerender } = render(<ProfessionalDraft profile={profile} confirmedProfile={profile} busy={false} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText(/Informations professionnelles/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer les informations professionnelles' }).disabled).toBe(true);
    rerender(<ProfessionalDraft profile={{ ...profile, biography: 'Agent' }} confirmedProfile={profile} busy={false} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Enregistrer les informations professionnelles' }).disabled).toBe(false);
  });
});
