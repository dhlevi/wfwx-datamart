import requests
import csv
import math
import psycopg2
import os
from datetime import datetime, timedelta

# Fetching data from: https://www.for.gov.bc.ca/ftp/HPR/external/!publish/BCWS_DATA_MART/<year>/year-month-day.csv
# Note that the historical data is in a single file and a slightly different model
# The last year stored will be 1987 at most

running = True
historical_running = True
next_day = datetime.now() + timedelta(hours=-8)
conn = psycopg2.connect(user=os.environ.get('user'),
                        password=os.environ.get('password'),
                        host=os.environ.get('host'),
                        port=os.environ.get('port'),
                        database=os.environ.get('db'))
historical_year = 1987
print('Connected to DB')

# load the historical data
while historical_running:
  print('Loading historical data for ' + str(historical_year))
  wfwx_fetch = requests.get('https://www.for.gov.bc.ca/ftp/HPR/external/!publish/BCWS_DATA_MART/' + str(historical_year) + '/' + str(historical_year) + '_BCWS_WX_OBS.csv')
  station_fetch = requests.get('https://www.for.gov.bc.ca/ftp/HPR/external/!publish/BCWS_DATA_MART/' + str(historical_year) + '/' + str(historical_year) + '_BCWS_WX_STATIONS.csv')

  if station_fetch.status_code == 200:
    # load stations rows from the csv
    station_readings = station_fetch.text
    # and clear the fetch
    del station_fetch
    # push stations to postgres. These need to upsert
    station_reader = csv.reader(station_readings.split('\n'), delimiter=',')
    index = 0
    for row in station_reader:
      if index > 0 and len(row) > 0:
        insert = "INSERT INTO wfwx.station(station_name, station_code, station_acronym, latitude, longitude, elevation, slope, aspect, windspeed_height, adjusted_roughness, geometry) VALUES ('" + row[1] + "', " + row[0] + ", '" + row[2] + "', " + (row[3] if row[3] != '' else 'null') + ", " + (row[4] if row[4] != '' else 'null') + ", " + (row[5] if row[5] != '' else 'null') + ", " + (row[6] if row[6] != '' else 'null') + ", '" + (row[7] if row[7] != '' else 'null') + "', '" + (row[8] if row[8] != '' else 'null') + "', " + (row[9] if row[9] != '' else 'null') + ", null) ON CONFLICT (station_code) DO UPDATE SET station_name = '" + row[1] + "',station_code = " + row[0] + ",station_acronym = '" + row[2] + "',latitude = " + (row[3] if row[3] != '' else 'null') + ",longitude = " + (row[4] if row[4] != '' else 'null') + ",elevation = " + (row[5] if row[5] != '' else 'null') + ",slope = " + (row[6] if row[6] != '' else 'null') + ",aspect = '" + (row[7] if row[7] != '' else 'null') + "',windspeed_height = '" + (row[8] if row[8] != '' else 'null') + "',adjusted_roughness = " + (row[9] if row[9] != '' else 'null')
        
        cursor = conn.cursor()

        try:
          cursor.execute(insert)
          conn.commit()
          count = cursor.rowcount
        except Exception as e:
          print("Oops!", e.__class__, "occurred.")
          print('Insert failed')
          conn.rollback()
        finally:
          cursor.close()

      index = index + 1

  if wfwx_fetch.status_code == 200:
    # load the csv values
    readings = wfwx_fetch.text
    # delete the fetch
    del wfwx_fetch
    # push to postgres
    reader = csv.reader(readings.split('\n'), delimiter=',')
    index = 0
    for row in reader:
      if index > 0 and len(row) > 0:
        date = row[1]
        daily = 'true' if date[-2] + date[-1] == '12' else 'false'
        hour = date[-2] + date[-1]
        day = date[-4] + date[-3]
        month = date[-6] + date[-5]
        epoch = math.floor(datetime(historical_year, int(month), int(day), int(hour),0).timestamp() * 1000)
        insert = "INSERT INTO wfwx.readings VALUES ('"+ row[0] + "', " + str(epoch) + ", " + daily + ", " + (row[4] if row[4] != '' else 'null') + ", " + (row[5] if row[5] != '' else 'null') + ", " + (row[6] if row[6] != '' else 'null') + ", " + (row[8] if row[8] != '' else 'null') + ", " + (row[7] if row[7] != '' else 'null') + ", " + (row[2] if row[2] != '' else 'null') + ", " + (row[3] if row[3] != '' else 'null') + ", " + (row[14] if row[14] != '' else 'null') + ", " + (row[10] if row[10] != '' else 'null') + ", " + (row[9] if row[9] != '' else 'null') + ", " + (row[12] if row[12] != '' else 'null') + ", " + (row[13] if row[13] != '' else 'null') + ", " + (row[11] if row[11] != '' else 'null') + ", " + (row[15] if row[15] != '' else 'null') + ")"
        cursor = conn.cursor()

        try:
          cursor.execute(insert)
          conn.commit()
          count = cursor.rowcount
        except Exception as e:
          print("Oops!", e.__class__, "occurred.")
          print('Insert failed')
          conn.rollback()
        finally:
          cursor.close()

      index = index + 1

  historical_year = historical_year + 1
  if historical_year == next_day.year:
    historical_running = False

#load the current year
misses = 0
while running:
  current_day = next_day.day
  current_month = next_day.month
  current_year = next_day.year
  print('Loading current year data for ' + str(current_year) + '-' + str(current_month) + "-" + str(current_day))
  wfwx_fetch = requests.get('https://www.for.gov.bc.ca/ftp/HPR/external/!publish/BCWS_DATA_MART/' + str(current_year) + '/' + str(current_year) + '-' + (str(current_month) if current_month >= 10 else '0' + str(current_month)) + '-' + (str(current_day) if current_day >= 10 else '0' + str(current_day)) + '.csv')

  next_day = next_day + timedelta(days=-1)

  if wfwx_fetch.status_code == 200:
    # load the csv values
    readings = wfwx_fetch.text
    # delete the fetch
    del wfwx_fetch
    # push to postgres
    reader = csv.reader(readings.split('\n'), delimiter=',')
    index = 0
    for row in reader:
      if index > 0 and len(row) > 0:
          date = row[1]
          daily = 'true' if date[-2] + date[-1] == '12' else 'false'
          hour = date[-2] + date[-1]
          epoch = math.floor(datetime(current_year, current_month, current_day, int(hour),0).timestamp() * 1000)
          insert = "INSERT INTO wfwx.readings VALUES ('"+ row[0] + "', " + str(epoch) + ", " + daily + ", " + (row[3] if row[3] != '' else 'null') + ", " + (row[4] if row[4] != '' else 'null') + ", " + (row[5] if row[5] != '' else 'null') + ", " + (row[6] if row[6] != '' else 'null') + ", 0, " + (row[2] if row[2] != '' else 'null') + ", 0, " + (row[12] if row[12] != '' else 'null') + ", " + (row[8] if row[8] != '' else 'null') + ", " + (row[7] if row[7] != '' else 'null') + ", " + (row[10] if row[10] != '' else 'null') + ", " + (row[11] if row[11] != '' else 'null') + ", " + (row[9] if row[9] != '' else 'null') + ", " + (row[13] if row[13] != '' else 'null') + ")"
          cursor = conn.cursor()

          try:
            cursor.execute(insert)
            conn.commit()
            count = cursor.rowcount
          except Exception as e:
            print("Oops!", e.__class__, "occurred.")
            print('Insert failed')
            conn.rollback()
          finally:
            cursor.close()

      index = index + 1
  else:
    print('Failed to find data')
    print(wfwx_fetch)
    misses = misses + 1
    if misses > 10:
      running = False

print('Done!')
conn.close()
