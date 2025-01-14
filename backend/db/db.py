import sqlite3
import json


def create_hashes_database(database_path="hashes.db"):
    try:
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()

        # Create table if it doesn't exist
        cursor.execute(
            """
      CREATE TABLE IF NOT EXISTS file_hashes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_name TEXT NOT NULL,
          labels TEXT,
          file_hash TEXT,
          error_message TEXT
      )
      """
        )
        conn.commit()
    except sqlite3.Error as e:
        # Handle SQLite errors
        print(f"Error creating hash db: {e}")
    except Exception as e:
        # Handle other unexpected errors
        print(f"An unexpected error occurred create: {e}")
    finally:
        # Close the connection if it was established
        if "conn" in locals():
            conn.close()


def store_file_hash_in_db(
    file_name, labels, file_hash, error_message=None, database_path="hashes.db"
):
    try:
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()

        # Insert file info into the database
        cursor.execute(
            """
      INSERT INTO file_hashes (file_name, labels, file_hash, error_message)
      VALUES (?, ?, ?, ?)
      """,
            (file_name, str(labels), file_hash, error_message),
        )

        conn.commit()
    except sqlite3.Error as e:
        # Handle SQLite errors
        print(f"Error storing hash: {e}")
    except Exception as e:
        # Handle other unexpected errors
        print(f"An unexpected error occurred store: {e}")
    finally:
        # Close the connection if it was established
        if "conn" in locals():
            conn.close()


def get_hash_by_filename(database_path="hashes.db", filename=None):

    if filename is None:
        raise ValueError("Filename is required")

    try: 
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()

        # Query the database for the hash
        cursor.execute(
            """
            SELECT *
            FROM file_hashes
            WHERE file_name = ?
            """,
            (filename,),
        )

        result = cursor.fetchone()
        if result:
            columns = [description[0] for description in cursor.description]
            result_json = dict(zip(columns, result))
            result_json = json.dumps(result_json)
        else:
            return None
        conn.close()

        if result_json:
            return result_json
        else:
            return None
    except sqlite3.Error as e:
        # Handle SQLite errors
        print(f"Error retrieving hash: {e}")
        return None
    except Exception as e:
        # Handle other unexpected errors
        print(f"An unexpected error occurred get: {e}")
        return None
