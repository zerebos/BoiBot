module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        client.cpuUsage = process.cpuUsage();
        client.readyAt = new Date();
    },
};