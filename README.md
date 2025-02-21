# MongoDB Web-Based CLI (Development In-Progress)

## Overview
As a teacher, I know firsthand how challenging it can be to teach MongoDB in a classroom setting when hardware resources are limited. In my case, I work with Chromebooks—great for many tasks but impractical for installing tools like MongoDB Compass, especially when managing a large number of students. Setting up Linux development environments on Chromebooks was not a scalable solution either, given the time and technical overhead involved.

To address this, I developed the **MongoDB Web-Based CLI**—a lightweight, browser-based tool that allows students to interact with MongoDB without requiring any local installations. This tool connects directly to MongoDB instances hosted on our classroom servers, providing each student with secure, isolated access to practice MongoDB commands in real-time. 

This project is designed to make learning MongoDB accessible and engaging, even in environments with limited hardware capabilities. It eliminates the need for complex setups, allowing students to focus on mastering MongoDB concepts through hands-on experimentation.

![Connection Form](/screenshots/connection.png)  
![Results Screen](/screenshots/results.png)

---

## Features
- **Web-Based Interface**: No need to install MongoDB or Compass locally; everything runs in the browser.
- **Interactive Learning**: Execute MongoDB commands and see results instantly.
- **Lightweight**: Optimized for low-resource devices.
- **Secure Sandbox**: Each user session operates in an isolated environment to ensure safety and prevent interference.
- **Educational Focus**: Tailored for classroom use, encouraging experimentation and learning.

---

## Getting Started

### Prerequisites
1. A modern web browser (e.g., Google Chrome, Firefox).
2. An active internet connection.
3. Basic MongoDB knowledge (optional but helpful).

### Setup Instructions
1. **Access the Application**:
   - Open your browser and navigate to the hosted URL provided by your instructor (e.g., `https://your-mongodb-cli-domain.com`).
2. **Login** (if required):
   - Use credentials provided by your instructor to access a secure sandbox environment.
3. **Start Exploring**:
   - You’ll see a command-line interface (CLI) where you can type MongoDB commands:
     ```javascript
     // Insert a document into a collection
     db.myCollection.insertOne({ "name": "John", "age": 25 });
     // Query documents
     db.myCollection.find({ "age": 20 });
     ```
4. **Experiment Freely**:
   - Create databases, collections, insert data, query data, and more. Mistakes are encouraged—this is a safe learning environment!

---

## How It Works
The MongoDB Web-Based CLI connects to a backend server that facilitates communication with **existing MongoDB instances**. Students provide a valid MongoDB connection string (e.g., for a cloud-hosted database or a local instance) to establish a connection.

Each user session is isolated, ensuring secure and independent interaction with the database. The frontend sends commands to the backend via an API, which then forwards these commands to the connected MongoDB instance. Results are fetched and displayed in real-time.

**Note:** Currently, the tool supports only simple queries such as `find`, `insertOne`, `updateOne`, and `deleteOne`. Support for more advanced queries and operations will be added in future updates.

---

## Why Use This Tool?
- **Accessibility**: Eliminates the need for local installations, ideal for classrooms with limited hardware.
- **Ease of Use**: A simple, intuitive interface lets students focus on learning MongoDB.
- **Scalability**: Supports multiple users simultaneously, making it suitable for large classrooms.
- **Cost-Effective**: Reduces the need for expensive hardware.

---

## Limitations
While this tool is great for learning, keep these limitations in mind:
1. **Performance**: Shared backend performance may vary with concurrent users.
2. **Feature Set**: Not all MongoDB features are supported.
3. **Temporary Data**: Data created during a session does not persist after the session ends, ensuring a clean slate for each user.

---

## Contributing
We welcome contributions from educators, developers, and students! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

For major changes, please open an issue first to discuss your ideas.

---

## Support
If you encounter issues or have questions, contact your instructor or open an issue on the project's GitHub repository.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy Learning! 🚀
