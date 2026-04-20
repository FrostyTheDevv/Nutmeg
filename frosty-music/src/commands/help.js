const { 
  SlashCommandBuilder, 
  ContainerBuilder,
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available music commands'),

  async execute(interaction, client) {
    try {
      const container = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addTextDisplayComponents(
          t => t.setContent("**🎵 Music Bot Help**"),
          t => t.setContent(
            "**Playback Controls**\n" +
            "`/play` - Play a song or playlist\n" +
            "`/playback pause` - Pause playback\n" +
            "`/playback resume` - Resume playback\n" +
            "`/playback skip` - Skip to next track\n" +
            "`/playback stop` - Stop and clear queue\n" +
            "`/playback back` - Go to previous track\n" +
            "`/playback forward` - Seek forward\n" +
            "`/playback rewind` - Seek backward\n\n" +
            "**Queue Management**\n" +
            "`/queue` - View current queue\n" +
            "`/queue clear` - Clear all tracks\n" +
            "`/shuffle` - Shuffle queue order\n\n" +
            "**Audio Settings**\n" +
            "`/volume` - Adjust playback volume\n" +
            "`/loop` - Toggle track repeat\n\n" +
            "**Session Controls**\n" +
            "`/247` - Toggle 24/7 mode\n" +
            "`/join` - Join your voice channel\n" +
            "`/leave` - Leave voice channel\n\n" +
            "**Additional Features**\n" +
            "`/lyrics` - Display song lyrics\n" +
            "`/favs` - Manage favorites\n" +
            "`/dj` - DJ role management"
          ),
          t => t.setContent(
            "**ℹ️ Tips**\n" +
            "• Use `/` before each command\n" +
            "• Most commands require you to be in a voice channel\n" +
            "• Commands are organized by category for easy reference"
          )
        );

      await interaction.reply({ 
        components: [container], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Help command error:', error);
      const errorCont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to display help: ${error.message}`)
        );
      
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ components: [errorCont], flags: MessageFlags.IsComponentsV2 });
      } else {
        await interaction.reply({ 
          components: [errorCont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }
    }
  }
};