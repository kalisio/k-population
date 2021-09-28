# k-population

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k-population?sort=semver&label=latest)](https://github.com/kalisio/k-population/releases)
[![Build Status](https://app.travis-ci.com/kalisio/k-population.svg?branch=master)](https://app.travis-ci.com/kalisio/k-population)

A processing job used to populate demography data from the French intitute [INSEE](https://www.insee.fr/).

## Description

The **k-population** job allows to ingest the INSEE [200m grid data](https://www.insee.fr/fr/statistiques/4176290?sommaire=4176305) starting from a GeoPackage. The data are stored within a [MongoDB](https://www.mongodb.com/) database, more precisely in a `population` collection, so that spatial analysis can be performed.

All records are stored in [GeoJson](https://fr.wikipedia.org/wiki/GeoJSON) format.

## Configuration

| Variable | Description |
|--- | --- |
| `DB_URL` | The Mongo DB database URL. The default value is `mongodb://127.0.0.1:27017/kano` |
| `DB_COLLECTION` | The Mongo DB target collection. The default value is `population` |

You need to mount the input data in the `data` folder, e.g. like this on a local development environment:
```
docker build -f dockerfile -t kalisio/k-population .
docker run --name k-population --rm -it -e "DB_URL=mongodb://host.docker.internal:27017/kano" -v E:\GeoData\Filosofi2015_carreaux_200m_gpkg:/opt/k-population/data kalisio/k-population
```

## Deployment

We personally use [Kargo](https://kalisio.github.io/kargo/) to deploy the job as a before hook whenever an application requires the data.

## Contributing

Please refer to [contribution section](./CONTRIBUTING.md) for more details.

## Authors

This project is sponsored by 

![Kalisio](https://s3.eu-central-1.amazonaws.com/kalisioscope/kalisio/kalisio-logo-black-256x84.png)

## License

This project is licensed under the MIT License - see the [license file](./LICENCE) for details