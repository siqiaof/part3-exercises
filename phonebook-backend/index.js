require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

morgan.token("data", function getData(req) {
  return JSON.stringify(req.body);
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("build"));
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data")
);

const Person = require("./models/person");

app.get("/api/persons", (request, response) => {
  Person.find({}).then((result) => response.json(result));
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((result) => {
      if (result) {
        response.json(result);
      } else {
        response.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.get("/info", (request, response) => {
  Person.find({}).then((result) =>
    response.send(
      `<dev><p>Phonebook has info for ${
        result.length
      } people</p> <p>${new Date()}</p></dev>`
    )
  );
});

app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => response.status(204).end())
    .catch((error) => next(error));
});

app.post("/api/persons", (request, response, next) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "name or number missing",
    });
  }

  Person.find({}).then((result) => {
    const entry = result.filter((person) => person.name == body.name)[0];
    if (entry) {
      Person.findByIdAndUpdate(
        entry.id,
        { name: body.name, number: body.number },
        { new: true }
      )
        .then((updatedPerson) => response.json(updatedPerson))
        .catch((error) => next(error));
    } else {
      const person = new Person({ name: body.name, number: body.number });
      person.save().then((result) => response.json(result));
    }
  });
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }

  next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
