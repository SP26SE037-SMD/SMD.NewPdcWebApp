import urllib.request, json
req = urllib.request.urlopen('http://43.207.156.116/v3/api-docs')
data = json.loads(req.read())
paths = data.get('paths', {})

with open('api_dump.txt', 'w', encoding='utf-8') as f:
    f.write("=== ALL RELEVANT ENDPOINTS ===\n")
    for path, methods in paths.items():
        if any(x in path.lower() for x in ['curriculum', 'group', 'combo']):
            f.write(f"\n[{path}]\n")
            for m, details in methods.items():
                f.write(f"  {m.upper()} - {details.get('summary', '')}\n")
                if 'requestBody' in details:
                    try:
                        content = details['requestBody']['content']['application/json']['schema']
                        if '$ref' in content:
                            schema_name = content['$ref'].split('/')[-1]
                            f.write(f"  RequestBody: {schema_name}\n")
                            schema_props = data['components']['schemas'][schema_name]['properties']
                            for prop_name, prop_details in schema_props.items():
                                prop_type = prop_details.get('type', prop_details.get('$ref', 'Unknown'))
                                if prop_type == 'array':
                                    try:
                                        item_ref = prop_details['items']['$ref']
                                        prop_type = f"array of {item_ref.split('/')[-1]}"
                                    except:
                                        prop_type = f"array of {prop_details['items'].get('type')}"
                                f.write(f"    - {prop_name}: {prop_type}\n")
                        elif 'type' in content and content['type'] == 'array':
                            item_ref = content['items'].get('$ref', '')
                            if item_ref:
                                schema_name = item_ref.split('/')[-1]
                                f.write(f"  RequestBody: Array of {schema_name}\n")
                                schema_props = data['components']['schemas'][schema_name]['properties']
                                for prop_name, prop_details in schema_props.items():
                                    prop_type = prop_details.get('type', prop_details.get('$ref', 'Unknown'))
                                    f.write(f"      - {prop_name}: {prop_type}\n")
                            else:
                                f.write(f"  RequestBody: Array of {content['items'].get('type')}\n")
                    except Exception as e:
                        f.write(f"  RequestBody parse error: {e}\n")
