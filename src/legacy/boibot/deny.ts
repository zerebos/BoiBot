const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "deny",
            group: "boibot",
            memberName: "deny",
            description: "Denies a given submission.",
            ownerOnly: true,
            args: [
                {
                    key: "num",
                    type: "integer",
                    prompt: "Which submission would you like to deny?"
                },
                {
                    key: "reason",
                    type: "string",
                    prompt: "What is the reason for denying?"
                }
            ]
        });
    }
    
    async run(msg, {num, reason}) {
        // Validate given index
        const submissions = this.client.settings.get("submissions", []);
        if (submissions.length == 0) return await msg.failure("There are no submissions outstanding.");
        if (submissions.length <= 0) return await msg.failure("Index starts at 1.");
        if (submissions.length > submissions.length) return await msg.failure(`There are only ${submissions.lenghth} submissions.`);
        
        // Delete submission
        const submission = submissions.splice(num - 1, 1)[0];
        await this.client.settings.set("submissions", submissions);

        // Notify the submitter
        const user = await this.client.users.fetch(submission.id);
        if (!user) await msg.failure(`Could not find and message the submitter.`);
        else await user.send(`Your submission, \`${submission.name}\`, was denied citing the following: "${reason}"`);
        await msg.success("Successfully denied the submission");
    }
};