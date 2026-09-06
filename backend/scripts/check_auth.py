import asyncio
from app.database import init_db, async_session_maker
from app.services.auth_service import authenticate_user

async def main():
    await init_db()
    async with async_session_maker() as session:
        user = await authenticate_user(session, 'admin', 'password123')
        print('auth result:', user)

if __name__ == '__main__':
    asyncio.run(main())
