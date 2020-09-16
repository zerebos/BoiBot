const http = require("http");
const https = require("https");
const stream = require("stream");
const fs = require("fs");
const path = require("path");
const URL = require("url");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);

const {Command} = require("discord.js-commando");

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "approve",
            group: "boibot",
            memberName: "approve",
            description: "Approves a given submission.",
            ownerOnly: true,
            args: [
                {
                    key: "num",
                    type: "integer",
                    prompt: "Which submission would you like to view?"
                },
                {
                    key: "name",
                    type: "string",
                    prompt: "What name should be given to the meme?"
                }
            ]
        });
    }
    
    async run(msg, {num, name}) {
        // Validate given index
        const submissions = this.client.settings.get("submissions", []);
        if (submissions.length == 0) return await msg.failure("There are no submissions outstanding.");
        if (submissions.length <= 0) return await msg.failure("Index starts at 1.");
        if (submissions.length > submissions.length) return await msg.failure(`There are only ${submissions.lenghth} submissions.`);

        // Check if a meme with that name exists
        const files = await readdir(this.client.boiPath);
        const file = files.find(f => f.startsWith(`${name}.`));
        if (file) return await msg.failure(`A meme with the name ${name} already exists!`);

        // Parse and download image
        const submission = submissions.splice(num - 1, 1)[0];
        const url = URL.parse(submission.url);
        const fileType = path.extname(url.pathname);
        const success = await this.downloadImage(url.href, `${name}${fileType}`, url.protocol == "https:");
        if (!success) await msg.failure("I couldn't download the file. You figure it out: " + submission.url);
        await this.client.settings.set("submissions", submissions);

        // Notify submitter
        const user = await this.client.users.fetch(submission.id);
        if (!user) await msg.failure(`Could not find and message the submitter.`);
        else await user.send(`Your submission, \`${submission.name}\`, was approved under the name \`${name}\``);
        await msg.success("Successfully approved the submission");
    }

    downloadImage(url, filename, isSSL = true) {
        const httpLib = isSSL ? https : http;
        return new Promise(resolve => {
            const file = fs.createWriteStream(path.join(this.client.boiPath, filename));
            httpLib.get(url, response => {
                stream.pipeline(response, file, err => {
                    if (err) return resolve(false);
                    return resolve(true);
                });
            });
        });
    }
};





