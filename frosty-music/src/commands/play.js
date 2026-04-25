const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  SectionBuilder, 
  TextDisplayBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags,
  ThumbnailBuilder 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');
const MusicPlayer = require('../components/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist (supports YouTube, Spotify, and more)")
    .addStringOption(o => 
      o.setName("query")
        .setDescription("Song name, URL (YouTube/Spotify), or playlist URL")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const vc = interaction.member.voice.channel;
      if (!vc) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Not in Voice Channel"),
            t => t.setContent("Join a voice channel first!")
          );
        return interaction.editReply({ components: [cont], flags: MessageFlags.IsComponentsV2 });
      }

      const perms = vc.permissionsFor(interaction.client.user);
      if (!perms?.has(["Connect", "Speak"])) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Missing Permissions"),
            t => t.setContent("I need **Connect** and **Speak** permissions!")
          );
        return interaction.editReply({ components: [cont], flags: MessageFlags.IsComponentsV2 });
      }

      const query = interaction.options.getString("query");
      let player = client.lavalink.getPlayer(interaction.guild.id);

      if (!player) {
        player = await client.lavalink.createPlayer({
          guildId: interaction.guild.id,
          voiceChannelId: vc.id,
          textChannelId: interaction.channel.id,
          selfDeaf: true,
          selfMute: false,
          volume: 100,
          vcRegion: vc.rtcRegion
        });
        console.log(`🔊 Player created for channel ${vc.id}`);
        await player.connect();
        console.log(`✅ Player connected with Lavalink v4.2.0 (DAVE-compatible)`);
      }

      if (player.voiceChannelId !== vc.id) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Wrong Voice Channel"),
            t => t.setContent("I'm already playing in another channel.")
          );
        return interaction.editReply({ components: [cont], flags: MessageFlags.IsComponentsV2 });
      }

      const spotifyMatch = query.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
      let searchQuery = query;
      
      if (spotifyMatch) {
        console.log(`Spotify ${spotifyMatch[1]} detected: ${query}`);
      } else if (!query.match(/^https?:\/\//)) {
        searchQuery = `ytsearch:${query}`;
      }

      const res = await player.search({ query: searchQuery }, interaction.user);
      if (!res?.tracks?.length) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("🔍 No Results Found"),
            t => t.setContent(`Nothing found for **${query}**`)
          );
        return interaction.editReply({ components: [cont], flags: MessageFlags.IsComponentsV2 });
      }

      const isPlaylist = res.loadType === "playlist";
      const track = res.tracks[0];
      const added = isPlaylist ? res.tracks : [track];
      
      const wasPlaying = player.playing || player.paused;
      
      player.queue.add(added);
      
      if (!wasPlaying) {
        await player.play();
      }

      const trackUrl = track.info.uri || "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const queuePosition = wasPlaying ? player.queue.tracks.length : 1;

      const artworkUrl = MusicPlayer.getTrackThumbnail(track);

      let sourceIcon = "🎵";
      if (track.info.sourceName === "spotify" || query.includes("spotify")) {
        sourceIcon = "🟢";
      } else if (track.info.sourceName === "youtube") {
        sourceIcon = "🔴";
      } else if (track.info.sourceName === "soundcloud") {
        sourceIcon = "🟠";
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause").setLabel("Pause").setEmoji("⏸").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("skip").setLabel("Skip").setEmoji("⏭").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("⏹").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("loop").setLabel("Loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("queue").setLabel("Queue").setEmoji("📋").setStyle(ButtonStyle.Secondary)
      );

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(
              isPlaylist
                ? `**${sourceIcon} Added Playlist** [${res.playlist?.name || "Unknown Playlist"}](${trackUrl})`
                : wasPlaying
                  ? `**${sourceIcon} Added to Queue** [${track.info.title}](${trackUrl})`
                  : `**${sourceIcon} Now Playing** [${track.info.title}](${trackUrl})`
            ),
          new TextDisplayBuilder()
            .setContent(
              isPlaylist
                ? `⏱️ Duration: \`${formatPlaylistDuration(added)}\`\n🎵 Tracks: \`${added.length}\``
                : `⏱️ Duration: \`${MusicPlayer.formatTime(track.info.duration)}\`\n✍️ Artist: \`${track.info.author || "Unknown Artist"}\``
            ),
          new TextDisplayBuilder()
            .setContent(
              queuePosition === 1 
                ? `📢 Position: \`Now Playing\`` 
                : `📢 Position: \`#${queuePosition} in queue\``
            )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(artworkUrl)
            .setDescription("Album artwork")
        );

      const container = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addSectionComponents(section)
        .addActionRowComponents(() => row);

      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

      const reply = await interaction.fetchReply().catch(() => null);
      if (reply) {
        setupMessageCollector(reply, player, client, interaction.guild.id);
      }

    } catch (error) {
      console.error('Play command error:', error);
      const errorCont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`An error occurred: ${error.message}`)
        );
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ components: [errorCont], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } else {
          await interaction.reply({ components: [errorCont], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
        }
      } catch (e) {
        console.error('Error sending error message:', e);
      }
    }
  },
};

function setupMessageCollector(message, player, client, guildId) {
  const filter = i => ['pause', 'skip', 'stop', 'loop', 'queue'].includes(i.customId);
  const collector = message.createMessageComponentCollector({ 
    filter,
    time: 900000
  });

  collector.on("collect", async i => {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      const currentPlayer = client.lavalink.getPlayer(guildId);
      
      if (!i.member.voice.channel || !currentPlayer || i.member.voice.channel.id !== currentPlayer.voiceChannelId) {
        return await i.editReply({ content: "❌ Join my voice channel first!" });
      }

      if (i.customId !== 'queue' && !hasDJPermissions(i.member, guildId)) {
        return await i.editReply({ content: "❌ You need the DJ role to control playback!" });
      }

      switch (i.customId) {
        case "pause":
          if (currentPlayer.paused) {
            await currentPlayer.resume();
            await i.editReply({ content: "▶️ Resumed playback" });
          } else {
            await currentPlayer.pause();
            await i.editReply({ content: "⏸️ Paused playback" });
          }
          break;

        case "skip":
          if (currentPlayer.queue.tracks.length === 0) {
            await i.editReply({ content: "⏭️ No more tracks in queue" });
          } else {
            await currentPlayer.skip();
            await i.editReply({ content: "⏭️ Skipped to next track" });
          }
          break;

        case "stop":
          await currentPlayer.destroy();
          await i.editReply({ content: "⏹️ Stopped playback and cleared queue" });
          collector.stop();
          break;

        case "loop":
          const currentRepeatMode = currentPlayer.repeatMode;
          
          if (currentRepeatMode === "off") {
            currentPlayer.setRepeatMode("track");
            await i.editReply({ content: "🔁 Looping current track" });
          } else {
            currentPlayer.setRepeatMode("off");
            await i.editReply({ content: "➡️ Loop disabled" });
          }
          break;

        case "queue":
          const tracks = currentPlayer.queue.tracks.slice(0, 10);
          const current = currentPlayer.queue.current;
          
          let queueText = "";
          if (current) {
            queueText += `**Now Playing:**\n▶️ ${current.info.title}\n\n`;
          }
          
          if (tracks.length > 0) {
            queueText += `**Up Next:**\n${tracks.map((t, idx) => `${idx + 1}. ${t.info.title}`).join("\n")}`;
            if (currentPlayer.queue.tracks.length > 10) {
              queueText += `\n\n...and ${currentPlayer.queue.tracks.length - 10} more`;
            }
          } else {
            queueText += "No upcoming tracks";
          }

          const qcont = new ContainerBuilder()
            .setAccentColor(styles.Colors.PRIMARY)
            .addTextDisplayComponents(
              t => t.setContent("📋 Queue"),
              t => t.setContent(queueText)
            );

          return await i.editReply({ components: [qcont], flags: MessageFlags.IsComponentsV2 });
      }
    } catch (err) {
      console.error('Button interaction error:', err);
      try {
        if (!i.replied && !i.deferred) {
          await i.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
        } else {
          await i.editReply({ content: `❌ Error: ${err.message}` });
        }
      } catch (replyErr) {
        console.error('Error sending error reply:', replyErr);
      }
    }
  });

  collector.on("end", () => {
    message.edit({ components: [] }).catch(() => {});
  });
}

function formatPlaylistDuration(tracks) {
  const total = tracks.reduce((a, t) => a + (t.info.duration || 0), 0);
  return MusicPlayer.formatTime(total);
}