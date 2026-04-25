const { 
  SlashCommandBuilder, 
  ContainerBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');

const CATEGORIES = {
  playback: {
    title: '🎵 Playback Controls',
    emoji: '🎵',
    commands: [
      { name: 'play', description: 'Play a song or playlist from YouTube, Spotify, or URL' },
      { name: 'playback', description: 'Control playback (pause, resume, skip, stop, back, forward, rewind)' },
      { name: 'autoplay', description: 'Toggle YouTube autoplay to keep music going' }
    ]
  },
  queue: {
    title: '📝 Queue Management',
    emoji: '📝',
    commands: [
      { name: 'queue', description: 'View, clear, shuffle, or remove tracks from queue' },
      { name: 'loop', description: 'Toggle loop mode (track, queue, or off)' }
    ]
  },
  audio: {
    title: '🔊 Audio Settings',
    emoji: '🔊',
    commands: [
      { name: 'volume', description: 'Adjust playback volume (0-200%)' }
    ]
  },
  session: {
    title: '⚙️ Session Controls',
    emoji: '⚙️',
    commands: [
      { name: 'voice', description: 'Join or leave voice channels' },
      { name: '247', description: 'Toggle 24/7 mode to keep bot in voice channel' },
      { name: 'dj', description: 'Set DJ role for restricted commands' }
    ]
  },
  features: {
    title: '✨ Additional Features',
    emoji: '✨',
    commands: [
      { name: 'lyrics', description: 'Display lyrics for current or specified song' },
      { name: 'favs', description: 'Save and play your favorite tracks' }
    ]
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available music commands'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      const guildCommands = await interaction.guild.commands.fetch();
      
      const getCmdMention = (cmdName) => {
        const command = guildCommands.find(cmd => cmd.name === cmdName);
        return command ? `</${cmdName}:${command.id}>` : `\`/${cmdName}\``;
      };

      const container = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addTextDisplayComponents(
          t => t.setContent("**🎵 Nutmeg Music Bot**"),
          t => t.setContent(
            "A powerful music bot with Spotify, YouTube support, and DAVE-encrypted voice!"
          )
        );

      Object.entries(CATEGORIES).forEach(([key, cat]) => {
        const cmdLines = cat.commands.map(cmd => {
          const mention = getCmdMention(cmd.name);
          return `${mention} - ${cmd.description}`;
        });
        
        container.addTextDisplayComponents(
          t => t.setContent(`**${cat.title}**\n${cmdLines.join('\n')}`)
        );
      });

      container.addTextDisplayComponents(
        t => t.setContent(
          "\n**💡 Quick Tips**\n" +
          "• Click any command above to use it\n" +
          "• Most commands require you to be in a voice channel\n" +
          "• Powered by Lavalink v4.2.0 with DAVE encryption"
        )
      );

      const buttonRow = new ContainerBuilder();
      
      buttonRow.addButtonComponents(
        b => b.setCustomId('help_refresh')
              .setLabel('Refresh Commands')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🔄'),
        b => b.setCustomId('help_support')
              .setLabel('Need Help?')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('❓'),
        b => b.setLabel('GitHub')
              .setStyle(ButtonStyle.Link)
              .setUrl('https://github.com/FrostyTheDevv/Nutmeg')
              .setEmoji('⭐')
      );

      await interaction.editReply({ 
        components: [container, buttonRow], 
        flags: MessageFlags.IsComponentsV2
      });

    } catch (error) {
      console.error('Help command error:', error);
      const errorCont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to display help: ${error.message}`)
        );
      
      const replyMethod = interaction.deferred ? 'editReply' : 'reply';
      await interaction[replyMethod]({ 
        components: [errorCont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};