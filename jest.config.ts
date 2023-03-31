import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testRegex: ['/.*\\.test\\.(ts|tsx)$'],
      setupFilesAfterEnv: ['./jest-setup.ts'],
      fakeTimers: {
        enableGlobally: true,
      },
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: ['/.*\\.test\\.node\\.(ts|tsx)$'],
      setupFilesAfterEnv: ['./jest-setup.ts'],
      fakeTimers: {
        enableGlobally: true,
      },
    },
  ],
};

export default config;
