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

function getDJRole(guildId) {
  const db = getGuildDB(guildId);
  return db.settings?.djRoleId || null;
}

function setDJRole(guildId, roleId) {
  const db = getGuildDB(guildId);
  if (!db.settings) db.settings = {};
  db.settings.djRoleId = roleId;
  saveGuildDB(guildId, db);
}

function clearDJRole(guildId) {
  const db = getGuildDB(guildId);
  if (!db.settings) db.settings = {};
  delete db.settings.djRoleId;
  saveGuildDB(guildId, db);
}

function hasDJPermissions(member, guildId) {
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return true;
  }

  const djRoleId = getDJRole(guildId);
  if (!djRoleId) {
    return true;
  }

  return member.roles.cache.has(djRoleId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dj')
    .setDescription('Manage DJ role for music commands')
    .addSubcommand(sub =>
      sub
        .setName('setrole')
        .setDescription('Set the DJ role (restricts music commands to this role)')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role that can use music commands')
            .setRequired(true)
        )
    )
    .addSubcommand(sub => 
      sub.setName('clearrole')
        .setDescription('Remove DJ role restriction (everyone can use music commands)')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Show current DJ role settings')
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Missing Permission"),
          t => t.setContent("You need **Manage Server** permission to manage DJ settings")
        );
      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      if (sub === 'setrole') {
        const role = interaction.options.getRole('role');

        if (role.id === interaction.guild.id) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.WARNING)
            .addTextDisplayComponents(
              t => t.setContent("⚠️ Invalid Role"),
              t => t.setContent("You cannot set @everyone as the DJ role. Use `/dj clearrole` instead.")
            );
          return interaction.reply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
          });
        }

        setDJRole(guildId, role.id);

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("🎧 DJ Role Set"),
            t => t.setContent(
              `DJ role set to ${role}\n\n` +
              `Only members with this role (or administrators) can now use music commands.`
            )
          );

        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      if (sub === 'clearrole') {
        const currentRole = getDJRole(guildId);

        if (!currentRole) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.WARNING)
            .addTextDisplayComponents(
              t => t.setContent("⚠️ No DJ Role Set"),
              t => t.setContent("There is no DJ role currently set for this server")
            );
          return interaction.reply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
          });
        }

        clearDJRole(guildId);

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("🔓 DJ Role Cleared"),
            t => t.setContent("DJ role restriction has been removed. All members can now use music commands.")
          );

        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      if (sub === 'info') {
        const djRoleId = getDJRole(guildId);

        if (!djRoleId) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.INFO)
            .addTextDisplayComponents(
              t => t.setContent("ℹ️ DJ Role Info"),
              t => t.setContent(
                "**Status:** No DJ role set\n" +
                "**Access:** All members can use music commands\n\n" +
                "Use `/dj setrole` to restrict music commands to a specific role."
              )
            );
          return interaction.reply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
          });
        }

        const role = interaction.guild.roles.cache.get(djRoleId);
        const roleText = role ? role.toString() : `<@&${djRoleId}> (Role not found)`;

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.PRIMARY)
          .addTextDisplayComponents(
            t => t.setContent("🎧 DJ Role Info"),
            t => t.setContent(
              `**Status:** DJ role active\n` +
              `**Role:** ${roleText}\n` +
              `**Members:** ${role ? role.members.size : 'Unknown'}\n\n` +
              `Only members with this role or administrators can use music commands.`
            )
          );

        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

    } catch (error) {
      console.error('DJ command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to manage DJ role: ${error.message}`)
        );
      await interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  },

  hasDJPermissions
};