const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Started");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//API 1 (Get All States)
app.get("/states/", async (request, response) => {
  const getAllStatesFromDb = `
    SELECT
    *
    FROM
    state;
    `;

  const statesArray = await database.all(getAllStatesFromDb);
  response.send(statesArray.map((eachState) => convertDbObject(eachState)));
});

//API 2 (Get State based on StateId)

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateFromDb = `
  SELECT
    *
  FROM
    state
  WHERE
    state_id = ${stateId};
  `;

  const state = await database.get(getStateFromDb);
  response.send(convertDbObject(state));
});

//API 3 (Post a district)

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const postDistrictInDb = `
  INSERT INTO
    district(district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `;

  const postDistrict = await database.run(postDistrictInDb);
  response.send("District Successfully Added");
});

//API 4 (Get district based on districtId)

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictFromDb = `
  SELECT
    *
  FROM
    district
  WHERE
    district_id = ${districtId};
  `;

  const district = await database.get(getDistrictFromDb);
  response.send(convertDistrictObject(district));
});

// API 5 (Delete District from DB based on DistrictId)

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteMovieFromDb = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};
  `;
  const district = await database.run(deleteMovieFromDb);
  response.send("District Removed");
});

// API 6 (update district based on districtId)

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};
  `;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 (Get total cases,cured,death,active from Db)

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8 (Get state name based on district id)

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
