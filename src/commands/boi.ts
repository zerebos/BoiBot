import fs from "fs/promises"
import path from "path";
import {type AutocompleteInteraction, type ChatInputCommandInteraction, SlashCommandBuilder, AttachmentBuilder, ApplicationIntegrationType, InteractionContextType, MessageFlags} from "discord.js";
import {fileURLToPath} from "url";
import {userInstallNotices} from "../db";


// TODO: move all images to the database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boiPath = path.resolve(__dirname, "..", "..", "boi");

export default {
    data: new SlashCommandBuilder()
        .setName("boi")
        .setDescription("Gives a random *breath in*...BOI meme!")
        .addStringOption(option =>
            option.setName("boi")
                .setDescription("Which boi to use")
                .setAutocomplete(true))
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),


    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const desired = interaction.options.getString("boi", false);
        const files = await fs.readdir(boiPath);
        const file = files.find(v => v.startsWith(`${desired}.`)) || files[Math.floor(Math.random() * files.length)];
        const pathToFile = path.resolve(boiPath, file);
        const attachment = new AttachmentBuilder(pathToFile);
        await interaction.editReply({files: [attachment]});

        const hasShownNotice = await userInstallNotices.get(interaction.user.id);
        if (!hasShownNotice) {
            await userInstallNotices.set(interaction.user.id, true);
            await interaction.followUp({content: `**New!** Add BoiBot to your account for DM access and cross-server profiles!\n\nClick my profile → "Add App" → "Add to My Apps"`, flags: MessageFlags.Ephemeral});
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const files = await fs.readdir(boiPath);
        const focusedValue = interaction.options.getFocused();
        const choices = files.map(n => n.split(".")[0]);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
        await interaction.respond(
            filtered.map(choice => ({name: choice, value: choice})),
        );
    }
};
