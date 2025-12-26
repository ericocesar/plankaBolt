import os
import json
import urllib.request
import urllib.error
import sys

def get_env(name):
    val = os.environ.get(name)
    if not val:
        print(f"Error: Environment variable {name} is not set.")
        sys.exit(1)
    return val

def request(url, method="GET", data=None, headers={}):
    req = urllib.request.Request(url, method=method)
    for k, v in headers.items():
        req.add_header(k, v)
    
    if data:
        req.data = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        sys.exit(1)

def main():
    base_url = get_env('PORTAINER_URL').rstrip('/')
    api_key = get_env('PORTAINER_API_KEY')
    endpoint_id = get_env('PORTAINER_ENDPOINT_ID')
    stack_name = get_env('STACK_NAME')
    stack_file_path = get_env('STACK_FILE_PATH')

    headers = {
        'X-API-Key': api_key
    }

    try:
        with open(stack_file_path, 'r') as f:
            stack_content = f.read()
    except FileNotFoundError:
        print(f"Error: File '{stack_file_path}' not found.")
        sys.exit(1)

    print(f"Searching for stack '{stack_name}'...")
    try:
        stacks = request(f"{base_url}/api/stacks", headers=headers)
    except Exception as e:
        print(f"Error fetching stacks: {e}")
        sys.exit(1)
    
    if not isinstance(stacks, list):
        print(f"Error: Expected a list of stacks, got: {type(stacks)}")
        print(f"Response: {stacks}")
        sys.exit(1)

    stack_id = None
    stack_names = []
    for stack in stacks:
        name = stack.get('Name')
        stack_names.append(name)
        if name == stack_name:
            stack_id = stack.get('Id')
            break
    
    if not stack_id:
        print(f"Stack '{stack_name}' not found. Creating a new stack...")
        print(f"Available stacks: {', '.join(stack_names)}")
        
        create_url = f"{base_url}/api/stacks/create/standalone/string?endpointId={endpoint_id}"
        payload = {
            "name": stack_name,
            "stackFileContent": stack_content,
            "env": []
        }
        
        request(create_url, method="POST", data=payload, headers=headers)
        print(f"Stack '{stack_name}' created successfully.")
    else:
        print(f"Found Stack ID: {stack_id}")
        print(f"Updating stack with content from {stack_file_path}...")
        
        update_url = f"{base_url}/api/stacks/{stack_id}?endpointId={endpoint_id}"
        payload = {
            "stackFileContent": stack_content,
            "env": [],
            "prune": True,
            "pullImage": True
        }
        
        request(update_url, method="PUT", data=payload, headers=headers)
        print(f"Stack '{stack_name}' updated successfully.")

if __name__ == "__main__":
    main()
