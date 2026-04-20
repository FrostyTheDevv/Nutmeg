const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Control playback volume')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Set volume level (0-200)')
        .addIntegerOption(opt =>
          opt.setName('level')
            .setDescription('Volume percentage')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(200)
        )
    )
    .addSubcommand(sub => sub.setName('up').setDescription('Increase volume by 10%'))
    .addSubcommand(sub => sub.setName('down').setDescription('Decrease volume by 10%'))
    .addSubcommand(sub => sub.setName('show').setDescription('Display current volume')),

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

    if (sub !== 'show' && !hasDJPermissions(interaction.member, interaction.guild.id)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Permission Denied"),
          t => t.setContent("You need the DJ role to control volume!")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    let volume = player.volume;
    let title = "";
    let description = "";
    let color = styles.Colors.SUCCESS;

    try {
      switch (sub) {
        case 'set':
          volume = interaction.options.getInteger('level');
          player.setVolume(volume);
          title = "🔊 Volume Set";
          description = `Volume set to **${volume}%**`;
          break;

        case 'up':
          volume = Math.min(200, player.volume + 10);
          player.setVolume(volume);
          title = "🔊 Volume Increased";
          description = `Volume increased to **${volume}%**`;
          break;

        case 'down':
          volume = Math.max(0, player.volume - 10);
          player.setVolume(volume);
          title = "🔉 Volume Decreased";
          description = `Volume decreased to **${volume}%**`;
          break;

        case 'show':
          title = "🔊 Current Volume";
          description = `Volume is currently set to **${player.volume}%**`;
          color = styles.Colors.INFO;
          break;
      }

      const cont = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(
          t => t.setContent(title),
          t => t.setContent(description)
        );

      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });

    } catch (e) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Error: ${e.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};