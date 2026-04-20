const { 
  SlashCommandBuilder, 
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');
const MusicPlayer = require('../components/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View or manage the queue')
    .addSubcommand(s => s.setName('view').setDescription('Show current queue'))
    .addSubcommand(s => s.setName('clear').setDescription('Clear the entire queue'))
    .addSubcommand(s => s.setName('shuffle').setDescription('Shuffle the queue')),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    
    if (!player || !player.connected) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Not Playing"),
          t => t.setContent("No music is currently playing!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const vc = interaction.member.voice.channel;
    if (!vc || vc.id !== player.voiceChannelId) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Wrong Voice Channel"),
          t => t.setContent("You must be in my voice channel!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const sub = interaction.options.getSubcommand();

    if ((sub === 'clear' || sub === 'shuffle') && !hasDJPermissions(interaction.member, interaction.guild.id)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Permission Denied"),
          t => t.setContent("You need the DJ role to manage the queue!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    try {
      if (sub === 'clear') {
        const clearedCount = player.queue.tracks.length;
        
        if (clearedCount === 0) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.WARNING)
            .addTextDisplayComponents(
              t => t.setContent("⚠️ Queue Empty"),
              t => t.setContent("There are no tracks in the queue to clear!")
            );
          return interaction.reply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
          });
        }

        player.queue.tracks.splice(0, player.queue.tracks.length);
        
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("🗑️ Queue Cleared"),
            t => t.setContent(`Removed **${clearedCount}** track${clearedCount === 1 ? '' : 's'} from the queue`)
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      if (sub === 'shuffle') {
        if (player.queue.tracks.length === 0) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.WARNING)
            .addTextDisplayComponents(
              t => t.setContent("⚠️ Queue Empty"),
              t => t.setContent("There are no tracks in the queue to shuffle!")
            );
          return interaction.reply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
          });
        }

        const tracks = player.queue.tracks;
        for (let i = tracks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
        }
        
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("🔀 Queue Shuffled"),
            t => t.setContent(`Shuffled **${player.queue.tracks.length}** track${player.queue.tracks.length === 1 ? '' : 's'}`)
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const tracks = player.queue.tracks;
      const current = player.queue.current;
      const totalTracks = tracks.length;

      if (!current && totalTracks === 0) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("📜 Queue Empty"),
            t => t.setContent("No tracks in queue. Use `/play` to add songs!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      let queueList = '';
      
      if (totalTracks > 0) {
        const displayTracks = tracks.slice(0, 10);
        queueList = displayTracks.map((track, index) => {
          const duration = MusicPlayer.formatTime(track.info.duration);
          return `**${index + 1}.** ${track.info.title}\n⏱️ ${duration} • 👤 ${track.info.author || 'Unknown'}`;
        }).join('\n\n');

        if (totalTracks > 10) {
          queueList += `\n\n*...and ${totalTracks - 10} more track${totalTracks - 10 === 1 ? '' : 's'}*`;
        }
      } else {
        queueList = '*No upcoming tracks*';
      }

      const totalDuration = tracks.reduce((acc, track) => acc + (track.info.duration || 0), 0);
      const totalDurationStr = MusicPlayer.formatTime(totalDuration);

      const artworkUrl = current ? MusicPlayer.getTrackThumbnail(current) : "https://i.imgur.com/6Fx5kQ5.png";

      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(
              current 
                ? `**Now Playing**\n[${current.info.title}](${current.info.uri || 'https://youtube.com'})\n⏱️ ${MusicPlayer.formatTime(current.info.duration)} • 👤 ${current.info.author || 'Unknown'}`
                : '**Now Playing**\nNothing playing'
            ),
          new TextDisplayBuilder()
            .setContent(`**📜 Up Next (${totalTracks} track${totalTracks === 1 ? '' : 's'})**\n${queueList}`),
          new TextDisplayBuilder()
            .setContent(
              `**ℹ️ Queue Info**\n` +
              `Total Tracks: \`${totalTracks}\`\n` +
              `Total Duration: \`${totalDurationStr}\`\n` +
              `Loop Mode: \`${player.repeatMode || 'off'}\``
            )
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(artworkUrl)
            .setDescription("Now playing artwork")
        );

      const container = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addSectionComponents(section);

      await interaction.reply({ 
        components: [container], 
        flags: MessageFlags.IsComponentsV2 
      });

    } catch (error) {
      console.error('Queue command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to manage queue: ${error.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};