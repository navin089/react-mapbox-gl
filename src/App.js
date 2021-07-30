import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoibmF2aW5rb2RhbSIsImEiOiJja3F2d3N6ZW8waXAwMm9yeTk3cmlvMjI2In0.tfNR6Rgoed-XiYPfBzy8Hg";
  var Draw = new MapboxDraw();

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Draw Controls function implementation
  function updateArea(e) {
    var data = Draw.getAll();
    console.log("Drawn Data: ", data.features);
    // console.log("Current Selected: ",Draw.getSelected());
    // the_poly = data.features;

    var answer = document.getElementById("calculated-area");
    // if (data.features.length > 0) {
    //   // var area = turf.area(data);
    //   // restrict to area to 2 decimal points
    //   // var rounded_area = Math.round(area * 100) / 100;
    //   // answer.innerHTML =
    //     // "<p><strong>" + rounded_area + "</strong></p><p>square meters</p>";
    // } else {
    //   answer.innerHTML = "";
    //   if (e.type !== "draw.delete")
    //     alert("Use the draw tools to draw a polygon!");
    // }
  }

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11",
      center: [-70.9, 42.35],
      zoom: 9,
      pitch: 40
    });

    // Add navigation control (the +/- zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    //Draw Controls Box
    map.current.addControl(Draw, 'top-left');

    //Draw Controls Functions
    map.current.on("draw.create", updateArea);
    map.current.on("draw.delete", updateArea);
    map.current.on("draw.update", updateArea);


     // Clean up on unmount
    return () => map.current.remove();
  }, []);

  
  

  

  return (
    <div className="App">
      <h1>Lets Build Mapbox</h1>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
