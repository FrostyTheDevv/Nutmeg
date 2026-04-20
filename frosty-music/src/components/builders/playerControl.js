const { ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Emojis } = require('../utils/styles');

const playerControl = (player) => {
  if (!player) {
    return new ContainerBuilder()
      .setAccentColor(Colors.ERROR)
      .addTextDisplayComponents((text) =>
        text.setContent(`${Emojis.ERROR} No active player`)
      );
  }

  const isPlaying = player.playing;
  const volume = Math.round((player.volume / 100) * 100);
  const loop = player.loop || 0;

  const container = new ContainerBuilder().setAccentColor(Colors.PRIMARY);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music_back')
      .setEmoji(Emojis.BACK)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(isPlaying ? 'music_pause' : 'music_resume')
      .setEmoji(isPlaying ? Emojis.PAUSE : Emojis.PLAY)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_skip')
      .setEmoji(Emojis.SKIP)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_stop')
      .setEmoji(Emojis.STOP)
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music_volume_down')
      .setLabel('Vol -')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_volume_display')
      .setLabel(`${volume}%`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('music_volume_up')
      .setLabel('Vol +')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_loop')
      .setEmoji(Emojis.LOOP)
      .setStyle(loop > 0 ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  container.addActionRowComponents(() => row1);
  container.addActionRowComponents(() => row2);

  return container;
};

module.exports = playerControl;