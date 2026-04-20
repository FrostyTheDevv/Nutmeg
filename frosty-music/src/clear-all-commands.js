require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const guildIds = (process.env.GUILD_IDS || process.env.GUILD_ID || '').split(',').map(id => id.trim()).filter(id => id);
    
    console.log('🗑️  Clearing ALL commands from all guilds...\n');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Cleared global commands');

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: [] }
      );
      console.log(`✅ Cleared commands for guild ${guildId}`);
    }

    console.log('\n✅ All commands cleared!');
    console.log('Now run: node deploy-commands.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
