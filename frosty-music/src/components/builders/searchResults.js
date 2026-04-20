const { ContainerBuilder, ActionRowBuilder, ButtonBuilder, SectionBuilder } = require('discord.js');
const { Colors, Emojis, ButtonColors } = require('../utils/styles');
const { formatTime, bold, italic, truncate } = require('../utils/formatting');

const searchResults = (results = [], query = '') => {
  if (!results || results.length === 0) {
    return new ContainerBuilder()
      .setAccentColor(Colors.WARNING)
      .addTextDisplayComponents((text) =>
        text.setContent(`${Emojis.WARNING} No results found for "${query}"`)
      );
  }

  const containers = [];
  const limit = Math.min(results.length, 10);

  for (let i = 0; i < limit; i++) {
    const track = results[i];
    const title = truncate(track.info?.title || 'Unknown', 80);
    const author = truncate(track.info?.author || 'Unknown', 60);
    const duration = formatTime(track.duration || 0);
    const source = track.info?.sourceName || 'Unknown';

    const container = new ContainerBuilder().setAccentColor(Colors.PRIMARY);

    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents(
          (text) => text.setContent(bold(`${i + 1}. ${title}`)),
          (text) => text.setContent(italic(`${author} • ${duration}`)),
          (text) => text.setContent(`${source}`)
        )
        .setButtonAccessory((btn) =>
          btn
            .setCustomId(`search_play_${i}`)
            .setLabel('Play')
            .setStyle(ButtonColors.SUCCESS)
        )
    );

    containers.push(container);
  }

  return containers;
};

const singleSearchResult = (track, index = 0) => {
  if (!track) {
    return new ContainerBuilder()
      .setAccentColor(Colors.ERROR)
      .addTextDisplayComponents((text) =>
        text.setContent(`${Emojis.ERROR} Invalid track`)
      );
  }

  const title = truncate(track.info?.title || 'Unknown', 100);
  const author = truncate(track.info?.author || 'Unknown', 80);
  const duration = formatTime(track.duration || 0);
  const source = track.info?.sourceName || 'Unknown';

  const container = new ContainerBuilder().setAccentColor(Colors.PRIMARY);

  container.addSectionComponents((section) =>
    section
      .addTextDisplayComponents(
        (text) => text.setContent(bold(title)),
        (text) => text.setContent(italic(`${author} • ${duration}`)),
        (text) => text.setContent(`${source}`)
      )
      .setButtonAccessory((btn) =>
        btn
          .setCustomId(`search_play_${index}`)
          .setLabel('Play')
          .setStyle(ButtonColors.SUCCESS)
      )
  );

  return container;
};

module.exports = {
  searchResults,
  singleSearchResult,
};