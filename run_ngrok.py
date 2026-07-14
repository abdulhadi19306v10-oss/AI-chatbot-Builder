# ponytail: run servers and spawn ngrok windows
import subprocess, os, sys

print("⚡ Starting Database...")
subprocess.run("docker start chatbot-db", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("⚡ Starting Backend & Frontend...")
bp = subprocess.Popen("npm run dev", cwd=r"Build\backend-node", shell=True)
fp = subprocess.Popen("npm run dev", cwd=r"Build\frontend", shell=True)

print("🚇 Starting ngrok tunnels in new windows...")
subprocess.Popen('start cmd /k "ngrok http 3000"', shell=True)
subprocess.Popen('start cmd /k "ngrok http 8000"', shell=True)

print("\n⚠️ IMPORTANT: Copy the ngrok URLs from the new windows and update Build/frontend/.env.local:")
print("NEXTAUTH_URL=https://<frontend-url>")
print("NEXT_PUBLIC_BACKEND_URL=https://<backend-url>\n")

try:
    bp.wait()
    fp.wait()
except KeyboardInterrupt:
    subprocess.run(f"taskkill /F /T /PID {bp.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(f"taskkill /F /T /PID {fp.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sys.exit(0)
