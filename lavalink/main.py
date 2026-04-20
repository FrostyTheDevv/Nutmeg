import os
import subprocess
import sys

def main():
    """
    Main entry point for Replit deployment.
    This script ensures proper environment setup and starts Lavalink.
    """
    print("🚀 Starting Lavalink v4 on Replit...")
    
    # Check if Java is available
    try:
        result = subprocess.run(['java', '-version'], capture_output=True, text=True)
        print(f"✅ Java version check passed")
    except FileNotFoundError:
        print("❌ Java not found. Please ensure Java is installed.")
        sys.exit(1)
    
    # Check if Lavalink jar exists
    if not os.path.exists('Lavalink_v4.jar'):
        print("❌ Lavalink_v4.jar not found. Please ensure the JAR file is in the root directory.")
        sys.exit(1)
    
    # Check if config exists
    if not os.path.exists('application.yml'):
        print("❌ application.yml not found. Please ensure the config file is present.")
        sys.exit(1)
    
    print("✅ All prerequisites met. Starting Lavalink...")
    
    # Set JVM options for Replit environment
    jvm_opts = [
        "-Xmx512m",  # Limit memory usage for Replit
        "-Dspring.cloud.config.enabled=false",
        "-Djava.awt.headless=true",  # Headless mode for server environment
        "-Dfile.encoding=UTF-8"
    ]
    
    # Build the command
    cmd = ['java'] + jvm_opts + ['-jar', 'Lavalink_v4.jar', '--spring.config.location=application.yml']
    
    print(f"📋 Executing: {' '.join(cmd)}")
    
    # Start Lavalink
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Lavalink failed to start: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⏹️  Lavalink stopped by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()