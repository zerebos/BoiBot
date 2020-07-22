const {Command} = require("discord.js-commando");
const fs = require("fs");
const path = require("path");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);


module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "boi",
            group: "boibot",
            format: "<name>",
            memberName: "boi",
            description: "Gives you a single boi meme.",
            details: "When ran alone this will give a random boi meme. Otherwise will try to find the image matching the input and use that instead.",
            examples: ["boi", "boi poyo", "boi robot"]
        });
    }
    
    async run(msg, image) {
        const files = await readdir(this.client.boiPath);
        // Get the requested image... if it exists. || otherwise use a random one.
        const file = files.find(v => v.startsWith(`${image}.`)) || files[Math.floor(Math.random() * files.length)];
        const pathToFile = path.resolve(this.client.boiPath, file);
        await msg.channel.send({
            files: [{
                attachment: pathToFile,
                name: file
            }]
        });
    }
};