import logging
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game

logger = logging.getLogger(__name__)

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        try:
            game = Game.objects.get(id=self.room_name)
        except Game.DoesNotExist:
            await self.close()

        if game.status == 'in_progress':
            await self.send(text_data=json.dumps({
                'type': 'start_game',
                'message': 'La partie commence !'
            }))

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')


        if message_type == 'player_joined':
            try:
                game = Game.objects.get(id=self.room_name)
                game.player_count += 1
                game.save()

                if game.player_count >= 2:
                    game.status = 'in_progress'
                    game.save()
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'start_game',
                            'message': 'La partie commence !'
                        }
                    )
            except Game.DoesNotExist:
                logger.error(f"Game with id {self.room_name} does not exist.")

    async def start_game(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))
