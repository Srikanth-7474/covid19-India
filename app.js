const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
};
initializeDBAndServer();

//get States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
     state_id AS stateId,
     state_name AS stateName,
     population
    FROM 
    state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

//get state API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      state_id AS stateId,
      state_name AS stateName,
      population
    FROM
     state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

//add district API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO
      district (district_name, state_id, cases, cured, active, deaths)
    values('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//get district API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
     district_id AS districtId,
     district_name AS districtName,
     state_id AS stateId,
     cases,
     cured,
     active,
     deaths
    FROM 
     district
    WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

//delete district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM
      district
    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update district API
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
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
      sum(cases) AS totalCases,
      sum(cured) AS totalCured,
      sum(active) AS totalActive,
      sum(deaths) AS totalDeaths
    FROM 
      district
    WHERE state_id = ${stateId};`;
  const stats = await db.all(getStatsQuery);
  response.send(stats);
});

//get state based on districtId API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT 
      state_name AS stateName
    FROM 
      district 
    NATURAL JOIN 
      state
    WHERE district_id = ${districtId};`;

  const state = await db.get(getStateQuery);
  response.send(state);
});

module.exports = app;
