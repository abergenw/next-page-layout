import { TextEncoder } from 'util';

jest.mock('next/router', () => require('next-router-mock'));
global.TextEncoder = TextEncoder;
