import * as migration_20261104_102850_initial from './20261104_102850_initial';

export const migrations = [
  {
    up: migration_20261104_102850_initial.up,
    down: migration_20261104_102850_initial.down,
    name: '20261104_102850_initial'
  },
];
