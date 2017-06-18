#!/usr/bin/python3

import asyncio
import discordbot

description = """
BoiBot, for when you need to yell boi but with pictures.
"""

try:
    import uvloop
except ImportError:
    pass
else:
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

cogs = [
    'cogs.boibot'
]

prefix = '/'
bot = discordbot.DiscordBot(command_prefix=prefix, description=description, pm_help=False, help_attrs=dict(hidden=True))


if __name__ == '__main__':
    bot.load_cogs(cogs)
    bot.run()

