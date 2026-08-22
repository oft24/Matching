import assert from 'node:assert/strict';

process.env.DISCORD_BOT_TOKEN = 'local-test-token';
process.env.DISCORD_GUILD_ID = 'guild-local-test';
process.env.DISCORD_CHANNEL_TTL_HOURS = '12';

const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  if (String(url).endsWith('/guilds/guild-local-test/channels')) {
    return Response.json({ id: 'voice-channel-1' }, { status: 201 });
  }
  if (String(url).endsWith('/channels/voice-channel-1/invites')) {
    return Response.json({ code: 'local-invite' }, { status: 200 });
  }
  if (String(url).endsWith('/channels/voice-channel-1') && init.method === 'DELETE') {
    return new Response(null, { status: 204 });
  }
  if (String(url).endsWith('/guilds/guild-local-test/members/discord-a') && init.method === 'PUT') {
    return new Response(null, { status: 204 });
  }
  return Response.json({ message: 'Unexpected test request' }, { status: 404 });
};

const {
  addDiscordGuildMember,
  deleteDiscordChannel,
  getDiscordChannelMetadata,
  provisionDiscordChannel,
  setDiscordChannelMetadata,
} = await import('../src/services/discordService.js');

const provisioned = await provisionDiscordChannel(
  { id: 'match-12345678' },
  { memberIds: ['discord-a', 'discord-b'], playerNames: ['Sofía', 'Marco'] },
);
assert.equal(provisioned?.channelId, 'voice-channel-1');
assert.equal(provisioned?.inviteUrl, 'https://discord.gg/local-invite');
assert.equal(provisioned?.privateFor, 2);

const createBody = JSON.parse(calls[0].init.body);
const inviteBody = JSON.parse(calls[1].init.body);
assert.equal(createBody.type, 2);
assert.equal(createBody.user_limit, 2);
assert.equal(createBody.name, 'duo-sofia-marco');
assert.equal(createBody.permission_overwrites.length, 3);
assert.deepEqual(createBody.permission_overwrites[0], {
  id: 'guild-local-test', type: 0, allow: '0', deny: '1024',
});
assert.equal(createBody.permission_overwrites[1].type, 1);
assert.equal(inviteBody.max_uses, 2);
assert.equal(inviteBody.unique, true);
assert.equal(await addDiscordGuildMember('discord-a', 'user-access-token'), true);
assert.equal(await provisionDiscordChannel({ id: 'incomplete' }, { memberIds: ['discord-a'] }), null);

const filters = setDiscordChannelMetadata({ player1: { region: 'LAN' } }, {
  channelId: provisioned.channelId,
  expiresAt: provisioned.expiresAt,
});
assert.equal(getDiscordChannelMetadata({ filters })?.channelId, 'voice-channel-1');
assert.equal(await deleteDiscordChannel('voice-channel-1'), true);

console.log('DISCORD_SERVICE_TEST_OK');
