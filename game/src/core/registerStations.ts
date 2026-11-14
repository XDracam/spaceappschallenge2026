// Eagerly import every station's game logic (reducers + tick handlers) so all
// browsers register the same actions in the same order — required for replay.
// Station logic files must not import UI code.
import './coreActions';
import '../stations/planner/logic';
import '../stations/procurement/logic';
import '../stations/science/logic';
import '../stations/comms/logic';
