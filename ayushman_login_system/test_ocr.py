import urllib.request
import json
import mimetypes
import uuid

def post_json(url, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post_multipart(url, file_path, token=None):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    lines = []
    lines.append(f"--{boundary}".encode())
    lines.append(b'Content-Disposition: form-data; name="file"; filename="card.png"')
    lines.append(b'Content-Type: image/png')
    lines.append(b'')
    lines.append(file_bytes)
    lines.append(f"--{boundary}--".encode())
    lines.append(b'')

    body = b"\r\n".join(lines)
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Content-Length': str(len(body))
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# 1. Test Ayushman OCR service directly (port 8001)
direct_res = post_multipart('http://127.0.0.1:8001/extract', 'data/synthetic_cards/synthetic_000.png')
print("Direct OCR 8001:", json.dumps(direct_res.get('extracted_fields'), indent=2))

# 2. Test Java backend public endpoint (port 8080)
java_pub_res = post_multipart('http://localhost:8080/api/ayushman/extract-public', 'data/synthetic_cards/synthetic_001.png')
print("Java Public OCR 8080:", json.dumps(java_pub_res.get('extracted_fields'), indent=2))

# 3. Test Java backend authenticated endpoint (port 8080)
auth_res = post_json('http://localhost:8080/api/auth/login', {'email': 'admin@medicase.local', 'password': 'Admin@12345'})
token = auth_res['token']
print("Admin logged in successfully! User role:", auth_res['role'])

java_auth_res = post_multipart('http://localhost:8080/api/ayushman/extract', 'data/synthetic_cards/synthetic_002.png', token=token)
print("Java Authenticated OCR 8080:", json.dumps(java_auth_res.get('extracted_fields'), indent=2))
