const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Toggle autoplay (plays related songs when queue ends)')
    .addStringOption(o => o
      .setName('mode')
      .setDescription('Enable or disable autoplay')
      .setRequired(true)
      .addChoices(
        { name: 'Enable', value: 'on' }, 
        { name: 'Disable', value: 'off' }
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
          t => t.setContent("You need the DJ role to toggle autoplay!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const mode = interaction.options.getString('mode');
    const enabled = mode === 'on';

    try {
      
      if (!player.data) player.data = {};
      player.data.autoplay = enabled;

      const cont = new ContainerBuilder()
        .setAccentColor(enabled ? styles.Colors.SUCCESS : styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent(enabled ? "✅ Autoplay Enabled" : "⏸️ Autoplay Disabled"),
          t => t.setContent(
            enabled 
              ? "When the queue ends, I'll automatically play similar songs"
              : "Autoplay has been disabled. Playback will stop when the queue ends"
          )
        );

      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('Autoplay command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to toggle autoplay: ${error.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};