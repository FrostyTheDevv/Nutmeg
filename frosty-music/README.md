# 🎵 Frosty Music Bot

A professional Discord music bot powered by Lavalink with support for YouTube, Spotify, SoundCloud, and more!

## ✨ Features

- 🎶 High-quality music playback
- 🔍 Search and play from multiple sources
- 📝 Queue management with pagination
- ❤️ Favorite songs system
- 🔄 Loop modes (track, queue, disable)
- 🎚️ Volume control
- 📊 Now playing cards with progress bars
- 🎵 Lyrics support via Genius API
- 🤖 Auto-play recommendations
- 👥 DJ role system
- 24/7 mode for continuous playback

## 🚀 Quick Deploy to Railway

This bot is configured for easy deployment to Railway for 24/7 uptime.

### Prerequisites
- Railway account (https://railway.app)
- Discord Bot Token & Client ID
- GitHub account

### Deployment Steps

**See [RAILWAY_DEPLOYMENT_GUIDE.md](../RAILWAY_DEPLOYMENT_GUIDE.md) for complete instructions!**

Quick overview:
1. Deploy Lavalink service first
2. Get Lavalink Railway URL
3. Deploy bot service
4. Configure environment variables
5. Your bot is online 24/7! 🎉

## 🔧 Local Development

### Requirements
- Node.js 18 or higher
- Java 17 (for Lavalink)

### Setup

1. Clone the repository
2. Install dependencies:
```bash
cd src
npm install
```

3. Create `.env` file in `src/` directory:
```env
DISCORD_TOKEN=your_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id

LAVALINK_HOST=127.0.0.1
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
```

4. Start Lavalink (from root directory):
```bash
cd lavalink
# Download Lavalink jar first from https://github.com/lavalink-devs/Lavalink/releases
java -jar Lavalink_v4.jar
```

5. Deploy slash commands:
```bash
cd src
npm run deploy
```

6. Start the bot:
```bash
npm run start:local
```

## 📝 Available Commands

- `/play` - Play a song from URL or search query
- `/pause` - Pause playback
- `/resume` - Resume playback
- `/skip` - Skip current song
- `/stop` - Stop playback and clear queue
- `/queue` - View current queue
- `/nowplaying` - Show currently playing song
- `/volume` - Adjust volume (0-100)
- `/loop` - Set loop mode
- `/lyrics` - Get lyrics for current song
- `/favorites` - Manage your favorite songs
- `/247` - Enable/disable 24/7 mode
- `/autoplay` - Toggle autoplay
- `/dj` - Manage DJ role

## 🛠️ Tech Stack

- **Discord.js v14** - Discord bot framework
- **Lavalink** - High-performance audio streaming
- **Node.js** - Runtime environment
- **Railway** - Cloud hosting platform

## 📄 License

MIT License - feel free to use and modify!

## 💡 Support

For deployment help, see the complete [Railway Deployment Guide](../RAILWAY_DEPLOYMENT_GUIDE.md).
