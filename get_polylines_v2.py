#!/usr/bin/env python3
"""
Скрипт для генерації route_polylines.json
Запустити один раз: python get_polylines_v2.py
Результат: route_polylines.json — вставити на сервер замість старого
"""
import json, urllib.request, urllib.parse, math, os

API_KEY = "AIzaSyD2N2N_0D0GVhjQ5t0zwc9TXxJwsfl8OGM"

WAYPOINTS = {
  "1": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.2672882,
      27.4321477
    ],
    [
      49.422983,
      26.9871331
    ],
    [
      49.5510444,
      25.5952185
    ],
    [
      49.839683,
      24.029717
    ],
    [
      49.2503262,
      23.8788481
    ],
    [
      48.9200616,
      24.7089157
    ],
    [
      48.6967162,
      26.5825364
    ]
  ],
  "2": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.233083,
      28.4682169
    ],
    [
      49.0116128,
      28.5002432
    ],
    [
      49.0392612,
      28.4189393
    ],
    [
      49.1113082,
      28.6815982
    ],
    [
      48.9957904,
      29.4397153
    ],
    [
      48.8139473,
      29.3812035
    ]
  ],
  "3": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.7418077,
      28.0819465
    ],
    [
      48.7353932,
      28.0958054
    ],
    [
      48.5386802,
      28.1265611
    ],
    [
      48.4966294,
      28.2632535
    ],
    [
      48.6826307,
      28.2892113
    ],
    [
      48.7838875,
      28.4811427
    ],
    [
      48.543779,
      28.5143798
    ],
    [
      48.5327759,
      28.7448023
    ]
  ],
  "4": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.8162706,
      28.9461989
    ],
    [
      48.6739771,
      28.8563795
    ],
    [
      48.5899876,
      28.9636661
    ],
    [
      48.401643,
      29.2407915
    ],
    [
      48.3977066,
      29.3917653
    ],
    [
      48.368954,
      29.5331654
    ],
    [
      48.2153885,
      29.3644358
    ]
  ],
  "5": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.8139473,
      29.3812035
    ],
    [
      48.9965372,
      29.7999327
    ],
    [
      49.1040007,
      29.2092738
    ],
    [
      48.9957904,
      29.4397153
    ]
  ],
  "6": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.3292292,
      28.0828907
    ],
    [
      49.5510263,
      27.9382714
    ],
    [
      49.6911273,
      28.1308882
    ]
  ],
  "7": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.2266089,
      29.0592474
    ],
    [
      49.1876862,
      29.5288911
    ],
    [
      49.3663943,
      29.6583812
    ],
    [
      49.7328752,
      29.6642903
    ],
    [
      49.7203686,
      29.2068497
    ]
  ],
  "8": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.448552,
      28.5226562
    ],
    [
      49.5377699,
      28.6024577
    ],
    [
      49.7149346,
      28.8363647
    ],
    [
      49.6836465,
      29.0266036
    ]
  ],
  "9": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.7131461,
      27.5361936
    ],
    [
      48.6184003,
      27.8023025
    ],
    [
      48.4584391,
      27.7929285
    ],
    [
      48.2441219,
      28.2765218
    ]
  ],
  "10": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.0779819,
      27.681276
    ],
    [
      48.9922817,
      27.5033237
    ],
    [
      49.0323812,
      27.2314025
    ],
    [
      48.8358332,
      27.2653587
    ],
    [
      48.7897787,
      27.318155
    ]
  ],
  "11": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.6539114,
      27.4252885
    ],
    [
      48.5802132,
      27.4336397
    ],
    [
      48.4495656,
      27.4110397
    ],
    [
      48.4789732,
      27.2121767
    ],
    [
      48.4850631,
      27.0292924
    ],
    [
      48.5097106,
      26.4903334
    ],
    [
      48.227943,
      26.5088466
    ]
  ],
  "12": [
    [
      49.0390512,
      28.1085937
    ],
    [
      49.9106591,
      28.5900313
    ],
    [
      50.2615588,
      28.6666776
    ],
    [
      50.4503596,
      30.5245025
    ],
    [
      50.1770891,
      30.3196385
    ],
    [
      50.0637682,
      29.9049684
    ],
    [
      49.7967712,
      30.1278405
    ]
  ],
  "13": [
    [
      49.0390512,
      28.1085937
    ],
    [
      48.8139473,
      29.3812035
    ],
    [
      48.7493927,
      30.2214499
    ]
  ]
}

def decode_polyline(encoded):
    points = []
    index, lat, lng = 0, 0, 0
    while index < len(encoded):
        b, shift, result = 0, 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 32:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat
        shift, result = 0, 0
        while True:
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 32:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng
        points.append([round(lat/1e5, 5), round(lng/1e5, 5)])
    return points

def get_polyline(waypoints_list):
    origin = f"{waypoints_list[0][0]},{waypoints_list[0][1]}"
    destination = f"{waypoints_list[-1][0]},{waypoints_list[-1][1]}"
    mid = waypoints_list[1:-1]
    
    params = {
        "origin": origin,
        "destination": destination,
        "key": API_KEY,
        "mode": "driving"
    }
    
    if mid:
        wp_str = "|".join([f"{p[0]},{p[1]}" for p in mid])
        params["waypoints"] = wp_str
    
    url = "https://maps.googleapis.com/maps/api/directions/json?" + urllib.parse.urlencode(params)
    
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())
    
    if data["status"] != "OK":
        raise Exception(f"API error: {data['status']}")
    
    all_points = []
    for leg in data["routes"][0]["legs"]:
        for step in leg["steps"]:
            pts = decode_polyline(step["polyline"]["points"])
            all_points.extend(pts)
    
    # Прорежаем — каждая 3-я точка
    return all_points[::3]

result = {}
for route_id, wps in WAYPOINTS.items():
    print(f"Маршрут {route_id}...", end=" ", flush=True)
    try:
        points = get_polyline(wps)
        result[route_id] = points
        print(f"{len(points)} точок ✅")
    except Exception as e:
        print(f"ПОМИЛКА: {e}")

with open("route_polylines.json", "w") as f:
    json.dump(result, f, separators=(",", ":"))

size = os.path.getsize("route_polylines.json") // 1024
print(f"\nГотово! route_polylines.json ({size} КБ)")
print("Завантажте цей файл на сервер замість старого.")
