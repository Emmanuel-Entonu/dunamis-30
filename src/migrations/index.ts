import * as migration_20261104_102850_initial from './20261104_102850_initial';
import * as migration_20261105_103233_testimony_switch from './20261105_103233_testimony_switch';
import * as migration_20261105_121837_username_login from './20261105_121837_username_login';
import * as migration_20261106_214155_dashboard_uploads from './20261106_214155_dashboard_uploads';
import * as migration_20261106_235000_site_events from './20261106_235000_site_events';
import * as migration_20261108_120000_testimony_rotation from './20261108_120000_testimony_rotation';

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
    name: '20261105_121837_username_login',
  },
  {
    up: migration_20261106_214155_dashboard_uploads.up,
    down: migration_20261106_214155_dashboard_uploads.down,
    name: '20261106_214155_dashboard_uploads'
  },
  {
    up: migration_20261106_235000_site_events.up,
    down: migration_20261106_235000_site_events.down,
    name: '20261106_235000_site_events'
  },
  {
    up: migration_20261108_120000_testimony_rotation.up,
    down: migration_20261108_120000_testimony_rotation.down,
    name: '20261108_120000_testimony_rotation'
  },
];
