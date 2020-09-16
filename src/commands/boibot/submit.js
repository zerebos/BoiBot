const {MessageEmbed, Constants} = require("discord.js");
const {Command} = require("discord.js-commando");
const URL = require("url");
const path = require("path");

const types = ["png", "jpg", "jpeg", "gif", "webp"];
const typesString = types.map(t => `\`.${t}\``).join(", ");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "submit",
            group: "boibot",
            memberName: "submit",
            description: "Allows you to submit your own boi meme for approval.",
            args: [
                {
                    key: "name",
                    type: "string",
                    prompt: "What is the name of the boi meme?"
                },
                {
                    key: "url",
                    type: "string",
                    prompt: "What is the url of the image?"
                }
            ]
        });
    }
    
    async run(msg, {name, url}) {
        // Do some basic validation of the url
        const parsed = URL.parse(url);
        if (parsed.protocol != "https:" && parsed.protocol != "http:") return await msg.failure("You must use a full url, include the `http://` or `https://`.");
        const fileType = path.extname(parsed.pathname).slice(1);
        if (!types.includes(fileType)) return await msg.failure(`Make sure the link is a direct link to an image. The url should __end__ with any of the following: ${typesString}`);

        // Save submission information
        const submissions = this.client.settings.get("submissions", []);
        const id = msg.author.id;
        submissions.push({id, name, url});
        await this.client.settings.set("submissions", submissions);
        await msg.success(`Your submission \`${name}\` has been submitted. You will receive a message if it is approved or denied.`);

        // Alert owner of new submission
        const owner = this.client.owners[0];
        if (!owner) return; // Shouldn't happen
        const submissionInfo = new MessageEmbed();
        submissionInfo.setColor(Constants.Colors.INFO);
        submissionInfo.setAuthor(`Submission by ${msg.author.tag}`, msg.author.displayAvatarURL());
        submissionInfo.setTimestamp(Date.now());
        submissionInfo.setFooter(`ID: ${msg.author.id}`);
        submissionInfo.setThumbnail(url);
        submissionInfo.addField("Name", name, true);
        submissionInfo.addField("Filetype", fileType, true);
        await owner.send({embed: submissionInfo});
    }
};