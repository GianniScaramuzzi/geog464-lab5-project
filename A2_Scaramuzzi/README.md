# Economic Areas Near Greenspace in Montréal

> **Live map:** Pending GitHub Pages publication. Add the public URL here after publishing.

## Project purpose
This project maps Montréal building roof outlines that fall mostly inside areas classified as `Activités économiques` and measures their distance to mapped local greenspaces.

## Core action
A city or environmental planner can explore mapped roof outlines in economic-activity zones and compare their distance bands from mapped greenspace, including those within 100 metres.

## How to run
1. Open the project folder in VS Code.
2. Start Live Server from `site/index.html` (do not open the HTML file directly).
3. Use the layer selector to compare roof outlines within 100 m, 100–500 m, and over 500 m from greenspace, as well as local green spaces and broad economic planning zones for context.
4. Click a roof outline to see its greenspace distance and overlap with an economic planning zone.

Run `python3 -m pip install pyshp shapely` if these Python packages are not installed. Run `python3 Notebooks/process_building_footprints.py` to download Montréal's source data, classify roof outlines, and regenerate `Data/buildings/building_footprints_in_economic_zones.geojson`. Then start Live Server from `site/index.html` (do not open the HTML file directly). The existing analysis notebook is in `Notebooks/project.ipynb`.

The processing keeps a roof outline when at least 50% of its area overlaps the union of the economic-activity zones. Its greenspace distance is measured edge-to-edge from that roof outline to the nearest mapped greenspace. The website separates these distances into within 100 m, over 100 m through 500 m, and over 500 m. The source may group adjacent roof surfaces, so its features are not guaranteed to correspond one-to-one with buildings. Planning zones remain available as an optional context layer.

## Layer B check
- **Value and legend:** Roof outlines are coloured by distance to mapped greenspace, in metres. The legend uses the same classes as the map: 0–100 m, over 100 through 500 m, and over 500 m. All three classes contain roof outlines in the current data.
- **Layer switcher:** The roof-distance layers can be toggled alongside the local greenspace dataset and the economic planning zones.
- **Second-layer receipt:** The local greenspace layer uses the supplied `Data/affect_espacevertlocal/affect_espacevertlocal.json` dataset (1,232 features in EPSG:32188). `site/app.js` converts its coordinates to WGS 84 for Leaflet and exposes it as “Local green spaces” in the layer switcher.

## After the demo
**Status: not tested yet.** Ask a neighbour to look at the map for five seconds, then replace these prompts with their actual answers:
- What did they think the map was showing? **[Record their answer.]**
- What did they think the roof-outline colours meant? **[Record their answer.]**
- What question or confusion did they have? **[Record their answer.]**

## Data sources
- Economic land-use data: [Ville de Montréal — PUM 2050, intensification, density and land use](https://donnees.montreal.ca/dataset/niveaux-intensification-urbaine-densite-affectation-sol-pum-2050).
- Building roof outlines: [Ville de Montréal — Bâtiments 2D 2016](https://donnees.montreal.ca/dataset/batiment-2d), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The mapped data vintage is 2016; it represents roof outlines and may not reflect later changes.
- Local green-space data: `Data/affect_espacevertlocal/affect_espacevertlocal.json`. Add the official dataset page and verify its licence before submitting.
- Basemap: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).

## Not in this iteration
- Identifying individual businesses inside a building.
- Determining whether an economic area is vacant, abandoned, underused, publicly accessible, or suitable for green-space rehabilitation.
- Assessing green-space quality, access, ownership, or the practical feasibility of rehabilitation.
- A public website or a full site suitability score.

## AI disclosure
I used ChatGPT (GPT-6) and the integrated VS Copilot to help me develop my project. I asked it to help me troubleshoot my Python code, filter Montréal's land-use GeoJSON to identify economic-activity areas, and connect the processed data to my Leaflet webpage. I also asked for help incorporating green spaces and a 500-metre proximity analysis, improving the website layout and making the map layers easier to distinguish. 

I reviewed the suggestions and tested the map in my browser. I noticed that some economic-activity polygons covered large areas that appeared to include streets, so I added Montréal's 2016 building roof outlines as a more specific mapping layer. The outlines make mapped roof shapes easier to inspect, but they do not represent property parcels or identify businesses, and the older source data needs verification against current conditions.

I made the project decisions, including the intended audience, the purpose of the map, and the features I wanted to include. I used AI-generated explanations and code suggestions as assistance, rather than assuming they were automatically correct. The project still requires verification of the distance calculations, the green-space data source and licence, and the final output before submission.

## After the demo
The map shows production buildings close to greenspaces
The different colours represent the different distance from greenspaces

# Layer B 

Orange roof outlines are within 100 m of mapped greenspace, yellow outlines are over 100 m through 500 m away, and gray outlines are over 500 m away.

The second, computed roof-distance layer is created by `Notebooks/process_building_footprints.py`: it keeps 2016 roof outlines with at least 50% overlap with economic-activity zones and calculates each outline's edge-to-edge distance to the nearest mapped greenspace in metres. The total check is 4,780 outlines: 278 within 100 m + 1,778 over 100 through 500 m + 2,724 over 500 m = 4,780.