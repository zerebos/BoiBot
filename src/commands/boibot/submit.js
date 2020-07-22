const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "submit",
            group: "boibot",
            memberName: "submit",
            description: "Allows you to submit your own boi meme for approval."
        });
    }
    
    async run(msg, image) {
        
    }
};