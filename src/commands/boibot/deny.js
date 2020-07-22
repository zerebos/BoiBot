const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "deny",
            group: "boibot",
            memberName: "deny",
            description: "Denies a given submission."
        });
    }
    
    async run(msg, image) {
        
    }
};