# WFWX public datamart API

To build and test locally tl;dr, from this directory

```bash
docker pull postgis/postgis:13-3.3
docker run --name wfwx-datamart -e POSTGRES_USER=wfwx -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgis/postgis:13-3.3
docker exec -i wfwx-datamart psql -U wfwx < database/create.sql
docker build -t wfwx-dataload -f dockerfile.loader .
docker run --name wfwx-loader -e user=wfwx -e password=password -e host=172.17.0.2 -e port=5432 -e db=wfwx wfwx-dataload
docker build . -t wfwx-datamart-api
docker run --name wfwx-datamart-api -e PGUSER=wfwx -e PGPASSWORD=password -e PGHOST=172.17.0.2 -e PGPORT=5432 -e PGDATABASE=wfwx -p 1337:1337 wfwx-datamart-api
```

If the IP addresses for the postgis host don't match your system, you can fetch the correct IP with

```
docker ps
```

then copy the container ID, and

```
docker inspect <container id>
```

## Detailed instructions:

To start locally, first install postgres via docker. We use postgis to support spatial queries:

```
docker pull postgis/postgis:13-3.3
docker run --name wfwx-datamart -e POSTGRES_USER=wfwx -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgis/postgis:13-3.3
```

Add a mount if you want to use an external storage location for the data (recommended!)

Then, to create your DB schema and tables, run

```
docker exec -i wfwx-datamart psql -U wfwx < database/create.sql
```

Note: On windows, you'll need to run that command in cmd, not powershell (powershell doesn't support the < but cmd does)

This will create two tables in your WFWX schema:

- Station
- Readings

Station will contain station details, and include a geometry column to enable spatial queries

Readings will contain your hourly readings. Daily readings are included here, identified not only by the "noon" timestamp, but by the daily_ind value (true for dailies, otherwise it's just a regular hourly)

On data load, Dailies will include the daily indices values from the datamart, and a precip rollup of the day.

To load data from the datamart run the following:

```
docker build -t wfwx-dataload -f dockerfile.loader .
docker run --name wfwx-loader -e user=wfwx -e password=password -e host=172.17.0.2 -e port=5432 -e db=wfwx wfwx-dataload
```

That script will cycle through the datamart CSVs and load the data into your postgres image. This will take a while... but once it's done you'll have a DB full of data

Currently the dataload doesn't have station files, and a station dump isn't included in the repository. You will have to populate your stations from an existing source (databc catalog, for example). Note that station data will be available in the datamart in an upcoming update.

Then, fire up the API:

```
docker build . -t wfwx-datamart-api
docker run --name wfwx-datamart-api -e PGUSER=wfwx -e PGPASSWORD=password -e PGHOST=172.17.0.2 -e PGPORT=5432 -e PGDATABASE=wfwx -p 1337:1337 wfwx-datamart-api
```

This will allow you to hit the Datamart API at http://localhost:1337. Enjoy

## Using the API

The API has two main resources:

- `stations`
- `readings`

With Readings including the child resource `dailies`.

To view the swagger:

{GET} `/openapi`

to view the system health:

{GET} `/checkhealth`

To fetch stations:

{GET} `/stations`

To fetch readings:

{GET} `/readings`

To fetch Dailies only:

{GET} `/readings/dailies`

Endpoints have some default basic query params you can supply:

- page: the page number, Defaults to `0`
- rows: the number of rows to return, Defaults to `10`
- order: Column ordering, in comma separated format, with DESC or ASC setting the order: station_code,DESC,temperature,ASC
- point: A point location for using radius search, format of longitude,latitude
- radius: a radius to apply for a point radius search, in metres
- bbox: a bounding box to limit query results, format of xmin,ymin,xmax,ymax. Note: Overrides point/radius search
- query: An RSQL/FIDQ query for more advanced searching

For stations, all of the above plus:

- asGeojson: returns the station query as a feature class

For readings, the above plus:

- stations: A comma seperated list of station codes
- start: The start date/time `required`
- end: The end date/time `required`

Note that a maximum of 31 days can be returned for readings.

## RSQL

RSQL is a query language for parametrized filtering of entries in RESTful APIs.

It’s based on [FIQL](http://tools.ietf.org/html/draft-nottingham-atompub-fiql-00) (Feed Item Query Language)
a URI-friendly syntax for expressing filters across the entries in an Atom Feed.

The simplicity of RSQL and its capability to express complex queries in a compact and HTTP URI-friendly way
makes it a good candidate for becoming a generic query language for searching REST endpoints.

For example, you can query your resource like this:

`/stations?query=elevation=gt=100,station_acronym==null`

or
`/readings?query=precipitation=ge=10;danger==5`

or even

`/readings?query=precipitation>=10 and danger==5`

RSQL introduces simple and composite operators which can be used to build basic and complex queries.

### Basic operators:

| Basic Operator | Description         |
|----------------|---------------------|
| ==             | Equal To            |
| !=             | Not Equal To        |
| =gt=           | Greater Than        |
| >              | Greater Than        |
| =ge=           | Greater Or Equal To |
| >=             | Greater Or Equal To |
| =lt=           | Less Than           |
| <              | Less Than           |
| =le=           | Less Or Equal To    |
| <=             | Less Or Equal To    |
| =in=           | In                  |
| =out=          | Not in              |
| =includes-all= | Includes all        |
| =includes-one= | Includes one        |

These operators can be used to do all sort of simple queries.

### Composite operators:

| Composite Operator   | Description         |
|----------------------|---------------------|
| ;                    | Logical AND         |
| and                  | Logical AND         |
| ,                    | Logical OR          |
| or                   | Logical OR          |

These operators can be used to join the simple queries and build more involved queries which can be as complex as required.

### Fields and Values
#### Values can only consist of next regexp symbols:

* in double quotes - space, any unicode letter, any unicode number, `_`, `-`, `.`, `'`, `(`, `)`
* in single quotes - space, any unicode letter, any unicode number, `_`, `-`, `.`, `"`, `(`, `)`
* without quotes - any unicode letter, any unicode number, `_`, `-`, `.`
* with == or != operators you can also use asterisk `*` as a wildcard

### Ordering

By default, operators evaluated from left to right.
However, a parenthesized expression can be used to change the precedence.

* precipitation=lt=20;(station_name==TOBA CAMP,station_name==NICOLL)

## Data Updates

The API has a scheduled job that will run every hour at 50 minutes past the hour, which will check with the datamart and insert/update from the current hour to the maximum backfill range (configurable in the application properties)
