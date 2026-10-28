import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "trafficpulse.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'reported',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def get_incidents():
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT id, type, latitude, longitude,
                   severity, description, status, created_at
            FROM incidents
            ORDER BY id DESC
        """).fetchall()

    return [dict(row) for row in rows]


def add_incident(incident):
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO incidents
                (type, latitude, longitude, severity, description, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            incident["type"],
            incident["latitude"],
            incident["longitude"],
            incident["severity"],
            incident["description"],
            incident.get("status", "reported")
        ))

        return cursor.lastrowid


def update_incident(incident_id, status):
    with get_connection() as conn:
        cursor = conn.execute("""
            UPDATE incidents
            SET status = ?
            WHERE id = ?
        """, (status, incident_id))

        return cursor.rowcount > 0