import {type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType} from "discord.js";

const MEME_API_URL = "https://meme-api.com/gimme";

interface MemeResponse {
    postLink: string;
    subreddit: string;
    title: string;
    url: string;
    author: string;
    ups: number;
    nsfw: boolean;
    spoiler: boolean;
}

export default {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Sends a random meme from Reddit!")
        .addStringOption(option =>
            option.setName("subreddit")
                .setDescription("The subreddit to pull a meme from (default: random popular meme sub)")
                .setRequired(false))
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const subreddit = interaction.options.getString("subreddit");
        const url = subreddit ? `${MEME_API_URL}/${encodeURIComponent(subreddit)}` : MEME_API_URL;

        let data: MemeResponse;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                await interaction.editReply("❌ Could not fetch a meme right now. Try again later!");
                return;
            }
            data = await response.json() as MemeResponse;
        }
        catch {
            await interaction.editReply("❌ Could not reach the meme service. Try again later!");
            return;
        }

        if (!data.url) {
            await interaction.editReply(`❌ No meme found${subreddit ? ` in r/${subreddit}` : ""}. Try again or pick a different subreddit!`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(data.title)
            .setURL(data.postLink)
            .setImage(data.url)
            .setFooter({text: `r/${data.subreddit} • 👍 ${data.ups.toLocaleString()} • by u/${data.author}`})
            .setColor("Random");

        await interaction.editReply({embeds: [embed]});
    }
};
