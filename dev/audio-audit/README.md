# Audio audition development archive

The selected game sounds live in [`game/public/audio/`](../../game/public/audio/). This historical comparison workbench, 38 previews and all source/license records stay outside the deployable public directory. No game mechanics depend on it.

From the repository root, run:

```sh
python3 -m http.server 5198 --bind 127.0.0.1
```

Open [the local workbench](http://127.0.0.1:5198/dev/audio-audit/). The T-Minus link opens the published game. Stop the local server when finished; serving the repository is for local development only. The page's displayed Earth copy now reuses the already-labelled title source byte for byte; the unlabelled original remains in `source/` as historical evidence. Audio and selection behavior are unchanged.
