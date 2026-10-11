import os
from datetime import date

import mysql.connector
from flask import Flask, jsonify, render_template, request
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "research_portal"),
    )


def opportunity_from_row(row):
    return {
        "id": row[0],
        "title": row[1],
        "description": row[2],
        "research_area": row[3],
        "faculty_name": row[4],
        "department": row[5],
        "required_skills": row[6],
        "positions": row[7],
        "deadline": row[8].isoformat() if row[8] else None,
        "status": row[9],
    }


def get_opportunity(opportunity_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute(
        """SELECT id, title, description, research_area, faculty_name,
                  department, required_skills, positions, deadline, status
           FROM opportunities WHERE id = %s""",
        (opportunity_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    connection.close()
    return opportunity_from_row(row) if row else None


def validate_opportunity(data):
    required_fields = [
        "title", "description", "research_area", "faculty_name",
        "department", "required_skills", "positions", "deadline", "status"
    ]
    errors = {}
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == "":
            errors[field] = "This field is required."

    if "positions" in data and str(data.get("positions", "")).strip() != "":
        try:
            positions = int(data["positions"])
            if positions < 1:
                errors["positions"] = "Positions must be at least 1."
        except (TypeError, ValueError):
            errors["positions"] = "Positions must be a whole number."

    if data.get("status") not in (None, "Open", "Closed"):
        errors["status"] = "Status must be Open or Closed."

    if data.get("deadline"):
        try:
            date.fromisoformat(str(data["deadline"]))
        except ValueError:
            errors["deadline"] = "Deadline must use YYYY-MM-DD format."

    return errors


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/opportunities")
def get_all_opportunities():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """SELECT id, title, description, research_area, faculty_name,
                      department, required_skills, positions, deadline, status
               FROM opportunities ORDER BY id DESC"""
        )
        rows = cursor.fetchall()
        return jsonify([opportunity_from_row(row) for row in rows]), 200
    except Error:
        app.logger.exception("Could not retrieve opportunities")
        return jsonify({"error": "Database error while retrieving opportunities."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.get("/api/opportunities/<int:opportunity_id>")
def get_one_opportunity(opportunity_id):
    try:
        opportunity = get_opportunity(opportunity_id)
        if not opportunity:
            return jsonify({"error": "Research opportunity not found."}), 404
        return jsonify(opportunity), 200
    except Error:
        app.logger.exception("Could not retrieve opportunity")
        return jsonify({"error": "Database error while retrieving opportunity."}), 500


@app.post("/api/opportunities")
def create_opportunity():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON."}), 400
    errors = validate_opportunity(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """INSERT INTO opportunities
               (title, description, research_area, faculty_name, department,
                required_skills, positions, deadline, status)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                data["title"].strip(), data["description"].strip(),
                data["research_area"].strip(), data["faculty_name"].strip(),
                data["department"].strip(), data["required_skills"].strip(),
                int(data["positions"]), data["deadline"], data["status"],
            ),
        )
        connection.commit()
        new_id = cursor.lastrowid
        cursor.close()
        cursor = None
        connection.close()
        return jsonify(get_opportunity(new_id)), 201
    except Error:
        app.logger.exception("Could not create opportunity")
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({"error": "Database error while creating opportunity."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.put("/api/opportunities/<int:opportunity_id>")
def update_opportunity(opportunity_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON."}), 400
    errors = validate_opportunity(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """UPDATE opportunities SET title=%s, description=%s, research_area=%s,
               faculty_name=%s, department=%s, required_skills=%s, positions=%s,
               deadline=%s, status=%s WHERE id=%s""",
            (
                data["title"].strip(), data["description"].strip(),
                data["research_area"].strip(), data["faculty_name"].strip(),
                data["department"].strip(), data["required_skills"].strip(),
                int(data["positions"]), data["deadline"], data["status"], opportunity_id,
            ),
        )
        if cursor.rowcount == 0:
            cursor.close()
            cursor = None
            connection.close()
            existing = get_opportunity(opportunity_id)
            if not existing:
                return jsonify({"error": "Research opportunity not found."}), 404
            return jsonify(existing), 200
        connection.commit()
        cursor.close()
        cursor = None
        connection.close()
        return jsonify(get_opportunity(opportunity_id)), 200
    except Error:
        app.logger.exception("Could not update opportunity")
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({"error": "Database error while updating opportunity."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.delete("/api/opportunities/<int:opportunity_id>")
def delete_opportunity(opportunity_id):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM opportunities WHERE id = %s", (opportunity_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Research opportunity not found."}), 404
        connection.commit()
        return jsonify({"message": "Research opportunity deleted successfully."}), 200
    except Error:
        app.logger.exception("Could not delete opportunity")
        if connection and connection.is_connected():
            connection.rollback()
        return jsonify({"error": "Database error while deleting opportunity."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.errorhandler(404)
def page_not_found(error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "API endpoint not found."}), 404
    return "Page not found", 404


if __name__ == "__main__":
    app.run(debug=True)
