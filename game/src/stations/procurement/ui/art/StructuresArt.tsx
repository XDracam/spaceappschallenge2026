// Authored component diagrams; all joined faces share the same projected vertices.
export function StructuresArtDefs() {
  return (
    <>
      <symbol id="pr-art-panel" viewBox="0 0 300 180">
        {/* Shared oblique projection for cell beds, structural rails, hinge and yoke.
            The visible edge faces represent the same five-unit panel thickness. */}
        <linearGradient id="pr-panel-cell" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#173d5c" /><stop offset=".55" stop-color="#285b7c" /><stop offset="1" stop-color="#102b43" /></linearGradient>
        <path d="M173.34 131.92 L183.90 129.04 L183.90 136.04 L173.34 138.92Z" fill="#45627f" />
        <path d="M154.92 82.12 L183.90 129.04 L183.90 136.04 L154.92 89.12Z" fill="#29445d" />
        <path d="M144.36 85.00 L154.92 82.12 L183.90 129.04 L173.34 131.92Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M165.30 140.88 L196.98 132.24 L196.98 138.24 L165.30 146.88Z" fill="#45627f" />
        <path d="M191.52 123.40 L196.98 132.24 L196.98 138.24 L191.52 129.40Z" fill="#29445d" />
        <path d="M159.84 132.04 L191.52 123.40 L196.98 132.24 L165.30 140.88Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M137.28 84.52 L176.88 73.72 L176.88 81.72 L137.28 92.52Z" fill="#45627f" />
        <path d="M171.84 65.56 L176.88 73.72 L176.88 81.72 L171.84 73.56Z" fill="#29445d" />
        <path d="M132.24 76.36 L171.84 65.56 L176.88 73.72 L137.28 84.52Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M75.50 123.00 L156.46 100.92 L156.46 105.92 L75.50 128.00Z" fill="#45627f" />
        <path d="M124.96 49.92 L156.46 100.92 L156.46 105.92 L124.96 54.92Z" fill="#29445d" />
        <path d="M44.00 72.00 L124.96 49.92 L156.46 100.92 L75.50 123.00Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M49.20 73.76 L123.12 53.60 L151.26 99.16 L77.34 119.32Z" fill="#0c2033" />
        <path d="M54.86 74.60 L67.18 71.24 L69.78 72.12 L73.56 78.24 L72.64 80.08 L60.32 83.44 L57.72 82.56 L53.94 76.44Z" fill="url(#pr-panel-cell)" />
        <path d="M58.80 74.32L63.42 81.80M64.08 72.88L68.70 80.36" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M72.46 69.80 L84.78 66.44 L87.38 67.32 L91.16 73.44 L90.24 75.28 L77.92 78.64 L75.32 77.76 L71.54 71.64Z" fill="url(#pr-panel-cell)" />
        <path d="M76.40 69.52L81.02 77.00M81.68 68.08L86.30 75.56" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M90.06 65.00 L102.38 61.64 L104.98 62.52 L108.76 68.64 L107.84 70.48 L95.52 73.84 L92.92 72.96 L89.14 66.84Z" fill="url(#pr-panel-cell)" />
        <path d="M94.00 64.72L98.62 72.20M99.28 63.28L103.90 70.76" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M107.66 60.20 L119.98 56.84 L122.58 57.72 L126.36 63.84 L125.44 65.68 L113.12 69.04 L110.52 68.16 L106.74 62.04Z" fill="url(#pr-panel-cell)" />
        <path d="M111.60 59.92L116.22 67.40M116.88 58.48L121.50 65.96" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M61.58 85.48 L73.90 82.12 L76.50 83.00 L80.28 89.12 L79.36 90.96 L67.04 94.32 L64.44 93.44 L60.66 87.32Z" fill="url(#pr-panel-cell)" />
        <path d="M65.52 85.20L70.14 92.68M70.80 83.76L75.42 91.24" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M79.18 80.68 L91.50 77.32 L94.10 78.20 L97.88 84.32 L96.96 86.16 L84.64 89.52 L82.04 88.64 L78.26 82.52Z" fill="url(#pr-panel-cell)" />
        <path d="M83.12 80.40L87.74 87.88M88.40 78.96L93.02 86.44" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M96.78 75.88 L109.10 72.52 L111.70 73.40 L115.48 79.52 L114.56 81.36 L102.24 84.72 L99.64 83.84 L95.86 77.72Z" fill="url(#pr-panel-cell)" />
        <path d="M100.72 75.60L105.34 83.08M106.00 74.16L110.62 81.64" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M114.38 71.08 L126.70 67.72 L129.30 68.60 L133.08 74.72 L132.16 76.56 L119.84 79.92 L117.24 79.04 L113.46 72.92Z" fill="url(#pr-panel-cell)" />
        <path d="M118.32 70.80L122.94 78.28M123.60 69.36L128.22 76.84" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M68.30 96.36 L80.62 93.00 L83.22 93.88 L87.00 100.00 L86.08 101.84 L73.76 105.20 L71.16 104.32 L67.38 98.20Z" fill="url(#pr-panel-cell)" />
        <path d="M72.24 96.08L76.86 103.56M77.52 94.64L82.14 102.12" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M85.90 91.56 L98.22 88.20 L100.82 89.08 L104.60 95.20 L103.68 97.04 L91.36 100.40 L88.76 99.52 L84.98 93.40Z" fill="url(#pr-panel-cell)" />
        <path d="M89.84 91.28L94.46 98.76M95.12 89.84L99.74 97.32" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M103.50 86.76 L115.82 83.40 L118.42 84.28 L122.20 90.40 L121.28 92.24 L108.96 95.60 L106.36 94.72 L102.58 88.60Z" fill="url(#pr-panel-cell)" />
        <path d="M107.44 86.48L112.06 93.96M112.72 85.04L117.34 92.52" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M121.10 81.96 L133.42 78.60 L136.02 79.48 L139.80 85.60 L138.88 87.44 L126.56 90.80 L123.96 89.92 L120.18 83.80Z" fill="url(#pr-panel-cell)" />
        <path d="M125.04 81.68L129.66 89.16M130.32 80.24L134.94 87.72" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M75.02 107.24 L87.34 103.88 L89.94 104.76 L93.72 110.88 L92.80 112.72 L80.48 116.08 L77.88 115.20 L74.10 109.08Z" fill="url(#pr-panel-cell)" />
        <path d="M78.96 106.96L83.58 114.44M84.24 105.52L88.86 113.00" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M92.62 102.44 L104.94 99.08 L107.54 99.96 L111.32 106.08 L110.40 107.92 L98.08 111.28 L95.48 110.40 L91.70 104.28Z" fill="url(#pr-panel-cell)" />
        <path d="M96.56 102.16L101.18 109.64M101.84 100.72L106.46 108.20" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M110.22 97.64 L122.54 94.28 L125.14 95.16 L128.92 101.28 L128.00 103.12 L115.68 106.48 L113.08 105.60 L109.30 99.48Z" fill="url(#pr-panel-cell)" />
        <path d="M114.16 97.36L118.78 104.84M119.44 95.92L124.06 103.40" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M127.82 92.84 L140.14 89.48 L142.74 90.36 L146.52 96.48 L145.60 98.32 L133.28 101.68 L130.68 100.80 L126.90 94.68Z" fill="url(#pr-panel-cell)" />
        <path d="M131.76 92.56L136.38 100.04M137.04 91.12L141.66 98.60" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M44.00 72.00L124.96 49.92" stroke="#d3e0ee" stroke-width="1.5" />
        <ellipse cx="46.60" cy="72.88" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="124.04" cy="51.76" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="76.42" cy="121.16" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="153.86" cy="100.04" rx="1.2" ry=".85" fill="#29445d" />
        <path d="M179.34 94.68 L260.30 72.60 L260.30 77.60 L179.34 99.68Z" fill="#45627f" />
        <path d="M228.80 21.60 L260.30 72.60 L260.30 77.60 L228.80 26.60Z" fill="#29445d" />
        <path d="M147.84 43.68 L228.80 21.60 L260.30 72.60 L179.34 94.68Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M153.04 45.44 L226.96 25.28 L255.10 70.84 L181.18 91.00Z" fill="#0c2033" />
        <path d="M158.70 46.28 L171.02 42.92 L173.62 43.80 L177.40 49.92 L176.48 51.76 L164.16 55.12 L161.56 54.24 L157.78 48.12Z" fill="url(#pr-panel-cell)" />
        <path d="M162.64 46.00L167.26 53.48M167.92 44.56L172.54 52.04" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M176.30 41.48 L188.62 38.12 L191.22 39.00 L195.00 45.12 L194.08 46.96 L181.76 50.32 L179.16 49.44 L175.38 43.32Z" fill="url(#pr-panel-cell)" />
        <path d="M180.24 41.20L184.86 48.68M185.52 39.76L190.14 47.24" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M193.90 36.68 L206.22 33.32 L208.82 34.20 L212.60 40.32 L211.68 42.16 L199.36 45.52 L196.76 44.64 L192.98 38.52Z" fill="url(#pr-panel-cell)" />
        <path d="M197.84 36.40L202.46 43.88M203.12 34.96L207.74 42.44" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M211.50 31.88 L223.82 28.52 L226.42 29.40 L230.20 35.52 L229.28 37.36 L216.96 40.72 L214.36 39.84 L210.58 33.72Z" fill="url(#pr-panel-cell)" />
        <path d="M215.44 31.60L220.06 39.08M220.72 30.16L225.34 37.64" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M165.42 57.16 L177.74 53.80 L180.34 54.68 L184.12 60.80 L183.20 62.64 L170.88 66.00 L168.28 65.12 L164.50 59.00Z" fill="url(#pr-panel-cell)" />
        <path d="M169.36 56.88L173.98 64.36M174.64 55.44L179.26 62.92" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M183.02 52.36 L195.34 49.00 L197.94 49.88 L201.72 56.00 L200.80 57.84 L188.48 61.20 L185.88 60.32 L182.10 54.20Z" fill="url(#pr-panel-cell)" />
        <path d="M186.96 52.08L191.58 59.56M192.24 50.64L196.86 58.12" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M200.62 47.56 L212.94 44.20 L215.54 45.08 L219.32 51.20 L218.40 53.04 L206.08 56.40 L203.48 55.52 L199.70 49.40Z" fill="url(#pr-panel-cell)" />
        <path d="M204.56 47.28L209.18 54.76M209.84 45.84L214.46 53.32" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M218.22 42.76 L230.54 39.40 L233.14 40.28 L236.92 46.40 L236.00 48.24 L223.68 51.60 L221.08 50.72 L217.30 44.60Z" fill="url(#pr-panel-cell)" />
        <path d="M222.16 42.48L226.78 49.96M227.44 41.04L232.06 48.52" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M172.14 68.04 L184.46 64.68 L187.06 65.56 L190.84 71.68 L189.92 73.52 L177.60 76.88 L175.00 76.00 L171.22 69.88Z" fill="url(#pr-panel-cell)" />
        <path d="M176.08 67.76L180.70 75.24M181.36 66.32L185.98 73.80" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M189.74 63.24 L202.06 59.88 L204.66 60.76 L208.44 66.88 L207.52 68.72 L195.20 72.08 L192.60 71.20 L188.82 65.08Z" fill="url(#pr-panel-cell)" />
        <path d="M193.68 62.96L198.30 70.44M198.96 61.52L203.58 69.00" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M207.34 58.44 L219.66 55.08 L222.26 55.96 L226.04 62.08 L225.12 63.92 L212.80 67.28 L210.20 66.40 L206.42 60.28Z" fill="url(#pr-panel-cell)" />
        <path d="M211.28 58.16L215.90 65.64M216.56 56.72L221.18 64.20" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M224.94 53.64 L237.26 50.28 L239.86 51.16 L243.64 57.28 L242.72 59.12 L230.40 62.48 L227.80 61.60 L224.02 55.48Z" fill="url(#pr-panel-cell)" />
        <path d="M228.88 53.36L233.50 60.84M234.16 51.92L238.78 59.40" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M178.86 78.92 L191.18 75.56 L193.78 76.44 L197.56 82.56 L196.64 84.40 L184.32 87.76 L181.72 86.88 L177.94 80.76Z" fill="url(#pr-panel-cell)" />
        <path d="M182.80 78.64L187.42 86.12M188.08 77.20L192.70 84.68" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M196.46 74.12 L208.78 70.76 L211.38 71.64 L215.16 77.76 L214.24 79.60 L201.92 82.96 L199.32 82.08 L195.54 75.96Z" fill="url(#pr-panel-cell)" />
        <path d="M200.40 73.84L205.02 81.32M205.68 72.40L210.30 79.88" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M214.06 69.32 L226.38 65.96 L228.98 66.84 L232.76 72.96 L231.84 74.80 L219.52 78.16 L216.92 77.28 L213.14 71.16Z" fill="url(#pr-panel-cell)" />
        <path d="M218.00 69.04L222.62 76.52M223.28 67.60L227.90 75.08" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M231.66 64.52 L243.98 61.16 L246.58 62.04 L250.36 68.16 L249.44 70.00 L237.12 73.36 L234.52 72.48 L230.74 66.36Z" fill="url(#pr-panel-cell)" />
        <path d="M235.60 64.24L240.22 71.72M240.88 62.80L245.50 70.28" stroke="#6fb6e0" stroke-width=".55" opacity=".65" />
        <path d="M147.84 43.68L228.80 21.60" stroke="#d3e0ee" stroke-width="1.5" />
        <ellipse cx="150.44" cy="44.56" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="227.88" cy="23.44" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="180.26" cy="92.84" rx="1.2" ry=".85" fill="#29445d" />
        <ellipse cx="257.70" cy="71.72" rx="1.2" ry=".85" fill="#29445d" />
        <path d="M141.14 82.44 L149.06 80.28 L149.06 87.28 L141.14 89.44Z" fill="#45627f" />
        <path d="M140.66 66.68 L149.06 80.28 L149.06 87.28 L140.66 73.68Z" fill="#29445d" />
        <path d="M132.74 68.84 L140.66 66.68 L149.06 80.28 L141.14 82.44Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M164.90 75.96 L172.82 73.80 L172.82 80.80 L164.90 82.96Z" fill="#45627f" />
        <path d="M164.42 60.20 L172.82 73.80 L172.82 80.80 L164.42 67.20Z" fill="#29445d" />
        <path d="M156.50 62.36 L164.42 60.20 L172.82 73.80 L164.90 75.96Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <path d="M149.98 80.44 L162.30 77.08 L162.30 86.08 L149.98 89.44Z" fill="#45627f" />
        <path d="M155.58 66.20 L162.30 77.08 L162.30 86.08 L155.58 75.20Z" fill="#29445d" />
        <path d="M143.26 69.56 L155.58 66.20 L162.30 77.08 L149.98 80.44Z" fill="url(#pr-metal)" stroke="#8ea7c0" stroke-width="1" stroke-linejoin="round" />
        <ellipse cx="152.78" cy="73.32" rx="3.6" ry="2.5" fill="#45627f" stroke="#c4d4e4" stroke-width="1" />
      </symbol>

      <symbol id="pr-art-rtg" viewBox="0 0 300 180">
        {/* Radial longitudinal fins join a sealed cylindrical heat source. */}
        <path d="m143 43-30-15v111l30 14m29-110 30-15v111l-30 14" fill="#45627f" stroke="#8ea7c0" stroke-width="2" />
        <path d="M133 45h49v99h-49z" fill="url(#pr-metal)" />
        <ellipse cx="157.5" cy="45" rx="24.5" ry="10" fill="#c4d4e4" stroke="#5f7690" stroke-width="2" />
        <ellipse cx="157.5" cy="144" rx="24.5" ry="10" fill="#5f7690" />
        <path d="m136 52-34 11v69l34 11zm43 0 34 11v69l-34 11z" fill="#5f7a96" stroke="#a9bccf" stroke-width="2" />
        <path d="M151 55h13v98h-13z" fill="#45627f" stroke="#a9bccf" stroke-width="2" />
        <path d="M141 153v5h33v-5" fill="none" stroke="#8ea7c0" stroke-width="5" />
        <path d="M182 141h13v13h15" fill="none" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-legs" viewBox="0 0 300 180">
        {/* Rear legs are drawn first; braces share the upper load-bearing ring. */}
        <g fill="none" stroke="#45627f" stroke-linejoin="round">
          <path d="M130 66 108 122m62-56 22 56M151 84l-43 38m43-38 41 38" stroke-width="5" />
          <path d="M98 123h20m64 0h20" stroke="#8ea7c0" stroke-width="6" stroke-linecap="round" />
        </g>
        <path d="m112 54 74-10 22 22-74 11z" fill="#c4d4e4" />
        <path d="M112 54v31l22 22V77z" fill="#5f7a96" />
        <path d="m134 77 74-11v31l-74 10z" fill="#8ea7c0" />
        <path d="M122 87 80 151m76-47-76 47m118-55 39 55m-64-47 64 47" fill="none" stroke="#6f8ea8" stroke-width="6" stroke-linejoin="round" />
        <path d="m106 111-12 19m119-9 11 18" stroke="#c4d4e4" stroke-width="9" />
        <g fill="#a9bccf" stroke="#45627f" stroke-width="2">
          <ellipse cx="80" cy="153" rx="18" ry="5" />
          <ellipse cx="237" cy="153" rx="18" ry="5" />
        </g>
        <g fill="#d3e0ee"><circle cx="122" cy="87" r="4" /><circle cx="198" cy="96" r="4" /></g>
      </symbol>

      <symbol id="pr-art-shield" viewBox="0 0 300 180">
        {/* Continuous convex ablative face, with a shallow structural rim. */}
        <path d="M56 121c15-49 61-76 101-76s86 27 101 76v9c-54 22-148 22-202 0z" fill="#45627f" stroke="#6f8ea8" stroke-width="2" />
        <path d="M56 121c15-49 61-76 101-76s86 27 101 76c-54 22-148 22-202 0z" fill="#8a5a3c" stroke="#c48a5a" stroke-width="2" />
        <path d="M68 116c19-38 51-60 89-60s70 22 89 60M88 128c12-43 38-73 69-83m69 83c-12-43-38-73-69-83M157 45v94" fill="none" stroke="#ba835c" stroke-width="2" />
        <path d="M62 130c55 20 135 20 190 0" fill="none" stroke="#a9bccf" stroke-width="2" />
      </symbol>

      <symbol id="pr-art-vault" viewBox="0 0 300 180">
        {/* Closed enclosure: the lid and both walls use identical shared edges. */}
        <path d="m82 66 91-30 63 36-91 30z" fill="#c4d4e4" stroke="#8ea7c0" stroke-width="2" stroke-linejoin="round" />
        <path d="M82 66v57l63 36v-57z" fill="#5f7a96" stroke="#8ea7c0" stroke-width="2" stroke-linejoin="round" />
        <path d="m145 102 91-30v57l-91 30z" fill="#8ea7c0" stroke="#a9bccf" stroke-width="2" stroke-linejoin="round" />
        <path d="m92 66 80-26 53 31-80 26z" fill="none" stroke="#5f7690" stroke-width="2" />
        <path d="m82 76 63 36 91-30" fill="none" stroke="#45627f" stroke-width="3" />
        <path d="m104 90 14 8v14l-14-8zm66 19 14-5v14l-14 5zm40-13 14-5v14l-14 5z" fill="#d3e0ee" />
        <path d="m170 141 39-13" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-thermal" viewBox="0 0 300 180">
        {/* A layered thermal blanket/panel with a contained serpentine heat loop. */}
        <path d="m70 69 126-34 44 70-126 34z" fill="#45627f" stroke="#6f8ea8" stroke-width="2" />
        <path d="m70 63 126-34 44 70-126 34z" fill="#a9bccf" stroke="#d3e0ee" stroke-width="2" />
        <g transform="matrix(1 -.27 .63 1 82 65)">
          <rect width="102" height="51" fill="#d3e0ee" stroke="#7f97b0" stroke-width="2" />
          <path d="M10 42V15q0-6 6-6h8q6 0 6 6v21q0 6 6 6h8q6 0 6-6V15q0-6 6-6h8q6 0 6 6v21q0 6 6 6h8q6 0 6-6V9" fill="none" stroke="#5f7a96" stroke-width="3" />
        </g>
        <path d="M118 137v14h18m-6-17v10h18" fill="none" stroke="#6fb6e0" stroke-width="3" />
        <path d="m76 74 37 58m-32-50 32 51" stroke="#8ea7c0" stroke-width="2" />
      </symbol>
    </>
  );
}
