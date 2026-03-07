import {type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType} from "discord.js";

const JOKE_API_URL = "https://v2.jokeapi.dev/joke";
const BLACKLIST_FLAGS = "nsfw,racist,sexist,explicit";

interface JokeResponseSingle {
    error: false;
    category: string;
    type: "single";
    joke: string;
}

interface JokeResponseTwoPart {
    error: false;
    category: string;
    type: "twopart";
    setup: string;
    delivery: string;
}

interface JokeResponseError {
    error: true;
    message: string;
}

type JokeResponse = JokeResponseSingle | JokeResponseTwoPart | JokeResponseError;

export default {
    data: new SlashCommandBuilder()
        .setName("joke")
        .setDescription("Tells a random joke! 😂")
        .addStringOption(option =>
            option.setName("category")
                .setDescription("Category of joke (default: Any)")
                .addChoices(
                    {name: "Programming", value: "Programming"},
                    {name: "Misc", value: "Misc"},
                    {name: "Pun", value: "Pun"},
                    {name: "Spooky", value: "Spooky"},
                    {name: "Christmas", value: "Christmas"}
                )
                .setRequired(false))
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const category = interaction.options.getString("category") ?? "Any";

        let data: JokeResponse;
        try {
            const response = await fetch(`${JOKE_API_URL}/${category}?blacklistFlags=${BLACKLIST_FLAGS}`);
            if (!response.ok) {
                await interaction.editReply("❌ Could not fetch a joke right now. Try again later!");
                return;
            }
            data = await response.json() as JokeResponse;
        }
        catch {
            await interaction.editReply("❌ Could not reach the joke service. Try again later!");
            return;
        }

        if (data.error) {
            await interaction.editReply("❌ No jokes found in that category. Try a different one!");
            return;
        }

        const jokeText = data.type === "single"
            ? data.joke
            : `${data.setup}\n\n||${data.delivery}||`;

        const embed = new EmbedBuilder()
            .setDescription(`😂 ${jokeText}`)
            .setColor("Green")
            .setFooter({text: `Category: ${data.category} • Powered by JokeAPI`});

        await interaction.editReply({embeds: [embed]});
    }
};
