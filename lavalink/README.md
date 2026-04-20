# 🎵 Lavalink Server

High-performance audio streaming server for Discord music bots.

## Railway Deployment

This Lavalink server is configured for Railway deployment with:
- Java 17 runtime
- YouTube support via plugin
- Spotify support via LavaSrc
- Auto-downloading of required plugins
- Dynamic port binding for Railway

## Configuration

The `application.yml` is pre-configured for Railway with:
- Dynamic port binding (`PORT` environment variable)
- Bind to all interfaces (`0.0.0.0`)
- Password via environment variable
- Latest YouTube and Spotify plugins

## Local Development

1. Download Lavalink jar:
```bash
# Download from https://github.com/lavalink-devs/Lavalink/releases
# Save as Lavalink_v4.jar in this directory
```

2. Run Lavalink:
```bash
java -jar Lavalink_v4.jar
```

Server will start on `http://localhost:2333`

## Environment Variables

- `PORT` - Port to bind to (Railway sets this automatically)
- `LAVALINK_PASSWORD` - Password for authentication (default: youshallnotpass)

## Features

✅ YouTube support  
✅ Spotify support  
✅ SoundCloud support  
✅ Bandcamp support  
✅ HTTP streams  
✅ Audio filters  
✅ High-quality streaming  

## Version

Lavalink v4.0.8 with:
- YouTube plugin v1.16.0
- LavaSrc plugin v4.8.1
Your Spotify credentials are already configured:
- **Client ID**: `Yc5c0d8acbf6c4851af70cff2bff3aafb`
- **Client Secret**: `813d32b826cc47cfb2bdc10a5e294528`
- **Country**: US

## 🔧 Troubleshooting

### If Lavalink Won't Start
1. Check the Console output for error messages
2. Ensure all files uploaded correctly
3. Try refreshing the Replit page and running again

### If Bot Can't Connect
1. Verify your bot's `LAVALINK_URI` environment variable
2. Make sure the URL starts with `https://` (not `http://`)
3. Check that your Replit is running (green dot in Replit interface)

### Memory Issues
If you encounter memory issues:
1. The `main.py` script limits memory to 512MB for free tier compatibility
2. With paid Replit, you can increase this in `main.py`:
   ```python
   "-Xmx1024m",  # Increase to 1GB
   ```

## 🎵 Features Included

### Audio Sources
- ✅ YouTube (via YouTube plugin)
- ✅ Spotify (via LavaSrc plugin)
- ✅ SoundCloud
- ✅ Bandcamp
- ✅ Twitch streams
- ✅ Vimeo
- ✅ Direct HTTP links

### Audio Filters
- ✅ Volume control
- ✅ Equalizer
- ✅ Karaoke mode
- ✅ Timescale (speed/pitch)
- ✅ Tremolo & Vibrato
- ✅ Distortion & Rotation
- ✅ Channel mixing
- ✅ Low-pass filter

## 💰 Replit Features (Paid Account)

Since you have a paid Replit account, you can:
- ✅ **Always-On**: Keep Lavalink running 24/7
- ✅ **Better Performance**: More CPU and memory
- ✅ **Custom Domains**: Use your own domain
- ✅ **Private Repls**: Keep your code private

### Enable Always-On
1. In your Replit project, go to Settings
2. Scroll to "Always On"
3. Toggle it to "On"
4. Your Lavalink will now run continuously

## 🔄 Updates and Maintenance

### Updating Lavalink
1. Download the latest `Lavalink.jar` from [GitHub releases](https://github.com/lavalink-devs/Lavalink/releases)
2. Replace `Lavalink_v4.jar` in your Replit
3. Restart the Repl

### Monitoring
- Check the Console tab in Replit for logs
- Look for connection messages from your bot
- Monitor memory usage in the Resources tab

## 📞 Support

If you encounter issues:
1. Check the Replit Console for error messages
2. Verify your bot's environment variables
3. Ensure Always-On is enabled for 24/7 operation
4. Test connection with a simple curl command:
   ```bash
   curl https://[your-repl-name].[your-username].repl.co/version
   ```

---

**Ready to deploy?** Just copy this entire folder to Replit and hit Run! 🎶