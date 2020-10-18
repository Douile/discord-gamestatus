/*
discord-gamestatus: Game server monitoring via discord API
Copyright (C) 2019-2020 Douile

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
*/

const { MessageEmbed } = require('discord.js');

const { isAdmin } = require('../checks.js');

const WARNING = '_Changes will not take effect until after the status has updated_';

const statusIdentity = function(status) {
  return `${status.name} [\`${status.ip}\`] <${status.messageLink()}>`;
}

const call = async function(message) {
  const args = message.content.split(' ').splice(1);
  let statuses = message.client.updateCache.get(message.channel.id);
  if (statuses === undefined) {
    statuses = [];
  } else if (!Array.isArray(statuses)) {
    statuses = [statuses];
  }

  if (args.length > 0) {
    const index = parseInt(args[0].replace(/^#/,''));
    if (!isNaN(index) && index < statuses.length && index >= 0) {
      let status = statuses[index];
      if (args.length === 1) {
        await message.channel.send(new MessageEmbed({
          title: `#${index}`,
          description: statusIdentity(status),
          fields: Object.entries(status.getOptions()).map(s => {return {name: s[0], value: `\`\`\`json\n${JSON.stringify(s[1])}\n\`\`\``, inline: true }}),
          timestamp: Date.now()
        }));
      } else if (args.length === 2) {
        await status.deleteOption(message.client, args[1]);
        await message.channel.send(new MessageEmbed({
          title: `#${index}`,
          description: `${statusIdentity(status)}\nReset: \`${args[1]}\`\n${WARNING}`,
          timestamp: Date.now()
        }));
      } else {
        const value = args.splice(2).join(' ');
        await status.setOption(message.client, args[1], value);
        await message.channel.send(new MessageEmbed({
          title: `#${index}`,
          description: `${statusIdentity(status)}\nSet: \`${args[1]}=${status.getOption(args[1])}\`\n${WARNING}`,
          timestamp: Date.now()
        }));
      }
    } else {
      if (statuses.length === 0) {
        await message.channel.send(`There are no status messages in this channel`);
      } else {
        await message.channel.send(`Please enter a valid status ID (between 0 and ${statuses.length-1})`);
      }

    }
  } else {
    const fields = statuses.map((status, i) => {
      return {
        name: `#${i}`,
        value: statusIdentity(status),
        inline: false
      }
    });
    await message.channel.send(new MessageEmbed({
      title: `${fields.length} Active statuses`,
      fields: fields,
      timestamp: Date.now()
    }));
  }
}


const { FORMAT_PROPERTIES } = require('../constants.js');
exports.name = 'statusmod';
exports.call = call;
exports.check = isAdmin;
exports.help = `Modify status messages in the channel.\nUse cases:\n\
  - List statuses in current channel \`!statusmod\`\n\
  - Get status config \`!statusmod ID\` (e.g. \`!statusmod 0\`)\n\
  - Reset config option \`!statusmod ID option\` (e.g. \`!statusmod 0 title)\`\n\
  - Set config option \`statusmod ID option value\` (e.g. \`!statusmod 0 title Playing {map}\`)\n\
  Options will automatically be converted to the same type as seen when getting status options, this means for numbers you can do things like \`0xffe\` or \`2e3\`\n\
  When changing the title or description of an embed you can include formattable options that will be replaced with a value e.g. \`{validplayers}\` will be replaced with the number of players displayed in the embed\n\
  Full list of formattables: ${FORMAT_PROPERTIES.map(p => `\`{${p}}\``).join(', ')}`;
