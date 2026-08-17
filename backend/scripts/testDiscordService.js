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
  return Response.json({ message: 'Unexpected test request' }, { status: 404 });
};

const {
  deleteDiscordChannel,
  getDiscordChannelMetadata,
  provisionDiscordChannel,
  setDiscordChannelMetadata,
} = await import('../src/services/discordService.js');

const provisioned = await provisionDiscordChannel({ id: 'match-12345678' });
assert.equal(provisioned?.channelId, 'voice-channel-1');
assert.equal(provisioned?.inviteUrl, 'https://discord.gg/local-invite');

const createBody = JSON.parse(calls[0].init.body);
const inviteBody = JSON.parse(calls[1].init.body);
assert.equal(createBody.type, 2);
assert.equal(createBody.user_limit, 2);
assert.equal(inviteBody.max_uses, 2);
assert.equal(inviteBody.unique, true);

const filters = setDiscordChannelMetadata({ player1: { region: 'LAN' } }, {
  channelId: provisioned.channelId,
  expiresAt: provisioned.expiresAt,
});
assert.equal(getDiscordChannelMetadata({ filters })?.channelId, 'voice-channel-1');
assert.equal(await deleteDiscordChannel('voice-channel-1'), true);

console.log('DISCORD_SERVICE_TEST_OK');
