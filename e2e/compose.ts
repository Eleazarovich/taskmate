import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export const composeProject = 'taskmate-e2e';
export const composeFile = resolve(__dirname, '..', 'docker-compose.yaml');
export const appPort = process.env.TASKMATE_E2E_PORT ?? '8001';

const composeEnvironment = {
  ...process.env,
  COMPOSE_PROJECT_NAME: composeProject,
  TASKMATE_APP_PORT: appPort,
};

export function runCompose(args: string[]): void {
  execFileSync('docker', ['compose', '--file', composeFile, '--project-name', composeProject, ...args], {
    cwd: resolve(__dirname, '..'),
    env: composeEnvironment,
    stdio: 'inherit',
    timeout: 300_000,
  });
}
