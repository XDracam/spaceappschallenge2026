import earthArtwork from './assets/title-earth.webp';

export function TitleScene() {
  return (
    <div class="title-scene" aria-hidden="true">
      <img class="title-artwork" src={earthArtwork} alt="" loading="eager" decoding="async" />
    </div>
  );
}
