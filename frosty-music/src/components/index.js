const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

client.player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25,
    liveBuffer: 4000,
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
  },
  connectionDefaults: {
    volume: 0.7,
  },
});

client.player.on('error', (queue, error) => {
  console.error(`Player error: ${error.message}`);
  queue.metadata.channel.send('Audio error—skipping.');
  queue.node.skip();
});

client.player.on('trackError', (queue, error, track) => {
  console.error(`Track error for ${track.title}: ${error.message}`);
  queue.metadata.channel.send('Track failed—skipping.');
  queue.node.skip();
});

client.player.on('playerError', (queue, error) => {
  console.error(`Player extraction error: ${error.message}`);
  queue.metadata.channel.send('Extraction failed—skipping bad track.');
  queue.node.skip();
});

const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.player.extractors.loadMulti(DefaultExtractors);
  console.log('Extractors loaded—YouTube/Spotify ready');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: 'Command error!', ephemeral: true };
    if (interaction.deferred) {
      await interaction.editReply(reply).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);