"""Portable paths for optional preview renders; frozen delivery exports are never overwritten."""
from pathlib import Path
import argparse
import tempfile

def prepare(package: Path, default_name: str):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--capture', type=Path, default=package / 'assets' / 'capture.json', help='Capture metadata (existing recordings are not modified)')
    parser.add_argument('--output', type=Path, default=package / default_name, help='New preview MP4; must not already exist')
    args = parser.parse_args()
    output = args.output.resolve()
    if output.name in {'T-Minus-Submission.mp4', 'Mission-Control-Submission.mp4'}:
        parser.error('The submitted exports are frozen. Choose a new preview filename.')
    if output.exists():
        parser.error(f'Output already exists; choose a new preview filename: {output}')
    if not output.parent.is_dir():
        parser.error(f'Output directory does not exist: {output.parent}')
    if not args.capture.is_file():
        parser.error(f'Capture metadata not found: {args.capture}')
    work = Path(tempfile.mkdtemp(prefix='t-minus-render-'))
    print(f'Render work directory: {work}\nPreview output: {output}')
    return args.capture.resolve(), output, work

def recording(capture_file: Path, stored_path: str, package: Path):
    source = Path(stored_path)
    candidates = [source] if source.is_absolute() else [capture_file.parent / source]
    # Older preserved metadata used absolute workstation paths. Resolve by basename
    # only within this package's retained raw archive; never guess a different file.
    candidates.append(package / 'raw' / source.name)
    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve()
    raise SystemExit(f'Recording not found: {stored_path}. Supply --capture with metadata beside its source recording.')
