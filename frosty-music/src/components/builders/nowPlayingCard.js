const { ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { Colors, Emojis } = require('../utils/styles');
const { formatTime, progressBar, bold, italic, truncate } = require('../utils/formatting');

const nowPlayingCard = (player, track) => {
  if (!player || !track) {
    return new ContainerBuilder()
      .setAccentColor(Colors.WARNING)
      .addTextDisplayComponents((text) =>
        text.setContent(`${Emojis.INFO} No track currently playing`)
      );
  }

  const current = player.position || 0;
  const duration = track.duration || 0;
  const progress = progressBar(current, duration, 15);
  
  const artists = track.info?.author || 'Unknown Artist';
  const title = truncate(track.info?.title || 'Unknown Title', 100);
  const source = track.info?.sourceName || 'Unknown Source';

  const container = new ContainerBuilder().setAccentColor(Colors.PRIMARY);

  container.addSectionComponents((section) =>
    section
      .addTextDisplayComponents(
        (text) => text.setContent(bold(`${Emojis.MUSIC} ${title}`)),
        (text) => text.setContent(italic(artists))
      )
  );

  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addTextDisplayComponents(
    (text) => text.setContent(`${progress}`),
    (text) => text.setContent(`${Emojis.CLOCK} ${formatTime(current)} / ${formatTime(duration)}`)
  );

  container.addSeparatorComponents((sep) =>
    sep.setSpacing(SeparatorSpacingSize.Small).setDivider(false)
  );

  container.addTextDisplayComponents((text) =>
    text.setContent(`**Source:** ${source}`)
  );

  return container;
};

module.exports = nowPlayingCard;