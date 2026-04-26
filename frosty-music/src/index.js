require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { LavalinkManager } = require('lavalink-client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const LAVALINK_HOST = process.env.LAVALINK_HOST || '127.0.0.1';
const LAVALINK_PORT = parseInt(process.env.LAVALINK_PORT) || 2333;
const LAVALINK_PASSWORD = process.env.LAVALINK_PASS || process.env.LAVALINK_PASSWORD || 'youshallnotpass';
const AUTO_START_LAVALINK = process.env.LAVALINK_AUTOSTART !== '0';
async function checkLavalink() {
  return new Promise((resolve) => {
    const req = http.get(`http://${LAVALINK_HOST}:${LAVALINK_PORT}/version`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startLavalink() {
  const LAVALINK_PATH = path.join(__dirname, '..', '..', 'lavalink');
  const LAVALINK_JAR = path.join(LAVALINK_PATH, 'Lavalink.jar');
  
  if (!fs.existsSync(LAVALINK_JAR)) {
    console.error('❌ Lavalink.jar not found at:', LAVALINK_JAR);
    console.log('⚠️  Continuing without local Lavalink...');
    return false;
  }

  console.log('🚀 Starting Lavalink v4.2.0 with DAVE support...');
  
  const lavalink = spawn('java', [
    '-Xmx1G',
    '-jar', 
    'Lavalink.jar'
  ], {
    cwd: LAVALINK_PATH,
    stdio: 'inherit',
    shell: true,
    detached: false
  });

  return new Promise((resolve) => {
    let resolved = false;
    
    lavalink.on('error', (err) => {
      console.error('❌ Failed to start Lavalink:', err.message);
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('✅ Lavalink starting in background...');
        resolve(true);
      }
    }, 30000);
  });
}

if (AUTO_START_LAVALINK && LAVALINK_HOST === '127.0.0.1') {
  (async () => {
    const isRunning = await checkLavalink();
    if (!isRunning) {
      await startLavalink();
      console.log('⏳ Waiting for Lavalink HTTP endpoint...');
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const ready = await checkLavalink();
        if (ready) {
          console.log('✅ Lavalink HTTP endpoint ready!');
          break;
        }
        if (i === 29) {
          console.error('❌ Lavalink endpoint timeout');
        }
      }
    } else {
      console.log('✅ Lavalink already running');
    }
    
    console.log(`🔌 Connecting to Lavalink: ${LAVALINK_HOST}:${LAVALINK_PORT}`);
    initializeBot();
  })();
} else {
  console.log(`🔌 Connecting to Lavalink: ${LAVALINK_HOST}:${LAVALINK_PORT}`);
  initializeBot();
}

function initializeBot() {

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.commandIds = new Map();

client.on('raw', (d) => {
  if (d.t === 'VOICE_STATE_UPDATE' || d.t === 'VOICE_SERVER_UPDATE') {
    console.log(`📡 Voice event: ${d.t} for guild ${d.d?.guild_id || 'unknown'}`, JSON.stringify(d.d || {}));
  }
  if (client.lavalink) {
    client.lavalink.sendRawData(d);
  } else {
    console.warn('⚠️ Lavalink manager not initialized yet, skipping raw event');
  }
});

client.lavalink = new LavalinkManager({
  nodes: [{
    authorization: LAVALINK_PASSWORD,
    host: LAVALINK_HOST,
    port: LAVALINK_PORT,
    id: process.env.LAVALINK_NODE_ID || 'Main-Node',
    secure: process.env.LAVALINK_SECURE === 'true',
    retryAmount: 15,
    retryDelay: 5000,
  }],
  sendToShard: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    console.log(`📤 sendToShard called: guild=${guildId}, hasGuild=${!!guild}, op=${payload?.op}, d=${JSON.stringify(payload?.d || {})}`);
    if (guild) {
      guild.shard.send(payload);
      console.log(`✅ Sent payload to shard for guild ${guildId}`);
    } else {
      console.error(`❌ Guild ${guildId} not found in cache!`);
    }
  },
  client: { 
    id: process.env.CLIENT_ID, 
    username: process.env.LAVALINK_CLIENT_NAME || 'MusicBot' 
  },
  autoSkip: true,
  autoMove: true,
  playerOptions: {
    clientBasedPositionUpdateInterval: 150,
    defaultSearchPlatform: 'ytsearch',
    volumeDecrementer: 1,
    onDisconnect: { autoReconnect: true, destroyPlayer: false },
    onEmptyQueue: { destroyAfterMs: 300000 },
    useUnresolvedData: true,
    voiceChannelOptions: {
      selfDeaf: true,
      selfMute: false
    }
  },
  queueOptions: { maxPreviousTracks: 25 },
});

function is247Enabled(guildId) {
  const dbPath = path.join(__dirname, 'db', `${guildId}.json`);
  if (!fs.existsSync(dbPath)) return false;
  
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data.settings?.['247'] || false;
  } catch (error) {
    console.error('Error reading 24/7 status:', error);
    return false;
  }
}

client.lavalink
  .on('playerCreate', (player) => {
    console.log(`👤 Player created for guild ${player.guildId}`);
    console.log(`🔊 Initial state: voiceChannel=${player.voiceChannelId}, textChannel=${player.textChannelId}`);
  })
  .on('playerDestroy', (player) => {
    console.log(`💀 Player destroyed for guild ${player.guildId}`);
  })
  .on('trackStart', (player, track) => {
    console.log(`🎵 Track started: ${track.info.title} in ${player.guildId}`);
    console.log(`🔊 Voice state: connected=${player.connected}, voiceChannel=${player.voiceChannelId}`);
  })
  .on('trackEnd', (player, track, payload) => {
    console.log(`⏹️ Track ended: ${track.info.title} - Reason: ${payload.reason}`);
    if (payload.reason === 'loadFailed') {
      console.error('❌ Track failed to load - check Lavalink logs for details');
      
      const channel = client.channels.cache.get(player.textChannelId);
      if (channel && track.info.sourceName === 'youtube') {
        channel.send({
          embeds: [{
            color: 0xff0000,
            title: '⚠️ YouTube Track Failed',
            description: `**${track.info.title}** failed to load due to YouTube bot detection.\n\n💡 **Tip:** Use Spotify links for better reliability!`,
            footer: { text: 'Automatically skipping to next track...' }
          }]
        }).catch(() => {});
      }
    }
  })
  .on('trackStuck', (player, track) => {
    console.error(`⚠️ Track stuck: ${track.info.title}`);
  })
  .on('trackError', (player, track, err) => {
    console.error(`❌ Track error: ${track.info.title}`, err.exception?.message);
  })
  .on('playerMove', (player, oldChannel, newChannel) => {
    console.log(`🔀 Player moved from ${oldChannel} to ${newChannel} in guild ${player.guildId}`);
  })
  .on('playerDisconnect', (player, voiceChannelId) => {
    console.log(`🔌 Player disconnected from channel ${voiceChannelId} in guild ${player.guildId}`);
  })
  .on('nodeConnect', (node) => {
    console.log(`✅ Lavalink node ${node.options.id} connected`);
  })
  .on('nodeDisconnect', (node, reason) => {
    console.warn(`⚠️ Lavalink node ${node.options.id} disconnected:`, reason?.code || 'Unknown reason');
  })
  .on('nodeReconnect', (node) => {
    console.log(`🔄 Lavalink node ${node.options.id} reconnecting...`);
  })
  .on('nodeError', (node, error) => {
    console.error(`❌ Lavalink node ${node.options.id} error:`, error.message || error);
  })
  .on('playerUpdate', (player) => {
    console.log(`🔄 Player update: guild=${player.guildId}, connected=${player.connected}, playing=${player.playing}`);
  })
  .on('playerSocketClosed', (player, payload) => {
    console.error(`⚠️ Voice socket closed for guild ${player.guildId}:`, payload);
  })
  .on('queueEnd', (player, track, payload) => {
    console.log(`Queue ended in guild ${player.guildId}`);
    
    const is247 = is247Enabled(player.guildId) || player.data?.['247'];
    
    if (is247) {
      console.log(`24/7 mode enabled for ${player.guildId} - staying connected`);
      return;
    }
    
    const channel = client.channels.cache.get(player.textChannelId);
    if (channel) {
      const wasFailed = payload?.reason === 'loadFailed';
      channel.send({
        embeds: [{
          color: wasFailed ? 0xff0000 : 0xffa500,
          title: wasFailed ? '⚠️ All Tracks Failed' : '🎵 Queue Finished',
          description: wasFailed 
            ? 'All tracks failed to load due to YouTube restrictions.\n\n💡 **Try using Spotify links instead!**\nExample: `/play https://open.spotify.com/track/...`'
            : 'No more tracks to play! Add more songs with `/play`',
        }]
      }).catch(() => {});
    }
    
    setTimeout(() => {
      const stillNot247 = !is247Enabled(player.guildId) && !player.data?.['247'];
      if (stillNot247 && player.connected) {
        console.log(`Leaving voice channel in ${player.guildId} - queue empty`);
        player.destroy();
      }
    }, 30000);
  })
  .on('playerDisconnect', (player, voiceChannelId) => {
    console.log(`Player disconnected from ${voiceChannelId} in ${player.guildId}`);
  })
  .on('playerCreate', (player) => {
    console.log(`Player created for guild ${player.guildId}`);
  })
  .on('playerDestroy', (player) => {
    console.log(`Player destroyed for guild ${player.guildId}`);
  });

function formatTime(ms) {
  if (!ms || ms === 0) return 'Live';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  fs.readdirSync(commandsPath)
    .filter(f => f.endsWith('.js'))
    .forEach(file => {
      try {
        const command = require(path.join(commandsPath, file));
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          console.log(`Loaded command: ${command.data.name}`);
        }
      } catch (e) { 
        console.error(`Failed to load ${file}:`, e); 
      }
    });
}

async function deployCommands() {
  const commands = [];
  
  client.commands.forEach(command => {
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  });

  if (commands.length === 0) {
    console.log('No commands to deploy');
    return;
  }

  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    console.log(`🔄 Deploying ${commands.length} slash commands...`);

    const guildIds = process.env.GUILD_IDS || process.env.GUILD_ID;
    
    if (guildIds) {
      const guilds = guildIds.split(',').map(id => id.trim()).filter(id => id);
      console.log(`📋 Deploying to ${guilds.length} guild(s)...`);
      
      for (const guildId of guilds) {
        const data = await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
          { body: commands }
        );
        console.log(`✅ Successfully deployed ${data.length} commands to guild ${guildId}`);
        
        data.forEach(cmd => {
          client.commandIds.set(cmd.name, cmd.id);
        });
      }
    } else {
      const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ Successfully deployed ${data.length} global commands`);
      
      data.forEach(cmd => {
        client.commandIds.set(cmd.name, cmd.id);
      });
    }
    
    console.log(`📝 Stored ${client.commandIds.size} command IDs`);
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

client.once('clientReady', async () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
  
  await deployCommands();
  
  await client.lavalink.init({ ...client.user, shards: 'auto' });
  client.lavalink.nodeManager.on('error', (node, error) => {
    console.error(`❌ Lavalink Node ${node.options.id} error:`, error.message);
  });

  console.log('🎵 Lavalink initialized and connected');
  
  client.user.setActivity('/shrmurdaaa', { type: 0 });
});

const commandAliases = new Map([
  ['p', 'play'],
  ['q', 'queue'],
  ['v', 'volume'],
  ['vol', 'volume'],
  ['l', 'loop'],
  ['np', 'queue'],
  ['clear', 'queue'],
  ['shuffle', 'queue'],
]);

const playbackActions = new Map([
  ['skip', 'skip'],
  ['s', 'skip'],
  ['pause', 'pause'],
  ['resume', 'resume'],
  ['stop', 'stop'],
  ['back', 'back'],
  ['previous', 'back'],
  ['forward', 'forward'],
  ['ff', 'forward'],
  ['rewind', 'rewind'],
  ['rw', 'rewind'],
]);

function convertComponentsV2ToEmbed(payload) {
  const newPayload = {
    embeds: [],
    components: []
  };
  
  if (!payload.components || !Array.isArray(payload.components)) {
    return payload;
  }
  
  for (const component of payload.components) {
    if (component.type === 2) {
      try {
        const container = component.data || component;
        const embed = {
          color: container.accent_color || 0x5865F2
        };
        
        if (container.components && Array.isArray(container.components)) {
          const texts = [];
          
          for (const child of container.components) {
            if (child.type === 0 && child.components) {
              for (const textComp of child.components) {
                if (textComp.text) {
                  texts.push(textComp.text);
                } else if (textComp.content) {
                  texts.push(textComp.content);
                }
              }
            }
            else if (child.type === 1) {
              newPayload.components.push(child);
            }
          }
          
          if (texts.length > 0) {
            embed.title = texts[0];
            if (texts.length > 1) {
              embed.description = texts.slice(1).join('\n\n');
            }
          }
        }
        
        if (container.thumbnail_url) {
          embed.thumbnail = { url: container.thumbnail_url };
        } else if (container.thumbnail && container.thumbnail.url) {
          embed.thumbnail = { url: container.thumbnail.url };
        }
        
        if (embed.title || embed.description) {
          newPayload.embeds.push(embed);
        }
      } catch (err) {
        console.error('Error parsing ContainerBuilder:', err);
      }
    }
    else if (component.type === 1) {
      newPayload.components.push(component);
    }
  }
  
  if (newPayload.components.length === 0) {
    delete newPayload.components;
  }
  if (newPayload.embeds.length === 0) {
    delete newPayload.embeds;
  }
  
  return newPayload;
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  
  const content = message.content;
  if (!content.startsWith('N!') && !content.startsWith('n!')) return;

  const args = content.slice(2).trim().split(/ +/);
  const originalCommand = args.shift()?.toLowerCase();
  if (!originalCommand) return;

  let commandName = originalCommand;
  let playbackAction = null;

  if (playbackActions.has(originalCommand)) {
    commandName = 'playback';
    playbackAction = playbackActions.get(originalCommand);
  } else if (commandAliases.has(originalCommand)) {
    commandName = commandAliases.get(originalCommand);
  }

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    const mockInteraction = {
      guild: message.guild,
      member: message.member,
      channel: message.channel,
      user: message.author,
      client: client,
      replied: false,
      deferred: false,
      
      deferReply: async (options) => {
        mockInteraction.deferred = true;
        if (!options?.ephemeral) {
          mockInteraction.loadingMsg = await message.channel.send('⏳ Loading...');
        }
        return mockInteraction.loadingMsg;
      },
      
      reply: async (payload) => {
        mockInteraction.replied = true;
        mockInteraction.deferred = false;
        
        const convertedPayload = convertComponentsV2ToEmbed(payload);
        
        if (mockInteraction.loadingMsg) {
          return await mockInteraction.loadingMsg.edit(convertedPayload).catch(err => {
            console.error('Failed to edit loading message:', err);
            return message.channel.send(convertedPayload);
          });
        }
        return await message.channel.send(convertedPayload);
      },
      
      editReply: async (payload) => {
        mockInteraction.replied = true;
        
        const convertedPayload = convertComponentsV2ToEmbed(payload);
        
        if (mockInteraction.loadingMsg) {
          return await mockInteraction.loadingMsg.edit(convertedPayload).catch(err => {
            console.error('Failed to edit reply:', err);
            return message.channel.send(convertedPayload);
          });
        }
        return await message.channel.send(convertedPayload);
      },
      
      fetchReply: async () => {
        return mockInteraction.loadingMsg || message;
      },
      
      options: {
        getString: (name) => args.join(' ') || '',
        getInteger: (name) => parseInt(args[0]) || null,
        getSubcommand: () => args[0] || 'view',
      }
    };

    if (commandName === 'play') {
      mockInteraction.options.getString = () => args.join(' ') || '';
    } else if (commandName === 'playback') {
      const action = playbackAction || args[0]?.toLowerCase() || 'pause';
      mockInteraction.options.getSubcommand = () => action;
      mockInteraction.options.getInteger = () => parseInt(args[playbackAction ? 0 : 1]) || 10;
    } else if (commandName === 'volume') {
      if (args.length === 0) {
        mockInteraction.options.getSubcommand = () => 'show';
      } else {
        const subcommand = args[0]?.toLowerCase();
        if (['up', 'down', 'show'].includes(subcommand)) {
          mockInteraction.options.getSubcommand = () => subcommand;
        } else if (!isNaN(parseInt(subcommand))) {
          mockInteraction.options.getSubcommand = () => 'set';
          mockInteraction.options.getInteger = () => parseInt(subcommand);
        } else {
          mockInteraction.options.getSubcommand = () => 'set';
          mockInteraction.options.getInteger = () => parseInt(args[1]) || 80;
        }
      }
    } else if (commandName === 'loop') {
      const mode = args[0]?.toLowerCase() || 'off';
      mockInteraction.options.getString = () => mode;
    } else if (commandName === 'queue') {
      if (originalCommand === 'clear') {
        mockInteraction.options.getSubcommand = () => 'clear';
      } else if (originalCommand === 'shuffle') {
        mockInteraction.options.getSubcommand = () => 'shuffle';
      } else {
        mockInteraction.options.getSubcommand = () => args[0] || 'view';
      }
    }

    await command.execute(mockInteraction, client);
  } catch (err) {
    console.error(`Prefix command error ${commandName}:`, err);
    message.channel.send({
      embeds: [{
        color: 0xff0000,
        title: '❌ Command Error',
        description: `Something went wrong: ${err.message}`
      }]
    }).catch(() => {});
  }
});

client.on('interactionCreate', async i => {
  if (i.isButton()) {
    if (i.customId === 'help_refresh') {
      const helpCommand = client.commands.get('help');
      if (helpCommand) {
        await helpCommand.execute(i, client);
      }
      return;
    }
    
    if (i.customId === 'help_support') {
      const { ContainerBuilder, MessageFlags } = require('discord.js');
      const { styles } = require('./components/builders');
      
      const supportContainer = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addTextDisplayComponents(
          t => t.setContent("**❓ Need Help?**"),
          t => t.setContent(
            "**Common Issues:**\n" +
            "• Make sure you're in a voice channel\n" +
            "• Bot needs 'Connect' and 'Speak' permissions\n" +
            "• Check if bot is online and connected\n\n" +
            "**Support:**\n" +
            "• GitHub: https://github.com/FrostyTheDevv/Nutmeg\n" +
            "• Use `/play <song>` to start playing music\n" +
            "• Use `/queue` to view current queue"
          )
        );
      
      await i.update({ 
        components: [supportContainer], 
        flags: MessageFlags.IsComponentsV2 
      });
      return;
    }
  }
  
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  
  try {
    await cmd.execute(i, client);
  } catch (err) {
    console.error(`Command error ${i.commandName}:`, err);
    const payload = { 
      embeds: [{ 
        color: 0xff0000, 
        title: 'Command Error', 
        description: 'Something went wrong!' 
      }], 
      ephemeral: true 
    };
    
    if (!i.replied && !i.deferred) {
      await i.reply(payload).catch(() => {});
    } else if (i.deferred) {
      await i.editReply(payload).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Login failed:', err);
  process.exit(1);
});

  } 