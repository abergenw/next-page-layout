module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      testRegex: ['/.*\\.test\\.(ts|tsx)$'],
      timers: 'fake',
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testRegex: ['/.*\\.test\\.node\\.(ts|tsx)$'],
      timers: 'fake',
    },
  ],
};
