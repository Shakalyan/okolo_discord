import asyncio
import websockets
import json

clients_pool = set()

async def handler(websocket):
    while True:
        try:
            message = await websocket.recv()
        except websockets.exceptions.ConnectionClosedOK:
            print('Connection closed')
            clients_pool.remove(websocket)
            print(f'Pool size: {len(clients_pool)}')
            break
        
        print(message)
        message_dict = json.loads(message)

        if message_dict['type'] == 'start_call':
            for client in clients_pool:
                await client.send(message)
            clients_pool.add(websocket)
        elif message_dict['type'] == 'offer':
            for client in clients_pool:
                if websocket != client:
                    await client.send(message)
        elif message_dict['type'] == 'answer':
            for client in clients_pool:
                if websocket != client:
                    await client.send(message)
        elif message_dict['type'] == 'candidate':
            for client in clients_pool:
                if websocket != client:
                    await client.send(message)
    
        print(f'Pool size: {len(clients_pool)}')


async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
    print('test')