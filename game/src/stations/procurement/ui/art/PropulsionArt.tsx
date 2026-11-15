// Front elevations keep circular sections, mounts and feed paths on one axis.
// These are catalogue family diagrams, rather than scale drawings of each model.
export function PropulsionArtDefs() {
  return (
    <>
      <symbol id="pr-art-engine" viewBox="0 0 300 180">
        <path d="M111 24h78v10h-78z" fill="#a9bccf" />
        <path d="M136 34h28v15h-28z" fill="#5f7a96" />
        <path d="M132 49h36v28c0 10-9 13-9 24h-18c0-11-9-14-9-24z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M141 99c0 19-18 40-38 49h94c-20-9-38-30-38-49z" fill="url(#pr-nozzle)" stroke="#8ea7c0" stroke-width="2" />
        <ellipse cx="150" cy="148" rx="47" ry="9" fill="#0c1a2a" stroke="#8ea7c0" stroke-width="3" />
        <path d="M136 34h-24v25m0 17v23h29M164 34h24v25m0 17v23h-29" fill="none" stroke="#6f8ea8" stroke-width="6" stroke-linejoin="round" />
        <circle cx="112" cy="68" r="12" fill="#a9bccf" stroke="#45627f" stroke-width="3" />
        <circle cx="188" cy="68" r="12" fill="#a9bccf" stroke="#45627f" stroke-width="3" />
        <path d="M125 134h50m-40-10h30m-23-10h16" stroke="#8ea7c0" stroke-width="2" opacity=".65" />
        <path d="M137 54h26" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-engine-solid" viewBox="0 0 300 180">
        <path d="M99 27h102v45c0 18-22 25-35 28h-32c-13-3-35-10-35-28z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M95 27h110v10H95zM99 59h102v8H99z" fill="#5f7a96" />
        <path d="M136 96c0 18-14 39-30 51h88c-16-12-30-33-30-51z" fill="url(#pr-nozzle)" stroke="#8ea7c0" stroke-width="2" />
        <ellipse cx="150" cy="147" rx="44" ry="9" fill="#0c1a2a" stroke="#8ea7c0" stroke-width="3" />
        <path d="M111 41v13m78-13v13" stroke="#3fc7ff" stroke-width="3" />
        <path d="M138 119h24m-32 15h40" stroke="#8ea7c0" stroke-width="2" opacity=".6" />
      </symbol>

      <symbol id="pr-art-engine-hydrolox" viewBox="0 0 300 180">
        <path d="M112 22h76v9h-76zM137 31h26v14h-26z" fill="#a9bccf" />
        <path d="M134 45h32v20c0 9-10 13-10 23h-12c0-10-10-14-10-23z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M144 86c0 23-18 55-47 65h106c-29-10-47-42-47-65z" fill="url(#pr-nozzle)" stroke="#8ea7c0" stroke-width="2" />
        <ellipse cx="150" cy="151" rx="53" ry="8" fill="#0c1a2a" stroke="#8ea7c0" stroke-width="3" />
        <path d="M137 32h-24v19m0 18v30l29 12M163 32h24v19m0 18v30l-29 12" fill="none" stroke="#6f8ea8" stroke-width="5" stroke-linejoin="round" />
        <circle cx="113" cy="60" r="11" fill="#a9bccf" stroke="#45627f" stroke-width="3" />
        <circle cx="187" cy="60" r="11" fill="#a9bccf" stroke="#45627f" stroke-width="3" />
        <path d="M125 141h50m-40-13h30m-23-13h16m-13-13h10" stroke="#8ea7c0" stroke-width="2" opacity=".65" />
        <path d="M138 50h24" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-engine-hypergolic" viewBox="0 0 300 180">
        <path d="M108 28h84v10h-84z" fill="#a9bccf" />
        <path d="M130 38v22m40-22v22" stroke="#6f8ea8" stroke-width="7" />
        <path d="M125 51h10v16h-10zm40 0h10v16h-10z" fill="#3fc7ff" />
        <path d="M130 67h40v17c0 10-10 15-10 26h-20c0-11-10-16-10-26z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M140 108c0 15-16 31-33 40h86c-17-9-33-25-33-40z" fill="url(#pr-nozzle)" stroke="#8ea7c0" stroke-width="2" />
        <ellipse cx="150" cy="148" rx="43" ry="8" fill="#0c1a2a" stroke="#8ea7c0" stroke-width="3" />
        <path d="M134 135h32m-25-12h18" stroke="#8ea7c0" stroke-width="2" opacity=".65" />
      </symbol>

      <symbol id="pr-art-engine-ion" viewBox="0 0 300 180">
        <path d="M111 29h78v15h-78zM124 44h52v23h-52z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <circle cx="150" cy="105" r="49" fill="#5f7a96" stroke="#a9bccf" stroke-width="3" />
        <circle cx="150" cy="105" r="40" fill="#142c42" stroke="#8ea7c0" stroke-width="3" />
        <path d="M126 77v56m12-63v70m12-73v76m12-73v70m12-63v56M122 81h56m-65 12h74m-76 12h78m-76 12h74m-65 12h56" stroke="#6fb6e0" stroke-width="1.5" />
        <path d="M186 49h24v50h-12" fill="none" stroke="#6f8ea8" stroke-width="5" stroke-linejoin="round" />
        <path d="M201 88h17v19h-17z" fill="#a9bccf" />
        <path d="M204 107h11" stroke="#3fc7ff" stroke-width="3" />
        <circle cx="150" cy="61" r="3" fill="#c4d4e4" />
        <circle cx="106" cy="105" r="3" fill="#c4d4e4" />
        <circle cx="194" cy="105" r="3" fill="#c4d4e4" />
        <circle cx="150" cy="149" r="3" fill="#c4d4e4" />
      </symbol>

      <symbol id="pr-art-tank" viewBox="0 0 300 180">
        <path d="M143 20h14v12h-14zM143 148h14v12h-14z" fill="#6f8ea8" />
        <path d="M101 53c0-16 22-25 49-25s49 9 49 25v73c0 16-22 25-49 25s-49-9-49-25z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M101 53c23 12 75 12 98 0M101 88c23 12 75 12 98 0M101 126c23 12 75 12 98 0" fill="none" stroke="#5f7a96" stroke-width="3" />
        <path d="M114 58v63" stroke="#d3e0ee" stroke-width="3" opacity=".65" />
        <path d="M186 62v15" stroke="#3fc7ff" stroke-width="4" />
      </symbol>

      <symbol id="pr-art-tank-solid" viewBox="0 0 300 180">
        <path d="M108 45c0-12 19-20 42-20s42 8 42 20v92c0 11-19 17-42 17s-42-6-42-17z" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M105 54h90v9h-90zM105 93h90v9h-90zM105 132h90v9h-90z" fill="#5f7a96" />
        <path d="M119 67v22m0 17v22" stroke="#d3e0ee" stroke-width="3" />
        <path d="M175 68v20m0 19v20" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-tank-hydrolox" viewBox="0 0 300 180">
        <path d="M143 19h14v13h-14zM143 148h14v12h-14z" fill="#6f8ea8" />
        <path d="M96 53c0-16 24-26 54-26s54 10 54 26v72c0 17-24 27-54 27s-54-10-54-27z" fill="#b4c4d4" stroke="#6f8ea8" stroke-width="2" />
        <path d="M97 55c26 10 80 10 106 0M97 78c26 10 80 10 106 0M97 101c26 10 80 10 106 0M97 124c26 10 80 10 106 0" fill="none" stroke="#8ea7c0" stroke-width="3" />
        <path d="M112 43v89m76-89v89" stroke="#d3e0ee" stroke-width="3" />
        <path d="M202 60h11v68h-12" fill="none" stroke="#45627f" stroke-width="4" stroke-linejoin="round" />
        <path d="M128 34h44" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-tank-hypergolic" viewBox="0 0 300 180">
        <path d="M107 145h86v9h-86z" fill="#5f7a96" />
        <path d="M119 130v15m62-15v15" stroke="#6f8ea8" stroke-width="7" />
        <path d="M142 20h16v15h-16z" fill="#6f8ea8" />
        <rect x="104" y="33" width="92" height="103" rx="44" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M105 80h90v9h-90z" fill="#5f7a96" />
        <path d="M119 52c-8 18-8 37-6 49" fill="none" stroke="#d3e0ee" stroke-width="3" />
        <path d="M146 21v-3h23v22" fill="none" stroke="#3fc7ff" stroke-width="3" />
      </symbol>

      <symbol id="pr-art-tank-ion" viewBox="0 0 300 180">
        <path d="M143 19h14v16h-14z" fill="#a9bccf" />
        <circle cx="150" cy="88" r="54" fill="url(#pr-metal)" stroke="#6f8ea8" stroke-width="2" />
        <path d="M97 78c25 12 81 12 106 0M97 98c25 12 81 12 106 0" fill="none" stroke="#45627f" stroke-width="4" />
        <path d="M123 42c-15 17-18 36-16 52" fill="none" stroke="#d3e0ee" stroke-width="3" />
        <path d="M117 130v20h66v-20" fill="none" stroke="#5f7a96" stroke-width="7" stroke-linejoin="round" />
        <path d="M157 23h23v30" fill="none" stroke="#3fc7ff" stroke-width="3" />
      </symbol>
    </>
  );
}
