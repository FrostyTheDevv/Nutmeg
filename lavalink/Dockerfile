# Lavalink Dockerfile for Railway Deployment
FROM openjdk:17-slim

WORKDIR /opt/Lavalink

# Install curl for healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Download Lavalink v4 (latest stable)
RUN curl -L https://github.com/lavalink-devs/Lavalink/releases/download/4.0.8/Lavalink.jar -o Lavalink.jar

# Copy application.yml
COPY application.yml ./application.yml

# Create plugins directory
RUN mkdir -p plugins

# Expose Lavalink port
EXPOSE 2333

# Start Lavalink
CMD ["java", "-jar", "Lavalink.jar"]
