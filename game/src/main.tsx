// Mission Control — one app, four station views (D-015).
import './core/registerStations';
import { render } from 'preact';
import { App } from './shell/App';
import { startHostClock } from './core/clock';
import { startPersistence } from './core/persist';
import { installPlaytestHook } from './core/playtestHook';
import './shell/shell.css';

installPlaytestHook();
startHostClock();
startPersistence();
render(<App />, document.getElementById('app')!);
