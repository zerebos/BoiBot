const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "view",
            group: "boibot",
            memberName: "view",
            description: "Views a given submission.",
            ownerOnly: true,
            args: [
                {
                    key: "num",
                    type: "integer",
                    prompt: "Which submission would you like to view?"
                }
            ]
        });
    }
    
    async run(msg, {num}) {
        const submissions = this.client.settings.get("submissions", []);
        if (submissions.length == 0) return await msg.failure("There are no submissions outstanding.");
        if (submissions.length <= 0) return await msg.failure("Index starts at 1.");
        if (submissions.length > submissions.length) return await msg.failure(`There are only ${submissions.lenghth} submissions.`);
        const submission = submissions[num - 1];
        await msg.say(submission.url);
    }
};