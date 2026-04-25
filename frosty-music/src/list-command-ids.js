require('dotenv').config();
const { REST, Routes } = require('discord.js');

async function listCommandIds() {
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    const guildIds = process.env.GUILD_IDS || process.env.GUILD_ID;
    
    console.log('📝 Fetching Command IDs...\n');
    
    if (guildIds) {
      const guilds = guildIds.split(',').map(id => id.trim()).filter(id => id);
      
      for (const guildId of guilds) {
        console.log(`\n🏰 Guild: ${guildId}`);
        const commands = await rest.get(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId)
        );
        
        commands.forEach(cmd => {
          console.log(`  /${cmd.name} → ID: ${cmd.id}`);
          console.log(`  Mention: </${cmd.name}:${cmd.id}>\n`);
        });
      }
    } else {
      console.log('🌍 Global Commands:');
      const commands = await rest.get(
        Routes.applicationCommands(process.env.CLIENT_ID)
      );
      
      commands.forEach(cmd => {
        console.log(`  /${cmd.name} → ID: ${cmd.id}`);
        console.log(`  Mention: </${cmd.name}:${cmd.id}>\n`);
      });
    }
    
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listCommandIds();
