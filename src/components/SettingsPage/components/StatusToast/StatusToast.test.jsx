import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastProvider } from '@mairie360/lib-components/primitives';

import { StatusToast } from './StatusToast';

const wrap = (node) => <ToastProvider regionLabel="Notifications" placement="top-end">{node}</ToastProvider>;

describe('StatusToast', () => {
  it('shows nothing without a message', () => {
    const onShown = vi.fn();
    render(wrap(<StatusToast message="" onShown={onShown} />));
    expect(onShown).not.toHaveBeenCalled();
    expect(document.querySelector('[data-m360-component~="Toast"]')).toBeNull();
  });

  it('queues a success toast once, then lets the caller clear its message', () => {
    const onShown = vi.fn();
    render(wrap(<StatusToast message="Votre profil a été enregistré." title="Profil enregistré" onShown={onShown} />));
    expect(onShown).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('group', { name: 'Profil enregistré' })).toBeTruthy();
  });

  it('queues an error toast announced assertively', () => {
    render(wrap(<StatusToast message="Enregistrement impossible." tone="error" onShown={() => {}} />));
    expect(screen.getByRole('alert').textContent).toContain('Enregistrement impossible.');
  });
});
