import asyncio
import socket
import sys
import uvicorn
from app.main import app

def run():
    port = 8000
    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        sock.bind(("::", port))
        sock.listen(128)
        config = uvicorn.Config(app, log_level="info")
        server = uvicorn.Server(config)
        print(f"MediCase AI Service running on http://localhost:{port} (dual-stack IPv4/IPv6)")
        asyncio.run(server.serve(sockets=[sock]))
    except Exception as e:
        print(f"Dual-stack bind notice ({e}), falling back to 0.0.0.0:{port}")
        uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    run()
