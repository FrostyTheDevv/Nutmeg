require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('📋 Checking registered commands...\n');

    const globalCommands = await rest.get(
      Routes.applicationCommands(process.env.CLIENT_ID)
    );
    console.log(`🌍 Global commands: ${globalCommands.length}`);
    globalCommands.forEach(cmd => console.log(`  - ${cmd.name}`));
    console.log('');

    const guildIds = (process.env.GUILD_IDS || process.env.GUILD_ID || '').split(',').map(id => id.trim()).filter(id => id);
    
    for (const guildId of guildIds) {
      const guildCommands = await rest.get(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId)
      );
      console.log(`🏰 Guild ${guildId}: ${guildCommands.length} commands`);
      guildCommands.forEach(cmd => console.log(`  - ${cmd.name}`));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
