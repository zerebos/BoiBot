const {Command} = require("discord.js-commando");
const fs = require("fs");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "bois",
            group: "boibot",
            memberName: "bois",
            description: "Gives a list of all the current boi memes."
        });
    }
    
    async run(msg) {
        const files = await readdir(this.client.boiPath);
        await msg.info({title: "Available Bois", description: files.map(n => `\`${n.split(".")[0]}\``).join(", ")});
    }
};