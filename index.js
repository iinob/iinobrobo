const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const app = express();
require('dotenv').config();
const server = http.createServer(app);
const cron = require('node-cron');
const wss = new WebSocket.Server({ server });
const {Client, IntentsBitField} = require('discord.js');
const { ActivityType } = require('discord.js')

const discordKey = process.env.DISCORD_KEY; // ok fine I made a .env
const channelID = process.env.CROSS_CHANNEL_CID;
const ownerID = process.env.OWNER_UID;
const dailyChannel = process.env.DAILY_CID;
const otherDailyChannel = process.env.SECONDARY_DAILY_CID;
const serverID = process.env.TARGET_SERVER_ID;

var messages = [];
var users = 0;

const outcomes = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy, try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Don't count on it", "My reply is no", "Outlook not so good", "Very doubtful", "KILL YOURSELF", "It is real in the subura", "Too deep in the files for you to know", "OH YEAH", "/gif https://media1.tenor.com/m/0Vn9kBbtblQAAAAd/simpsons-food.gif", "Sure why not", "Ms. Howe probably thinks so", "Use dataminer and try again", "Date a minor and try again", "Ok greasy gock gobbler", "Nop", "Go home", "It is as the gobumpulous has decided", "King biggy balls with me and I can't even lie", "Hit a seven, sure you're right", "It will get sticky"];
const feelings = ['https://media1.tenor.com/m/kkyVF17qvn8AAAAd/mario-super-mario.gif', 'https://tenor.com/view/that-monday-feeling-mario-luigi-gif-4870452924641132638', 'https://tenor.com/view/that-tuesday-feeling-mario-swag-dance-gif-159860540190894364', 'https://tenor.com/view/that-wednesday-feeling-mario-luigi-gif-17147220739757084890', 'https://tenor.com/view/that-thursday-feeling-mario-twerking-gif-1942858848498373928', 'https://tenor.com/view/that-friday-feeling-mario-luigi-gif-12023906803573680184', 'https://tenor.com/view/that-saturday-feeling-ellipsis-queen-of-strongest-hero-mario-gif-9250951604859110521'];
const letters = { 'A': '🇦', 'B': '🇧', 'C': '🇨', 'D': '🇩', 'E': '🇪', 'F': '🇫', 'G': '🇬', 'H': '🇭', 'I': '🇮', 'J': '🇯', 'K': '🇰', 'L': '🇱', 'M': '🇲', 'N': '🇳', 'O': '🇴', 'P': '🇵', 'Q': '🇶', 'R': '🇷', 'S': '🇸', 'T': '🇹', 'U': '🇺', 'V': '🇻', 'W': '🇼', 'X': '🇽', 'Y': '🇾', 'Z': '🇿' };

console.log('init started'); // don't need nginx warning anymore, it starts at boot now

function systemMessage(username, message, color, room) { // probably doesn't need to be a function but it is
        messages.push({ username, message, color, room });
}

function passMessage(message) { // send the message out to active clients
	wss.clients.forEach((client2) => {
        if (client2.readyState === WebSocket.OPEN) {
        	client2.send(message);
        }
        });
}


const client = new Client({ // discord intents, discord requires perms to be set
    presence: {
        status: 'online',
        afk: false,
        activities: [{ // Playing, Watching, Listening, Competing, Streaming, Custom
            name: '2014 is only 3 months away!',
            type: ActivityType.Custom
	    /* url: 'url'*/ // for streaming
        }],
	},
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

function randomInt(min, max) {
  let num = Math.floor(Math.random() * (max - min + 1) + min);
return num;
}

client.on('ready', (c) => {
    console.log(`${c.user.tag} has awoken`) // verify if bot is online. only code maintained from iinobrobo 1.0
})

cron.schedule('0 6 * * *', () => { // send the daily feeling every day at 6
	let today = new Date();
	client.channels.cache.get(dailyChannel).send(feelings[today.getDay()]);
	client.channels.cache.get(otherDailyChannel).send(feelings[today.getDay()]);
});

var rouletteChannel;
var rouletteEnabled = false;
var inGame = false;
var players = [];
var playerHealth = [];
var shells = [];
var turn = 0;

function rouletteGame(channel) {
    rouletteEnabled = true;
    rouletteChannel = channel;
    inGame = false;
    players = [];
    playerHealth = [];
    shells = [];
}

function rouletteEnd() {
    client.channels.cache.get(rouletteChannel).send("Game ending.");
    rouletteChannel = '';
    rouletteEnabled = false;
    inGame = false;
    players = [];
    playerHealth = [];
    shells = [];
}

function reloadShells() {
    shells = [];
    for (let i = 0; i < randomInt(3, 8); i++) {
        //shells.push(randomInt(0,1)); // for the purposes of the game, 1 is live and 0 is blank
        if (randomInt(0,1) == 1) {
            shells.push(1);
        } else {
            shells.push(0);
        }
    }
    liveCount = shells.reduce((acc, item) => item === 1 ? acc + 1 : acc, 0);
    client.channels.cache.get(rouletteChannel).send(liveCount + " live and " + (shells.length - liveCount) + " blank. The shells are loaded in an unknown order.");
}

client.on('messageCreate', (msg) => {

    let isGoonery = msg.guild.id == serverID;

    if (msg.author.bot) { // don't reply to your own messages
      return;
    }

    //msg.reply('\:smile:');

    if (rouletteEnabled && msg.channel.id === rouletteChannel) {
        if (!inGame && msg.content.includes('.joinroulette') && !players.includes(msg.author.id)) {
            players.push(msg.author.id);
            playerHealth.push(3);
            msg.react('✅');
        }
        if (!inGame && msg.content.includes('.startroulette') && players.length >= 2) {
            inGame = true;
            client.channels.cache.get(rouletteChannel).send("game starting with " + players.length + " players");
            client.channels.cache.get(rouletteChannel).send("All players start with 3 health. Use .fire to fire at a player.");
            reloadShells();
            client.channels.cache.get(rouletteChannel).send("It is " + client.users.cache.get(players[0]).username + "'s turn.");
        } else if (msg.content.includes('.startroulette') && players.length < 2) {
            client.channels.cache.get(rouletteChannel).send("at least 2 players are required");
        }

        if (inGame) {
            if (msg.content.includes('.fire') && msg.content.includes('@') && players[turn] === msg.author.id && players.indexOf(msg.author.id) !== -1) {
                let result = shells.pop(); // the gun in your hand's gonna kill me dead
                let tempTarget = msg.content.match(/@([^>]+)>/); // make sure it's an actual username
                if (players.indexOf(tempTarget[1]) === -1) {
                    msg.channel.send("Invalid target.");
                    return;
                }
                msg.channel.send('You shot ' + client.users.cache.get(tempTarget[1]).username + ".");
                if (tempTarget[1] === msg.author.id && !result) {
                    msg.channel.send("It was a blank. You gain another turn.");
                } else if (!result) {
                    msg.channel.send("It was a blank.");
                    if (turn < players.length - 1) {
                        turn += 1;
                    } else {
                        turn = 0;
                    }
                } else if (result) {
                    msg.channel.send("It was live.");
                    playerHealth[players.indexOf(tempTarget[1])] -= 1;
                    if (turn < players.length -1) {
                        turn += 1;
                    } else {
                        turn = 0;
                    }
                    if (playerHealth[players.indexOf(tempTarget[1])] == 0) {
                        msg.channel.send(players[tempTarget[1]] + "lost.");
                        delete playerHealth[players.indexOf(tempTarget[1])];
                        delete players[players.indexOf(tempTarget[1])];
                        if (turn > players.length) {
                            turn = 0;
                        }
                    }
                }
                //msg.channel.send("p1 health: " + playerHealth[0] + " p2 health: " + playerHealth[1] + " turn: " + turn);
                if (players.length === 0) {
                    rouletteEnd();
                    return;
                }
                if (shells.length === 0) {
                    reloadShells();
                }
                msg.channel.send("It is " + client.users.cache.get(players[turn]).username + "'s turn.");
            }
        }
    }


    if (msg.content.toLowerCase().includes('balls') && isGoonery) {
        msg.reply('hehe balls');
    }

    if (msg.content.toLowerCase().includes('uwu') || msg.content.toLowerCase().includes('owo')) {
    	msg.react('🤓');
    }

    if (msg.content.toLowerCase().includes('foolish') && isGoonery) {
	 msg.reply({ files: ["./content/foolish.mp4"] });
    }

    if (msg.content.toLowerCase().includes('gyu')) {
         msg.reply({ files: ["./content/gyu.mp4"] });
    }

    if (msg.content.toLowerCase().includes('pickle') && isGoonery) {
	    msg.reply({ files: ["./content/pickle.mp4"] });
    }

    if (msg.channelId == channelID) { // send the discord messages in the #yohoho channel to the website
	//console.log("discord message sent from: " + msg.author.username + " << " + msg.content);
    	systemMessage("(discord) " + msg.author.username, msg.content, "#5865F2", "main");
	passMessage(JSON.stringify(messages[messages.length - 1]));
    }
})

client.on('interactionCreate', (interaction) => { // it's this many days until this national holiday
	if (interaction.isChatInputCommand()) {
		switch (interaction.commandName) {
			case 'pimps':
				interaction.reply("they need to go back to zimbabwe");
				break;
			case '8ball':
				interaction.reply(outcomes[randomInt(0, outcomes.length - 1)]);
				break;
			case 'thatfeeling':
				let today = new Date(); // idk why the date function's like this either, redeclare locally so it can change daily
	            		interaction.reply(feelings[today.getDay()]);
				break;
			case 'roulettestart':
		                if (!rouletteEnabled) {
                		rouletteGame(interaction.channel.id);
                		//interaction.reply({ content: "roulette started successfully", ephemeral: true });
                		interaction.reply("roulette starting in current channel");
                		}
                		break;
            		case 'rouletteend':
                		rouletteEnd();
                		break;
			case 'pickup':
				interaction.reply("you wanna rungle in my cungle I'll take you out");
				break;
			case 'reactword':
				interaction.reply({ content: "reacting", ephemeral: true });
                let reactwordID = interaction.options.get('messageid').value;
                interaction.channel.messages.fetch(reactwordID)
                .then(targetMessage => {
                    let content = interaction.options.get('messagecontent').value;
                    for (let i = 0; i < content.length; i++) {
                        if (/^[a-zA-Z]$/.test(content[i])) {
                            //interaction.channel.send(letters[content[i].toUpperCase()]);
                            targetMessage.react(letters[content[i].toUpperCase()]) // '\:regional_indicator_' + content[i].toLowerCase() + ':'
                                .catch(error => interaction.reply({ content: error.rawError, ephemeral: true }));
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching message:', error); 
                });
				break;
            case 'messagesend':
                let targetChannel = interaction.client.channels.cache.get(interaction.options.get('channelid').value);
                let targetMessage = interaction.options.get('messagecontent').value;
                targetChannel.send(targetMessage);
                interaction.reply({ content: "message successful", ephemeral: true });
			} // the end of the switch statement, not the end of the case
	}
});

client.login(discordKey);

wss.on('connection', (ws, req) => {
	users++;

	systemMessage("SYSTEM", "New client joined!"/* from " + req.headers['x-forwarded-for'] + "!"*/, "#fc7b03", "all");
	passMessage(JSON.stringify(messages[messages.length - 1]));
	// this is a necessary part of the website's functionality, even if the site hides join messages

    if (ws.readyState === WebSocket.OPEN) { // send all messages if it's open, otherwise wait
        ws.send(JSON.stringify(messages));
    } else {
        ws.on('open', () => { // I have no idea if this is even possible to reach
            ws.send(JSON.stringify(messages));
        });
    }

    ws.on('message', (message) => {
        //console.log(`Received: ${message}`);
        try {
            const parsedMessage = JSON.parse(message);
	        if (!(parsedMessage.message.length > 1500) && parsedMessage.room == "main") { // messages too long will break discord
		        client.channels.cache.get(channelID).send(parsedMessage.username + ': ' + parsedMessage.message); // send messages from the website to discord
	        }
	        if (parsedMessage.message.includes('@')) { // don't @everyone on discord lol
		        return;
	        }
	        if (parsedMessage.message.includes('/clear')) { // supposed to save memory, mostly used to hide suspicious messages
		        messages = [];
	        }
            messages.push(parsedMessage); // message list is important for new users to get the messages

            const jsonMessage = JSON.stringify(parsedMessage);
            wss.clients.forEach((client2) => { // send new messages out to the clients
                if (client2.readyState === WebSocket.OPEN) {
                    client2.send(jsonMessage);
                }
            });
            if (parsedMessage.message.includes('/count')) { // using the users variable is probably a stupid solution but it works soo
                systemMessage("SYSTEM", "There are currently " + users + " users online.", "#fc7b03", "all");
                passMessage(JSON.stringify(messages[messages.length - 1]));
            }
	        if (parsedMessage.message.includes('/8ball')) { // google (I think aven added this)
		        systemMessage("SYSTEM", outcomes[randomInt(0, outcomes.length - 1)], "#fc7b03", parsedMessage.room);
		        passMessage(JSON.stringify(messages[messages.length - 1]));
	        }
        } catch (error) {
            console.error("Invalid message: " + message); // normally when this happens the error is something else entirely
            console.error("Error: " + error); // so there's this
	}
    });

    ws.on('close', () => {
        //systemMessage("SYSTEM", "Client left!", "#fc7b03"); // for some reason there are a lot of join messages
//	console.log('Client disconnected');
	users--;
    });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); // file to tell users to go away
});

app.get('/isaac', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'isaac.html'));
});

app.get('/wotl.swf', (req, res) => {
	res.sendFile(path.join(__dirname, 'content', 'wotl.swf'));
});

app.get('/file', (req, res) => {
	res.sendFile(path.join(__dirname, 'content', 'movie.zip'));
	//console.log("file accessed from " + req.headers['x-forwarded-for']); //very secretive
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'notfound.html')); // another file to tell users to go away
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
