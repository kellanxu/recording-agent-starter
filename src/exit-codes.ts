export const ExitCode = {
  success: 0,
  usage: 2,
  unavailable: 3,
  failure: 1,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
