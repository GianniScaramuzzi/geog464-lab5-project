// Map of Montréal building roof outlines, economic planning zones, and green spaces.
// The source GeoJSON coordinates use EPSG:32188, so convert them to
// longitude/latitude before displaying them in Leaflet.
const map = L.map('map').setView([45.5017, -73.5673], 11);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

proj4.defs(
  'EPSG:32188',
  '+proj=tmerc +lat_0=0 +lon_0=-73.5 +k=0.9999 +x_0=304800 +y_0=0 +datum=NAD83 +units=m +no_defs'
);

function toWgs84(coordinates) {
  if (typeof coordinates[0] === 'number') {
    const [longitude, latitude] = proj4('EPSG:32188', 'EPSG:4326', coordinates);
    return [longitude, latitude, ...coordinates.slice(2)];
  }
  return coordinates.map(toWgs84);
}

function convertGeoJSON(data) {
  const converted = {
    ...data,
    features: data.features.map(function (feature) {
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: toWgs84(feature.geometry.coordinates)
        }
      };
    })
  };
  delete converted.crs;
  return converted;
}

Promise.all([
  fetch('../Data/intens_affect/economic_activities.geojson').then(checkResponse),
  fetch('../Data/affect_espacevertlocal/affect_espacevertlocal.json').then(checkResponse),
  fetch('../Data/buildings/building_footprints_in_economic_zones.geojson').then(checkResponse)
])
.then(function (datasets) {
  const allEconomic = convertGeoJSON(datasets[0]);
  const greenSpaces = convertGeoJSON(datasets[1]);
  const buildings = convertGeoJSON(datasets[2]);
  const within100m = buildings.features.filter(function (feature) {
    return feature.properties.greenspace_distance_m <= 100;
  });
  const between100and500m = buildings.features.filter(function (feature) {
    return feature.properties.greenspace_distance_m > 100 &&
      feature.properties.greenspace_distance_m <= 500;
  });
  const over500m = buildings.features.filter(function (feature) {
    return feature.properties.greenspace_distance_m > 500;
  });

  const within100mLayer = L.geoJSON({
    type: 'FeatureCollection',
    features: within100m
  }, {
    style: { color: '#9a4c0b', fillColor: '#e99535', fillOpacity: 0.3, weight: 1 },
    onEachFeature: function (feature, layer) {
      const p = feature.properties;
      layer.bindPopup('<strong>Building roof outline (2016)</strong>' +
        '<br>Roof area: ' + safeText(p.roof_area_m2) + ' m²' +
        '<br>Distance to mapped greenspace: ' + safeText(p.greenspace_distance_m) + ' m' +
        '<br>Overlap with economic planning zone: ' +
        safeText(p.economic_zone_overlap_percent) + '%');
    }
  });

  const between100and500mLayer = L.geoJSON({
    type: 'FeatureCollection',
    features: between100and500m
  }, {
    style: { color: '#8a6a22', fillColor: '#f1cb73', fillOpacity: 0.24, weight: 0.8 },
    onEachFeature: function (feature, layer) {
        const p = feature.properties;
        layer.bindPopup('<strong>Building roof outline (2016)</strong>' +
          '<br>Roof area: ' + safeText(p.roof_area_m2) + ' m²' +
          '<br>Distance to mapped greenspace: ' + safeText(p.greenspace_distance_m) + ' m' +
          '<br>Overlap with economic planning zone: ' +
          safeText(p.economic_zone_overlap_percent) + '%');
    }
  });

  const over500mLayer = L.geoJSON({
    type: 'FeatureCollection',
    features: over500m
  }, {
    style: { color: '#475569', fillColor: '#94a3b8', fillOpacity: 0.12, weight: 0.7 },
    onEachFeature: function (feature, layer) {
      const p = feature.properties;
      layer.bindPopup('<strong>Building roof outline (2016)</strong>' +
        '<br>Roof area: ' + safeText(p.roof_area_m2) + ' m²' +
        '<br>Distance to mapped greenspace: ' + safeText(p.greenspace_distance_m) + ' m' +
        '<br>Overlap with economic planning zone: ' +
        safeText(p.economic_zone_overlap_percent) + '%');
    }
  });

  const economicZoneLayer = L.geoJSON(allEconomic, {
    style: { color: '#334155', fillColor: '#94a3b8', fillOpacity: 0, weight: 1, dashArray: '4 3' },
    onEachFeature: function (feature, layer) {
      layer.bindPopup('<strong>Economic activity planning zone</strong><br>' +
        safeText(feature.properties.Affectatio || 'Economic activities') +
        '<br>This broad zone is shown for context; building outlines are mapped separately.');
    }
  });

  const greenLayer = L.geoJSON(greenSpaces, {
    style: { color: '#17683c', fillColor: '#36a269', fillOpacity: 0.38, weight: 0.8 },
    onEachFeature: function (feature, layer) {
      const p = feature.properties || {};
      const details = [];
      if (p.ARRONDISSE) details.push('Borough: ' + safeText(p.ARRONDISSE));
      if (p.NUM_INDEX) details.push('Index: ' + safeText(p.NUM_INDEX));
      if (p.ParcPUM) details.push('PUM park designation: ' + safeText(p.ParcPUM));
      layer.bindPopup('<strong>Local greenspace</strong>' +
        (details.length ? '<br>' + details.join('<br>') : '<br>Mapped local green-space feature'));
    }
  });

  within100mLayer.addTo(map);
  greenLayer.addTo(map);

  L.control.layers(null, {
    ['Roof outlines within 100 m (' + within100m.length + ')']: within100mLayer,
    ['Roof outlines 100–500 m (' + between100and500m.length + ')']: between100and500mLayer,
    ['Roof outlines over 500 m (' + over500m.length + ')']: over500mLayer,
    'Economic planning zones (context)': economicZoneLayer,
    'Local green spaces': greenLayer
  }, { collapsed: false }).addTo(map);

  const bounds = L.geoJSON(buildings).getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });

  document.getElementById('total-count').textContent = buildings.features.length;
  document.getElementById('within-100-count').textContent = within100m.length;
  document.getElementById('between-100-500-count').textContent = between100and500m.length;
  document.getElementById('over-500-count').textContent = over500m.length;
  document.getElementById('headline-count').textContent =
    within100m.length + ' of ' + buildings.features.length;
  document.getElementById('near-ratio').textContent =
    within100m.length + ' / ' + buildings.features.length;
  document.getElementById('status').textContent =
    'Loaded ' + buildings.features.length + ' building roof outlines from 2016, filtered by overlap with ' +
    allEconomic.features.length + ' economic planning zones, and ' +
    greenSpaces.features.length + ' local green-space features.';
})
.catch(function (error) {
  document.getElementById('status').textContent =
    'Some map data could not be loaded. Run Notebooks/process_building_footprints.py to create the building layer, then open this page with Live Server.';
  console.error(error);
});

function checkResponse(response) {
  if (!response.ok) throw new Error('Could not load data: ' + response.url + ' (' + response.status + ')');
  return response.json();
}

// Keep text from dataset properties from being interpreted as HTML in popups.
function safeText(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
  });
}
