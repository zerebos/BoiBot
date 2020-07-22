const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "approve",
            group: "boibot",
            memberName: "approve",
            description: "Approves a given submission."
        });
    }
    
    async run(msg, image) {
        
    }
};