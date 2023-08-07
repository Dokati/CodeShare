

from flask import Flask, request, jsonify, send_from_directory
from pymongo import MongoClient
import os
from flask_cors import CORS  # Import Flask-CORS



app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Replace with a secret key for security
CORS(app)  # Enable CORS for all routes

# MongoDB configuration
MONGO_URI = "mongodb+srv://dorkk9:Az3pWutFIISCeSe7@cluster0.3ojdtxw.mongodb.net/?retryWrites=true&w=majority"  # Replace with your MongoDB URI
DB_NAME = "test"  # Replace with your database name

# MongoDB connection
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db['data_collection']


@app.route('/')
def hello():
    return 'Hello, Flask Server!'

@app.route('/update_code_text', methods=['PUT'])
def update_code_text():
    try:
        # Get the block_id and code_text from the request
        data = request.json
        block_id = data.get('block_id')
        code_text = data.get('code_text')

        # Check if the block_id exists in the collection
        if not collection.find_one({'block_id': block_id}):
            return jsonify({'error': 'Block ID not found.'}), 404

        # Update the 'code_text' field for the corresponding block_id
        collection.update_one({'block_id': block_id}, {'$set': {'code_text': code_text}})

        return jsonify({'message': 'Code text updated successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/get_all_data', methods=['GET'])
def get_all_data():
    collection = db['data_collection']

    # Fetch all the documents from the collection
    all_data = list(collection.find({}, {'_id': False}))  # Exclude the "_id" field from the response

    return jsonify(all_data)

@app.route('/create', methods=['POST'])
def create_data():
    data = request.json  # Assuming data is sent as JSON in the request body
    block_id = data.get('block_id')
    block_name = data.get('block_Name')
    code_text = data.get('code_text')

    # Insert the data into the database
    collection = db['data_collection']
    result = collection.insert_one({
        "block_id": block_id,
        "block_Name": block_name,
        "code_text": code_text
    })
    return jsonify({'message': 'Data created successfully', 'id': str(result.inserted_id)})


# Function to check MongoDB connection status
def check_mongodb_connection():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        db.list_collection_names()  # This line will raise an exception if the connection fails
        return True
    except Exception as e:
        return False

@app.route('/connection', methods=['GET'])
def check_connection():
    status = check_mongodb_connection()
    print(status)
    if status:
        return jsonify({'message': 'Connection to MongoDB server is OK'})
    else:
        return jsonify({'message': 'Failed to connect to MongoDB server'})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)