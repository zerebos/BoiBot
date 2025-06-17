const {Command} = require("discord.js-commando");
const fs = require("fs");
const path = require("path");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);
const deleteFile = promisify(fs.unlink);

module.exports = class extends Command {
    constructor(client) {
        super(client, {
            name: "delete",
            group: "boibot",
            format: "<boi>",
            memberName: "delete",
            description: "Deletes a given boi meme.",
            examples: ["delete", "delete poyo", "delete robot"],
            ownerOnly: true
        });
    }
    
    async run(msg, image) {
        const files = await readdir(this.client.boiPath);
        const file = files.find(v => v.startsWith(`${image}.`));
        if (!file) return await msg.failure(`Could not find a boi called \`${image}\`.`);
        try {
            await deleteFile(path.resolve(this.client.boiPath, file));
            await msg.success(`Boi \`${file}\` has been deleted.`);
        }
        catch {
            await msg.failure(`Could not delete file \`${file}\`.`);
        }
    }
};