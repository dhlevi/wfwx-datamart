CREATE ROLE "app_wfwx_datamart" WITH
  LOGIN
  NOSUPERUSER
  INHERIT
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  PASSWORD 'password';

COMMENT ON ROLE "app_wfwx_datamart" IS 'WFWX Datamart DB';

CREATE ROLE "app_wfwx_datamart_custodian";

CREATE SCHEMA "wfwx";

GRANT ALL ON SCHEMA "wfwx" TO "app_wfwx_datamart";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE "wfwx"."station"
(
  "station_name" VARCHAR(120) NOT NULL,
  "station_code" INTEGER NOT NULL,
  "station_acronym" VARCHAR(3),
  "latitude" DECIMAL(8,6),
  "longitude" DECIMAL(9,6),
  "elevation" DECIMAL(10,4),
  "slope" DECIMAL(10,4),
  "aspect" VARCHAR(10),
  "windspeed_height" VARCHAR(10),
  "adjusted_roughness" VARCHAR(10),
  "geometry" geometry(Point, 4326) NULL
);

/* Create Primary Keys, Indexes, Uniques, Checks */

ALTER TABLE "wfwx"."station" ADD CONSTRAINT "stn_pk" PRIMARY KEY ("station_code");
ALTER TABLE "wfwx"."station" ADD CONSTRAINT "stn_uk" UNIQUE ("station_name","station_code");

CREATE INDEX "stn_name_idx" ON "wfwx"."station" ("station_name" ASC);
CREATE INDEX "stn_code_idx" ON "wfwx"."station" ("station_code" ASC);
CREATE INDEX "stn_point_geom_idx" ON "wfwx"."station" USING gist("geometry"); 
CREATE INDEX "stn_point_geog_idx" ON "wfwx"."station" USING gist(geography("geometry"));

--Create Function for trigger that sets the point_geom and point_geom_buffered columns
CREATE OR REPLACE FUNCTION set_geometries()
  RETURNS trigger 
  LANGUAGE PLPGSQL AS
'
BEGIN
  IF ((NEW.latitude IS NOT NULL) AND (NEW.longitude IS NOT NULL)) THEN
    --Set Point Geometery
    New.geometry = ST_SetSRID(ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision), 4326);
  END IF;
  RETURN NEW;
END;
';

--Create trigger that will set geometry columns before incident record is inserted or updated.
DROP TRIGGER IF EXISTS "station_changes" ON "wfwx"."station";

CREATE TRIGGER "station_changes"
  BEFORE INSERT OR UPDATE 
  OF longitude, latitude
  ON wfwx.station
  FOR EACH ROW
  EXECUTE PROCEDURE set_geometries();
  
ANALYZE "wfwx"."station";

CREATE TABLE "wfwx"."readings"
(
  "station_code" INTEGER NOT NULL,
  "timestamp_epoch" BIGINT NOT NULL,
  "daily_ind" BOOLEAN NOT NULL DEFAULT FALSE,
  "temperature" DECIMAL(7,3),
  "relative_humidity" DECIMAL(7,3),
  "wind_speed" DECIMAL(7,3),
  "wind_direction" DECIMAL(7,3),
  "wind_gust" DECIMAL(7,3),
  "precipitation" DECIMAL(7,3),
  "precip_rollup"  DECIMAL(7,3),
  "bui" DECIMAL(7,3),
  "isi" DECIMAL(7,3),
  "ffmc" DECIMAL(7,3),
  "dmc" DECIMAL(7,3),
  "dc" DECIMAL(7,3),
  "fwi" DECIMAL(7,3),
  "danger" INTEGER
);

ALTER TABLE "wfwx"."readings" ADD CONSTRAINT "rdng_pk" PRIMARY KEY ("station_code","timestamp_epoch");

CREATE INDEX "rdng_stn_idx" ON "wfwx"."readings" ("station_code" ASC);
CREATE INDEX "rdng_stamp_idx" ON "wfwx"."readings" ("timestamp_epoch" ASC);
CREATE INDEX "rdng_temp_idx" ON "wfwx"."readings" ("temperature" ASC);
CREATE INDEX "rdng_precip_idx" ON "wfwx"."readings" ("precipitation" ASC);
CREATE INDEX "rdng_danger_idx" ON "wfwx"."readings" ("danger" ASC);

ANALYZE "wfwx"."readings";

