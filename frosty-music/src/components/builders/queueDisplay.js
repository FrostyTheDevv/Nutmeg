const { ContainerBuilder, ActionRowBuilder, ButtonBuilder, TextDisplayBuilder } = require('discord.js');
const { Colors, Emojis, ButtonColors } = require('../utils/styles');
const { formatTime, bold, truncate } = require('../utils/formatting');

const queueDisplay = (player, page = 1) => {
  if (!player || !player.queue) {
    return new ContainerBuilder()
      .setAccentColor(Colors.WARNING)
      .addTextDisplayComponents((text) =>
        text.setContent(`${Emojis.QUEUE} Queue is empty`)
      );
  }

  const queue = player.queue || [];
  const itemsPerPage = 5;
  const totalPages = Math.ceil(queue.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageQueue = queue.slice(start, end);

  const container = new ContainerBuilder().setAccentColor(Colors.SECONDARY);

  const queueText = pageQueue
    .map((track, idx) => {
      const position = start + idx + 1;
      const title = truncate(track.info?.title || 'Unknown', 60);
      const duration = formatTime(track.duration || 0);
      return `${bold(`#${position}`)} ${title} ${duration}`;
    })
    .join('\n');

  container.addTextDisplayComponents(
    (text) => text.setContent(`${Emojis.QUEUE} **Queue** (${queue.length} songs)`),
    (text) => text.setContent(queueText || 'No songs in queue')
  );

  if (totalPages > 1) {
    container.addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId(`queue_prev_${page}`)
          .setLabel('◀')
          .setStyle(ButtonColors.SECONDARY)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId('queue_page')
          .setLabel(`${page}/${totalPages}`)
          .setStyle(ButtonColors.SECONDARY)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`queue_next_${page}`)
          .setLabel('▶')
          .setStyle(ButtonColors.SECONDARY)
          .setDisabled(page === totalPages)
      )
    );
  }

  return container;
};

module.exports = queueDisplay;