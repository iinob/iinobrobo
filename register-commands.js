const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
require('dotenv').config();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_KEY);
const serverID = process.env.TARGET_SERVER_ID;
const cheeseID = process.env.CHEESECORD_ID;
const adminServerID = process.env.ADMIN_SERVER_ID;
const botID = process.env.BOT_UID;

const commands = [
	{
		name: 'pimps',
		description: 'they live amongst us',
		"integration_types": [0,1],
		"contexts": [0,1,2]
	},
	{
		name: '8ball',
		description: 'the magical 8 ball from the dark web',
		"integration_types": [0,1],
		"contexts": [0,1,2]
	},
	{
		name: 'thatfeeling',
		description: 'the feeling of the day',
		"integration_types": [0,1],
		"contexts": [0,1,2]
	},
	{
		name: 'roulettestart',
		description: 'start roulette',
	},
	{
		name: 'rouletteend',
		description: 'end roulette'
	},
	{
		name: 'pickup',
		description: 'hashtag skib',
		"integration_types": [0,1],
		"contexts": [0,1,2]
	},
	{
		name: 'reactword',
		description: 'reacts with a word',
		options: [
			{
				name: "messageid",
				description: "message to react to",
				type: ApplicationCommandOptionType.String,
				required: true
			},
			{
				name: "messagecontent",
				description: "text to react with",
				type: ApplicationCommandOptionType.String,
				required: true
			}
		]
	}
];

const adminCommands = [
	{
		name: "messagesend",
		description: "sends a message in another server",
		options: [
			{
				name: "channelid",
				description: "channel to send in",
				type: ApplicationCommandOptionType.String,
				required: true
			},
			{
				name: "messagecontent",
				description: "message content",
				type: ApplicationCommandOptionType.String,
				required: true
			}
		]
	}
];

(async () => {
try {
	console.log("registering slash commands");
	await rest.put(Routes.applicationCommands(botID), { body: commands });
	await rest.put(Routes.applicationGuildCommands(botID, serverID), { body: commands });
	await rest.put(Routes.applicationGuildCommands(botID, cheeseID), { body: commands });
	await rest.put(Routes.applicationGuildCommands(botID, adminServerID), { body: adminCommands });
	console.log("done registering slash commands");
} catch (error) {
	console.log('error: ' + error);
}


})();
