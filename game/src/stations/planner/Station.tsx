// Planner station root view (rendered by the shell inside <div class="st-root st-planner">).
// Game state comes from the shared core store; see logic.ts (reducers),
// derive.ts (derived part states) and result.ts (mission result).
import './ui/styles.css';
import { App } from './ui/App';

export function PlannerStation() {
  return <App />;
}
