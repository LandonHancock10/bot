require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const ytdl = require('ytdl-core-discord');
const { search } = require('yt-search');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs').promises;
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

async function displayHelp(channel) {
    let helpMessage = "Here are the available commands and how to use them:\n";
    
    // Reading all command files from the directory
    const commandFiles = await fs.readdir('./commands');
    
    for (const file of commandFiles) {
        const commandData = JSON.parse(await fs.readFile(`./commands/${file}`, 'utf8'));
        helpMessage += `**${path.basename(file, '.json')}** - ${commandData.description}\n`;
        helpMessage += `  Usage: ${commandData.usage}\n`;
        helpMessage += `  Example: ${commandData.example}\n\n`;
    }

    channel.send(helpMessage);
}

const oauth2Client = new google.auth.OAuth2(
    "91819767405-5huri5g6c5istut1suh3gl9s845m14u6.apps.googleusercontent.com",
    "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",
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: "1//04rnTAitIW3TsCgYIARAAGAQSNwF-L9IrbyiM8aGZZPqj0Y2GxnbjGrTuIhAujcXGlsm8PUtAGyLKyHSSkJP9crcX0Wajey_r9BQ"
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'hancocklandon@gmail.com',
        clientId: "91819767405-5huri5g6c5istut1suh3gl9s845m14u6.apps.googleusercontent.com",
        clientSecret: "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",
        refreshToken: "1//04rnTAitIW3TsCgYIARAAGAQSNwF-L9IrbyiM8aGZZPqj0Y2GxnbjGrTuIhAujcXGlsm8PUtAGyLKyHSSkJP9crcX0Wajey_r9BQ",
        accessToken: "ya29.a0Ad52N3_ib0NosN7exysZlCz1gVdQ5CNiA-aoRof8VjJs1anXHHVgomWKYX1H0SUybq_5R3M8ET8bz3z0gviuoc0Av9iAYg4FzD6nnlKXn-OfAcbXRA1ClP-2il5XQ_pqJC6w2PMHCgh0UVLyh5svbP_zWnFdOzFODKXJaCgYKAQwSAQ8SFQHGX2MiyHd4gxzQ_AubpUfh4PIj8g0171"
    }
});

client.once('ready', () => {
    console.log('Ready!');
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith('/') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'email':
            if (args.length < 3) {
                message.channel.send('Usage: !email recipient@example.com Subject Here Email body text here.');
                return;
            }
            const recipient = args[0];
            const subject = args[1];
            const emailBody = args.slice(2).join(' ');

            try {
                await transporter.sendMail({
                    from: `"Your Bot Name" <hancocklandon@gmail.com>`,
                    to: recipient,
                    subject: subject,
                    text: emailBody
                });
                message.channel.send('Email sent successfully!');
            } catch (error) {
                console.error('Error sending email:', error);
                message.channel.send('Failed to send email. Please check the logs.');
            }
            break;
        case 'text':
            if (args.length < 2) {
                message.channel.send('Usage: !text phoneNumber "Message content"');
                return;
            }
            const phone = args[0].replace(/[^0-9]/g, '');
            const textMessage = args.slice(1).join(' ');

            const carrierGateways = [
                '@vtext.com', // Verizon
                '@tmomail.net', // T-Mobile
                '@txt.att.net', // AT&T
                '@messaging.sprintpcs.com', // Sprint
                '@sms.mycricket.com', // Cricket
                '@mymetropcs.com', // MetroPCS
            ];

            carrierGateways.forEach(async (gateway) => {
                const to = phone + gateway;
                try {
                    await transporter.sendMail({
                        from: `"Your Bot Name" <hancocklandon@gmail.com>`,
                        to: to,
                        subject: '',
                        text: textMessage
                    });
                    console.log(`Message sent to ${to}`);
                } catch (error) {
                    console.error(`Error sending to ${to}:`, error);
                }
            });
            message.channel.send('Text message sent successfully!');
            break;
        case 'help':
            displayHelp(message.channel)
            break;
        case 'lorem':
            message.channel.send('Lorem ipsum dolor sit amet...');
            break;
        case 'dadjoke':
            try {
                const response = await axios.get('https://icanhazdadjoke.com/', { headers: { Accept: 'text/plain' } });
                message.channel.send(response.data);
            } catch (error) {
                message.channel.send('Failed to fetch a dad joke. Try again later.');
            }
            break;
        case 'die':
            await message.channel.send('Shutting down...');
            client.destroy();
            process.exit(0);
            break;
        case 'music':
            if (!message.member.voice.channel) {
                message.channel.send("You need to be in a voice channel to play music!");
                return;
            }

            const query = args.join(" ");
            try {
                const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState } = require('@discordjs/voice');
                const voiceChannel = message.member.voice.channel;

                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                connection.subscribe(player);

                const video = await search(query);
                if (video && video.videos.length > 0) {
                    const stream = await ytdl(video.videos[0].url, { filter: 'audioonly' });
                    const resource = createAudioResource(stream);
                    player.play(resource);

                    player.on(AudioPlayerStatus.Idle, () => {
                        connection.destroy(); // Correct way to disconnect from the voice channel
                    });

                    player.on('error', error => {
                        console.error(`Error: ${error.message}`);
                        connection.destroy(); // Correct way to disconnect from the voice channel
                    });

                    message.channel.send(`Now playing: ${video.videos[0].title}`);
                } else {
                    message.channel.send('No results found.');
                }
            } catch (error) {
                console.error('Error playing music:', error);
                message.channel.send('Failed to play music. Please try again later.');
            }
            break;

        case 'weather':
            let location;

            if (args.length === 0) {
                location = 'Orem, Utah';
            } else {
                location = args.join(' ');
            }

            try {
                const apiKey = '38c2f6adb9b62f2416523daaa747be6d';
                const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=imperial&appid=${apiKey}`);
                const weatherData = response.data;

                const temperature = weatherData.main.temp;
                const humidity = weatherData.main.humidity;
                const windSpeed = weatherData.wind.speed;
                const cloudiness = weatherData.clouds.all;
                const description = weatherData.weather[0].description;

                message.channel.send(`Weather in ${location}: 
                Temperature: ${temperature}°F, 
                Description: ${description}, 
                Humidity: ${humidity}%, 
                Wind Speed: ${windSpeed} mph, 
                Cloudiness: ${cloudiness}%`);
            } catch (error) {
                console.error('Error fetching weather:', error);
                message.channel.send('Failed to fetch weather information. Please try again later.');
            }
            break;

        default:
            message.channel.send('Command not recognized. Try /help for a list of available commands.');
    }
});

client.login(process.env.DISCORD_TOKEN);

