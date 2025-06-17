import http from "http";
import https from "https";
import stream from "stream";
import URL, {fileURLToPath} from "url";
import fs from "fs";
import path from "path";
import {readdir} from "fs/promises";
import {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, ButtonInteraction, type ModalMessageModalSubmitInteraction} from "discord.js";



// TODO: move all images to the database
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boiPath = path.resolve(__dirname, "..", "..", "boi");

export default {
    data: new SlashCommandBuilder()
        .setName("submit")
        .setDescription("Submit your own meme!")
        .addAttachmentOption(option =>
            option.setName("submission")
                .setDescription("Image to be submitted")
                .setRequired(true))
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),


    async execute(interaction: ChatInputCommandInteraction) {
        const attachment = interaction.options.getAttachment("submission");
        if (!attachment?.contentType?.startsWith("image/")) {
            return await interaction.reply({embeds: [(new EmbedBuilder()).setColor("Red").setDescription("Only image submissions are allowed at this time!")]});
        }

        const user = await interaction.client.users.fetch(process.env.BOT_OWNER_ID!);
        const submissionEmbed = new EmbedBuilder()
            .setTitle("New Submission")
            .setColor("Blue")
            .setAuthor({name: interaction.user.tag, iconURL: interaction.user.avatarURL()!})
            .setThumbnail(attachment.url)
            .setTimestamp()
            .setFooter({text: interaction.user.id})
            .addFields(
                {name: "Filename", value: attachment.name, inline: true},
                {name: "Size", value: `${attachment.width} x ${attachment.height}`, inline: true},
                {name: "Content Type", value: attachment.contentType, inline: true},
            );
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("submit-approve")
                    .setLabel("Approve")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("submit-deny")
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger),
            );
        user.send({embeds: [submissionEmbed], components: [row]});

        await interaction.reply({embeds: [(new EmbedBuilder()).setColor("Green").setDescription("Image successfully submitted!")]});
    },

    async button(interaction: ButtonInteraction) {
        const id = interaction.customId.split("-")[1];
        const isApproved = id === "approve";

        const modal = new ModalBuilder().setTitle("Submission " + (isApproved ? "Approved" : "Denied")).setCustomId("submit-" + (isApproved ? "approve" : "deny"));
        const approveInput = new TextInputBuilder().setCustomId("name").setLabel("Name for boi meme").setStyle(TextInputStyle.Short);
        const denyInput = new TextInputBuilder().setCustomId("reason").setLabel("Denial reason").setStyle(TextInputStyle.Paragraph);
        const row = new ActionRowBuilder<TextInputBuilder>().addComponents(isApproved ? approveInput : denyInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    },

    async modal(interaction: ModalMessageModalSubmitInteraction) {
        const id = interaction.customId.split("-")[1];
        const isApproved = id === "approve";

        if (!isApproved) return await this.deny(interaction);
        return await this.approve(interaction);
    },

    async approve(interaction: ModalMessageModalSubmitInteraction) {
        const name = interaction.fields.getTextInputValue("name");

        // Check if a meme with that name exists
        const files = await readdir(boiPath);
        const file = files.find(f => f.startsWith(`${name}.`));
        if (file) return await interaction.reply({content: `A meme with the name \`${name}\` already exists!`, ephemeral: true});

        const submissionEmbed = interaction.message!.embeds[0];

        // Parse and download image
        const url = URL.parse(submissionEmbed.thumbnail!.url);
        const fileType = path.extname(url.pathname!);
        const success = await this.downloadImage(url.href, `${name}${fileType}`, url.protocol == "https:");
        if (!success) await interaction.reply({content: "I couldn't download the file. You figure it out: " + submissionEmbed.thumbnail!.url, ephemeral: true});

        const finishedEmbed = EmbedBuilder.from(submissionEmbed).setTitle("Submission Approved").setColor("Green").addFields({name: "Name", value: name});
        await interaction.update({embeds: [finishedEmbed], components: []});

        const submitterID = submissionEmbed.footer!.text;
        const user = await interaction.client.users.fetch(submitterID);

        if (!user) return await interaction.reply({content: "Could not find user", ephemeral: true});
        const notificationEmbed = new EmbedBuilder()
                .setColor("Green")
                .setDescription(`Your submission \`${submissionEmbed.fields[0].value}\` was approved.`)
                .setThumbnail(submissionEmbed.thumbnail!.url)
                .addFields({name: "Name", value: name});
        user.send({embeds: [notificationEmbed]});
    },

    async deny(interaction: ModalMessageModalSubmitInteraction) {
        const reason = interaction.fields.getTextInputValue("reason");
        const submissionEmbed = interaction.message!.embeds[0];

        const finishedEmbed = EmbedBuilder.from(submissionEmbed).setTitle("Submission Denied").setColor("Red").addFields({name: "Reason", value: reason});
        await interaction.update({embeds: [finishedEmbed], components: []});

        const submitterID = submissionEmbed.footer!.text;
        const user = await interaction.client.users.fetch(submitterID);

        if (!user) return await interaction.reply({content: "Could not find user", ephemeral: true});
        const notificationEmbed = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`Your submission \`${submissionEmbed.fields[0].value}\` was denied.`)
                .setThumbnail(submissionEmbed.thumbnail!.url)
                .addFields({name: "Reason", value: reason});
        user.send({embeds: [notificationEmbed]});
    },

    downloadImage(url: string, filename: string, isSSL = true) {
        const httpLib = isSSL ? https : http;
        return new Promise(resolve => {
            const file = fs.createWriteStream(path.join(boiPath, filename));
            httpLib.get(url, response => {
                stream.pipeline(response, file, err => {
                    if (err) return resolve(false);
                    return resolve(true);
                });
            });
        });
    }
};
