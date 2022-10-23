import requests
import csv
import math
import psycopg2
import os
from datetime import datetime, timedelta

# Fetching data from: https://www.for.gov.bc.ca/ftp/HPR/external/!publish/BCWS_DATA_MART/<year>/year-month-day.csv

# The last year stored will be 1973 at most
# this script doesn't handle the yearly dumps as they dont exist yet
# but will be updated to handle the full year load, which will include stations
running = True
next_day = datetime.now() + timedelta(hours=-8)

conn = psycopg2.connect(user=os.environ.get('user'),
                        password=os.environ.get('password'),
                        host=os.environ.get('host'),
                        port=os.environ.get('port'),
                        database=os.environ.get('db'))
print('Connected to DB')

misses = 0
while running:
  current_day = next_day.day
  current_month = next_day.month
  current_year = next_day.year
  print('Loading data for ' + str(current_year) + '-' + str(current_month) + "-" + str(current_day))
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
          except:
            print('Insert failed')
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
