const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = class MusicPlayer {
  static getPlayer(client, guildId) {
    return client.lavalink.getPlayer(guildId);
  }

  static createControls(disabled = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('back').setEmoji('⏮').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('pause').setEmoji('⏯').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('skip').setEmoji('⏭').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('stop').setEmoji('⏹').setStyle(ButtonStyle.Danger).setDisabled(disabled),
      new ButtonBuilder().setCustomId('queue').setEmoji('📜').setStyle(ButtonStyle.Secondary)
    );
  }

  static hasDJRole(member, guild) {
    const djRole = guild.settings?.djRole;
    return djRole && member.roles.cache.has(djRole);
  }

  static formatTime(ms) {
    if (!ms || ms === 0) return 'Live';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static getTrackThumbnail(track) {
    let artworkUrl = track.info.artworkUrl;
    
    if (artworkUrl && artworkUrl.includes('vi_webp')) {
      artworkUrl = artworkUrl.replace('/vi_webp/', '/vi/').replace('.webp', '.jpg');
    }
    
    if (!artworkUrl && track.info.sourceName === 'youtube' && track.info.identifier) {
      artworkUrl = `https://i.ytimg.com/vi/${track.info.identifier}/hqdefault.jpg`;
    }
    
    if (!artworkUrl) {
      artworkUrl = 'https://i.imgur.com/6Fx5kQ5.png';
    }
    
    return artworkUrl;
  }
};