import sqlite3
p=r'd:\\hackquest\\phc_health_db.sqlite'
conn=sqlite3.connect(p)
cur=conn.cursor()
print('tables:', [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")])
try:
    rows=list(cur.execute("SELECT id,username,hashed_password,role,scope_id FROM users"))
    print('users:', rows)
except Exception as e:
    print('users error', e)
finally:
    conn.close()
