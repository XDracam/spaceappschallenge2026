import { useStore } from '../core/createStore';
import { audioState, setAudioPreferences } from './gameAudio';
import './sound-settings.css';

export function SoundSettings() {
  const s = useStore(audioState, s => s);
  return <section class="sound-settings" aria-label="Sound controls">
    <button class="sound-mute" type="button" aria-label={s.muted ? 'Unmute sound' : 'Mute sound'} title={s.muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={s.muted} onClick={() => setAudioPreferences({ muted: !s.muted })}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {s.muted ? <path d="m17 9 5 6m0-6-5 6" /> : <path d="M17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />}
      </svg>
    </button>
      <label class="sound-volume">Effects <input aria-label="Effects volume" type="range" min="0" max="100" value={Math.round(s.effects * 100)} onInput={e => setAudioPreferences({ effects: Number(e.currentTarget.value) / 100 })} /><span>{Math.round(s.effects * 100)}%</span></label>
      <label class="sound-volume">Music <input aria-label="Music volume" type="range" min="0" max="100" value={Math.round(s.music * 100)} onInput={e => setAudioPreferences({ music: Number(e.currentTarget.value) / 100 })} /><span>{Math.round(s.music * 100)}%</span></label>
      {(s.error || s.storageFailed) && <p class="sound-error" role="status">{s.error || 'Volume could not be saved. This tab still uses your settings.'}</p>}
  </section>;
}
