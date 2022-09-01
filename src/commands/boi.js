const fs = require("fs");
const path = require("path");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);

const {SlashCommandBuilder, AttachmentBuilder} = require("discord.js");

const boiPath = path.resolve(__dirname, "..", "..", "boi");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boi")
        .setDescription("Gives a random *breath in*...BOI meme!")
        .addStringOption(option =>
            option.setName("boi")
                .setDescription("Which boi to use")
                .setAutocomplete(true)),

    /** 
     * @param interaction {import("discord.js").CommandInteraction}
     */
    async execute(interaction) {
        await interaction.deferReply();
        const desired = interaction.options.getString("boi", false);
        const files = await readdir(boiPath);
        const file = files.find(v => v.startsWith(`${desired}.`)) || files[Math.floor(Math.random() * files.length)];
        const pathToFile = path.resolve(boiPath, file);
        const attachment = new AttachmentBuilder(pathToFile);
        await interaction.editReply({files: [attachment]});
    },

    /** 
     * @param interaction {import("discord.js").AutocompleteInteraction}
     */
    async autocomplete(interaction) {
        const files = await readdir(boiPath);
        const focusedValue = interaction.options.getFocused();
        const choices = files.map(n => n.split(".")[0]);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({name: choice, value: choice})),
        );
    }
};
