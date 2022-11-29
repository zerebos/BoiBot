const fs = require("fs");
const path = require("path");

const {promisify} = require("util");
const readdir = promisify(fs.readdir);
const rename = promisify(fs.rename);
const rm = promisify(fs.rm);

const {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle} = require("discord.js");

const config = require("../../config");

const boiPath = path.resolve(__dirname, "..", "..", "boi");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bois")
        .setDescription("Gives a list of all available bois!"),

    /** 
     * @param interaction {import("discord.js").ChatInputCommandInteraction}
     */
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});

        const files = await readdir(boiPath);

        // inside a command, event listener, etc.
        const listingEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("Available Bois")
                .setDescription(files.map(n => `\`${n.split(".")[0]}\``).join(", "));

        if (interaction.user.id != config.owner) return await interaction.editReply({embeds: [listingEmbed], ephemeral: true});

        const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("bois-rename")
                        .setLabel("Rename")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("bois-delete")
                        .setLabel("Delete")
                        .setStyle(ButtonStyle.Danger),
        );

        await interaction.editReply({embeds: [listingEmbed], components: [row], ephemeral: true});
    },

    /** 
     * @param interaction {import("discord.js").ButtonInteraction}
     */
    async button(interaction) {
        const id = interaction.customId.split("-")[1];
        const isRename = id === "rename";

        const modal = new ModalBuilder().setTitle("Submission " + (isRename ? "Rename" : "Delete")).setCustomId("bois-" + (isRename ? "rename" : "delete"));
        const currentInput = new TextInputBuilder().setCustomId("current").setLabel("Meme to rename").setStyle(TextInputStyle.Short);
        const newInput = new TextInputBuilder().setCustomId("new").setLabel("New name for meme").setStyle(TextInputStyle.Short);
        const deleteInput = new TextInputBuilder().setCustomId("delete").setLabel("Meme to delete").setStyle(TextInputStyle.Short);
        const row = new ActionRowBuilder().addComponents(isRename ? currentInput : deleteInput);
        const row2 = new ActionRowBuilder().addComponents(newInput);
        modal.addComponents(row);
        if (isRename) modal.addComponents(row2);

        await interaction.showModal(modal);
    },

    /** 
     * @param interaction {import("discord.js").ModalSubmitInteraction}
     */
     async modal(interaction) {
        const id = interaction.customId.split("-")[1];
        const isRename = id === "rename";

        if (!isRename) return await this.delete(interaction);
        return await this.rename(interaction);
    },

    /** 
     * @param interaction {import("discord.js").ModalSubmitInteraction}
     */
    async rename(interaction) {
        const currentName = interaction.fields.getTextInputValue("current");
        const newName = interaction.fields.getTextInputValue("new");

        // Check if a meme with that name exists
        const files = await readdir(boiPath);
        const currentFile = files.find(f => f.startsWith(`${currentName}.`));
        if (!currentFile) return await interaction.reply({content: `Could not find meme called \`${currentName}\`!`, ephemeral: true});
        const existingFile = files.find(f => f.startsWith(`${newName}.`));
        if (existingFile) return await interaction.reply({content: `A meme called \`${newName}\` already exists!`, ephemeral: true});


        // Move existing file
        const ext = path.extname(currentFile);
        const newFilename = newName + ext;
        await rename(path.resolve(boiPath, currentFile), path.resolve(boiPath, newFilename));
        await interaction.reply({content: `\`${currentName}\` successfully renamed to \`${newName}\``, ephemeral: true});
    },

    /** 
     * @param interaction {import("discord.js").ModalSubmitInteraction}
     */
    async delete(interaction) {
        const currentName = interaction.fields.getTextInputValue("delete");

        // Check if a meme with that name exists
        const files = await readdir(boiPath);
        const currentFile = files.find(f => f.startsWith(`${currentName}.`));
        if (!currentFile) return await interaction.reply({content: `Could not find meme called \`${currentName}\`!`, ephemeral: true});


        // Move existing file
        await rm(path.resolve(boiPath, currentFile));
        await interaction.reply({content: `Successfully deleted \`${currentName}\``, ephemeral: true});
    },
};
