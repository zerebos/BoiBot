const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "submissions",
            group: "boibot",
            memberName: "submissions",
            description: "Gives a list of all submissions."
        });
    }
    
    async run(msg, image) {
        
    }
};