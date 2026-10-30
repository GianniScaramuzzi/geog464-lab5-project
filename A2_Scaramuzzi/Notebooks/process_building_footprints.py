"""Build a building-roof layer classified by economic-zone overlap and greenspace distance."""

import json
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import mapping, shape
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
BUILDING_DATA_URL = (
    "https://donnees.montreal.ca/dataset/"
    "fab160ae-c81d-46f8-8f92-4a01c10d4390/resource/"
    "183866d5-9027-456a-b0af-36b2e45c8aac/download/"
    "batiments_2d_2016_arrondissements.zip"
)
BUILDING_LAYER = "CARTO-BAT-TOIT"
EXPECTED_CRS = "urn:ogc:def:crs:EPSG::32188"
MINIMUM_ZONE_OVERLAP = 0.5
GREENSPACE_DISTANCE_METRES = 500
OUTPUT_PATH = ROOT / "Data/buildings/building_footprints_in_economic_zones.geojson"


def load_geojson(path):
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def download_source(destination):
    subprocess.run(
        [
            "curl",
            "--fail",
            "--location",
            "--retry",
            "2",
            "--user-agent",
            "Mozilla/5.0 (compatible; MontrealBuildingFootprintStudy/1.0)",
            "--referer",
            "https://donnees.montreal.ca/dataset/batiment-2d",
            "--output",
            str(destination),
            BUILDING_DATA_URL,
        ],
        check=True,
    )


def extract_roof_layer(archive_path, destination):
    with zipfile.ZipFile(archive_path) as archive:
        for extension in (".shp", ".shx", ".dbf", ".prj"):
            member_name = BUILDING_LAYER + extension
            try:
                member = archive.getinfo(member_name)
            except KeyError as error:
                raise ValueError(f"Building dataset is missing {member_name}.") from error
            with archive.open(member) as source, (destination / member_name).open("wb") as target:
                shutil.copyfileobj(source, target)


def main():
    economic_data = load_geojson(ROOT / "Data/intens_affect/economic_activities.geojson")
    greenspace_data = load_geojson(ROOT / "Data/affect_espacevertlocal/affect_espacevertlocal.json")
    for label, dataset in (("Economic zones", economic_data), ("Greenspaces", greenspace_data)):
        crs_name = dataset.get("crs", {}).get("properties", {}).get("name")
        if crs_name != EXPECTED_CRS:
            raise ValueError(f"{label} must use EPSG:32188; found {crs_name!r}.")

    economic_zones = unary_union(
        [shape(feature["geometry"]) for feature in economic_data["features"]]
    )
    greenspaces = unary_union(
        [shape(feature["geometry"]) for feature in greenspace_data["features"]]
    )

    with tempfile.TemporaryDirectory(prefix="montreal-buildings-") as temporary_directory:
        temporary_path = Path(temporary_directory)
        archive_path = temporary_path / "building_footprints.zip"
        download_source(archive_path)
        extract_roof_layer(archive_path, temporary_path)

        projection = (temporary_path / f"{BUILDING_LAYER}.prj").read_text(encoding="utf-8")
        if not re.search(r'Central_Meridian",\s*-73\.5', projection, re.IGNORECASE):
            raise ValueError("Building dataset projection is not Montréal MTM zone 8.")
        if not re.search(r'False_Easting",\s*304800', projection, re.IGNORECASE):
            raise ValueError("Building dataset projection does not match EPSG:32188.")

        reader = shapefile.Reader(
            str(temporary_path / BUILDING_LAYER),
            encoding="latin1",
        )
        features = []
        within_distance_count = 0

        for source_id, shape_record in enumerate(reader.iterShapeRecords()):
            roof = shape(shape_record.shape.__geo_interface__)
            if roof.is_empty or roof.area <= 0 or not roof.intersects(economic_zones):
                continue

            overlap_ratio = roof.intersection(economic_zones).area / roof.area
            if overlap_ratio < MINIMUM_ZONE_OVERLAP:
                continue

            distance = roof.distance(greenspaces)
            within_500m = distance <= GREENSPACE_DISTANCE_METRES
            features.append(
                {
                    "type": "Feature",
                    "id": source_id,
                    "properties": {
                        "source_id": source_id,
                        "roof_area_m2": round(roof.area, 1),
                        "economic_zone_overlap_percent": round(overlap_ratio * 100, 1),
                        "greenspace_distance_m": round(distance, 1),
                        "within_500m": within_500m,
                    },
                    "geometry": mapping(roof),
                }
            )
            within_distance_count += within_500m

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output_data = {
        "type": "FeatureCollection",
        "name": "building_roof_footprints_in_economic_zones",
        "crs": {"type": "name", "properties": {"name": EXPECTED_CRS}},
        "features": features,
    }
    with OUTPUT_PATH.open("w", encoding="utf-8") as output:
        json.dump(output_data, output, separators=(",", ":"))

    print(f"Building roof outlines in economic zones: {len(features)}")
    print(f"Within 500 m of greenspace: {within_distance_count}")
    print(f"Over 500 m from greenspace: {len(features) - within_distance_count}")
    print(f"Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
