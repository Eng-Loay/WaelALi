#!/usr/bin/env python3
import sys
import paramiko

EMAIL = sys.argv[1] if len(sys.argv) > 1 else 'essamloay2@gmail.com'
SSH_HOST = '77.237.232.181'
SSH_PORT = 2222
SSH_USER = 'root'
SSH_PASS = '*1h*1£7N+oP"'
DB_USER = 'adminanmkavps_waelali'
DB_PASS = '}-{!Bq2Q=:M/y4aD'
DB_NAME = 'adminanmkavps_waelali'

sql = f"""
DELETE e FROM enrollments e
JOIN students s ON s.id = e.student_id
WHERE LOWER(s.email) = LOWER('{EMAIL}');
DELETE FROM students WHERE LOWER(email) = LOWER('{EMAIL}');
DELETE FROM subscribers WHERE LOWER(email) = LOWER('{EMAIL}');
SELECT COUNT(*) AS remaining FROM students WHERE LOWER(email) = LOWER('{EMAIL}');
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS, timeout=30)
cmd = f"mysql -u {DB_USER} -p'{DB_PASS}' {DB_NAME} -e \"{sql}\""
_, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print(err)
client.close()
