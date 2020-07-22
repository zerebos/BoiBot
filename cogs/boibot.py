import discordbot
import os, re
import random, string
import mimetypes
import glob, aiohttp

BOI_FOLDER = "boi"
SUBMISSION_FOLDER = "submissions"

class BoiBot:
    """For all your BOI needs."""

    def __init__(self, bot):
        self.bot = bot
        self.config = discordbot.Config('boi.json', loop=bot.loop, directory="data")
        os.makedirs(BOI_FOLDER, exist_ok=True)
        os.makedirs(SUBMISSION_FOLDER, exist_ok=True)

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

    @staticmethod
    def _boi_list():
        # re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file)
        names = [re.sub(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?'+r'(.*)\..*', r'\1', l) for l in glob.glob(BOI_FOLDER+"/*")]
        names.sort()
        return '      '.join(names)

    @discordbot.commands.command(aliases=['listbois'])
    async def bois(self):
        """Prints a list of all the available Boi memes."""
        await self.bot.responses.basic(title="Current Bois:", message=BoiBot._boi_list())

    def randomword(self, length):
        letters = string.ascii_lowercase
        return ''.join(random.choice(letters) for i in range(length))

    @discordbot.commands.command(pass_context=True, aliases=['addboi'])
    async def add(self, ctx, name=None, link=None):
        """Either upload an image, or provide URL and then filename

        When uploading a file, "link" should be the filename and name is not needed.
        When using a URL, you must also provide name.

        **Usage Examples:**
        For Upload:
        {prefix}addboi [name]

        For URL:
        {prefix}addboi [name] [url]
        """

        if name is None:
            await self.bot.responses.failure(message="You did not provide a filename")
            return

        file_name = name.lower()
        url = link

        if ctx.message.attachments:
            url = ctx.message.attachments[0]['url']

        if url is None:
            await self.bot.responses.failure(message="You did not provide a URL or upload an image.")
            return

        for file in glob.glob(SUBMISSION_FOLDER+"/*"):
            file = file.replace('\\', "/")
            if re.match(r'\.?/?\\?'+SUBMISSION_FOLDER+r'/?\\?' + file_name + r'\..*', file):
                file_name = file_name + '-' + ''.join(random.choice(string.ascii_lowercase) for i in range(6))
                break

        result = await self.downloadImage(url, SUBMISSION_FOLDER, file_name, self.bot.loop)

        if not result['canAccessURL']:
            await self.bot.responses.failure(message="The URL provided was invalid.")
        elif not result['isImage']:
            await self.bot.responses.failure(message="The URL was not to a direct image.")
        elif result['fileSaved']:
            await self.bot.responses.success(title="Boi Submitted", message="Your boi \"" + name.lower() + "\" has been submitted for approval.", thumbnail=url)
            await self.bot.responses.basic(destination=await self.bot.get_user_info(self.bot.config.get('meta', {}).get('owner', "249746236008169473")),
                                           author=str(ctx.message.author), author_img=ctx.message.author.avatar_url,
                                           title="Submission Received", message="A new boi submission \"" + name.lower() + "\" has been received.")
        else:
            await self.bot.responses.failure(message="Something went wrong ¯\_(ツ)_/¯")

    @discordbot.commands.command(pass_context=True, aliases=['delboi', 'deleteboi'])
    @discordbot.checks.is_owner()
    async def delete(self, ctx, image):
        """Deletes a specific Boi."""

        image = image.lower()

        for file in glob.glob(BOI_FOLDER+'/*'):
            if re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file):
                os.remove(file)
                await self.bot.responses.success(title="Boi Removed",
                                                 message="Your boi \"" + image + "\" has been removed.")
                return

        await self.bot.responses.failure(message="The boi \"" + image + "\" does not exist.")

    @staticmethod
    def _submission_list():
        # re.match(r'\.?/?\\?'+BOI_FOLDER+r'/?\\?' + image + r'\..*', file)
        names = [re.sub(r'\.?/?\\?'+SUBMISSION_FOLDER+r'/?\\?'+r'(.*)\..*', r'\1', l) for l in glob.glob(SUBMISSION_FOLDER+"/*")]
        names.sort()
        return '      '.join(names)

    @discordbot.commands.command()
    @discordbot.checks.is_owner()
    async def submissions(self):
        """Prints a list of all the Boi submissions."""
        await self.bot.responses.basic(title="Current Submissions:", message=BoiBot._submission_list())

        # os.rename("path/to/current/file.foo", "path/to/new/desination/for/file.foo")

    @discordbot.commands.command(pass_context=True)
    @discordbot.checks.is_owner()
    async def approve(self, ctx, image, new_name=""):
        """Approve a submission to the working list."""

        image = image.lower()

        for sub_file in glob.glob(SUBMISSION_FOLDER+'/*'):
            if re.match(r'\.?/?\\?'+SUBMISSION_FOLDER+r'/?\\?' + image + r'\..*', sub_file):
                new_name = image if new_name == "" else new_name

                for file in glob.glob(BOI_FOLDER + "/*"):
                    file = file.replace('\\', "/")
                    if re.match(r'\.?/?\\?' + BOI_FOLDER + r'/?\\?' + new_name + r'\..*', file):
                        await self.bot.responses.failure(message="The boi \"{}\" already exists!".format(new_name))
                        return

                os.rename(sub_file, BOI_FOLDER + '/' + new_name + '.' + sub_file.split('.')[-1])
                await self.bot.responses.success(title="Submission Approved",
                                                 message="The submission \"" + new_name + "\" has been approved.")
                return

        await self.bot.responses.failure(message="The submission \"" + image + "\" does not exist.")

    @discordbot.commands.command(pass_context=True, aliases=['subs'])
    @discordbot.checks.is_owner()
    async def view(self, ctx, image):
        """View a submission."""

        image = image.lower()

        for file in glob.glob(SUBMISSION_FOLDER+'/*'):
            if re.match(r'\.?/?\\?'+SUBMISSION_FOLDER+r'/?\\?' + image + r'\..*', file):
                await self.bot.upload(file)
                return

        await self.bot.responses.failure(message="The submission \"" + image + "\" does not exist.")

    @discordbot.commands.command(pass_context=True)
    @discordbot.checks.is_owner()
    async def remove(self, ctx, image):
        """Deletes a specific submission."""

        image = image.lower()

        for file in glob.glob(SUBMISSION_FOLDER + '/*'):
            if re.match(r'\.?/?\\?' + SUBMISSION_FOLDER + r'/?\\?' + image + r'\..*', file):
                os.remove(file)
                await self.bot.responses.success(title="Submission Removed",
                                                 message="The submission \"" + image + "\" has been removed.")
                return

        await self.bot.responses.failure(message="The submission \"" + image + "\" does not exist.")


    async def downloadImage(self, url, folder, name, loop, chunkSize=20):
        result = {'canAccessURL': False, 'isImage': False, 'fileSaved': False}
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'Accept-Encoding': 'none',
            'Accept-Language': 'en-US,en;q=0.8',
            'Connection': 'keep-alive'}
        async with aiohttp.ClientSession(loop=loop) as session:
            async with session.get(url, headers=headers, timeout=10) as response:
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
