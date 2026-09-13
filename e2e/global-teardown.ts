import type { FullConfig } from '@playwright/test';
import { runCompose } from './compose';

export default function globalTeardown(_: FullConfig): void {
  runCompose(['down', '--volumes', '--remove-orphans']);
}
