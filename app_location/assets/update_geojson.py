import json
import requests
import csv
from io import StringIO

def update_geojson():
    # Load the original GeoJSON file
    with open('original_geojson_file.json', 'r') as f:
        geojson_data = json.load(f)

    # Process each feature
    for feature in geojson_data['features']:
        # Get the CSV data
        response = requests.get(feature['properties']['Data_url'])
        csv_data = StringIO(response.text)
        
        # Read the CSV and get the last row
        csv_reader = csv.DictReader(csv_data)
        rows = list(csv_reader)
        if rows:
            last_row = rows[-1]
            temperature = last_row['Air Temperature(degree Celsius)']
        else:
            temperature = 'N/A'

        # Update the feature properties
        new_properties = {
            'name': feature['properties']['AutomaticWeatherStation_en'],
            'temperature': temperature
        }
        feature['properties'] = new_properties

    # Save the updated GeoJSON
    with open('updated_geojson_file.json', 'w') as f:
        json.dump(geojson_data, f)

    print("GeoJSON updated successfully")

update_geojson()
