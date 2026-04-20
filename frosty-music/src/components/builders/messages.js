const { ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Emojis } = require('../utils/styles');

const errorMessage = (error, dismissable = true) => {
  const container = new ContainerBuilder().setAccentColor(Colors.ERROR);

  container.addTextDisplayComponents((text) =>
    text.setContent(`${Emojis.ERROR} **Error**\n${error}`)
  );

  if (dismissable) {
    container.addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId('error_dismiss')
          .setLabel('Dismiss')
          .setStyle(ButtonStyle.Danger)
      )
    );
  }

  return container;
};

const successMessage = (message, title = null) => {
  const container = new ContainerBuilder().setAccentColor(Colors.SUCCESS);

  const content = title
    ? `${Emojis.SUCCESS} **${title}**\n${message}`
    : `${Emojis.SUCCESS} ${message}`;

  container.addTextDisplayComponents((text) =>
    text.setContent(content)
  );

  return container;
};

const warningMessage = (message, title = 'Warning') => {
  const container = new ContainerBuilder().setAccentColor(Colors.WARNING);

  container.addTextDisplayComponents((text) =>
    text.setContent(`${Emojis.WARNING} **${title}**\n${message}`)
  );

  return container;
};

const infoMessage = (message, title = 'Info') => {
  const container = new ContainerBuilder().setAccentColor(Colors.INFO);

  container.addTextDisplayComponents((text) =>
    text.setContent(`${Emojis.INFO} **${title}**\n${message}`)
  );

  return container;
};

module.exports = {
  errorMessage,
  successMessage,
  warningMessage,
  infoMessage,
};