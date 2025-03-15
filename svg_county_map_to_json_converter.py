import xml.etree.ElementTree as ET
import json
import re

def extract_county_data(svg_file):
    """
    Extract county path data from an SVG file and convert to JSON format.
    
    Args:
        svg_file (str): Path to the SVG file
        
    Returns:
        list: List of dictionaries containing county ID and path data
    """
    # Parse the SVG file
    tree = ET.parse(svg_file)
    root = tree.getroot()
    
    # Define the SVG namespace
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}
    
    # Find all path elements
    paths = root.findall('.//svg:path', namespaces)
    
    counties = []
    
    # Extract county data from each path
    for path in paths:
        path_id = path.get('id')
        
        # Check if this is a county path (not decorative elements)
        # Assuming county IDs have some consistent pattern
        if path_id and not path_id.startswith('outline') and not path_id.startswith('background'):
            counties.append({
                'id': path_id,
                'path': path.get('d')
            })
    
    return counties

def main():
    """
    Main function to run the script.
    """
    input_file = "Map_of_Minnesota_counties_blank.svg"
    output_file = "minnesota_counties.json"
    
    try:
        # Extract county data
        county_data = extract_county_data(input_file)
        
        # Write data to JSON file
        with open(output_file, 'w') as f:
            json.dump(county_data, f, indent=2)
        
        print(f"Successfully extracted {len(county_data)} counties to {output_file}")
    except Exception as e:
        print(f"Error processing SVG file: {e}")

if __name__ == "__main__":
    main()