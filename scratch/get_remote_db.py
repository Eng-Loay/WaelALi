import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('77.237.232.181', port=2222, username='root', password='*1h*1£7N+oP"', timeout=30)

def run_query(q):
    print("=== QUERY:", q)
    cmd = f"mysql -u adminanmkavps_waelali -p'}}-{{!Bq2Q=:M/y4aD' adminanmkavps_waelali -e \"{q}\""
    _, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("ERR:", err)

run_query("SELECT * FROM students")
run_query("SELECT * FROM enrollments")
client.close()

