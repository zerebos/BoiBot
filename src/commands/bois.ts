import path from "path";
import {readdir, rename, rm} from "fs/promises";
import {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, ButtonInteraction, ModalSubmitInteraction, MessageFlags} from "discord.js";
import {fileURLToPath} from "url";


// TODO: move all images to the database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boiPath = path.resolve(__dirname, "..", "..", "boi");

export default {
    data: new SlashCommandBuilder()
        .setName("bois")
        .setDescription("Gives a list of all available bois!")
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),


    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const files = await readdir(boiPath);

        // inside a command, event listener, etc.
        const listingEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("Available Bois")
                .setDescription(files.map(n => `\`${n.split(".")[0]}\``).join(", "));

        if (interaction.user.id != process.env.BOT_OWNER_ID) return await interaction.editReply({embeds: [listingEmbed]});

        const row = new ActionRowBuilder<ButtonBuilder>()
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

        await interaction.editReply({embeds: [listingEmbed], components: [row]});
    },

    async button(interaction: ButtonInteraction) {
        const id = interaction.customId.split("-")[1];
        const isRename = id === "rename";

        const modal = new ModalBuilder().setTitle("Submission " + (isRename ? "Rename" : "Delete")).setCustomId("bois-" + (isRename ? "rename" : "delete"));
        const currentInput = new TextInputBuilder().setCustomId("current").setLabel("Meme to rename").setStyle(TextInputStyle.Short);
        const newInput = new TextInputBuilder().setCustomId("new").setLabel("New name for meme").setStyle(TextInputStyle.Short);
        const deleteInput = new TextInputBuilder().setCustomId("delete").setLabel("Meme to delete").setStyle(TextInputStyle.Short);
        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(isRename ? currentInput : deleteInput);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(newInput);
        modal.addComponents(row);
        if (isRename) modal.addComponents(row2);

        await interaction.showModal(modal);
    },

    async modal(interaction: ModalSubmitInteraction) {
        const id = interaction.customId.split("-")[1];
        const isRename = id === "rename";

        if (!isRename) return await this.delete(interaction);
        return await this.rename(interaction);
    },

    async rename(interaction: ModalSubmitInteraction) {
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

    async delete(interaction: ModalSubmitInteraction) {
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
