import discordbot
import os
import random
import urllib.request
import urllib
import mimetypes
import fnmatch

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
        if image == "list":
            await self.bot.responses.basic(title="Current Bois:", message=BoiBot._boi_list())
            return

        if image != "":
            for file in os.listdir('boi'):
                if fnmatch.fnmatch(file, image + '.*'):
                    image = 'boi/' + file
                    break

        if image == "" or not os.path.isfile(image):
            image = 'boi/' + random.choice(os.listdir('boi'))
            while image == "Thumbs.db":
                image = 'boi/' + random.choice(os.listdir('boi'))

        await self.bot.upload(image)

    @staticmethod
    def _boi_list():
        names = []
        fileList = os.listdir('boi')
        fileList.sort()
        for file in fileList:
            if file != "Thumbs.db":
                names.append(os.path.splitext(file)[0])
        return '      '.join(names)

    @discordbot.commands.command(pass_context=True)
    @discordbot.checks.mod_or_permissions(manage_messages=True)
    async def addboi(self, ctx, link=None, name=None):
        """Either upload an image, or provide URL and then filename

        When uploading a file, "link" should be the filename and name is not needed.
        When using a URL, you must also provide name.

        **Usage Examples:**
        For Upload:
        {prefix}addboi [filename]

        For URL:
        {prefix}addboi [url] [filename]
        """

        url = link

        if ctx.message.attachments:
            url = ctx.message.attachments[0]['url']
            # name = os.path.splitext(ctx.message.attachments[0]['filename'])[0]
            name = link

        if link is None and url is None:
            await self.bot.responses.failure(message="You did not provide a URL or upload an image.")
            return

        if url is not None and (name is None or link is None):
            await self.bot.responses.failure(message="You did not provide a filename")
            return

        for file in os.listdir('boi'):
            if fnmatch.fnmatch(file, name + '.*'):
                await self.bot.responses.failure(message="The boi \"{}\" already exists!".format(name))
                return

        try:
            req = urllib.request.Request(url,
                                         headers={
                                             'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                                             'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
                                             'Accept-Encoding': 'none',
                                             'Accept-Language': 'en-US,en;q=0.8',
                                             'Connection': 'keep-alive'})
        except ValueError:
            await self.bot.responses.failure(message="The URL provided was invalid")
            return

        response = urllib.request.urlopen(req)
        content_type = response.headers['content-type']
        extension = mimetypes.guess_extension(content_type)
        if extension == '.jpe':
            extension = '.jpg'
        out = open('boi/' + name + extension, 'wb')
        out.write(response.read())

        await self.bot.responses.success(title="Boi Added", message="Your boi \"" + name + "\" has been added successfully.", thumbnail=url)


def setup(bot):
    bot.add_cog(BoiBot(bot))
