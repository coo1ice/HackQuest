import asyncio
import asyncpg

async def check_pg():
    try:
        conn = await asyncpg.connect('postgresql://postgres:123456@localhost:5432/nhrm_india')
        dbs = await conn.fetch("SELECT datname FROM pg_database WHERE datistemplate = false;")
        print("Databases in Postgres:", [d['datname'] for d in dbs])
        
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        print("Tables in nhrm_india:", [t['table_name'] for t in tables])
        
        # Check phcs table
        phc_count = await conn.fetchval("SELECT count(*) FROM phcs;")
        states = await conn.fetch("SELECT state_id, count(*) as count FROM phcs GROUP BY state_id ORDER BY state_id;")
        print(f"Total PHCs: {phc_count}")
        print(f"Total Distinct States in PHCs table: {len(states)}")
        for s in states:
            print(f"  {s['state_id']}: {s['count']} PHCs")
        
        await conn.close()
    except Exception as e:
        print("Error checking PG:", e)

if __name__ == '__main__':
    asyncio.run(check_pg())
