#!/usr/bin/env python3
"""
Script to start Django server for client access.
"""

import os
import sys
import subprocess
import socket

def get_local_ip():
    """Get the local IP address."""
    try:
        # Connect to a remote address to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def main():
    print("🌐 Django Server for Client Access")
    print("=" * 40)
    
    # Get local IP
    local_ip = get_local_ip()
    
    print(f"📱 Your local IP: {local_ip}")
    print()
    
    # Ask for port
    port = input("Enter port number (default: 8000): ").strip()
    if not port:
        port = "8000"
    
    # Ask for access type
    print("\n🔧 Access Type:")
    print("1. Local only (127.0.0.1)")
    print("2. Network access (0.0.0.0)")
    print("3. Custom host")
    
    choice = input("\nSelect option (1-3, default: 2): ").strip()
    
    if choice == "1":
        host = "127.0.0.1"
        access_url = f"http://127.0.0.1:{port}"
    elif choice == "3":
        host = input("Enter custom host: ").strip()
        access_url = f"http://{host}:{port}"
    else:
        host = "0.0.0.0"
        access_url = f"http://{local_ip}:{port}"
    
    print(f"\n🚀 Starting server on {host}:{port}")
    print(f"📱 Clients can access: {access_url}")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 40)
    
    try:
        # Start Django server
        subprocess.run([
            sys.executable, "manage.py", "runserver", f"{host}:{port}"
        ])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped.")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")

if __name__ == "__main__":
    main() 