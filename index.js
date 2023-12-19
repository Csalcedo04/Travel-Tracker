import express from "express";
import bodyParser from "body-parser";
import pg from "pg"

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function pais (){
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}


app.get("/", async (req, res) => {
  var data = await pais();
  console.log(data.map(str => str.replace(/\s/g, '')))
  res.render("index.ejs", { countries: data.map(str => str.replace(/\s/g, '')) , total: data.length }); // the ".map" function is used to iterate over each element of the data array, and the replace function is used with a regular expression (/\s/g) to remove all white spaces (\s) globally (g) from each string. 
});


app.post("/add", async (req, res) => {
  var country = req.body["country"]
  try{
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[country.toLowerCase()]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    try{
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
        countryCode,
      ]);
      res.redirect("/");
    }catch(err){
      console.log(err);
      const countries = await pais();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again",
      })
    }
  }catch(err){
    console.log(err);
    const countries = await pais();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    })
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
