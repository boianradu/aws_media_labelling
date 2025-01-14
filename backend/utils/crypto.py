import hashlib


def calculate_file_hash(file_path, hash_algorithm="sha256") -> str:
    """
    Calculate the hash of a file using the specified hashing algorithm.

    Args:
        file_path (str): Path to the file.
        hash_algorithm (str): Hashing algorithm to use ('md5', 'sha1', 'sha256', etc.).

    Returns:
        str: Hexadecimal hash of the file.
    """
    try:
        hash_func = hashlib.new(hash_algorithm)
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                hash_func.update(chunk)

        return hash_func.hexdigest()
    except FileNotFoundError:
        return "File not found."
    except ValueError:
        return f"Invalid hash algorithm: {hash_algorithm}"
