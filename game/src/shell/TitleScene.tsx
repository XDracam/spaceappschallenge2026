import earthArtwork from './assets/title-earth.webp';

export function TitleScene() {
  return (
    <div class="title-scene" aria-hidden="true">
      <img class="title-artwork" src={earthArtwork} width={1672} height={941} alt="" loading="eager" decoding="async" />
    </div>
  );
}
