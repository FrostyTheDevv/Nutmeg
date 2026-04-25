const { 
  SlashCommandBuilder, 
  ContainerBuilder,
  MessageFlags 
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
    return { favorites: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error reading guild DB:', error);
    return { favorites: {} };
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

function getUserFavorites(guildId, userId) {
  const db = getGuildDB(guildId);
  return db.favorites[userId] || [];
}

function addFavorite(guildId, userId, track) {
  const db = getGuildDB(guildId);
  if (!db.favorites[userId]) {
    db.favorites[userId] = [];
  }
  
  const exists = db.favorites[userId].some(fav => fav.url === track.url);
  if (!exists) {
    db.favorites[userId].push({
      title: track.title,
      artist: track.artist,
      url: track.url,
      addedAt: Date.now()
    });
    saveGuildDB(guildId, db);
    return true;
  }
  return false;
}

function removeFavorite(guildId, userId, url) {
  const db = getGuildDB(guildId);
  if (!db.favorites[userId]) return false;
  
  const initialLength = db.favorites[userId].length;
  db.favorites[userId] = db.favorites[userId].filter(fav => fav.url !== url);
  
  if (db.favorites[userId].length < initialLength) {
    saveGuildDB(guildId, db);
    return true;
  }
  return false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('favs')
    .setDescription('Manage your favorite songs')
    .addSubcommand(s => s.setName('add').setDescription('Add current song to favorites'))
    .addSubcommand(s => s.setName('remove').setDescription('Remove current song from favorites'))
    .addSubcommand(s => s.setName('list').setDescription('Show your favorite songs'))
    .addSubcommand(s => s.setName('play').setDescription('Play all your favorites'))
    .addSubcommand(s => s.setName('clear').setDescription('Clear all your favorites')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const player = client.lavalink.getPlayer(guildId);
      const currentTrack = player?.queue?.current;

      if (!currentTrack) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("⚠️ No Song Playing"),
            t => t.setContent("There's no song currently playing to add to favorites!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const track = {
        title: currentTrack.info.title,
        artist: currentTrack.info.author || 'Unknown Artist',
        url: currentTrack.info.uri
      };

      const added = addFavorite(guildId, userId, track);

      const cont = new ContainerBuilder()
        .setAccentColor(added ? styles.Colors.SUCCESS : styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent(added ? "💖 Added to Favorites" : "⚠️ Already Favorited"),
          t => t.setContent(
            added 
              ? `Added **${track.title}** by ${track.artist} to your favorites`
              : `**${track.title}** is already in your favorites`
          )
        );

      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    if (sub === 'remove') {
      const player = client.lavalink.getPlayer(guildId);
      const currentTrack = player?.queue?.current;

      if (!currentTrack) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("⚠️ No Song Playing"),
            t => t.setContent("There's no song currently playing to remove from favorites!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const removed = removeFavorite(guildId, userId, currentTrack.info.uri);

      const cont = new ContainerBuilder()
        .setAccentColor(removed ? styles.Colors.SUCCESS : styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent(removed ? "💔 Removed from Favorites" : "⚠️ Not in Favorites"),
          t => t.setContent(
            removed 
              ? `Removed **${currentTrack.info.title}** from your favorites`
              : `**${currentTrack.info.title}** is not in your favorites`
          )
        );

      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    if (sub === 'list') {
      const favorites = getUserFavorites(guildId, userId);

      if (favorites.length === 0) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("📭 No Favorites"),
            t => t.setContent("You haven't added any songs to your favorites yet!\nUse `/favs add` while a song is playing to add it.")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const displayFavs = favorites.slice(0, 15);
      const list = displayFavs.map((fav, i) => 
        `**${i + 1}.** [${fav.title}](${fav.url})\n👤 ${fav.artist}`
      ).join('\n\n');

      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addTextDisplayComponents(
          t => t.setContent(`💖 Your Favorites (${favorites.length} song${favorites.length === 1 ? '' : 's'})`),
          t => t.setContent(list),
          t => t.setContent(
            favorites.length > 15 
              ? `*...and ${favorites.length - 15} more. Use \`/favs play\` to queue all favorites*`
              : `Use \`/favs play\` to play all your favorites!`
          )
        );

      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }

    if (sub === 'play') {
      const favorites = getUserFavorites(guildId, userId);

      if (favorites.length === 0) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("📭 No Favorites"),
            t => t.setContent("You don't have any favorites to play!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const vc = interaction.member.voice.channel;
      if (!vc) {
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

      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });

      try {
        let player = client.lavalink.getPlayer(guildId);

        if (!player) {
          player = await client.lavalink.createPlayer({
            guildId: guildId,
            voiceChannelId: vc.id,
            textChannelId: interaction.channel.id,
            selfDeaf: true,
            volume: 100,
            vcRegion: vc.rtcRegion
          });
          await player.connect();
        }

        let addedCount = 0;
        for (const fav of favorites) {
          try {
            const res = await player.search({ query: fav.url }, interaction.user);
            if (res?.tracks?.length > 0) {
              player.queue.add(res.tracks[0]);
              addedCount++;
            }
          } catch (err) {
            console.error(`Failed to load favorite: ${fav.title}`, err);
          }
        }

        if (addedCount === 0) {
          const cont = new ContainerBuilder()
            .setAccentColor(styles.Colors.DANGER)
            .addTextDisplayComponents(
              t => t.setContent("❌ Failed to Load"),
              t => t.setContent("Could not load any of your favorite songs")
            );
          return interaction.editReply({ 
            components: [cont], 
            flags: MessageFlags.IsComponentsV2 
          });
        }

        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.SUCCESS)
          .addTextDisplayComponents(
            t => t.setContent("💖 Playing Favorites"),
            t => t.setContent(`Added **${addedCount}** song${addedCount === 1 ? '' : 's'} from your favorites to the queue`)
          );

        await interaction.editReply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 
        });

        if (!player.playing && !player.paused) await player.play();

      } catch (error) {
        console.error('Favorites play error:', error);
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.DANGER)
          .addTextDisplayComponents(
            t => t.setContent("❌ Error"),
            t => t.setContent(`Failed to play favorites: ${error.message}`)
          );
        await interaction.editReply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 
        });
      }
    }

    if (sub === 'clear') {
      const favorites = getUserFavorites(guildId, userId);

      if (favorites.length === 0) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("📭 No Favorites"),
            t => t.setContent("You don't have any favorites to clear!")
          );
        return interaction.reply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
        });
      }

      const count = favorites.length;
      const db = getGuildDB(guildId);
      db.favorites[userId] = [];
      saveGuildDB(guildId, db);

      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.SUCCESS)
        .addTextDisplayComponents(
          t => t.setContent("🗑️ Favorites Cleared"),
          t => t.setContent(`Removed **${count}** song${count === 1 ? '' : 's'} from your favorites`)
        );

      return interaction.reply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral 
      });
    }
  }
};