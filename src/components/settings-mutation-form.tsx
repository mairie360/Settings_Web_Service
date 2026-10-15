"use client";

import { useSyncExternalStore, type ComponentProps } from 'react';

const subscribe = () => () => {};
const browserReady = () => true;
const serverReady = () => false;
type Props = Pick<ComponentProps<'form'>, 'children' | 'className' | 'onSubmit' | 'aria-busy' | 'aria-labelledby'>;

// Mutations are owned by SDK handlers, with no HTML form endpoint. Keep the
// confirmed fields readable on the server without offering a native submission.
export default function SettingsMutationForm({ children, className, onSubmit, ...aria }: Props) {
  const ready = useSyncExternalStore(subscribe, browserReady, serverReady);
  const classes = className?.split(/\s+/) ?? [];
  const spacing = classes.filter(value => value.startsWith('space-y-')).join(' ');
  const container = classes.filter(value => !value.startsWith('space-y-')).join(' ');
  return ready
    ? <form method="post" className={className} onSubmit={onSubmit} data-settings-mutation {...aria}>{children}</form>
    : <div className={container} data-settings-mutation {...aria}><fieldset disabled className={`m-0 min-w-0 border-0 p-0 ${spacing}`}>{children}</fieldset><noscript><p>Activez JavaScript pour modifier et enregistrer ces informations.</p></noscript></div>;
}
