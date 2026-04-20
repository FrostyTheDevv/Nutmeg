const { 
  SlashCommandBuilder, 
  ContainerBuilder, 
  MessageFlags 
} = require("discord.js");
const { styles } = require('../components/builders');
const Genius = require("genius-lyrics");

const Client = new Genius.Client(process.env.GENIUS_API_KEY || "");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Get lyrics for a song')
    .addStringOption(o => 
      o.setName('query')
        .setDescription('Song name (uses current track if not provided)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });

    let query = interaction.options.getString('query');
    const player = client.lavalink.getPlayer(interaction.guild.id);
    const currentTrack = player?.queue?.current;

    let searchQuery;
    
    if (query) {
      searchQuery = query;
    } else if (currentTrack) {
      const artist = currentTrack.info.author || '';
      let title = currentTrack.info.title;
      
      title = title
        .replace(/\(Official Video\)/gi, '')
        .replace(/\(Official Music Video\)/gi, '')
        .replace(/\(Official Audio\)/gi, '')
        .replace(/\(Lyric Video\)/gi, '')
        .replace(/\(Lyrics\)/gi, '')
        .replace(/\[Official Video\]/gi, '')
        .replace(/\[Official Music Video\]/gi, '')
        .replace(/\[Official Audio\]/gi, '')
        .replace(/\[Lyric Video\]/gi, '')
        .replace(/\[Lyrics\]/gi, '')
        .replace(/\s+/g, ' ') 
      
      searchQuery = `${artist} ${title}`.trim();
    } else {
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.WARNING)
        .addTextDisplayComponents(
          t => t.setContent("⚠️ No Song Specified"),
          t => t.setContent("No song is currently playing and no query was provided.\nUse `/lyrics query:[song name]` to search for lyrics.")
        );
      return interaction.editReply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 
      });
    }

    try {
      const searches = await Client.songs.search(searchQuery);
      
      if (!searches || searches.length === 0) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("🔍 Lyrics Not Found"),
            t => t.setContent(`Could not find lyrics for **${searchQuery}**`)
          );
        return interaction.editReply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 
        });
      }

      const firstSong = searches[0];
      
      const lyrics = await firstSong.lyrics();
      
      if (!lyrics) {
        const cont = new ContainerBuilder()
          .setAccentColor(styles.Colors.WARNING)
          .addTextDisplayComponents(
            t => t.setContent("🔍 Lyrics Not Available"),
            t => t.setContent(`Lyrics not available for **${firstSong.title}** by ${firstSong.artist.name}`)
          );
        return interaction.editReply({ 
          components: [cont], 
          flags: MessageFlags.IsComponentsV2 
        });
      }

      const maxLength = 1800;
      const lyricsChunks = [];
      
      if (lyrics.length <= maxLength) {
        lyricsChunks.push(lyrics);
      } else {
        const lines = lyrics.split('\n');
        let currentChunk = '';
        
        for (const line of lines) {
          if ((currentChunk + line + '\n').length > maxLength) {
            if (currentChunk) lyricsChunks.push(currentChunk);
            currentChunk = line + '\n';
          } else {
            currentChunk += line + '\n';
          }
        }
        
        if (currentChunk) lyricsChunks.push(currentChunk);
      }

      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.PRIMARY)
        .addTextDisplayComponents(
          t => t.setContent(`📝 ${firstSong.title}`),
          t => t.setContent(`**Artist:** ${firstSong.artist.name}\n\n${lyricsChunks[0]}`),
          t => t.setContent(
            lyricsChunks.length > 1 
              ? `**Note:** Lyrics are too long to display in full. Showing part 1 of ${lyricsChunks.length}. [View full lyrics on Genius](${firstSong.url})`
              : `[View on Genius](${firstSong.url})`
          )
        );

      await interaction.editReply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 
      });

    } catch (error) {
      console.error('Lyrics command error:', error);
      const cont = new ContainerBuilder()
        .setAccentColor(styles.Colors.DANGER)
        .addTextDisplayComponents(
          t => t.setContent("❌ Error"),
          t => t.setContent(`Failed to fetch lyrics: ${error.message}`)
        );
      await interaction.editReply({ 
        components: [cont], 
        flags: MessageFlags.IsComponentsV2 
      });
    }
  }
};