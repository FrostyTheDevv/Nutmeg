const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set loop/repeat mode')
    .addStringOption(option => option
      .setName('mode')
      .setDescription('Loop mode')
      .setRequired(true)
      .addChoices(
        { name: 'Off - No repeat', value: 'off' },
        { name: 'Track - Repeat current track', value: 'track' },
        { name: 'Queue - Repeat entire queue', value: 'queue' }
      )),

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

    if (!hasDJPermissions(interaction.member, interaction.guild.id)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Permission Denied"),
          t => t.setContent("You need the DJ role to change loop mode!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const mode = interaction.options.getString('mode');

    try {
      player.setRepeatMode(mode);

      let emoji, title, description;
      
      switch (mode) {
        case 'off':
          emoji = '➡️';
          title = 'Loop Disabled';
          description = 'Tracks will play once and continue to the next';
          break;
        case 'track':
          emoji = '🔂';
          title = 'Track Loop Enabled';
          description = 'Current track will repeat continuously';
          break;
        case 'queue':
          emoji = '🔁';
          title = 'Queue Loop Enabled';
          description = 'The entire queue will repeat after the last track';
          break;
        default:
          emoji = '🔄';
          title = 'Loop Mode Changed';
          description = `Loop mode set to **${mode}**`;
      }

      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.SUCCESS)
        .addTextDisplayComponents(
          t => t.setContent(`${emoji} ${title}`),
          t => t.setContent(description)
        );

      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('Loop command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to set loop mode: ${error.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};