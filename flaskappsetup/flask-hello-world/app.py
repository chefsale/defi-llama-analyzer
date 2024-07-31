from flask import Flask, jsonify
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return 'Hello, World!'

@app.route('/data')
def data():
    with open('data.json') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/defillama')
def defillama():
    with open('defillama.json') as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)



