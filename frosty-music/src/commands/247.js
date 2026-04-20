const { 
  SlashCommandBuilder, 
  ContainerBuilder,
  MessageFlags,
  PermissionsBitField 
} = require("discord.js");
const { styles } = require('../components/builders');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function getGuildDB(guildId) {
  const filePath = path.join(dbDir, `${guildId}.json`);
  if (!fs.existsSync(filePath)) {
    return { favorites: {}, settings: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error reading guild DB:', error);
    return { favorites: {}, settings: {} };
  }
}

function saveGuildDB(guildId, data) {
  const filePath = path.join(dbDir, `${guildId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving guild DB:', error);
  }
}

function get247Status(guildId) {
  const db = getGuildDB(guildId);
  return db.settings?.['247'] || false;
}

function set247Status(guildId, enabled) {
  const db = getGuildDB(guildId);
  if (!db.settings) db.settings = {};
  db.settings['247'] = enabled;
  saveGuildDB(guildId, db);
}

function is247Enabled(guildId) {
  return get247Status(guildId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('247')
    .setDescription('Toggle 24/7 mode (bot stays in voice channel)')
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Enable or disable 24/7 mode')
        .setRequired(true)
        .addChoices(
          { name: 'Enable - Stay in voice channel', value: 'on' },
          { name: 'Disable - Leave when queue ends', value: 'off' }
        )
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Missing Permission"),
          t => t.setContent("You need **Manage Server** permission to toggle 24/7 mode")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const player = client.lavalink.getPlayer(interaction.guild.id);
    
    if (!player || !player.connected) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent("⚠️ Not Connected"),
          t => t.setContent("I'm not currently in a voice channel. Use `/play` or `/voice join` first.")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const mode = interaction.options.getString('mode');
    const enabled = mode === 'on';
    const guildId = interaction.guild.id;

    try {
      set247Status(guildId, enabled);

      if (!player.data) player.data = {};
      player.data['247'] = enabled;

      const channelName = interaction.guild.channels.cache.get(player.voiceChannelId)?.name || 'voice channel';

      const cont = new ContainerBuilder()
        .setAccentColor(enabled ? styles.Colors.SUCCESS : styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent(enabled ? "🔒 24/7 Mode Enabled" : "🔓 24/7 Mode Disabled"),
          t => t.setContent(
            enabled 
              ? `I will now stay in **${channelName}** even when the queue is empty or everyone leaves.\n\n` +
                `**Note:** To make me leave, use \`/voice leave\` or \`/247 off\``
              : `I will now leave **${channelName}** when the queue ends or everyone leaves.\n\n` +
                `This is the default behavior.`
          )
        );

      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('24/7 command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to toggle 24/7 mode: ${error.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  },

  is247Enabled,
  get247Status
};