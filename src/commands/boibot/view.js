const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "view",
            group: "boibot",
            memberName: "view",
            description: "Views a given submission."
        });
    }
    
    async run(msg, image) {
        
    }
};