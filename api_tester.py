from dotenv import load_dotenv
import os
import requests
from datetime import datetime
import pprint
load_dotenv('apis.env')

API_KEY = os.getenv('API')
params = {
    'start_date' : '2026-07-13',
    'end_date'   : datetime.today().strftime('%Y-%m-%d'),
    'api_key'    : API_KEY
}
results = requests.get("https://api.nasa.gov/neo/rest/v1/feed", params=params)

# print(params)
# print(results.json()[0].keys())
data = results.json()
no_of_asteriods:int = int(data['element_count'])
print(f"no:asteriods : {no_of_asteriods}\n\n\n\n")
# pprint.pprint(data)
pprint.pprint(data['near_earth_objects'])

date12data = data['near_earth_objects']['2026-07-14']
listofsentryasteroids = list()
for curr_vals in date12data:
    id = curr_vals['id']
    is_dangerous = curr_vals['is_potentially_hazardous_asteroid']
    if is_dangerous:
        print('maybe dangerous')
    if curr_vals['is_sentry_object']:
        print("THIS SHI DANGEROUS")
        listofsentryasteroids.append((curr_vals['is_sentry_object'], curr_vals['sentry_data'], curr_vals['id']))
    print(id, is_dangerous)
    print(f"\n\n")

# pprint.pprint(curr_vals)
# print(type(curr_vals))
# print(len(curr_vals))


print(listofsentryasteroids)
SDBD_API = f"https://ssd-api.jpl.nasa.gov/sbdb.api"
response = requests.get(SDBD_API, params={'spk': int(listofsentryasteroids[0][2])})

print(f"\n\n\n")
print(f"response status code: {response.status_code}")
pprint.pprint(response.json())

data = response.json()
basic_information = {
    'des': data['object']['des'],
    'fullname': data['object']['fullname'],
    'spkid': data['object']['spkid'],
    'orbit_id': data['object']['orbit_id'],
}
print(f"\n\n\n")
print(f"basic_information: {basic_information}")
