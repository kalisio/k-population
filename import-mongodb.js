const GeoPackageAPI = require('@ngageoint/geopackage').GeoPackageAPI
const MongoClient = require('mongodb').MongoClient
const path = require('path')
const _ = require('lodash')
const reproject = require('reproject').reproject

let count = 0

const files = [
  'Filosofi2015_carreaux_200m_metropole.gpkg',
  'Filosofi2015_carreaux_200m_reg02.gpkg',
  'Filosofi2015_carreaux_200m_reg04.gpkg'
]
const collectionName = process.env.DB_COLLECTION || 'population'
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/kano'
const chunkSize = 100
// Extract database name.  Need to remove the connections options if any
let dbName
const indexOfDBName = dbUrl.lastIndexOf('/') + 1
const indexOfOptions = dbUrl.indexOf('?')
if (indexOfOptions === -1) dbName = dbUrl.substring(indexOfDBName)
else dbName = dbUrl.substring(indexOfDBName, indexOfOptions)

async function writeChunk (collection, chunk) {
  if (_.isEmpty(chunk)) return
  await collection.bulkWrite(chunk.map(document => ({ insertOne: { document } })))
}

async function processGeoPackage (geoPackage, collection) {
  let count = 0
  // get the feature table names
  const featureTableNames = await geoPackage.getFeatureTables()
  console.log(`Found ${featureTableNames.length} tables`)
  // We write by chunk to be efficent
  let chunk = []
  // featureTableNames is an array of all feature table names
  for (let featureTableName of featureTableNames) {
    console.log(`Processing ${featureTableName} table`)
    // get the info for the table
    const featureDao = await geoPackage.getFeatureDao(featureTableName)
    const info = await geoPackage.getInfoForTable(featureDao)
    // query for all features
    for (let row of featureDao.queryForEach()) {
      const feature = featureDao.getRow(row)
      const geometry = feature.geometry
      if (geometry) {
        let geoJson = {
          type: 'Feature',
          geometry: geometry.toGeoJSON()
        }
        // Need to reproject to 4326, this should work:
        // featureDao.reprojectFeature(feature, featureDao.srs, 'EPSG:4326')
        // We use custom reprojection code instead
        geoJson = reproject(geoJson, featureDao.srs.definition, '+proj=longlat +datum=WGS84 +no_defs')

        geoJson.properties = {}
        for (let key in feature.values) {
          if (feature.values.hasOwnProperty(key) && key != feature.geometryColumn.name) {
            const column = info.columnMap[key]
            geoJson.properties[column.displayName] = feature.values[key]
          }
        }
        // Push to current chunk/count
        count++
        chunk.push(geoJson)
        if (chunk.length === program.chunkSize) {
          await writeChunk(collection, chunk)
          // Proceed with next chunk
          chunk = []
        }
      }
    }
  }
  // Proceed with last chunk
  await writeChunk(collection, chunk)
  console.log(`Processed ${count} features`)
  return count
}

async function run () {
  console.log(`Connecting to ${dbName} database on ${dbUrl}`)
  const client = await MongoClient.connect(dbUrl, { useNewUrlParser: true })
  const db = client.db(dbName)
  // Drop any existing collection
  try {
    await db.dropCollection(collectionName)
  } catch (error) {
    // If collection does not exist we do not raise
    if (error.code === 26) {
      console.log(collectionName + ' collection does not exist, skipping drop')
    } else {
      // Rethrow
      throw error
    }
  }
  let collection = await db.createCollection(collectionName)
  collection.createIndex({ geometry: '2dsphere' })

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`Processing ${file}`)
    const geoPackage = await GeoPackageAPI.open(path.join(__dirname, 'data', file))
    count += await processGeoPackage (geoPackage, collection)
  }

  await client.close()
  console.log(`Processed a total of ${count} features`)
}

run()
