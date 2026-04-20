require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  });

  return results;
}

const commandFiles = walkDir(commandsPath);

for (const file of commandFiles) {
  try {
    const command = require(file);
    if (command.data?.name) {
      commands.push(command.data.toJSON());
      console.log(`Registered: ${command.data.name}`);
    }
  } catch (err) {
    console.error(`Failed to load command from ${file}:`, err.message);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash command(s)...`);

    const guildIds = process.env.GUILD_IDS || process.env.GUILD_ID;
    
    if (guildIds) {
      const guilds = guildIds.split(',').map(id => id.trim()).filter(id => id);
      console.log(`Deploying to ${guilds.length} guild(s)...`);
      
      for (const guildId of guilds) {
        const data = await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        );
        console.log(`✅ Successfully deployed ${data.length} commands to guild ${guildId}`);
      }
    } else {
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} command(s) globally.`);
    }
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
})();