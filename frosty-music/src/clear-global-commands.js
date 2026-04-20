require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🗑️  Clearing all global commands...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );

    console.log('✅ Successfully cleared all global commands!');
    console.log('Commands will now only show in your specified guilds.');
  } catch (error) {
    console.error('❌ Failed to clear global commands:', error);
    process.exit(1);
  }
})();
