import subprocess
import sys
import os
import signal
import time

def main():
    print("🚀 Starting AI Chatbot Builder on LAN...")
    
    # Get the absolute path to the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(root_dir, "Build")
    
    backend_dir = os.path.join(build_dir, "backend-node")
    frontend_dir = os.path.join(build_dir, "frontend")
    
    # Define the commands
    backend_cmd = "npm run dev"
    
    frontend_cmd = "npm run dev -- -H 0.0.0.0"
    
    print(f"📁 Backend Path: {backend_dir}")
    print(f"📁 Frontend Path: {frontend_dir}\n")
    
    try:
        # Start Database Container
        print("⚡ Starting Database (Docker)...")
        subprocess.run(["docker", "start", "chatbot-db"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Start Backend
        print("⚡ Starting Backend (Node.js)...")
        backend_process = subprocess.Popen(
            backend_cmd, 
            cwd=backend_dir,
            shell=True
        )
        
        # Start Frontend
        print("⚡ Starting Frontend (Next.js)...")
        # On Windows, npm is a .cmd file, so shell=True is highly recommended
        frontend_process = subprocess.Popen(
            frontend_cmd, 
            cwd=frontend_dir,
            shell=True
        )
        
        print("\n✅ Both servers are starting up!")
        print("🌐 To access from your phone or another computer, use your IPv4 address (e.g., http://192.168.1.X:3000)")
        print("🛑 Press Ctrl+C to stop both servers gracefully.\n")
        
        # Wait for both processes
        backend_process.wait()
        frontend_process.wait()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        try:
            # Send termination signals
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(backend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            pass
        print("👋 Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    main()
