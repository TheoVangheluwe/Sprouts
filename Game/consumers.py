import logging
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game

logger = logging.getLogger(__name__)

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.debug("Connect method called")
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        logger.info(f"User connected to room: {self.room_name}")

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        try:
            game = Game.objects.get(id=self.room_name)
            logger.info(f"Game {self.room_name} status: {game.status}, players: {game.player_count}")
        except Game.DoesNotExist:
            logger.error(f"Game with id {self.room_name} does not exist.")
            await self.close()

        if game.status == 'in_progress':
            await self.send(text_data=json.dumps({
                'type': 'start_game',
                'message': 'La partie commence !'
            }))

    async def disconnect(self, close_code):
        logger.debug("Disconnect method called")
        logger.info(f"User disconnected from room: {self.room_name}")

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        logger.debug("Receive method called")
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        logger.info(f"Received message of type: {message_type} in room: {self.room_name}")

        if message_type == 'player_joined':
            try:
                game = Game.objects.get(id=self.room_name)
                game.player_count += 1
                game.save()

                if game.player_count >= 2:
                    game.status = 'in_progress'
                    game.save()
                    logger.info(f"Game {self.room_name} started with {game.player_count} players.")
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
        logger.debug("Start_game method called")
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))