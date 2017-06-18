#!/usr/local/bin/python3

import discord
import os
from discord.ext import commands
import random
import urllib.request
import urllib
import mimetypes
import fnmatch

description = '''*Breath In* BOI'''
bot = commands.Bot(command_prefix='/', description=description)

path = os.path.dirname(os.path.realpath(__file__))

with open(path+'/banned_users.list') as f:
    banned = f.read().splitlines()

admin_list = ['Zerebos#7790']

async def admin_perms_check(ctx):
    if str(ctx.message.author) not in admin_list:
        await bot.say("Sorry, "+ctx.message.author.name+", you must be an admin of BoiBot to use that function.")
        return False
    return True


async def is_banned(ctx):
    if str(ctx.message.author) in banned and str(ctx.message.author) not in admin_list:
        await bot.say("Sorry, "+ctx.message.author.name+", you are banned from BoiBot.")
        return True
    return False


def rewrite_list():
    with open(path + '/banned_users.list', 'w') as f:
        for person in banned:
            f.write("%s\n" % person)


@bot.event
async def on_message(message):
    if message.author.bot:
        return

    await bot.process_commands(message)


@bot.event
async def on_ready():
    await bot.change_presence(game=discord.Game(name='/boi'))


@bot.command(pass_context=True, hidden=True)
async def ban(ctx, member : discord.Member):
    """Ban a member from BoiBot."""

    if await admin_perms_check(ctx):
        banned.append(str(member))
        rewrite_list()
        await bot.say("```\n"+str(member)+" has been banned from BoiBot.\n```")


@bot.command(pass_context=True, hidden=True)
async def unban(ctx, member : discord.Member):
    """Ban a member from BoiBot."""

    if await admin_perms_check(ctx):
        banned.remove(str(member))
        rewrite_list()
        await bot.say("```\n"+str(member)+" has been unbanned from BoiBot.\n```")


@bot.command(pass_context=True)
async def boi(ctx, image=""):
    """Gives a random boi unless a name is given."""

    if await is_banned(ctx):
        return

    if ctx.message.server is not None:
        if ctx.message.channel.permissions_for(ctx.message.server.me).manage_messages:
            await bot.delete_message(ctx.message)

    image = image.lower()
    if image == "list":
        await bot.say("Current Bois:")
        await bot.say(boi_list())
        return

    if image != "":
        for file in os.listdir(path + '/boi'):
            if fnmatch.fnmatch(file, image + '.*'):
                image = path + '/boi/' + file
                break

    if image == "" or not os.path.isfile(image):
        image = path + '/boi/' + random.choice(os.listdir(path + '/boi'))
        while image == "Thumbs.db":
            image = path + '/boi/' + random.choice(os.listdir(path + '/boi'))

    await bot.upload(image)


def boi_list():
    """*Breath in* BOI"""

    names = []
    fileList = os.listdir(path + '/boi')
    fileList.sort()
    for file in fileList:
        if file != "Thumbs.db":
            names.append(os.path.splitext(file)[0])
    return ', '.join(names)


@bot.command(pass_context=True)
async def addboi(ctx, link=None, name=None):
    """Either upload an image, or provide URL and then filename"""

    if await is_banned(ctx):
        return

    url = link

    if ctx.message.attachments:
        url = ctx.message.attachments[0]['url']
        name = os.path.splitext(ctx.message.attachments[0]['filename'])[0]

    if link is None and url is None:
        await bot.say("You did not provide a URL or upload an image.")
        return

    if url is not None and name is None:
            await bot.say("When using a URL you must provide a filename.")
            return

    download_image(url,name)
    await bot.say("```\n" + "Your boi " + name + " has been added.\n```")


def download_image(url : str, filename : str):
    foo = urllib.request.Request(url,
        headers={
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'none',
            'Accept-Language': 'en-US,en;q=0.8',
            'Connection': 'keep-alive'})

    response = urllib.request.urlopen(foo)
    content_type = response.headers['content-type']
    extension = mimetypes.guess_extension(content_type)
    if extension == '.jpe':
        extension = '.jpg'
    out = open(get_cwd() + '/boi/' + filename+extension, 'wb')
    out.write(response.read())


def get_cwd():
    return os.path.dirname(os.path.realpath(__file__))


bot.run('MzA3MDQ0NjMwMDE1Mzc3NDI4.C-MlLg.Uz-KBOLBzj9GInJLHg9sUu-60WI')