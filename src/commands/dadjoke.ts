import {type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ApplicationIntegrationType, InteractionContextType} from "discord.js";

const DAD_JOKE_API_URL = "https://icanhazdadjoke.com/";

interface DadJokeResponse {
    id: string;
    joke: string;
    status: number;
}

export default {
    data: new SlashCommandBuilder()
        .setName("dadjoke")
        .setDescription("Delivers a random dad joke! 👨")
        .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        let data: DadJokeResponse;
        try {
            const response = await fetch(DAD_JOKE_API_URL, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "MemeVault Discord Bot (https://github.com/zerebos/BoiBot)"
                }
            });

            if (!response.ok) {
                await interaction.editReply("❌ Could not fetch a dad joke right now. Try again later!");
                return;
            }

            data = await response.json() as DadJokeResponse;
        }
        catch {
            await interaction.editReply("❌ Could not reach the joke service. Try again later!");
            return;
        }

        const embed = new EmbedBuilder()
            .setDescription(`👨 ${data.joke}`)
            .setColor("Yellow")
            .setFooter({text: "Powered by icanhazdadjoke.com"});

        await interaction.editReply({embeds: [embed]});
    }
};
