import urllib.request, urllib.parse, json, sys

API_KEY = 'AIzaSyD2N2N_0D0GVhjQ5t0zwc9TXxJwsfl8OGM'

# Простой декодер polyline — без сторонних библиотек
def decode_polyline(encoded):
    points = []
    index, lat, lng = 0, 0, 0
    while index < len(encoded):
        for is_lng in [False, True]:
            shift, result = 0, 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else result >> 1
            if is_lng:
                lng += delta
            else:
                lat += delta
        points.append((lat / 1e5, lng / 1e5))
    return points

routes = [
    {
        'id': 1,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Dunaivtsi, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Lityn,Ukraine|Letychiv,Ukraine|Khmelnytskyi,Ukraine|Derazhnia,Ukraine|Volochysk,Ukraine|Ternopil,Ukraine|Zolochiv,Ukraine|Lviv,Ukraine|Ivano-Frankivsk,Ukraine|Kolomyia,Ukraine|Chernivtsi,Ukraine|Kamianets-Podilskyi,Ukraine'
    },
    {
        'id': 2,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Haisyn, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Sutysky,Ukraine|Tyvrivske,Ukraine|Voronovytsia,Ukraine|Nemyriv,Ukraine|Dashiv,Ukraine'
    },
    {
        'id': 3,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Pishchanka, Ukraine',
        'waypoints': 'Sharhorod,Ukraine|Tomashpil,Ukraine|Vapniarka,Ukraine|Zhabokrych,Ukraine|Kryzhopil,Ukraine'
    },
    {
        'id': 4,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Zhabokrychka, Ukraine',
        'waypoints': 'Bratslav,Ukraine|Tulchyn,Ukraine|Bershad,Ukraine|Chechelnyk,Ukraine'
    },
    {
        'id': 5,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Monastyryshche, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Voronovytsia,Ukraine|Nemyriv,Ukraine|Haisyn,Ukraine|Illintsi,Ukraine|Orativ,Ukraine'
    },
    {
        'id': 6,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Ulaniv, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Lityn,Ukraine|Khmilnyk,Ukraine'
    },
    {
        'id': 7,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Tetiiv, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Lypovets,Ukraine|Orativ,Ukraine|Ruzhyn,Ukraine|Skvyra,Ukraine'
    },
    {
        'id': 8,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Bylylivka, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Kalynivka,Ukraine|Koziatyn,Ukraine'
    },
    {
        'id': 9,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Yampil, Ukraine',
        'waypoints': 'Murovani Kurylivtsi,Ukraine|Vendychany,Ukraine|Mohyliv-Podilskyi,Ukraine'
    },
    {
        'id': 10,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Struha, Ukraine',
        'waypoints': 'Bar,Ukraine|Yaltushkiv,Ukraine|Vinkivtsi,Ukraine|Nova Ushytsia,Ukraine'
    },
    {
        'id': 11,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Kostychany, Ukraine',
        'waypoints': 'Murovani Kurylivtsi,Ukraine|Naddnistranske,Ukraine|Novodnistrovsk,Ukraine|Sokyriany,Ukraine|Khotyn,Ukraine'
    },
    {
        'id': 12,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Bila Tserkva, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Kalynivka,Ukraine|Berdychiv,Ukraine|Zhytomyr,Ukraine|Makariv,Ukraine|Kyiv,Ukraine|Vasylkiv,Ukraine'
    },
    {
        'id': 13,
        'origin': 'Zhmerynka, Ukraine',
        'destination': 'Uman, Ukraine',
        'waypoints': 'Vinnytsia,Ukraine|Nemyriv,Ukraine|Haisyn,Ukraine|Krasnopilka,Ukraine|Khrystynivka,Ukraine'
    },
]

results = {}

for r in routes:
    print(f"Маршрут {r['id']}...", end=' ', flush=True)
    url = (
        f"https://maps.googleapis.com/maps/api/directions/json"
        f"?origin={urllib.parse.quote(r['origin'])}"
        f"&destination={urllib.parse.quote(r['destination'])}"
        f"&waypoints={urllib.parse.quote(r['waypoints'])}"
        f"&mode=driving&key={API_KEY}"
    )
    try:
        with urllib.request.urlopen(url) as resp:
            data = json.loads(resp.read())

        if data['status'] != 'OK':
            print(f"ПОМИЛКА: {data['status']}")
            continue

        points = []
        for leg in data['routes'][0]['legs']:
            for step in leg['steps']:
                decoded = decode_polyline(step['polyline']['points'])
                points.extend(decoded)

        # Кожна 3-я точка — достатньо для точності ~100м
        sampled = points[::3]
        results[str(r['id'])] = sampled
        print(f"{len(points)} точок → {len(sampled)} збережено")

    except Exception as e:
        print(f"ПОМИЛКА: {e}")

output_file = 'route_polylines.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(results, f)

print(f"\nГотово! Файл збережено: {output_file}")
print(f"Маршрутів оброблено: {len(results)} з {len(routes)}")
