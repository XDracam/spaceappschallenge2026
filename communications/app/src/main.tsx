import { render } from 'preact';
import { App } from './ui/App';
import { startClock } from './state/store';
import './ui/styles.css';

startClock();
render(<App />, document.getElementById('app')!);
