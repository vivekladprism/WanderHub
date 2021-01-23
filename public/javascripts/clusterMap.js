// const campgrounds = require("../../models/campgrounds");

console.log("MAPTOKEN ", mapToken)
console.log("campgrounds", campground.features[0]);
// console.log("features", features[0]);
mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-103.59179687498357, 40.66995747013945],
        zoom: 3
});

map.on('load', function () {
        // Add a new source from our GeoJSON data and
        // set the 'cluster' option to true. GL-JS will
        // add the point_count property to your source data.
        map.addSource('campgrounds', {
                type: 'geojson',
                // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
                // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
                data: campground,
                cluster: true,
                clusterMaxZoom: 14, // Max zoom to cluster points on
                clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
        });

        map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'campgrounds',
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
                source: 'campgrounds',
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
                source: 'campgrounds',
                filter: ['!', ['has', 'point_count']],
                paint: {
                        'circle-color': '#11b4da',
                        'circle-radius': 4,
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
                map.getSource('campgrounds').getClusterExpansionZoom(
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
                // const arr = markup.split(",");
                // const id = arr[0];
                // const location = arr[2];
                // const title = arr[1];
                // console.log((JSON.parse(markup)).id, typeof markup);
                // if (e.features[0].properties.tsunami === 1) {
                //         tsunami = 'yes';
                // } else {
                //         tsunami = 'no';
                // }

                // Ensure that if the map is zoomed out such that
                // multiple copies of the feature are visible, the
                // popup appears over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(
                                `<a href= "/campgrounds/${markup.id}">${markup.title}</a><br><h5>${markup.location}</h5>`
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