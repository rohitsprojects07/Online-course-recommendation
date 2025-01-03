const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create a connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "learnsphere",
});

// Database initialization function
const initializeDatabase = async () => {
  try {
    // Connect to MySQL server to ensure the database exists
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
    });

    // Create the database if it doesn't exist
    await connection.query("CREATE DATABASE IF NOT EXISTS learnsphere");
    console.log("Database 'learnsphere' created or already exists.");
    connection.end();

    // Proceed with the connection pool
    const poolConnection = await db.getConnection();

    // Create users table
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          credits INT DEFAULT 1000
      );
    `);

    // Create courses table
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          image TEXT NOT NULL,
          price INT NOT NULL
      );
    `);

    // Create enrollments table
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          course_id INT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (course_id) REFERENCES courses(id)
      );
    `);

    console.log("Tables created successfully.");

    // Insert default courses
    const insertCoursesQuery = `
      INSERT INTO courses (title, description, image, price)
      SELECT title, description, image, price
      FROM (
          SELECT 
              'Web Development Bootcamp' AS title,
              'Learn HTML, CSS, JavaScript, and more.' AS description,
              'https://images.unsplash.com/photo-1522071820081-009f0129c71c' AS image,
              300 AS price
          UNION ALL SELECT
              'Data Science with Python',
              'Master data analysis and machine learning.',
              'https://www.fsm.ac.in/blog/wp-content/uploads/2022/07/FUqHEVVUsAAbZB0.jpg',
              400
          UNION ALL SELECT
              'Graphic Design Essentials',
              'Create stunning visuals and branding.',
              'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
              200
          UNION ALL SELECT
              'Digital Marketing Strategies',
              'Boost your business with online marketing.',
              'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
              350
      ) AS tmp
      WHERE NOT EXISTS (
          SELECT 1 FROM courses WHERE courses.title = tmp.title
      );
    `;
    await poolConnection.query(insertCoursesQuery);
    console.log("Default courses inserted successfully.");

    poolConnection.release();
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};


initializeDatabase();

// Routes
app.post("/auth/register", async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (name, username, password) VALUES (?, ?, ?)";
    await db.execute(query, [name, username, hashedPassword]);
    res.status(201).send("User registered successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user. Try a different username.");
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);

    if (results.length === 0) return res.status(404).send("User not found!");

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return res.status(401).send("Invalid credentials!");

    res.status(200).send({
      message: "Login successful!",
      userId: user.id,
      name: user.name,
      credits: user.credits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in.");
  }
});

app.put("/users/credits", async (req, res) => {
  const { userId, newCredits } = req.body;

  try {
    await db.execute("UPDATE users SET credits = ? WHERE id = ?", [newCredits, userId]);
    res.status(200).send("Credits updated successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating credits.");
  }
});

app.get("/users/credits/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await db.execute("SELECT credits FROM users WHERE id = ?", [userId]);
    if (results.length === 0) return res.status(404).send("User not found!");

    res.status(200).send({ credits: results[0].credits });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching credits.");
  }
});

// app.post("/enroll", async (req, res) => {
//   const { userId, courseIds } = req.body;

//   try {
//     // Fetch total cost of selected courses
//     const [courseDetails] = await db.query(
//       `SELECT SUM(price) AS totalCost FROM courses WHERE id IN (?)`,
//       [courseIds]
//     );

//     const totalCost = courseDetails[0].totalCost;

//     // Fetch user credits
//     const [userDetails] = await db.query("SELECT credits FROM users WHERE id = ?", [userId]);

//     if (userDetails.length === 0) return res.status(404).send("User not found!");

//     const userCredits = userDetails[0].credits;

//     if (userCredits < totalCost) {
//       return res.status(400).send("Not enough credits to enroll in selected courses.");
//     }

//     // Deduct credits and enroll user in courses
//     await db.query("UPDATE users SET credits = ? WHERE id = ?", [userCredits - totalCost, userId]);
//     for (const courseId of courseIds) {
//       await db.query("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, courseId]);
//     }

//     res.status(200).send("Enrollment successful!");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error enrolling in courses.");
//   }
// });

app.post("/enroll", async (req, res) => {
  const { courses, totalCost, username } = req.body;
  console.log("Received Enroll Request:", req.body);

  try {
    // Validate user
    const [user] = await db.query("SELECT id, credits FROM users WHERE username = ?", [username]);
    if (user.length === 0) {
      console.error("User not found:", username);
      return res.status(404).json({ error: "User not found." });
    }

    // Check user credits
    if (user[0].credits < totalCost) {
      console.error("Not enough credits:", user[0].credits, totalCost);
      return res.status(400).json({ error: "Not enough credits." });
    }

    // Validate courses
    const courseIds = courses.map((course) => course.id);
    const [validCourses] = await db.query(
      "SELECT id FROM courses WHERE id IN (?)",
      [courseIds]
    );
    if (validCourses.length !== courseIds.length) {
      console.error("Invalid course IDs:", courseIds);
      return res.status(400).json({ error: "Invalid courses selected." });
    }

    // Deduct credits
    await db.query("UPDATE users SET credits = credits - ? WHERE id = ?", [totalCost, user[0].id]);

    // Add enrollments
    const enrollmentValues = courseIds.map((courseId) => [user[0].id, courseId]);
    await db.query("INSERT INTO enrollments (user_id, course_id) VALUES ?", [enrollmentValues]);

    // Fetch updated credits
    const [updatedUser] = await db.query("SELECT credits FROM users WHERE id = ?", [user[0].id]);

    console.log("Enrollment Successful:", { updatedCredits: updatedUser[0].credits });
    res.json({ success: true, updatedCredits: updatedUser[0].credits });
  } catch (error) {
    console.error("Error enrolling courses:", error);
    res.status(500).json({ error: "Failed to enroll in courses." });
  }
});



// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
