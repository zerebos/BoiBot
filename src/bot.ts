import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

// Require the necessary discord.js classes
import {Client, Collection, GatewayIntentBits} from "discord.js";

import "dotenv/config";
import type {CommandModule} from "./types";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    presence: {activities: [{name: "🆕 Now user-installable!", type: 4}]}
});

client.commands = new Collection<string, CommandModule>();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command: CommandModule | {default: CommandModule} = await import(pathToFileURL(filePath).href);

    // Handle both default and named exports
    const commandData = "default" in command ? command.default : command;

    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(commandData.data.name, commandData);
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".ts"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(pathToFileURL(filePath).href);
    // Handle both default and named exports
    const eventData = event.default || event;
    if (eventData.once) {
        client.once(eventData.name, (...args) => eventData.execute(...args));
    }
    else {
        client.on(eventData.name, (...args) => eventData.execute(...args));
    }
}

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);
