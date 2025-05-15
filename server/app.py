from flask import Flask
import os
import psycopg2

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello from the server!"

@app.route("/db-check")
def db_check():
    try:
        conn = psycopg2.connect(
            host=os.environ["DB_HOST"],
            dbname=os.environ["DB_NAME"],
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"]
        )
        return "DB connected"
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
