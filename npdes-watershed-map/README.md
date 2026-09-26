# NPDES Watershed Map

Expo (React Native) app that maps Clean Water Act discharge permits (EPA ICIS-NPDES via ECHO) by watershed.
Drill down HUC-4 → HUC-8 → HUC-12, see every active permit, last-year violations, annual pollutant loads,
and 12 months of Discharge Monitoring Report values per permit.

## Run

```bash
npm install
npx expo start --web     # browser at http://localhost:8081
npx expo start           # scan the QR code with Expo Go (iOS/Android)
```

No API keys are required.

## Data sources (all live, public, keyless)

| What | Source |
|---|---|
| Permits, compliance (last 4 quarters) | ECHO `cwa_rest_services.get_facilities` / `get_qid` (status EFF + ADC) |
| DMR values (last 12 months) | ECHO `eff_rest_services.get_effluent_chart` |
| Annual pollutant loads | ECHO `dmr_rest_services.get_custom_data_annual` (EPA Loading Tool) |
| Watershed boundaries | USGS Watershed Boundary Dataset MapServer |
| Rivers & streams | USGS NHD cached tiles (`USGSHydroCached`) |
| Basemaps | USGS The National Map (Topo, Imagery, Shaded relief) |
| Coastal charts (optional layer) | NOAA Office of Coast Survey ENC WMS |

## Layout

- `App.tsx`: drill-down state, layout, and search
- `src/api.ts`: all fetchers, response parsing, and in-memory cache
- `src/map/`: Leaflet page (`mapHtml.ts`), rendered in an iframe on web (`MapView.web.tsx`) or a WebView on device (`MapView.tsx`)
- `src/components/`: watershed and facility panels
