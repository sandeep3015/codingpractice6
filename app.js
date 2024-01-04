const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

const initialiseDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.database,
    })

    app.listen(3000, () => {
      consoloe.log('Server runing at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Database Error ${e.message}`)
    process.exit(1)
  }
}

initialiseDbAndServer()

//API 1

app.get('/states/', async (request, response) => {
  const stateNamesQuery = `SELECT * FRO state`

  const statesArray = await db.all(stateNamesQuery)

  response.send(
    statesArray.map((eachState) => {
      convertDbObjectToResponseObject(eachState)
    }),
  )
})

//API 2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateNameQuery = `SELECT * FROM state WHERE stateId = ${stateId}`

  const stateDetails = await db.get(stateNameQuery)

  response.send(convertDbObjectToResponseObject(stateDetails))
})

//API 3

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body

  const {districtName, stateId, cases, cured, active, deaths} = createDistrict

  const createDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths) VALUES ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}')`

  const dbResponse = await db.run(createDistrictQuery)
  const newDistrict = dbResponse.lastID
  response.send('District Successfully Added')
})

//API 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtInfoQuery = `SELECt * FROM district WHERE districtId = ${districtId}`

  const districtArray = await db.get(districtInfoQuery)
  response.send(convertDbObjectToResponseObject(districtArray))
})

//API 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const deleteDistrictQuery = `DELETE FROM district WHERE districtId = ${districtId}`

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//API 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}', state_id = '${stateId}', cases = '${cases}', cured = '${cured}', active = '${active}', deaths = '${deaths}' WHERE district_id = '${districtId}'`

  await db.run(updateDistrictQuery)

  response.send('District Details Updated')
})

//API 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const allStatesCountQuery = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district WHERE state_id = ${stateId}`

  const stateDetails = await db.run(allStatesCountQuery)

  response.send({
    totalCases: stateDetails['SUM(cases)'],
    totalCured: stateDetails['SUM(cured)'],
    totalActive: stateDetails['SUM(active)'],
    totalDeaths: stateDetails['SUM(deaths)'],
  })
})

//API 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const stateQuery = `SELECT state_name FROM state NATURAL JOIN district WHERE district_id = ${districtId}`

  const stateName = await db.get(stateQuery)
  response.send(convertDbObjectToResponseObject(stateName))
})

module.exports = app
