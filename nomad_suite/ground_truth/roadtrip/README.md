# nomad-pwa
Nomad: RoadTrip PWA (forked from 'nomad_road-trip-app')

## Central Version & Creator Registry (`version.js`)

All branding, version numbers, and creator links are managed in `/version.js`.

### Available Merge Tags:
Any page that includes `<script src="version.js"></script>` can use these standard merge tags anywhere in the markup:

- `[merge_visionary]` &rarr; `NOMAD: RoadTrip by BostonyFX` (with link to Instagram)
- `[merge_creator]` or `[merge_author]` &rarr; `BostonyFX` (with link to Instagram)
- `[merge_footer]` &rarr; `NOMAD: RoadTrip Navigation Dashboard • Crafted by BostonyFX` (with link)
- `[merge_version]` &rarr; `v3.08312026.2145` (or whatever the active build version is)

### Semantic Classes & Attributes:
- `<span class="nomad-brand"></span>`
- `<span class="nomad-creator"></span>`
- `<div class="nomad-footer"></div>`
- `<span class="nomad-version"></span>`

### Modal Generator:
- Call `window.openNomadAboutModal()` to trigger the standard About & Guide overlay from any view or button.
