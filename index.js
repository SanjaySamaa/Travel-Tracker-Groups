import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "bhabiteradewardiwana",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// let users = [
//   { id: 1, name: "Sanjay", color: "red" },
//   { id: 2, name: "Sanjay2", color: "blue" },
// ];



let currentUser = 1;

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users on users.id = user_id where user_id = $1",[currentUser]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getUser(){
  let user = await db.query("SELECT * FROM USERS");
  return user.rows.find((u)=> u.id == currentUser);

}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const user = await getUser();
  let users = await db.query('SELECT * FROM USERS');
  users = users.rows;
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: user.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add == "new"){
    res.render("new.ejs");
    return
  }
  currentUser = req.body.user;
  res.redirect("/");
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body.name;
  const color = req.body.color
  try{
  const result = await db.query('INSERT INTO users (name,color) values ($1,$2) RETURNING *',[name,color]);
  const id = result.rows[0].id;
  currentUser = id;
  }catch(e){
    console.log(e);
    res.redirect('/');
  }
  
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
