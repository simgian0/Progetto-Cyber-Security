"""Flask API that answers the client and logs every request.
The existing / and /db-check routes stay; we add minimal request logging
so something appears in the container logs too (handy when tailing).
"""
from flask import Flask, request
import logging
import os
import psycopg2

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# --- simple request logger ---------------------------------------------------
@app.before_request
def log_request():
    app.logger.info("%s %s from %s", request.method, request.path, request.remote_addr)

# --- routes ------------------------------------------------------------------
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
            password=os.environ["DB_PASSWORD"],
        )
        conn.close()
        return "DB connected"
    except Exception as e:
        return str(e), 500

@app.route("/health")
def health():
    return "ok"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
