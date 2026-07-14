# ponytail: local testing script
import subprocess, os, sys, re, traceback

def main():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Auto-update .env.local back to localhost
    env_path = os.path.join(BASE_DIR, "Build", "frontend", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f: env = f.read()
        env = re.sub(r'NEXTAUTH_URL=.*', 'NEXTAUTH_URL=http://localhost:3000', env)
        env = re.sub(r'NEXT_PUBLIC_BACKEND_URL=.*\n?', '', env)
        with open(env_path, "w", encoding="utf-8") as f: f.write(env)

    print("Starting Database...")
    subprocess.run("docker start chatbot-db", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Starting Backend & Frontend on Localhost...")
    bp = subprocess.Popen("npm run dev", cwd=os.path.join(BASE_DIR, r"Build\backend-node"), shell=True)
    fp = subprocess.Popen("npm run dev", cwd=os.path.join(BASE_DIR, r"Build\frontend"), shell=True)

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
