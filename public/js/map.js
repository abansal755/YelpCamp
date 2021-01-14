mapboxgl.accessToken = mbxToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: coordinates,
    zoom: 10
});

const marker = new mapboxgl.Marker().setLngLat(coordinates).addTo(map);