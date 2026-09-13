import type { FullConfig } from '@playwright/test';
import { runCompose } from './compose';

export default function globalSetup(_: FullConfig): void {
  if (process.env.TASKMATE_E2E_EXTERNAL_STACK === 'true') {
    return;
  }

  // Use a separate Compose project and volume so an e2e run cannot mutate a
  // developer's regular Taskmate stack or database.
  runCompose(['down', '--volumes', '--remove-orphans']);
  runCompose(['up', '--detach', '--build', '--wait']);
}
