import asyncio
from app.database import init_db, async_session_maker
from sqlalchemy import select
from app.models.user import User

async def main():
    await init_db()
    async with async_session_maker() as session:
        res = await session.execute(select(User))
        users = res.scalars().all()
        if not users:
            print('NO_USERS')
        for u in users:
            role = getattr(u.role, 'value', str(u.role))
            print(f"USER:{u.id}:{u.username}:{role}:{u.scope_id}:{u.hashed_password}")

if __name__ == '__main__':
    asyncio.run(main())
