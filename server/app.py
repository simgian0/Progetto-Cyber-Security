"""Flask API that answers the client and logs every request.
The existing / and /db-check routes stay; we add minimal request logging
so something appears in the container logs too (handy when tailing).
"""
from flask import Flask, request, jsonify
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# --- simple request logger ---------------------------------------------------
@app.before_request
def log_request():
    app.logger.info("%s %s from %s", request.method, request.path, request.remote_addr)

def get_db_conn():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )

# --- routes ------------------------------------------------------------------
@app.route("/")
def home():
    return "Hello from the server!"


@app.route("/db-check")
def db_check():
    try:
        conn = get_db_conn()
        conn.close()
        return "DB connected"
    except Exception as e:
        return str(e), 500

@app.route("/health")
def health():
    return "ok"

# --- CRUD ---------------------------------

# GET drawing by id
@app.route("/drawings/<int:drawing_id>", methods=["GET"])
def get_drawing(drawing_id):
    conn = get_db_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor) # in questo modo restituisce la tupla chiave valore in modo leggibile da jsonify
    cur.execute("SELECT * FROM drawing_files WHERE id = %s", (drawing_id,))
    drawing = cur.fetchone()
    cur.close()
    conn.close()
    if drawing:
        return jsonify(drawing)
    else:
        return jsonify({"error": "Drawing not found"}), 404

# create drawing
@app.route("/drawings", methods=["POST"])
def create_drawing():
    data = request.json
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO drawing_files (name, owner_id, points, lines, texts)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (
        data["name"],
        data["owner_id"],
        data.get("points", "[]"),
        data.get("lines", "[]"),
        data.get("texts", "[]")
    ))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": new_id}), 201

# modify drawing by id
@app.route("/drawings/<int:drawing_id>", methods=["PUT"])
def update_drawing(drawing_id):
    data = request.json
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE drawing_files
        SET name = %s, points = %s, lines = %s, texts = %s
        WHERE id = %s
    """, (
        data["name"],
        data.get("points", "[]"),
        data.get("lines", "[]"),
        data.get("texts", "[]"),
        drawing_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "updated"})

# delete drawing by id
@app.route("/drawings/<int:drawing_id>", methods=["DELETE"])
def delete_drawing(drawing_id):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM drawing_files WHERE id = %s", (drawing_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "deleted"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
