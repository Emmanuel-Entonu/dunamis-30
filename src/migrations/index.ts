import * as migration_20261104_102850_initial from './20261104_102850_initial';
import * as migration_20261105_103233_testimony_switch from './20261105_103233_testimony_switch';
import * as migration_20261105_121837_username_login from './20261105_121837_username_login';

export const migrations = [
  {
    up: migration_20261104_102850_initial.up,
    down: migration_20261104_102850_initial.down,
    name: '20261104_102850_initial',
  },
  {
    up: migration_20261105_103233_testimony_switch.up,
    down: migration_20261105_103233_testimony_switch.down,
    name: '20261105_103233_testimony_switch',
  },
  {
    up: migration_20261105_121837_username_login.up,
    down: migration_20261105_121837_username_login.down,
    name: '20261105_121837_username_login'
  },
];
