const {Constants} = require("discord.js");
const {Command} = require("discord.js-commando");
const Paginator = require("../../paginator");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "submissions",
            group: "boibot",
            memberName: "submissions",
            description: "Gives a list of all submissions.",
            ownerOnly: true,
        });
    }
    
    async run(msg) {
        const submissions = this.client.settings.get("submissions", []);
        if (submissions.length == 0) return await msg.info("There are no submissions at this time.");
        const list = submissions.map(s => s.name);
        const p = new Paginator(this.client, msg, list, 10);
        const title = `BoiBot Submissions`;
        p.embed.setAuthor(title, this.client.user.displayAvatarURL());
        p.embed.setColor(Constants.Colors.INFO);
        await p.paginate();
    }
};