// Mission Control — one app, four station views (D-015).
import './core/registerStations';
import { render } from 'preact';
import { App } from './shell/App';
import { startHostClock } from './core/clock';
import { startPersistence } from './core/persist';
import { installPlaytestHook } from './core/playtestHook';
import { installGameAudio } from './audio/gameAudio';
// Keep the established style cascade stable when station view code loads lazily.
// Shell corner overrides follow these station styles, exactly as before splitting.
import './stations/planner/ui/styles.css';
import './stations/planner/ui/panels.css';
import './stations/planner/ui/popups.css';
import './stations/procurement/procurement.css';
import './stations/science/ui/styles.css';
import './stations/comms/ui/styles.css';
import './shell/shell.css';

installPlaytestHook();
installGameAudio();
startHostClock();
startPersistence();
render(<App />, document.getElementById('app')!);
