# ponytail: run servers and spawn ngrok windows
import subprocess, os, sys, traceback

def main():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    print("Starting Database...")
    subprocess.run("docker start chatbot-db", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("Starting Backend & Frontend...")
    bp = subprocess.Popen("npm run dev", cwd=os.path.join(BASE_DIR, r"Build\backend-node"), shell=True)
    fp = subprocess.Popen("npm run dev", cwd=os.path.join(BASE_DIR, r"Build\frontend"), shell=True)

    print("Starting ngrok tunnel for frontend...")
    subprocess.Popen('start cmd /k "ngrok http 3000"', shell=True)

    print("\nIMPORTANT: Copy the ngrok URL and update Build/frontend/.env.local:")
    print("NEXTAUTH_URL=https://<frontend-url>")
    print("NEXT_PUBLIC_BACKEND_URL= is no longer needed!\n")

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
