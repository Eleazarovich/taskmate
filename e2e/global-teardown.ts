import type { FullConfig } from '@playwright/test';
import { runCompose } from './compose';

export default function globalTeardown(_: FullConfig): void {
  if (process.env.TASKMATE_E2E_EXTERNAL_STACK === 'true') {
    return;
  }

  runCompose(['down', '--volumes', '--remove-orphans']);
}
