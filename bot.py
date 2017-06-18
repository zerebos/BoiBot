#!/usr/bin/python3

import asyncio
import discordbot

try:
    import uvloop
except ImportError:
    pass
else:
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())


bot = discordbot.DiscordBot()


if __name__ == '__main__':
    bot.load_cogs()
    bot.run()

