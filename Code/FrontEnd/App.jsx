import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [credits, setCredits] = useState(1000);
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Web Development Bootcamp",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
      description: "Learn HTML, CSS, JavaScript, and more.",
      price: 300,
      rating: 4.5,
    },
    {
      id: 2,
      title: "Data Science with Python",
      image: "https://www.fsm.ac.in/blog/wp-content/uploads/2022/07/FUqHEVVUsAAbZB0.jpg",
      description: "Master data analysis and machine learning.",
      price: 400,
      rating: 4.8,
    },
    {
      id: 3,
      title: "Graphic Design Essentials",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
      description: "Create stunning visuals and branding.",
      price: 200,
      rating: 4.2,
    },
    {
      id: 4,
      title: "Digital Marketing Strategies",
      image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
      description: "Boost your business with online marketing.",
      price: 350,
      rating: 4.7,
    },
  ]);

  const [bag, setBag] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCourses, setFilteredCourses] = useState(courses);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setFilteredCourses(
      courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, courses]);

  /*
  
  */ 
 

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="stars">
        {Array(fullStars)
          .fill("★")
          .map((star, i) => (
            <span key={`full-${i}`} className="full-star">
              {star}
            </span>
          ))}
        {halfStar && <span className="half-star">☆</span>}
        {Array(emptyStars)
          .fill("☆")
          .map((star, i) => (
            <span key={`empty-${i}`} className="empty-star">
              {star}
            </span>
          ))}
      </div>
    );
  };

  const addToBag = (index) => {
    const selectedCourse = courses[index];
    if (bag.includes(selectedCourse)) {
      alert("This course is already in your bag!");
      return;
    }
    setBag([...bag, selectedCourse]);
  };

  const removeFromBag = (index) => {
    const updatedBag = [...bag];
    updatedBag.splice(index, 1);
    setBag(updatedBag);
  };

  const enrollCourses = async () => {
    const totalCost = bag.reduce((sum, course) => sum + course.price, 0);

    if (totalCost > credits) {
      alert("You don't have enough credits to enroll in these courses!");
      return;
    }

    try {
      const requestBody = {
        courses: bag.map((course) => ({ id: course.id })),
        totalCost,
        username,
      };

      const response = await fetch("http://localhost:5000/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.updatedCredits);
        setMyCourses([...myCourses, ...bag]);
        setBag([]);
        alert("You have successfully enrolled in the selected courses!");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to enroll in courses. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.name);
        setIsLoggedIn(true);
        setIsLoginModalOpen(false);
        alert(`Welcome, ${data.name}!`);
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      if (response.ok) {
        alert("Registration successful!");
        setIsRegisterModalOpen(false);
      } else {
        alert("Registration failed. Try a different username.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  return (
    <div className="App">
      <header>
        <div className="logo">LearnSphere</div>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#courses">Courses</a></li>
            <li><a href="#bag">My Bag</a></li>
            <li>
              {isLoggedIn ? (
                <span>Welcome, {username}</span>
              ) : (
                <>
                  <a href="#" onClick={() => setIsLoginModalOpen(true)}>Login</a> |
                  <a href="#" onClick={() => setIsRegisterModalOpen(true)}>Register</a>
                </>
              )}
            </li>
          </ul>
        </nav>
      </header>

      {isLoginModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-btn" onClick={() => setIsLoginModalOpen(false)}>&times;</span>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                  required
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      )}

      {isRegisterModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-btn" onClick={() => setIsRegisterModalOpen(false)}>&times;</span>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username"
                  required
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit">Register</button>
            </form>
          </div>
        </div>
      )}

      <main>
        <section id="home" className="banner">
          <h1>Empower Your Learning Journey</h1>
          <p>Explore thousands of online courses and enhance your skills.</p>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="credits">Credits Left: {credits}</div>
        </section>

        <section id="courses" className="course-section">
          <h2>Popular Courses</h2>
          <div className="course-container">
            {filteredCourses.map((course, index) => (
              <div className="course" key={index}>
                <img src={course.image} alt={course.title} />
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p><strong>Price:</strong> {course.price} credits</p>
                <p><strong>Rating:</strong> {renderStars(course.rating)} ({course.rating})</p>
                <button onClick={() => addToBag(index)}>Add to Bag</button>
              </div>
            ))}
          </div>
        </section>

        <section id="bag" className="bag-section">
          <h2>My Bag</h2>
          <div className="bag-container">
            {bag.length === 0 ? (
              <p>Your bag is empty. Add courses to your bag to enroll.</p>
            ) : (
              bag.map((course, index) => (
                <div className="course" key={index}>
                  <h3>{course.title}</h3>
                  <p><strong>Price:</strong> {course.price} credits</p>
                  <button onClick={() => removeFromBag(index)}>Remove</button>
                </div>
              ))
            )}
          </div>
          <button onClick={enrollCourses} disabled={bag.length === 0}>
            Enroll in Selected Courses
          </button>
        </section>

        <section id="my-courses" className="my-courses-section">
          <h2>My Courses</h2>
          <div className="my-courses-container">
            {myCourses.length === 0 ? (
              <p>You haven't enrolled in any courses yet. Enroll in a course to see it here.</p>
            ) : (
              myCourses.map((course, index) => (
                <div className="enrolled-course" key={index}>
                  <img src={course.image} alt={course.title} />
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <p><strong>Price:</strong> {course.price} credits</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2024 LearnSphere. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
