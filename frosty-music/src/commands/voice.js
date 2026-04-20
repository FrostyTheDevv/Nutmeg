const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const { hasDJPermissions } = require('./dj');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Voice channel controls')
    .addSubcommand(s => s.setName('join').setDescription('Join your voice channel'))
    .addSubcommand(s => s.setName('leave').setDescription('Leave voice channel'))
    .addSubcommand(s => s.setName('move').setDescription('Move to your current voice channel')),

  async execute(interaction, client) {
    const memberVC = interaction.member?.voice?.channel;
    const sub = interaction.options.getSubcommand();

    if (sub === 'join' || sub === 'move') {
      if (!memberVC) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Not in Voice Channel"),
            t => t.setContent("Join a voice channel first!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const perms = memberVC.permissionsFor(interaction.client.user);
      if (!perms?.has(["Connect", "Speak"])) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Missing Permissions"),
            t => t.setContent("I need **Connect** and **Speak** permissions!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      try {
        let player = client.lavalink.getPlayer(interaction.guild.id);

        if (sub === 'move' && player) {
          if (!hasDJPermissions(interaction.member, interaction.guild.id)) {
            const cont = new ContainerBuilder()
              .setAccentColor(styles.Colors.DANGER)
              .addTextDisplayComponents(
                t => t.setContent("❌ Permission Denied"),
                t => t.setContent("You need the DJ role to move the bot!")
              );
            return interaction.reply({ 
              components: [cont], 
              flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
            });
          }
          
          await player.destroy();
          player = null;
        }

        if (!player) {
          player = await client.lavalink.createPlayer({
            guildId: interaction.guild.id,
            voiceChannelId: memberVC.id,
            textChannelId: interaction.channel.id,
            selfDeaf: true,
            volume: 80
          });
          await player.connect();
        }

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent(sub === 'move' ? "🔁 Moved" : "✅ Joined"),
            t => t.setContent(`${sub === 'move' ? 'Moved to' : 'Joined'} ${memberVC.name}`)
          );

        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });

      } catch (error) {
        console.error('Voice join error:', error);
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Error"),
            t => t.setContent(`Failed to join: ${error.message}`)
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }
    }

    if (sub === 'leave') {
      const player = client.lavalink.getPlayer(interaction.guild.id);
      
      if (!player || !player.connected) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("⚠️ Not Connected"),
            t => t.setContent("I'm not in a voice channel!")
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
            t => t.setContent("You need the DJ role to disconnect the bot!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const channelName = interaction.guild.channels.cache.get(player.voiceChannelId)?.name || "voice channel";
      
      try {
        await player.destroy();

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("👋 Left Voice Channel"),
            t => t.setContent(`Left ${channelName}`)
          );

        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });

      } catch (error) {
        console.error('Voice leave error:', error);
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Error"),
            t => t.setContent(`Failed to leave: ${error.message}`)
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }
    }
  }
};