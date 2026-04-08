// create-rell-app CLI entry point.
//
// This file is the only module tsup bundles into the published bin.
// It has exactly one job: build the Commander program and run it against
// the actual process argv. All logic lives in ./index.ts so it is unit-
// testable in isolation.

import { buildProgram } from './index.ts';

const program = buildProgram();
await program.parseAsync(process.argv);
