// Minimal structured logger for {{projectName}}.
//
// The default implementation is dependency-free and writes structured
// JSON-ish lines to stdout/stderr. Swap this module out for Pino,
// winston, or a Sentry transport when you're ready — every call site
// uses only the `log` object exported below, so the swap is a one-file
// change.
//
// Usage:
//
//   import { log } from '@/lib/logger';
//
//   log.info({ event: 'user.signin', userId }, 'user signed in');
//   log.error({ err }, 'failed to process webhook');
//
// Structured-first: the first argument is always a plain object of
// context; the second is a human-readable message. This shape matches
// Pino's API exactly so the upgrade path is trivial.

type Level = 'debug' | 'info' | 'warn' | 'error';

type Context = Record<string, unknown>;

function emit(level: Level, ctx: Context, msg: string): void {
  const line = { level, time: new Date().toISOString(), ...ctx, msg };
  const writer = level === 'error' || level === 'warn' ? console.error : console.log;
  writer(JSON.stringify(line));
}

export const log = {
  debug(ctx: Context, msg: string): void {
    if (process.env.NODE_ENV === 'production') return;
    emit('debug', ctx, msg);
  },
  info(ctx: Context, msg: string): void {
    emit('info', ctx, msg);
  },
  warn(ctx: Context, msg: string): void {
    emit('warn', ctx, msg);
  },
  error(ctx: Context, msg: string): void {
    emit('error', ctx, msg);
  },
};
