const http = require("http");
const url = require("url");
const fs = require("fs");

const readFile = () => {
  try {
    const data = fs.readFileSync("students.json", "utf-8");
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (error) {
    console.error("Error reading or parsing json");
  }
};

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const fullUrl = new URL(url, `http://${req.headers.host}`);
  const path = fullUrl.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  let studentData;

  if (
    method === "GET" &&
    path === "/students" &&
    !fullUrl.searchParams.has("course")
  ) {
    try {
      studentData = JSON.stringify(readFile(), null, 2);
      studentData.sort((a, b) => a.name.localCompare(b.name));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(studentData);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      let errorMessage = {
        error: "An error occurred",
        details: error.message,
      };
      res.end(JSON.stringify(errorMessage));
    }
  } else if (
    method === "GET" &&
    path.startsWith("/students") &&
    fullUrl.searchParams.has("course")
  ) {
    const course = fullUrl.searchParams.get("course");
    let result;
    try {
      if (course) {
        studentData = readFile();
        result = studentData.filter(
          (s) => s.course.toLowerCase() === course.toLowerCase()
        );

        if (result.length === 0) {
          result = { message: `No students found for the  ${course}` };
        }
      } else {
        result = { message: "please provide a valid query" };
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      let errorMessage = {
        error: "Course doesn't exist",
        details: error.message,
      };
      res.end(JSON.stringify(errorMessage));
    }
  } else if (method === "GET" && path.startsWith("/students/")) {
    let id = parseInt(path.split("/")[2]);
    let student;
    try {
      studentData = readFile();
      if (id <= studentData.length) {
        student = studentData.find((s) => Number(s.id) === id);
      } else {
        student = { message: `No student found for this ID: ${id}` };
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(student));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      let errorMessage = {
        details: error.message,
      };
      res.end(JSON.stringify(errorMessage));
    }
  } else if (method === "POST" && path === "/students") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        studentData = readFile();
        const newStudent = JSON.parse(body);
        if (!newStudent.name && !newStudent.course) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ error: `Student must have a name and a course` })
          );
          return;
        }

        newStudent.id =
          studentData.length > 0
            ? Math.max(...studentData.map((s) => s.id)) + 1
            : 1;
        studentData.push(newStudent);

        fs.writeFileSync(
          "students.json",
          JSON.stringify(studentData[index], null, 2)
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(newStudent, null, 2));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (method === "PUT" && path.startsWith("/students/")) {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));

    let id = parseInt(path.split("/")[2]);

    req.on("end", () => {
      studentData = readFile();
      console.log(studentData);
      const updatedStudent = JSON.parse(body);
      let index = studentData.findIndex((s) => s.id === id);
      console.log(index);
      try {
        if (index === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "student not found" }));
        } else {
          studentData[index] = {
            ...studentData[index],
            ...updatedStudent,
          };
          fs.writeFileSync(
            "students.json",
            JSON.stringify(studentData, null, 2)
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(studentData[index]));
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (method === "DELETE" && path.startsWith("/students/")) {
    studentData = readFile();
    let id = parseInt(path.split("/")[2]);
    let index = studentData.findIndex((s) => s.id === id);
    let exist = studentData.some((s) => s.id == -id);

    if (!exist) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "student not found" }));
      return;
    }
    studentData = studentData.filter((s) => s.id !== id);
    fs.writeFileSync("students.json", JSON.stringify(studentData, null, 2));

    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(8080, () => {
  console.log(`Server running at http://localhost:8080/`);
});
