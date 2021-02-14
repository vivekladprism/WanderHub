// const attractions = require("../../models/attractions");

// const { function } = require("joi");
// var MapboxDirections = require('@mapbox/mapbox-gl-directions');

console.log("MAPTOKEN ", mapToken)
console.log("attractions", attraction.features[0]);
let startCords = [-95, 36];

// console.log("features", features[0]);
mapboxgl.accessToken = mapToken;
if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {

                startCords = [position.coords.longitude, position.coords.latitude];
                generateMap(startCords, 8);

        }, function (e) {
                generateMap(startCords, 3);
        });
};



const generateMap = (coords, zoomNum) => {
        const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/light-v10',
                center: coords,
                zoom: zoomNum
        });

        map.on('load', function () {
                // Add a new source from our GeoJSON data and
                // set the 'cluster' option to true. GL-JS will
                // add the point_count property to your source data.
                map.addControl(
                        new MapboxDirections({
                                accessToken: mapToken
                        }),
                        'top-left'
                );
                map.addSource('attractions', {
                        type: 'geojson',
                        // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                        // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                        data: attraction,
                        cluster: true,
                        clusterMaxZoom: 14, // Max zoom to cluster points on
                        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
                });

                map.addLayer({
                        id: 'clusters',
                        type: 'circle',
                        source: 'attractions',
                        filter: ['has', 'point_count'],
                        paint: {
                                // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
                                // with three steps to implement three types of circles:
                                //   * Blue, 20px circles when point count is less than 100
                                //   * Yellow, 30px circles when point count is between 100 and 750
                                //   * Pink, 40px circles when point count is greater than or equal to 750
                                'circle-color': [
                                        'step',
                                        ['get', 'point_count'],
                                        '#51bbd6',
                                        100,
                                        '#f1f075',
                                        750,
                                        '#f28cb1'
                                ],
                                'circle-radius': [
                                        'step',
                                        ['get', 'point_count'],
                                        20,
                                        100,
                                        30,
                                        750,
                                        40
                                ]
                        }
                });

                map.addLayer({
                        id: 'cluster-count',
                        type: 'symbol',
                        source: 'attractions',
                        filter: ['has', 'point_count'],
                        layout: {
                                'text-field': '{point_count_abbreviated}',
                                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                                'text-size': 12
                        }
                });

                map.addLayer({
                        id: 'unclustered-point',
                        type: 'circle',
                        source: 'attractions',
                        filter: ['!', ['has', 'point_count']],
                        paint: {
                                'circle-color': '#11b4da',
                                'circle-radius': 6,
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#fff'
                        }
                });

                // inspect a cluster on click
                map.on('click', 'clusters', function (e) {
                        var features = map.queryRenderedFeatures(e.point, {
                                layers: ['clusters']
                        });
                        var clusterId = features[0].properties.cluster_id;
                        map.getSource('attractions').getClusterExpansionZoom(
                                clusterId,
                                function (err, zoom) {
                                        if (err) return;

                                        map.easeTo({
                                                center: features[0].geometry.coordinates,
                                                zoom: zoom
                                        });
                                }
                        );
                });

                // When a click event occurs on a feature in
                // the unclustered-point layer, open a popup at
                // the location of the feature, with
                // description HTML from its properties.
                map.on('click', 'unclustered-point', function (e) {
                        var coordinates = e.features[0].geometry.coordinates.slice();
                        console.log("Hello ", e.features[0]);
                        const markup = JSON.parse(e.features[0].properties.popUpMarkup);

                        console.log(e.lngLat.lng, e.lngLat.lat);
                        // Ensure that if the map is zoomed out such that
                        // multiple copies of the feature are visible, the
                        // popup appears over the copy being pointed to.
                        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                        }

                        new mapboxgl.Popup()
                                .setLngLat(coordinates)
                                .setHTML(
                                        `<a href= "/attractions/${markup.id}">${markup.title}</a><br><h5>${markup.location}</h5>`
                                )
                                .addTo(map);
                });

                map.on('mouseenter', 'clusters', function () {
                        map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'clusters', function () {
                        map.getCanvas().style.cursor = '';
                });
        });


}
