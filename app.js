const { format } = require("date-fns");
const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db;
console.log(dbPath);
const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Started");
    });
  } catch (error) {
    console.log(error.message);
  }
};

initDbAndServer();

const middleWareScenarios = (request, response, next) => {
  console.log(request.query);

  const {
    status = "",
    priority = "",
    category = "",
    date = "",
  } = request.query;
  console.log(
    status === "TO DO",
    status === "WORK",
    status === "DONE",
    status === "",
    status
  );
  if (
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === ""
  ) {
    if (
      priority === "HIGH" ||
      priority === "LOW" ||
      priority === "MEDIUM" ||
      priority === ""
    ) {
      if (
        category === "WORK" ||
        category === "LEARNING" ||
        category === "HOME" ||
        category === ""
      ) {
        if (date !== undefined || date === "") {
          next();
        } else {
          response.status(400);
          response.send("Invalid Todo Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

const hasStatus = (query) => {
  const { status } = query;
  return status !== undefined;
};

const hasStatusAndPriorites = (query) => {
  const { status, priority } = query;
  console.log(query);
  return status !== undefined && priority !== undefined;
};

const hasCategoryAndPriorites = (query) => {
  const { category, priority } = query;
  return category !== undefined && priority !== undefined;
};

const hasCategoryAndStatus = (query) => {
  const { category, status } = query;
  return category !== undefined && status !== undefined;
};

const hasCategory = (query) => {
  const { category } = query;
  return category !== undefined;
};

const hasPriority = (query) => {
  const { priority } = query;
  return priority !== undefined;
};

app.get("/todos/", middleWareScenarios, async (request, response) => {
  try {
    const { status, priority, search_q = "", category } = request.query;

    let query = "";

    switch (true) {
      case hasStatusAndPriorites(request.query):
        query = ` select * from todo where status = '${status}' and priority = '${priority}'`;
        break;
      case hasCategoryAndPriorites(request.query):
        query = `select * from todo where category = '${category}' and priority = '${priority}';`;
        break;
      case hasCategoryAndStatus(request.query):
        query = `select * from todo where category = '${category}' and status = '${status}';`;
        break;
      case hasStatus(request.query):
        query = `select * from todo where status = '${status}';`;
        break;
      case hasCategory(request.query):
        query = `select * from todo where category = '${category}';`;
        break;
      case hasPriority(request.query):
        query = `select * from todo where priority = '${priority}';`;
        break;

      default:
        query = `select * from todo where todo like '%${search_q}%';`;
        break;
    }
    console.log(query);
    const dbRes = await db.all(query);
    response.send(dbRes);
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/todos/:todoId", middleWareScenarios, async (request, response) => {
  try {
    const { todoId } = request.params;
    const query = `SELECT * from todo where id=${todoId};`;

    const dbRes = await db.get(query);
    response.send(dbRes);
  } catch (error) {
    response.send(error.message);
  }
});

app.post("/todos", async (request, response) => {
  try {
    const data = request.body;
    const { id, todo, priority, status, category, dueDate } = data;

    const query = `
  insert into todo 
  (id,todo,priority,status,category,due_date) 
  values(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
    console.log(query);
    const dbRes = await db.run(query);

    response.send("Todo Successfully Added");
  } catch (error) {
    console.log(error.message);
  }
});

app.put("/todos/:todoId", async (request, response) => {
  try {
    const { todoId } = request.params;

    const { status, category, todo, priority, dueDate } = request.body;

    let queryPart1 = null;
    let flag = "";
    if (status !== undefined) {
      flag = "Status Updated";
      queryPart1 = `update todo set status = '${status}'`;
    }

    if (category !== undefined) {
      flag = "Category Updated";
      queryPart1 = `update todo set category =' ${category}'`;
    }

    if (priority !== undefined) {
      flag = "Priority Updated";
      queryPart1 = `update todo set priority =' ${priority}'`;
    }
    if (todo !== undefined) {
      flag = "Todo Updated";
      queryPart1 = `update todo set todo = '${todo}'`;
    }

    if (dueDate !== undefined) {
      flag = "Due";
      queryPart1 = `update todo set due_date = '${dueDate}'`;
    }
    const queryPart2 = ` where id = ${todoId};`;

    const query = queryPart1 + queryPart2;
    console.log(flag, query);
    const dbRes = await db.run(query);
    response.send(flag);
  } catch (error) {
    console.log(error.message);
  }
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const query = `delete from todo where id=${todoId};`;

  const dbRes = await db.run(query);
  response.send("Todo Deleted");
});

app.get("/validateData", (req, res) => {
  const { date } = req.query;
  const nDate = format(new Date(date), "yyyy-MM-dd");
  res.send(nDate);
});

module.exports = app;
