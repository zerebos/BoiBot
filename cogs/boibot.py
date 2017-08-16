import discordbot
import os, re
import random
import mimetypes
import glob, aiohttp

BOI_FOLDER = "boi"

class BoiBot:
    """For all your BOI needs."""

    def __init__(self, bot):
        self.bot = bot
        self.config = discordbot.Config('boi.json', loop=bot.loop, directory="data")

    @discordbot.commands.command(pass_context=True)
    async def boi(self, ctx, image=""):
        """Gives a random boi unless a name is given.

        Uploads the image specified if it is found. Otherwise a random one is used.
        Will also delete the calling message if the bot has permissions.
        """

        if ctx.message.server is not None:
            if ctx.message.channel.permissions_for(ctx.message.server.me).manage_messages:
                await self.bot.delete_message(ctx.message)

        image = image.lower()

        if image != "":
            for file in glob.glob(BOI_FOLDER+'/*'):
                if re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file):
                    image = file
                    break

        if image == "" or not os.path.isfile(image):
            image = random.choice(glob.glob(BOI_FOLDER+"/*"))

        await self.bot.upload(image)

    @discordbot.commands.command(pass_context=True)
    @discordbot.checks.is_owner()
    async def deleteboi(self, ctx, image=""):
        """Deletes a specific Boi."""

        if ctx.message.server is not None:
            if ctx.message.channel.permissions_for(ctx.message.server.me).manage_messages:
                await self.bot.delete_message(ctx.message)

        image = image.lower()

        if image != "":
            for file in glob.glob(BOI_FOLDER+'/*'):
                if re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file):
                    image = file
                    break

    @staticmethod
    def _boi_list():
        # re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file)
        names = [re.sub(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?'+r'(.*)\..*', r'\1', l) for l in glob.glob(BOI_FOLDER+"/*")]
        names.sort()
        return '      '.join(names)

    @discordbot.commands.command()
    async def listbois(self):
        """Prints a list of all the available Boi memes."""
        await self.bot.responses.basic(title="Current Bois:", message=BoiBot._boi_list())

    @discordbot.commands.command(pass_context=True)
    async def addboi(self, ctx, name=None, link=None):
        """Either upload an image, or provide URL and then filename

        When uploading a file, "link" should be the filename and name is not needed.
        When using a URL, you must also provide name.

        **Usage Examples:**
        For Upload:
        {prefix}addboi [filename]

        For URL:
        {prefix}addboi [filename] [url]
        """

        if name is None:
            await self.bot.responses.failure(message="You did not provide a filename")
            return

        url = link

        if ctx.message.attachments:
            url = ctx.message.attachments[0]['url']

        if url is None:
            await self.bot.responses.failure(message="You did not provide a URL or upload an image.")
            return

        for file in glob.glob(BOI_FOLDER+"/*"):
            file = file.replace('\\', "/")
            if re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + name + r'\..*', file):
                await self.bot.responses.failure(message="The boi \"{}\" already exists!".format(name))
                return

        result = await self.downloadImage(url, BOI_FOLDER, name, self.bot.loop)

        if not result['canAccessURL']:
            await self.bot.responses.failure(message="The URL provided was invalid.")
        elif not result['isImage']:
            await self.bot.responses.failure(message="The URL was not to a direct image.")
        elif result['fileSaved']:
            await self.bot.responses.success(title="Boi Added", message="Your boi \"" + name + "\" has been added successfully.", thumbnail=url)
        else:
            await self.bot.responses.failure(message="Something went wrong ¯\_(ツ)_/¯")


    async def downloadImage(url, folder, name, loop, chunkSize=20):
        result = {'canAccessURL': False, 'isImage': False, 'fileSaved': False}
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'none',
            'Accept-Language': 'en-US,en;q=0.8',
            'Connection': 'keep-alive'}
        async with aiohttp.ClientSession(loop=loop) as session:
            with aiohttp.Timeout(10, loop=session.loop):
                async with session.get(url, headers=headers) as response:
                    content_type = response.headers['content-type']
                    if response.status == 200:
                        result['canAccessURL'] = True
                    if "image" in content_type:
                        result['isImage'] = True
                    if not result['canAccessURL'] or not result['isImage']:
                        return result
                    extension = mimetypes.guess_extension(content_type)
                    if extension == '.jpe':
                        extension = '.jpg'

                    with open(folder + "/" + name + extension, 'wb') as fd:
                        while True:
                            chunk = await response.content.read(chunkSize)
                            if not chunk:
                                break
                            fd.write(chunk)
                    result['fileSaved'] = True
                    return result


def setup(bot):
    bot.add_cog(BoiBot(bot))
