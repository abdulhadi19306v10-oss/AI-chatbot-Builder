# ponytail: auto-detect IP, update env, run servers
import subprocess, os, socket, re, sys, traceback

def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except: return '127.0.0.1'

def main():
    ip = get_ip()
    print(f"Detected LAN IP: {ip}")

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    # Auto-update .env.local
    env_path = os.path.join(BASE_DIR, "Build", "frontend", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f: env = f.read()
        env = re.sub(r'NEXTAUTH_URL=.*', f'NEXTAUTH_URL=http://{ip}:3000', env)
        env = re.sub(r'NEXT_PUBLIC_BACKEND_URL=.*\n?', '', env) # remove ngrok override
        with open(env_path, "w", encoding="utf-8") as f: f.write(env)

    print("Starting Database...")
    subprocess.run("docker start chatbot-db", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Starting Backend & Frontend...")
    bp = subprocess.Popen("npm run dev", cwd=os.path.join(BASE_DIR, r"Build\backend-node"), shell=True)
    fp = subprocess.Popen("npm run dev -- -H 0.0.0.0", cwd=os.path.join(BASE_DIR, r"Build\frontend"), shell=True)

    try:
        bp.wait()
        fp.wait()
    except KeyboardInterrupt:
        pass
    finally:
        subprocess.run(f"taskkill /F /T /PID {bp.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(f"taskkill /F /T /PID {fp.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("\nFATAL ERROR:")
        traceback.print_exc()
    finally:
        input("\nPress Enter to exit...")
