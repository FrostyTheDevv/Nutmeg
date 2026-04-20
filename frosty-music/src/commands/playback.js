const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playback')
    .setDescription('Playback controls')
    .addSubcommand(sub => sub.setName('pause').setDescription('Pause current track'))
    .addSubcommand(sub => sub.setName('resume').setDescription('Resume playback'))
    .addSubcommand(sub => sub.setName('stop').setDescription('Stop and clear queue'))
    .addSubcommand(sub => sub.setName('skip').setDescription('Skip current track'))
    .addSubcommand(sub => sub.setName('back').setDescription('Go to previous track'))
    .addSubcommand(sub => 
      sub.setName('forward')
        .setDescription('Seek forward')
        .addIntegerOption(o => 
          o.setName('seconds')
            .setDescription('Seconds to seek forward (default: 10)')
            .setRequired(false)
        )
    )
    .addSubcommand(sub => 
      sub.setName('rewind')
        .setDescription('Seek backward')
        .addIntegerOption(o => 
          o.setName('seconds')
            .setDescription('Seconds to seek backward (default: 10)')
            .setRequired(false)
        )
    ),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    
    if (!player || !player.connected) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Not Playing"),
          t => t.setContent("No music is currently playing!")
        );
      return interaction.reply({ components: [cont], flags: MessageFlags.IsComponentsV2, ephemeral: true });
    }

    const vc = interaction.member.voice.channel;
    if (!vc || vc.id !== player.voiceChannelId) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Wrong Voice Channel"),
          t => t.setContent("You must be in my voice channel!")
        );
      return interaction.reply({ components: [cont], flags: MessageFlags.IsComponentsV2, ephemeral: true });
    }

    if (!hasDJPermissions(interaction.member, interaction.guild.id)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Permission Denied"),
          t => t.setContent("You need the DJ role to control playback!")
        );
      return interaction.reply({ components: [cont], flags: MessageFlags.IsComponentsV2, ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    let title = "";
    let description = "";
    let color = styles.Colors.SUCCESS;

    try {
      switch (sub) {
        case 'pause':
          if (player.paused) {
            title = "⏸️ Already Paused";
            description = "Playback is already paused!";
            color = styles.Colors.WARNING;
          } else {
            await player.pause();
            title = "⏸️ Paused";
            description = "Playback has been paused";
          }
          break;

        case 'resume':
          if (!player.paused) {
            title = "▶️ Already Playing";
            description = "Playback is already active!";
            color = styles.Colors.WARNING;
          } else {
            await player.resume();
            title = "▶️ Resumed";
            description = "Playback has been resumed";
          }
          break;

        case 'stop':
          const queueSize = player.queue.tracks.length;
          player.destroy();
          title = "⏹️ Stopped";
          description = `Playback stopped and queue cleared (${queueSize} tracks)`;
          color = styles.Colors.DANGER;
          break;

        case 'skip':
          if (player.queue.tracks.length === 0) {
            title = "⏭️ Queue Empty";
            description = "No more tracks to skip to. Stopping playback.";
            color = styles.Colors.WARNING;
            player.destroy();
          } else {
            const currentTrack = player.queue.current?.info?.title || "Unknown";
            player.skip();
            title = "⏭️ Skipped";
            description = `Skipped: **${currentTrack}**`;
          }
          break;

        case 'back':
          if (!player.queue.previous || player.queue.previous.length === 0) {
            title = "⏮️ No Previous Track";
            description = "There is no previous track to go back to";
            color = styles.Colors.WARNING;
          } else {
            const previousTrack = player.queue.previous[player.queue.previous.length - 1];
            if (player.queue.current) {
              player.queue.add(player.queue.current, 0);
            }
            player.queue.add(previousTrack, 0);
            player.skip();
            title = "⏮️ Previous Track";
            description = `Playing: **${previousTrack.info.title}**`;
          }
          break;

        case 'forward':
        case 'rewind':
          const seconds = interaction.options.getInteger('seconds') ?? 10;
          const current = player.position;
          const duration = player.queue.current?.info?.duration || 0;
          
          let newPos = sub === 'forward' 
            ? current + (seconds * 1000) 
            : current - (seconds * 1000);

          if (newPos < 0) {
            title = "⏪ Cannot Rewind";
            description = "Cannot rewind past the start of the track";
            color = styles.Colors.WARNING;
          } else if (newPos > duration) {
            title = "⏩ Cannot Seek";
            description = "Cannot seek past the end of the track";
            color = styles.Colors.WARNING;
          } else {
            player.seek(newPos);
            title = sub === 'forward' ? "⏩ Seeked Forward" : "⏪ Seeked Backward";
            description = `${sub === 'forward' ? 'Forwarded' : 'Rewinded'} **${seconds}** seconds`;
          }
          break;
      }

      const cont = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(
          t => t.setContent(title),
          t => t.setContent(description)
        );

      await interaction.reply({ components: [cont], flags: MessageFlags.IsComponentsV2, ephemeral: true });

    } catch (e) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Error: ${e.message}`)
        );
      await interaction.reply({ components: [cont], flags: MessageFlags.IsComponentsV2, ephemeral: true });
    }
  }
};